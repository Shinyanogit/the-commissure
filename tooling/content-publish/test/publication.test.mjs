import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildPublication, sha256, verifyPublication } from "../lib.mjs";

const repositoryRoot = resolve(fileURLToPath(new URL("../../..", import.meta.url)));

async function fixture() {
  const root = await mkdtemp(join(os.tmpdir(), "commissure-publish-test-"));
  await cp(join(repositoryRoot, "content"), join(root, "content"), { recursive: true });
  await mkdir(join(root, "ios/Resources/NativeAssets"), { recursive: true });
  const catalogPath = join(root, "content/catalog/catalog.json");
  const catalog = JSON.parse(await readFile(catalogPath));
  const procedures = [];
  for (const entry of catalog.procedures) {
    const provenanceEntry = entry.files.find(({ role }) => role === "provenance");
    const provenancePath = join(root, provenanceEntry.path);
    const provenance = JSON.parse(await readFile(provenancePath));
    provenance.medicalReview = { status: "ownerApproved", releaseGate: false };
    provenance.rightsReview = { status: "ownerApproved", releaseGate: false };
    const provenanceBytes = Buffer.from(`${JSON.stringify(provenance, null, 2)}\n`);
    await writeFile(provenancePath, provenanceBytes);
    provenanceEntry.sha256 = sha256(provenanceBytes);
    provenanceEntry.bytes = provenanceBytes.length;

    const model = Buffer.from(`USDZ fixture for ${entry.id}`);
    const modelDirectory = join(root, `ios/Resources/NativeAssets/${entry.id}`);
    await mkdir(modelDirectory, { recursive: true });
    await writeFile(join(modelDirectory, "model.usdz"), model);
    procedures.push({
      id: entry.id,
      filename: `${entry.id}/model.usdz`,
      sha256: sha256(model),
      bytes: model.length,
      triangles: 1000,
      entityCount: 1,
      entityPaths: [`/root/procedure_${entry.id}/anatomy/bone`]
    });
  }
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  await writeFile(join(root, "ios/Resources/NativeAssets/manifest.json"), `${JSON.stringify({
    schemaVersion: 1,
    toolchain: { exporter: "test", version: "1" },
    procedures
  }, null, 2)}\n`);

  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const privateDer = privateKey.export({ format: "der", type: "pkcs8" });
  const publicDer = publicKey.export({ format: "der", type: "spki" });
  const environment = {
    CONTENT_SIGNING_PRIVATE_KEY_BASE64: privateDer.toString("base64"),
    CONTENT_SIGNING_PUBLIC_KEY_BASE64: publicDer.subarray(-32).toString("base64")
  };
  return { root, environment };
}

async function build(root, environment, output = join(root, "site"), extra = {}) {
  return buildPublication({
    root,
    output,
    generation: 1,
    publishedAt: "2026-09-12T00:00:00Z",
    assetBaseURL: "https://content.thecommissure.app/",
    environment,
    ...extra
  });
}

test("builds and verifies four immutable signed packs", async (t) => {
  const { root, environment } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifest = await build(root, environment);
  assert.deepEqual(manifest.procedures.map(({ id }) => id), ["acdf", "accf", "pcdf", "pcf"]);
  assert.ok(manifest.procedures.every(({ files }) => files.length === 7));
  await verifyPublication({ site: join(root, "site"), publicKey: join(root, "site/public-key.raw") });
});

test("rejects a tampered manifest signature", async (t) => {
  const { root, environment } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await build(root, environment);
  const path = join(root, "site/manifest.json");
  const manifest = JSON.parse(await readFile(path));
  manifest.generation = 2;
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
  await assert.rejects(
    verifyPublication({ site: join(root, "site"), publicKey: join(root, "site/public-key.raw") }),
    /signature verification failed/
  );
});

test("rejects tampered pack bytes", async (t) => {
  const { root, environment } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifest = await build(root, environment);
  const model = manifest.procedures[0].files.find(({ role }) => role === "model");
  await writeFile(join(root, "site", model.path), "tampered");
  await assert.rejects(
    verifyPublication({ site: join(root, "site"), publicKey: join(root, "site/public-key.raw") }),
    /byte count mismatch|SHA-256 mismatch/
  );
});

test("rejects path traversal even when the manifest is re-signed", async (t) => {
  const { root, environment } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await build(root, environment);
  const path = join(root, "site/manifest.json");
  const manifest = JSON.parse(await readFile(path));
  manifest.procedures[0].files[0].path = "packs/acdf/1.0.0/../../escape.json";
  const bytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  const { createPrivateKey, sign } = await import("node:crypto");
  const key = createPrivateKey({
    key: Buffer.from(environment.CONTENT_SIGNING_PRIVATE_KEY_BASE64, "base64"),
    format: "der",
    type: "pkcs8"
  });
  await writeFile(path, bytes);
  await writeFile(join(root, "site/manifest.sig"), sign(null, bytes, key));
  await assert.rejects(
    verifyPublication({ site: join(root, "site"), publicKey: join(root, "site/public-key.raw") }),
    /unsafe published path|outside its immutable pack directory/
  );
});

for (const [name, property, expected] of [
  ["medical review", "medicalReview", /medical review is release-blocking/],
  ["rights review", "rightsReview", /rights review is release-blocking/]
]) {
  test(`fails closed on unresolved ${name}`, async (t) => {
    const { root, environment } = await fixture();
    t.after(() => rm(root, { recursive: true, force: true }));
    const provenancePath = join(root, "content/procedures/acdf/provenance.json");
    const provenance = JSON.parse(await readFile(provenancePath));
    provenance[property] = property === "medicalReview"
      ? { status: "inheritedWebsiteSource", releaseGate: true }
      : { status: "ownerConfirmationRequired", releaseGate: true };
    const bytes = Buffer.from(`${JSON.stringify(provenance, null, 2)}\n`);
    await writeFile(provenancePath, bytes);
    const catalogPath = join(root, "content/catalog/catalog.json");
    const catalog = JSON.parse(await readFile(catalogPath));
    const entry = catalog.procedures[0].files.find(({ role }) => role === "provenance");
    entry.sha256 = sha256(bytes);
    entry.bytes = bytes.length;
    await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
    await assert.rejects(build(root, environment), expected);
  });
}

test("rejects a non-monotonic manifest generation", async (t) => {
  const { root, environment } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await build(root, environment);
  await assert.rejects(build(root, environment, join(root, "site-2"), {
    previousManifest: join(root, "site/manifest.json"),
    previousSite: join(root, "site"),
    generation: 1
  }), /must increase beyond 1/);
});

test("preserves prior packs and rejects same-version replacement bytes", async (t) => {
  const { root, environment } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await build(root, environment);
  await build(root, environment, join(root, "site-2"), {
    previousManifest: join(root, "site/manifest.json"),
    previousSite: join(root, "site"),
    generation: 2
  });
  const retention = JSON.parse(await readFile(join(root, "site-2/retained-files.json")));
  assert.equal(retention.files.length, 28);

  const modelPath = join(root, "ios/Resources/NativeAssets/acdf/model.usdz");
  const model = Buffer.from("replacement bytes for same version");
  await writeFile(modelPath, model);
  const nativePath = join(root, "ios/Resources/NativeAssets/manifest.json");
  const native = JSON.parse(await readFile(nativePath));
  native.procedures[0].sha256 = sha256(model);
  native.procedures[0].bytes = model.length;
  await writeFile(nativePath, `${JSON.stringify(native, null, 2)}\n`);
  await assert.rejects(build(root, environment, join(root, "site-3"), {
    previousManifest: join(root, "site-2/manifest.json"),
    previousSite: join(root, "site-2"),
    generation: 3
  }), /already published with different bytes/);
});
