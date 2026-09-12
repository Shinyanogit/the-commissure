import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
  verify
} from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile
} from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

export const procedureIds = ["acdf", "accf", "pcdf", "pcf"];
export const requiredCapabilities = [
  "absoluteSceneState",
  "restrictedMarkdown",
  "bilingualV1"
];

const roles = [
  ["procedure", "procedure.json"],
  ["scene", "scene.json"],
  ["localization-en", "en.json"],
  ["localization-ja", "ja.json"],
  ["provenance", "provenance.json"],
  ["model", "model.usdz"]
];
const allRoles = [...roles.map(([role]) => role), "pack-metadata"];
const spkiEd25519Prefix = Buffer.from("302a300506032b6570032100", "hex");

export class PublishError extends Error {}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJSON(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function readJSON(path, label = path) {
  let bytes;
  try {
    bytes = await readFile(path);
  } catch (error) {
    throw new PublishError(`${label}: cannot read (${error.code ?? error.message})`);
  }
  try {
    return { value: JSON.parse(bytes), bytes };
  } catch {
    throw new PublishError(`${label}: invalid JSON`);
  }
}

function assert(condition, message) {
  if (!condition) throw new PublishError(message);
}

function isSafeComponent(value) {
  return typeof value === "string" && /^[a-z0-9][a-z0-9._-]*$/.test(value)
    && value !== "." && value !== "..";
}

function validateBaseURL(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new PublishError("asset base URL is not a valid absolute URL");
  }
  assert(url.protocol === "https:", "asset base URL must use HTTPS");
  assert(!url.username && !url.password && !url.search && !url.hash,
    "asset base URL must not contain credentials, query, or fragment");
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url.toString();
}

function compareSemver(left, right) {
  const a = left.split(".").map(Number);
  const b = right.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

function validateTimestamp(value) {
  assert(typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value),
    "publishedAt must be an RFC 3339 UTC timestamp with whole seconds");
  assert(!Number.isNaN(Date.parse(value)), "publishedAt is not a real timestamp");
}

async function ensureRegularFile(path, label) {
  let stats;
  try {
    stats = await lstat(path);
  } catch (error) {
    throw new PublishError(`${label}: missing (${error.code ?? error.message})`);
  }
  assert(stats.isFile() && !stats.isSymbolicLink(), `${label}: must be a regular non-symlink file`);
  return stats;
}

function pathInside(root, candidate, label) {
  const rel = relative(resolve(root), resolve(candidate));
  assert(rel && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel),
    `${label}: path escapes its root`);
}

function validateCatalogEntry(entry, expectedId, expectedFileCount = 5) {
  assert(entry && entry.id === expectedId, `catalog: expected procedure ${expectedId}`);
  assert(/^\d+\.\d+\.\d+$/.test(entry.version), `${expectedId}: invalid semantic version`);
  assert(Number.isSafeInteger(entry.revision) && entry.revision >= 1, `${expectedId}: invalid revision`);
  assert(entry.sceneSchemaVersion === 1, `${expectedId}: unsupported scene schema`);
  assert(Number.isSafeInteger(entry.minimumAppBuild) && entry.minimumAppBuild >= 1,
    `${expectedId}: invalid minimum app build`);
  assert(JSON.stringify(entry.locales) === JSON.stringify(["en", "ja"]),
    `${expectedId}: locales must be exactly en,ja`);
  assert(JSON.stringify([...entry.requiredCapabilities].sort()) === JSON.stringify([...requiredCapabilities].sort()),
    `${expectedId}: required capabilities differ from the native v1 allowlist`);
  assert(entry.provenanceId === `${expectedId}_provenance`, `${expectedId}: invalid provenance ID`);
  assert(Array.isArray(entry.files) && entry.files.length === expectedFileCount,
    `${expectedId}: expected ${expectedFileCount} files`);
}

function validateReleaseProvenance(provenance, id) {
  assert(provenance.procedureId === id, `${id}: provenance procedure mismatch`);
  assert(provenance.medicalReview?.status === "ownerApproved"
    && provenance.medicalReview?.releaseGate === false,
  `${id}: medical review is release-blocking; require ownerApproved with releaseGate=false`);
  assert(provenance.rightsReview?.status === "ownerApproved"
    && provenance.rightsReview?.releaseGate === false,
  `${id}: rights review is release-blocking; require ownerApproved with releaseGate=false`);
  assert(typeof provenance.license === "string" && provenance.license.trim().length > 0,
    `${id}: license is missing`);
  assert(Array.isArray(provenance.authors) && provenance.authors.length > 0,
    `${id}: authors are missing`);
}

function validateNativeRecord(record, id) {
  assert(record?.id === id, `native asset manifest: expected procedure ${id}`);
  assert(record.filename === `${id}/model.usdz`, `${id}: native filename must be ${id}/model.usdz`);
  assert(/^[a-f0-9]{64}$/.test(record.sha256), `${id}: invalid native model SHA-256`);
  assert(Number.isSafeInteger(record.bytes) && record.bytes > 0, `${id}: invalid native model size`);
  assert(Number.isSafeInteger(record.triangles) && record.triangles > 0, `${id}: invalid triangle count`);
  assert(Number.isSafeInteger(record.entityCount) && record.entityCount > 0, `${id}: invalid entity count`);
  assert(Array.isArray(record.entityPaths) && record.entityPaths.length === record.entityCount,
    `${id}: entity path count mismatch`);
  assert(new Set(record.entityPaths).size === record.entityPaths.length,
    `${id}: duplicate native entity path`);
  for (const path of record.entityPaths) {
    assert(typeof path === "string" && path.startsWith(`/root/procedure_${id}/`),
      `${id}: invalid native entity path ${path}`);
  }
}

function keyFromEnvironment(environment = process.env) {
  const encoded = environment.CONTENT_SIGNING_PRIVATE_KEY_BASE64;
  assert(encoded, "missing CONTENT_SIGNING_PRIVATE_KEY_BASE64 (base64 PKCS#8 Ed25519 key)");
  let der;
  try {
    der = Buffer.from(encoded, "base64");
  } catch {
    throw new PublishError("CONTENT_SIGNING_PRIVATE_KEY_BASE64 is not valid base64");
  }
  assert(der.length > 0 && der.toString("base64").replace(/=+$/, "") === encoded.replace(/\s+/g, "").replace(/=+$/, ""),
    "CONTENT_SIGNING_PRIVATE_KEY_BASE64 is not canonical base64");
  let key;
  try {
    key = createPrivateKey({ key: der, format: "der", type: "pkcs8" });
  } catch {
    throw new PublishError("CONTENT_SIGNING_PRIVATE_KEY_BASE64 is not a PKCS#8 private key");
  }
  assert(key.asymmetricKeyType === "ed25519", "content signing key must be Ed25519");
  return key;
}

function rawPublicKey(privateKey) {
  const der = createPublicKey(privateKey).export({ format: "der", type: "spki" });
  assert(der.length === spkiEd25519Prefix.length + 32
    && der.subarray(0, spkiEd25519Prefix.length).equals(spkiEd25519Prefix),
  "unable to export a raw Ed25519 public key");
  return der.subarray(spkiEd25519Prefix.length);
}

function expectedRawPublicKey(environment) {
  const encoded = environment.CONTENT_SIGNING_PUBLIC_KEY_BASE64;
  assert(encoded, "missing CONTENT_SIGNING_PUBLIC_KEY_BASE64 (base64 raw 32-byte Ed25519 public key)");
  const bytes = Buffer.from(encoded, "base64");
  assert(bytes.length === 32 && bytes.toString("base64").replace(/=+$/, "")
    === encoded.replace(/\s+/g, "").replace(/=+$/, ""),
  "CONTENT_SIGNING_PUBLIC_KEY_BASE64 must be canonical base64 for exactly 32 bytes");
  return bytes;
}

async function copyPayload(source, destination, expectedDigest, expectedBytes, label) {
  const stats = await ensureRegularFile(source, label);
  assert(stats.size === expectedBytes, `${label}: byte count differs from its source manifest`);
  const bytes = await readFile(source);
  assert(sha256(bytes) === expectedDigest, `${label}: SHA-256 differs from its source manifest`);
  await copyFile(source, destination);
  return { bytes, digest: expectedDigest };
}

export async function buildPublication({
  root,
  output,
  generation,
  publishedAt,
  assetBaseURL,
  previousManifest,
  previousSite,
  environment = process.env
}) {
  root = resolve(root);
  output = resolve(output);
  assert(Number.isSafeInteger(generation) && generation >= 1, "generation must be an integer >= 1");
  validateTimestamp(publishedAt);
  assetBaseURL = validateBaseURL(assetBaseURL);

  const sourceCatalogPath = join(root, "content/catalog/catalog.json");
  const { value: sourceCatalog } = await readJSON(sourceCatalogPath, "source catalog");
  assert(sourceCatalog.schemaVersion === 1, "source catalog: unsupported schema version");
  assert(sourceCatalog.procedures?.length === 4, "source catalog: exactly four procedures are required");

  let previous;
  if (previousManifest) {
    assert(previousSite, "previous site is required with a previous manifest");
    ({ value: previous } = await readJSON(previousManifest, "previous manifest"));
    assert(Number.isSafeInteger(previous.generation), "previous manifest: invalid generation");
    assert(generation > previous.generation,
      `manifest generation must increase beyond ${previous.generation}`);
  } else {
    assert(!previousSite, "previous manifest is required with a previous site");
    assert(generation === 1,
      "previous manifest is required when generation is greater than 1");
  }

  const nativeRoot = join(root, "ios/Resources/NativeAssets");
  const { value: nativeManifest } = await readJSON(join(nativeRoot, "manifest.json"), "native asset manifest");
  assert(nativeManifest.schemaVersion === 1, "native asset manifest: unsupported schema version");
  assert(Array.isArray(nativeManifest.procedures) && nativeManifest.procedures.length === 4,
    "native asset manifest: exactly four procedures are required");
  assert(nativeManifest.toolchain && typeof nativeManifest.toolchain === "object",
    "native asset manifest: toolchain record is required");

  const privateKey = keyFromEnvironment(environment);
  const publicKeyBytes = rawPublicKey(privateKey);
  assert(publicKeyBytes.equals(expectedRawPublicKey(environment)),
    "content signing private key does not match CONTENT_SIGNING_PUBLIC_KEY_BASE64");
  const staging = `${output}.staging-${process.pid}`;
  await rm(staging, { recursive: true, force: true });
  try {
    await lstat(output);
    throw new PublishError(`output already exists: ${output}`);
  } catch (error) {
    if (!(error instanceof PublishError) && error.code !== "ENOENT") throw error;
    if (error instanceof PublishError) throw error;
  }
  if (previousSite) {
    const verificationKey = join(resolve(previousSite), "public-key.raw");
    await verifyPublication({ site: previousSite, publicKey: verificationKey });
    const priorKey = await readFile(verificationKey);
    assert(priorKey.equals(publicKeyBytes), "previous site uses a different content signing public key");
    const retention = await verifyRetention({ site: previousSite, publicKey: verificationKey });
    await mkdir(staging, { recursive: true });
    for (const file of retention.files) {
      const source = join(resolve(previousSite), file.path);
      const destination = join(staging, file.path);
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(source, destination);
    }
  } else {
    await mkdir(staging, { recursive: true });
  }
  try {
    const manifestProcedures = [];
    for (const [index, id] of procedureIds.entries()) {
      const sourceEntry = sourceCatalog.procedures[index];
      validateCatalogEntry(sourceEntry, id);
      const nativeRecord = nativeManifest.procedures[index];
      validateNativeRecord(nativeRecord, id);

      const sourceByRole = new Map(sourceEntry.files.map((file) => [file.role, file]));
      assert(sourceByRole.size === 5, `${id}: duplicate source file role`);
      const provenanceSource = sourceByRole.get("provenance");
      const { value: provenance } = await readJSON(join(root, provenanceSource.path), `${id} provenance`);
      validateReleaseProvenance(provenance, id);

      const payloadSources = new Map();
      for (const [role, filename] of roles) {
        if (role === "model") {
          payloadSources.set(role, {
            source: join(nativeRoot, nativeRecord.filename),
            filename,
            sha256: nativeRecord.sha256,
            bytes: nativeRecord.bytes
          });
          continue;
        }
        const source = sourceByRole.get(role);
        assert(source, `${id}: missing source role ${role}`);
        pathInside(root, join(root, source.path), `${id}/${role}`);
        payloadSources.set(role, {
          source: join(root, source.path),
          filename,
          sha256: source.sha256,
          bytes: source.bytes
        });
      }

      const packMetadata = {
        schemaVersion: 1,
        id,
        version: sourceEntry.version,
        revision: sourceEntry.revision,
        provenanceId: sourceEntry.provenanceId,
        files: roles.map(([role]) => {
          const source = payloadSources.get(role);
          return { role, filename: source.filename, sha256: source.sha256, bytes: source.bytes };
        }),
        nativeAsset: {
          triangles: nativeRecord.triangles,
          entityCount: nativeRecord.entityCount,
          entityPaths: nativeRecord.entityPaths,
          toolchain: nativeManifest.toolchain
        }
      };
      const packBytes = Buffer.from(stableJSON(packMetadata));
      const packDigest = sha256(packBytes);
      const digestPrefix = packDigest.slice(0, 16);
      const relativeDirectory = `packs/${id}/${sourceEntry.version}/${digestPrefix}`;
      const directory = join(staging, relativeDirectory);
      await mkdir(directory, { recursive: true });

      const fileRecords = [];
      for (const [role] of roles) {
        const source = payloadSources.get(role);
        await copyPayload(source.source, join(directory, source.filename), source.sha256, source.bytes,
          `${id}/${role}`);
        fileRecords.push({
          role,
          path: `${relativeDirectory}/${source.filename}`,
          sha256: source.sha256,
          bytes: source.bytes
        });
      }
      await writeFile(join(directory, "pack.json"), packBytes);
      fileRecords.push({
        role: "pack-metadata",
        path: `${relativeDirectory}/pack.json`,
        sha256: packDigest,
        bytes: packBytes.length
      });

      const previousPack = previous?.procedures?.find((candidate) => candidate.id === id);
      if (previousPack?.version === sourceEntry.version) {
        assert(JSON.stringify(previousPack.files) === JSON.stringify(fileRecords),
          `${id}: version ${sourceEntry.version} was already published with different bytes; increment the semantic version`);
      } else if (previousPack && compareSemver(sourceEntry.version, previousPack.version) < 0) {
        for (const file of fileRecords) {
          const retained = join(staging, file.path);
          const stats = await ensureRegularFile(retained, `${id}: rollback target ${sourceEntry.version}/${file.role}`);
          assert(stats.size === file.bytes && sha256(await readFile(retained)) === file.sha256,
            `${id}: rollback target ${sourceEntry.version} is not the retained immutable pack`);
        }
      }

      manifestProcedures.push({
        id,
        version: sourceEntry.version,
        revision: sourceEntry.revision,
        sceneSchemaVersion: sourceEntry.sceneSchemaVersion,
        minimumAppBuild: sourceEntry.minimumAppBuild,
        locales: ["en", "ja"],
        requiredCapabilities: [...requiredCapabilities],
        provenanceId: sourceEntry.provenanceId,
        networkBytes: fileRecords.reduce((total, file) => total + file.bytes, 0),
        installedBytes: fileRecords.reduce((total, file) => total + file.bytes, 0),
        files: fileRecords
      });
    }

    const manifest = {
      schemaVersion: 1,
      generation,
      publishedAt,
      assetBaseURL,
      procedures: manifestProcedures
    };
    const manifestBytes = Buffer.from(stableJSON(manifest));
    const signature = sign(null, manifestBytes, privateKey);
    assert(signature.length === 64, "Ed25519 signature must be exactly 64 bytes");
    await writeFile(join(staging, "manifest.json"), manifestBytes);
    await writeFile(join(staging, "manifest.sig"), signature);
    await writeFile(join(staging, "public-key.raw"), publicKeyBytes);
    await writeRetention(staging, privateKey);

    await verifyPublication({ site: staging, publicKey: join(staging, "public-key.raw") });
    await verifyRetention({ site: staging, publicKey: join(staging, "public-key.raw") });
    await mkdir(dirname(output), { recursive: true });
    await rename(staging, output);
    return manifest;
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
}

async function listPackFiles(root, directory = join(root, "packs")) {
  const files = [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return files;
    throw error;
  }
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const path = join(directory, entry.name);
    assert(!entry.isSymbolicLink(), `retention: symbolic links are forbidden (${path})`);
    if (entry.isDirectory()) files.push(...await listPackFiles(root, path));
    else {
      assert(entry.isFile(), `retention: non-regular file is forbidden (${path})`);
      const bytes = await readFile(path);
      files.push({
        path: relative(root, path).split(sep).join("/"),
        sha256: sha256(bytes),
        bytes: bytes.length
      });
    }
  }
  return files;
}

async function writeRetention(site, privateKey) {
  const retention = { schemaVersion: 1, files: await listPackFiles(site) };
  const bytes = Buffer.from(stableJSON(retention));
  await writeFile(join(site, "retained-files.json"), bytes);
  await writeFile(join(site, "retained-files.sig"), sign(null, bytes, privateKey));
}

function rawPublicKeyObject(bytes) {
  assert(bytes.length === 32, "Ed25519 public key must be exactly 32 raw bytes");
  return createPublicKey({
    key: Buffer.concat([spkiEd25519Prefix, bytes]),
    format: "der",
    type: "spki"
  });
}

export function verifyDetachedSignature(bytes, signature, publicKeyBytes) {
  return signature.length === 64
    && verify(null, bytes, rawPublicKeyObject(publicKeyBytes), signature);
}

export async function verifyRetention({ site, publicKey }) {
  site = resolve(site);
  const { value: retention, bytes } = await readJSON(join(site, "retained-files.json"), "retention manifest");
  const signature = await readFile(join(site, "retained-files.sig")).catch((error) => {
    throw new PublishError(`retention signature: cannot read (${error.code ?? error.message})`);
  });
  const keyBytes = await readFile(publicKey);
  assert(verifyDetachedSignature(bytes, signature, keyBytes),
    "retention signature verification failed");
  assert(retention.schemaVersion === 1 && Array.isArray(retention.files) && retention.files.length > 0,
    "retention manifest: invalid structure");
  const seen = new Set();
  for (const file of retention.files) {
    assert(typeof file.path === "string" && file.path.startsWith("packs/") && !seen.has(file.path),
      `retention manifest: unsafe or duplicate path ${file.path}`);
    seen.add(file.path);
    const components = file.path.split("/");
    assert(components.length === 5 && components.every(isSafeComponent),
      `retention manifest: unsafe path ${file.path}`);
    assert(/^[a-f0-9]{64}$/.test(file.sha256) && Number.isSafeInteger(file.bytes) && file.bytes > 0,
      `retention manifest: invalid expectation for ${file.path}`);
    const absolute = join(site, file.path);
    pathInside(site, absolute, "retention");
    const stats = await ensureRegularFile(absolute, `retention/${file.path}`);
    assert(stats.size === file.bytes && sha256(await readFile(absolute)) === file.sha256,
      `retention manifest: content mismatch for ${file.path}`);
  }
  return retention;
}

function validatePublishedFilePath(path, id, version, digestPrefix) {
  assert(typeof path === "string" && !path.includes("\\") && !path.includes(":"),
    `${id}: unsafe published path ${path}`);
  const components = path.split("/");
  assert(components.length === 5 && components.every((part) => isSafeComponent(part)),
    `${id}: unsafe published path ${path}`);
  assert(components[0] === "packs" && components[1] === id && components[2] === version
    && components[3] === digestPrefix,
  `${id}: published path is outside its immutable pack directory`);
}

export async function verifyPublication({ site, publicKey }) {
  site = resolve(site);
  const { value: manifest, bytes: manifestBytes } = await readJSON(join(site, "manifest.json"), "manifest");
  const signature = await readFile(join(site, "manifest.sig")).catch((error) => {
    throw new PublishError(`manifest signature: cannot read (${error.code ?? error.message})`);
  });
  assert(signature.length === 64, "manifest signature must be exactly 64 bytes");
  const publicKeyBytes = await readFile(publicKey).catch((error) => {
    throw new PublishError(`public key: cannot read (${error.code ?? error.message})`);
  });
  assert(verifyDetachedSignature(manifestBytes, signature, publicKeyBytes),
    "manifest signature verification failed");

  assert(manifest.schemaVersion === 1, "manifest: unsupported schema version");
  assert(Number.isSafeInteger(manifest.generation) && manifest.generation >= 1,
    "manifest: invalid generation");
  validateTimestamp(manifest.publishedAt);
  validateBaseURL(manifest.assetBaseURL);
  assert(Array.isArray(manifest.procedures) && manifest.procedures.length === 4,
    "manifest: exactly four procedures are required");

  for (const [index, id] of procedureIds.entries()) {
    const pack = manifest.procedures[index];
    validateCatalogEntry(pack, id, 7);
    assert(Array.isArray(pack.files) && pack.files.length === 7, `${id}: expected seven published files`);
    assert(Number.isSafeInteger(pack.networkBytes) && pack.networkBytes > 0, `${id}: invalid network size`);
    assert(pack.installedBytes === pack.networkBytes, `${id}: installed/network size mismatch`);
    const roleSet = new Set(pack.files.map((file) => file.role));
    assert(roleSet.size === 7 && allRoles.every((role) => roleSet.has(role)),
      `${id}: published file roles are incomplete or duplicated`);
    const pathSet = new Set(pack.files.map((file) => file.path));
    assert(pathSet.size === 7, `${id}: duplicate published file path`);
    const metadata = pack.files.find((file) => file.role === "pack-metadata");
    assert(/^[a-f0-9]{64}$/.test(metadata.sha256), `${id}: invalid pack metadata SHA-256`);
    const digestPrefix = metadata.sha256.slice(0, 16);
    let totalBytes = 0;
    for (const file of pack.files) {
      assert(/^[a-f0-9]{64}$/.test(file.sha256), `${id}/${file.role}: invalid SHA-256`);
      assert(Number.isSafeInteger(file.bytes) && file.bytes > 0, `${id}/${file.role}: invalid byte count`);
      validatePublishedFilePath(file.path, id, pack.version, digestPrefix);
      const absolute = join(site, file.path);
      pathInside(site, absolute, `${id}/${file.role}`);
      const stats = await ensureRegularFile(absolute, `${id}/${file.role}`);
      assert(stats.size === file.bytes, `${id}/${file.role}: byte count mismatch`);
      const bytes = await readFile(absolute);
      assert(sha256(bytes) === file.sha256, `${id}/${file.role}: SHA-256 mismatch`);
      totalBytes += file.bytes;
      if (file.role === "provenance") {
        let provenance;
        try { provenance = JSON.parse(bytes); } catch { throw new PublishError(`${id}: invalid provenance JSON`); }
        validateReleaseProvenance(provenance, id);
      }
    }
    assert(totalBytes === pack.networkBytes, `${id}: aggregate byte count mismatch`);
    const { value: packMetadata } = await readJSON(join(site, metadata.path), `${id}/pack-metadata`);
    assert(packMetadata.id === id && packMetadata.version === pack.version,
      `${id}: pack metadata identity mismatch`);
    assert(JSON.stringify(packMetadata.files.map(({ role }) => role)) === JSON.stringify(roles.map(([role]) => role)),
      `${id}: pack metadata roles/order mismatch`);
  }
  return manifest;
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

export async function currentGeneration(path) {
  if (!path) return 0;
  const { value } = await readJSON(path, "previous manifest");
  assert(Number.isSafeInteger(value.generation) && value.generation >= 1,
    "previous manifest: invalid generation");
  return value.generation;
}
