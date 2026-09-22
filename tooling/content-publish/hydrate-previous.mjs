#!/usr/bin/env node
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import {
  parseArguments,
  PublishError,
  verifyDetachedSignature,
  verifyPublication,
  verifyRetention
} from "./lib.mjs";

function assert(condition, message) {
  if (!condition) throw new PublishError(message);
}

async function fetchBytes(url, label, allowMissing = false) {
  const response = await fetch(url, { redirect: "error" });
  if (allowMissing && response.status === 404) return undefined;
  assert(response.ok, `${label}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

try {
  const args = parseArguments(process.argv.slice(2));
  if (!args.url) throw new PublishError("missing required --url");
  if (!args.output) throw new PublishError("missing required --output");
  const base = new URL(args.url);
  assert(base.protocol === "https:" && !base.username && !base.password && !base.search && !base.hash,
    "previous site URL must be credential-free HTTPS without query or fragment");
  if (!base.pathname.endsWith("/")) base.pathname += "/";
  const output = resolve(args.output);
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });

  const manifestBytes = await fetchBytes(new URL("manifest.json", base), "previous manifest", true);
  if (!manifestBytes) {
    console.log("No previous publication found; generation 1 is required.");
    process.exit(0);
  }
  const signature = await fetchBytes(new URL("manifest.sig", base), "previous signature");
  const retentionBytes = await fetchBytes(new URL("retained-files.json", base), "retention manifest");
  const retentionSignature = await fetchBytes(new URL("retained-files.sig", base), "retention signature");
  const publicKeyEncoded = process.env.CONTENT_SIGNING_PUBLIC_KEY_BASE64;
  assert(publicKeyEncoded, "missing CONTENT_SIGNING_PUBLIC_KEY_BASE64");
  const publicKey = Buffer.from(publicKeyEncoded, "base64");
  assert(publicKey.length === 32, "CONTENT_SIGNING_PUBLIC_KEY_BASE64 must decode to 32 bytes");
  assert(verifyDetachedSignature(manifestBytes, signature, publicKey),
    "previous manifest signature verification failed");
  assert(verifyDetachedSignature(retentionBytes, retentionSignature, publicKey),
    "retention signature verification failed");
  let manifest;
  try { manifest = JSON.parse(manifestBytes); } catch { throw new PublishError("previous manifest: invalid JSON"); }
  assert(Array.isArray(manifest.procedures), "previous manifest: missing procedures");
  await writeFile(join(output, "manifest.json"), manifestBytes);
  await writeFile(join(output, "manifest.sig"), signature);
  await writeFile(join(output, "public-key.raw"), publicKey);
  await writeFile(join(output, "retained-files.json"), retentionBytes);
  await writeFile(join(output, "retained-files.sig"), retentionSignature);

  let retention;
  try { retention = JSON.parse(retentionBytes); } catch { throw new PublishError("retention manifest: invalid JSON"); }
  assert(Array.isArray(retention.files), "retention manifest: missing files");
  for (const file of retention.files) {
    assert(typeof file.path === "string" && /^packs\/[a-z0-9._-]+\/\d+\.\d+\.\d+\/[a-f0-9]{16}\/[a-z0-9._-]+$/.test(file.path),
      `retention manifest: unsafe file path ${file.path}`);
    const fileURL = new URL(file.path, base);
    assert(fileURL.origin === base.origin && fileURL.pathname.startsWith(base.pathname),
      `retention manifest: file escapes base URL ${file.path}`);
    const destination = join(output, file.path);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, await fetchBytes(fileURL, file.path));
  }
  await verifyPublication({ site: output, publicKey: join(output, "public-key.raw") });
  await verifyRetention({ site: output, publicKey: join(output, "public-key.raw") });
  console.log(`Hydrated previous publication generation ${manifest.generation}.`);
} catch (error) {
  console.error(`content-publish: ${error.message}`);
  process.exitCode = 1;
}
