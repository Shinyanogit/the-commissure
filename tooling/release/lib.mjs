import { createHash } from "node:crypto";
import { lstat, readFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { execFileSync } from "node:child_process";

import { verifyPublication, verifyRetention } from "../content-publish/lib.mjs";
import { inspectSignedIPA } from "./platform.mjs";

export class ReleaseError extends Error {}

const requiredGates = {
  "internal-testflight": [
    "automated-tests",
    "signed-archive-validation",
    "privacy-audit",
    "medical-content-review",
    "content-rights-review"
  ],
  "external-testflight": [
    "automated-tests",
    "signed-archive-validation",
    "privacy-audit",
    "medical-content-review",
    "content-rights-review",
    "floor-device-performance",
    "current-iphone-performance",
    "current-ipad-performance",
    "accessibility",
    "visual-acceptance",
    "app-thinning",
    "app-store-scan-preexternal"
  ],
  "app-store": [
    "automated-tests",
    "signed-archive-validation",
    "privacy-audit",
    "medical-content-review",
    "content-rights-review",
    "floor-device-performance",
    "current-iphone-performance",
    "current-ipad-performance",
    "accessibility",
    "visual-acceptance",
    "app-thinning",
    "app-store-scan-preexternal",
    "app-store-scan-release-candidate",
    "metadata",
    "support-privacy-urls",
    "screenshots",
    "reviewer-notes",
    "internal-testflight",
    "external-testflight"
  ]
};

function assert(condition, message) {
  if (!condition) throw new ReleaseError(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function readJSON(path, label) {
  let bytes;
  try { bytes = await readFile(path); }
  catch (error) { throw new ReleaseError(`${label}: cannot read (${error.code ?? error.message})`); }
  try { return { value: JSON.parse(bytes), bytes }; }
  catch { throw new ReleaseError(`${label}: invalid JSON`); }
}

async function regularFile(path, label) {
  let stats;
  try { stats = await lstat(path); }
  catch (error) { throw new ReleaseError(`${label}: missing (${error.code ?? error.message})`); }
  assert(stats.isFile() && !stats.isSymbolicLink(), `${label}: must be a regular non-symlink file`);
  return stats;
}

function safeRelative(root, path, label) {
  const rel = relative(resolve(root), resolve(path));
  assert(rel && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel),
    `${label}: path escapes the evidence directory`);
}

function validTimestamp(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)
    && !Number.isNaN(Date.parse(value));
}

function command(commandName, argumentsList, cwd) {
  try {
    return execFileSync(commandName, argumentsList, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    throw new ReleaseError(`${commandName} ${argumentsList.join(" ")} failed: ${(error.stderr || error.message).toString().trim()}`);
  }
}

function verifyGitBinding(evidence, repositoryRoot) {
  const head = command("git", ["rev-parse", "HEAD"], repositoryRoot);
  assert(evidence.commit === head, `release commit ${evidence.commit} does not equal checked-out HEAD ${head}`);
  assert(/^ios-v\d+\.\d+\.\d+-\d+$/.test(evidence.tag),
    "release tag must match ios-v<marketing-version>-<build-number>");
  const tagCommit = command("git", ["rev-list", "-n", "1", evidence.tag], repositoryRoot);
  assert(tagCommit === head, `release tag ${evidence.tag} does not point to checked-out HEAD`);
}

export async function validateReleaseEvidence({
  evidencePath,
  artifactOverride,
  repositoryRoot,
  inspectArtifact = true,
  verifyGit = true
}) {
  evidencePath = resolve(evidencePath);
  const evidenceRoot = dirname(evidencePath);
  const { value: evidence } = await readJSON(evidencePath, "release evidence");
  assert(evidence.schemaVersion === 1, "release evidence: unsupported schema version");
  assert(requiredGates[evidence.stage],
    "release evidence: stage must be internal-testflight, external-testflight, or app-store");
  assert(/^[a-f0-9]{40}$/.test(evidence.commit), "release evidence: commit must be a full 40-character SHA");
  assert(evidence.artifact && typeof evidence.artifact === "object", "release evidence: artifact is required");

  const artifactPath = resolve(artifactOverride ?? resolve(evidenceRoot, evidence.artifact.path ?? ""));
  await regularFile(artifactPath, "release IPA");
  const artifactBytes = await readFile(artifactPath);
  const artifactDigest = sha256(artifactBytes);
  assert(/^[a-f0-9]{64}$/.test(evidence.artifact.sha256), "release evidence: invalid IPA SHA-256");
  assert(artifactDigest === evidence.artifact.sha256, "release IPA SHA-256 does not match release evidence");
  assert(artifactBytes.length === evidence.artifact.bytes, "release IPA byte count does not match release evidence");
  assert(evidence.artifact.bundleIdentifier === "app.thecommissure.ios",
    "release evidence: unexpected bundle identifier");
  assert(/^\d+\.\d+\.\d+$/.test(evidence.artifact.marketingVersion),
    "release evidence: invalid marketing version");
  assert(/^[1-9]\d*$/.test(evidence.artifact.buildNumber), "release evidence: invalid build number");
  assert(evidence.tag === `ios-v${evidence.artifact.marketingVersion}-${evidence.artifact.buildNumber}`,
    "release tag does not match artifact version/build");

  assert(evidence.content && typeof evidence.content === "object", "release evidence: content binding is required");
  const sitePath = resolve(evidenceRoot, evidence.content.sitePath ?? "");
  const publicKeyPath = resolve(evidenceRoot, evidence.content.publicKeyPath ?? "");
  safeRelative(evidenceRoot, sitePath, "content site");
  safeRelative(evidenceRoot, publicKeyPath, "content public key");
  const manifestPath = resolve(sitePath, "manifest.json");
  const manifestBytes = await readFile(manifestPath).catch((error) => {
    throw new ReleaseError(`content manifest: cannot read (${error.code ?? error.message})`);
  });
  const manifestDigest = sha256(manifestBytes);
  assert(manifestDigest === evidence.content.manifestSha256,
    "content manifest SHA-256 does not match release evidence");
  let manifest;
  try {
    manifest = await verifyPublication({ site: sitePath, publicKey: publicKeyPath });
    await verifyRetention({ site: sitePath, publicKey: publicKeyPath });
  }
  catch (error) { throw new ReleaseError(`content publication invalid: ${error.message}`); }

  assert(evidence.gates && typeof evidence.gates === "object" && !Array.isArray(evidence.gates),
    "release evidence: gates object is required");
  for (const gateId of requiredGates[evidence.stage]) {
    const gate = evidence.gates[gateId];
    assert(gate, `release gate missing: ${gateId}`);
    assert(gate.status === "passed", `release gate ${gateId}: status must be passed`);
    assert(typeof gate.approvedBy === "string" && gate.approvedBy.trim().length >= 2,
      `release gate ${gateId}: approvedBy is required`);
    assert(validTimestamp(gate.completedAt), `release gate ${gateId}: completedAt must be RFC 3339 UTC`);
    assert(Date.parse(gate.completedAt) <= Date.now(), `release gate ${gateId}: completedAt is in the future`);
    assert(gate.artifactSha256 === artifactDigest,
      `release gate ${gateId}: evidence is not bound to this IPA`);
    assert(gate.contentManifestSha256 === manifestDigest,
      `release gate ${gateId}: evidence is not bound to this content manifest`);
    assert(typeof gate.evidencePath === "string" && gate.evidencePath.length > 0,
      `release gate ${gateId}: evidencePath is required`);
    const gatePath = resolve(evidenceRoot, gate.evidencePath);
    safeRelative(evidenceRoot, gatePath, `release gate ${gateId}`);
    await regularFile(gatePath, `release gate ${gateId}`);
    const gateDigest = sha256(await readFile(gatePath));
    assert(gateDigest === gate.evidenceSha256, `release gate ${gateId}: evidence file SHA-256 mismatch`);
  }

  if (verifyGit) verifyGitBinding(evidence, resolve(repositoryRoot));
  if (inspectArtifact) {
    const inspection = await inspectSignedIPA(artifactPath);
    assert(inspection.bundleIdentifier === evidence.artifact.bundleIdentifier,
      "signed IPA bundle identifier differs from release evidence");
    assert(inspection.marketingVersion === evidence.artifact.marketingVersion,
      "signed IPA marketing version differs from release evidence");
    assert(inspection.buildNumber === evidence.artifact.buildNumber,
      "signed IPA build number differs from release evidence");
    assert(inspection.teamIdentifier === evidence.artifact.signingTeamIdentifier,
      "signed IPA team identifier differs from release evidence");
  }

  return {
    stage: evidence.stage,
    commit: evidence.commit,
    tag: evidence.tag,
    artifactSha256: artifactDigest,
    contentManifestSha256: manifestDigest,
    contentGeneration: manifest.generation,
    gates: requiredGates[evidence.stage]
  };
}

export function parseArguments(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    assert(token.startsWith("--"), `unexpected argument ${token}`);
    const key = token.slice(2);
    assert(argv[index + 1] && !argv[index + 1].startsWith("--"), `missing value for --${key}`);
    assert(result[key] === undefined, `duplicate argument --${key}`);
    result[key] = argv[index + 1];
    index += 1;
  }
  return result;
}
