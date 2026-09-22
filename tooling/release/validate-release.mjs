#!/usr/bin/env node
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArguments, ReleaseError, validateReleaseEvidence } from "./lib.mjs";

try {
  const args = parseArguments(process.argv.slice(2));
  if (!args.evidence) throw new ReleaseError("missing required --evidence");
  const result = await validateReleaseEvidence({
    evidencePath: resolve(args.evidence),
    artifactOverride: args.artifact ? resolve(args.artifact) : undefined,
    repositoryRoot: resolve(args.root ?? fileURLToPath(new URL("../..", import.meta.url)))
  });
  console.log(JSON.stringify({ status: "ready", ...result }, null, 2));
} catch (error) {
  console.error(`release-readiness: ${error.message}`);
  process.exitCode = 1;
}
