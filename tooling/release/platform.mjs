import { spawnSync } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import { basename, join } from "node:path";

import { ReleaseError } from "./lib.mjs";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.error || result.status !== 0) {
    throw new ReleaseError(`${basename(command)} failed: ${(result.stderr || result.error?.message || "unknown error").trim()}`);
  }
  return `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
}

async function findApps(payload) {
  const entries = await readdir(payload, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory() && entry.name.endsWith(".app"));
}

function plistValue(plist, key) {
  return run("/usr/bin/plutil", ["-extract", key, "raw", "-o", "-", plist]);
}

function plistHas(plist, key) {
  const result = spawnSync("/usr/bin/plutil", ["-extract", key, "raw", "-o", "-", plist], {
    encoding: "utf8"
  });
  return result.status === 0;
}

export async function inspectSignedIPA(ipaPath) {
  if (process.platform !== "darwin") {
    throw new ReleaseError("signed IPA inspection requires macOS");
  }
  const temporary = await mkdtemp(join(os.tmpdir(), "commissure-ipa-"));
  try {
    run("/usr/bin/ditto", ["-x", "-k", ipaPath, temporary]);
    const payload = join(temporary, "Payload");
    const apps = await findApps(payload).catch(() => []);
    if (apps.length !== 1) throw new ReleaseError("IPA must contain exactly one Payload/*.app");
    const app = join(payload, apps[0].name);
    run("/usr/bin/codesign", ["--verify", "--deep", "--strict", "--verbose=2", app]);
    const signing = run("/usr/bin/codesign", ["-dv", "--verbose=4", app]);
    const authority = signing.match(/^Authority=(.+)$/m)?.[1];
    const teamIdentifier = signing.match(/^TeamIdentifier=(.+)$/m)?.[1];
    if (!authority?.includes("Apple Distribution") || !teamIdentifier || teamIdentifier === "not set") {
      throw new ReleaseError("IPA is not signed with an Apple Distribution identity");
    }

    const info = join(app, "Info.plist");
    const executableName = plistValue(info, "CFBundleExecutable");
    const architectures = run("/usr/bin/lipo", ["-archs", join(app, executableName)]).split(/\s+/);
    if (architectures.some((arch) => arch === "x86_64" || arch === "i386")) {
      throw new ReleaseError(`IPA contains simulator architecture: ${architectures.join(",")}`);
    }
    await readFile(join(app, "PrivacyInfo.xcprivacy")).catch(() => {
      throw new ReleaseError("signed IPA does not contain PrivacyInfo.xcprivacy");
    });
    const provisioningPath = join(app, "embedded.mobileprovision");
    await readFile(provisioningPath).catch(() => {
      throw new ReleaseError("signed IPA does not contain embedded.mobileprovision");
    });
    const decodedProvision = join(temporary, "embedded.plist");
    const provisionBytes = spawnSync("/usr/bin/security", ["cms", "-D", "-i", provisioningPath]);
    if (provisionBytes.status !== 0 || !provisionBytes.stdout?.length) {
      throw new ReleaseError("embedded.mobileprovision could not be decoded");
    }
    await writeFile(decodedProvision, provisionBytes.stdout);
    const bundleIdentifier = plistValue(info, "CFBundleIdentifier");
    const profileTeam = plistValue(decodedProvision, "TeamIdentifier.0");
    const applicationIdentifier = plistValue(decodedProvision, "Entitlements.application-identifier");
    if (profileTeam !== teamIdentifier || applicationIdentifier !== `${teamIdentifier}.${bundleIdentifier}`) {
      throw new ReleaseError("provisioning profile identity does not match the signed app");
    }
    if (plistHas(decodedProvision, "ProvisionedDevices") || plistHas(decodedProvision, "ProvisionsAllDevices")) {
      throw new ReleaseError("IPA provisioning profile is not an App Store distribution profile");
    }
    if (plistHas(decodedProvision, "Entitlements.get-task-allow")
      && plistValue(decodedProvision, "Entitlements.get-task-allow") === "true") {
      throw new ReleaseError("IPA provisioning profile enables get-task-allow");
    }

    return {
      bundleIdentifier,
      marketingVersion: plistValue(info, "CFBundleShortVersionString"),
      buildNumber: plistValue(info, "CFBundleVersion"),
      teamIdentifier,
      authority,
      architectures
    };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
