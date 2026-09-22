#!/usr/bin/env node
import { resolve } from "node:path";
import { parseArguments, PublishError, verifyPublication } from "./lib.mjs";

try {
  const args = parseArguments(process.argv.slice(2));
  if (!args.site) throw new PublishError("missing required --site");
  if (!args["public-key"]) throw new PublishError("missing required --public-key");
  const manifest = await verifyPublication({
    site: resolve(args.site),
    publicKey: resolve(args["public-key"])
  });
  console.log(`Verified signed content publication generation ${manifest.generation} and all pack bytes.`);
} catch (error) {
  console.error(`content-publish: ${error.message}`);
  process.exitCode = 1;
}
