import assert from "node:assert/strict";
import { generateKeyPairSync, createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildPublication, sha256 } from "../../content-publish/lib.mjs";
import { validateReleaseEvidence } from "../lib.mjs";

const repositoryRoot = resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const internalGates = [
  "automated-tests",
  "signed-archive-validation",
  "privacy-audit",
  "medical-content-review",
  "content-rights-review"
];

async function createFixture() {
  const root = await mkdtemp(join(os.tmpdir(), "commissure-release-test-"));
  const sourceRoot = join(root, "source");
  await cp(join(repositoryRoot, "content"), join(sourceRoot, "content"), { recursive: true });
  await mkdir(join(sourceRoot, "ios/Resources/NativeAssets"), { recursive: true });
  const catalogPath = join(sourceRoot, "content/catalog/catalog.json");
  const catalog = JSON.parse(await readFile(catalogPath));
  const procedures = [];
  for (const entry of catalog.procedures) {
    const provenanceEntry = entry.files.find(({ role }) => role === "provenance");
    const provenancePath = join(sourceRoot, provenanceEntry.path);
    const provenance = JSON.parse(await readFile(provenancePath));
    provenance.medicalReview = { status: "ownerApproved", releaseGate: false };
    provenance.rightsReview = { status: "ownerApproved", releaseGate: false };
    const provenanceBytes = Buffer.from(`${JSON.stringify(provenance, null, 2)}\n`);
    await writeFile(provenancePath, provenanceBytes);
    provenanceEntry.sha256 = sha256(provenanceBytes);
    provenanceEntry.bytes = provenanceBytes.length;
    const model = Buffer.from(`model-${entry.id}`);
    const modelDirectory = join(sourceRoot, `ios/Resources/NativeAssets/${entry.id}`);
    await mkdir(modelDirectory, { recursive: true });
    await writeFile(join(modelDirectory, "model.usdz"), model);
    procedures.push({
      id: entry.id,
      filename: `${entry.id}/model.usdz`,
      sha256: sha256(model),
      bytes: model.length,
      triangles: 1,
      entityCount: 1,
      entityPaths: [`/root/procedure_${entry.id}/anatomy/bone`]
    });
  }
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  await writeFile(join(sourceRoot, "ios/Resources/NativeAssets/manifest.json"), `${JSON.stringify({
    schemaVersion: 1,
    toolchain: { exporter: "test", version: "1" },
    procedures
  }, null, 2)}\n`);
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const environment = {
    CONTENT_SIGNING_PRIVATE_KEY_BASE64: privateKey.export({ format: "der", type: "pkcs8" }).toString("base64"),
    CONTENT_SIGNING_PUBLIC_KEY_BASE64: publicKey.export({ format: "der", type: "spki" }).subarray(-32).toString("base64")
  };
  const bundle = join(root, "bundle");
  const site = join(bundle, "content-site");
  await mkdir(bundle, { recursive: true });
  await buildPublication({
    root: sourceRoot,
    output: site,
    generation: 1,
    publishedAt: "2026-09-12T00:00:00Z",
    assetBaseURL: "https://content.thecommissure.app/",
    environment
  });
  const ipa = join(bundle, "TheCommissure.ipa");
  const ipaBytes = Buffer.from("signed-ipa-fixture");
  await writeFile(ipa, ipaBytes);
  const report = join(bundle, "gate-report.txt");
  const reportBytes = Buffer.from("passed on exact candidate\n");
  await writeFile(report, reportBytes);
  const manifestBytes = await readFile(join(site, "manifest.json"));
  const artifactDigest = sha256(ipaBytes);
  const manifestDigest = sha256(manifestBytes);
  const gates = Object.fromEntries(internalGates.map((id) => [id, {
    status: "passed",
    approvedBy: "Fixture Reviewer",
    completedAt: "2026-09-12T00:00:00Z",
    artifactSha256: artifactDigest,
    contentManifestSha256: manifestDigest,
    evidencePath: "gate-report.txt",
    evidenceSha256: sha256(reportBytes)
  }]));
  const evidence = {
    schemaVersion: 1,
    stage: "internal-testflight",
    commit: "a".repeat(40),
    tag: "ios-v1.0.0-1",
    artifact: {
      path: "TheCommissure.ipa",
      sha256: artifactDigest,
      bytes: ipaBytes.length,
      bundleIdentifier: "app.thecommissure.ios",
      marketingVersion: "1.0.0",
      buildNumber: "1",
      signingTeamIdentifier: "TEAMID1234"
    },
    content: {
      sitePath: "content-site",
      publicKeyPath: "content-site/public-key.raw",
      manifestSha256: manifestDigest
    },
    gates
  };
  const evidencePath = join(bundle, "release-evidence.json");
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  return { root, bundle, evidence, evidencePath, ipa, report };
}

async function validate(fixture) {
  return validateReleaseEvidence({
    evidencePath: fixture.evidencePath,
    repositoryRoot,
    inspectArtifact: false,
    verifyGit: false
  });
}

test("accepts complete evidence bound to an exact artifact and content manifest", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const result = await validate(fixture);
  assert.equal(result.stage, "internal-testflight");
  assert.equal(result.contentGeneration, 1);
});

test("rejects tampered gate evidence", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  await writeFile(fixture.report, "changed\n");
  await assert.rejects(validate(fixture), /evidence file SHA-256 mismatch/);
});

test("rejects a gate bound to another IPA", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  fixture.evidence.gates["privacy-audit"].artifactSha256 = "b".repeat(64);
  await writeFile(fixture.evidencePath, `${JSON.stringify(fixture.evidence, null, 2)}\n`);
  await assert.rejects(validate(fixture), /privacy-audit: evidence is not bound to this IPA/);
});

test("external TestFlight fails closed without floor-device evidence", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  fixture.evidence.stage = "external-testflight";
  await writeFile(fixture.evidencePath, `${JSON.stringify(fixture.evidence, null, 2)}\n`);
  await assert.rejects(validate(fixture), /release gate missing: floor-device-performance/);
});

test("rejects a tampered IPA", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  await writeFile(fixture.ipa, "tampered ipa");
  await assert.rejects(validate(fixture), /IPA SHA-256 does not match/);
});
