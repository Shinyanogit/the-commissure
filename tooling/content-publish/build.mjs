#!/usr/bin/env node
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPublication, parseArguments, PublishError } from "./lib.mjs";

try {
  const args = parseArguments(process.argv.slice(2));
  const required = ["output", "generation", "published-at", "asset-base-url"];
  for (const key of required) {
    if (!args[key]) throw new PublishError(`missing required --${key}`);
  }
  const root = resolve(args.root ?? fileURLToPath(new URL("../..", import.meta.url)));
  const manifest = await buildPublication({
    root,
    output: resolve(args.output),
    generation: Number(args.generation),
    publishedAt: args["published-at"],
    assetBaseURL: args["asset-base-url"],
    previousManifest: args["previous-manifest"] ? resolve(args["previous-manifest"]) : undefined,
    previousSite: args["previous-site"] ? resolve(args["previous-site"]) : undefined
  });
  console.log(`Built signed content publication generation ${manifest.generation} with four immutable packs.`);
} catch (error) {
  console.error(`content-publish: ${error.message}`);
  process.exitCode = 1;
}
