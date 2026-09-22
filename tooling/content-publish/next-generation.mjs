#!/usr/bin/env node
import { currentGeneration, parseArguments, PublishError } from "./lib.mjs";

try {
  const args = parseArguments(process.argv.slice(2));
  if (!args["github-output"]) throw new PublishError("missing required --github-output");
  const previous = args["previous-manifest"];
  const generation = (await currentGeneration(previous)) + 1;
  const { appendFile } = await import("node:fs/promises");
  await appendFile(args["github-output"], `generation=${generation}\n`);
  console.log(`Next manifest generation: ${generation}`);
} catch (error) {
  console.error(`content-publish: ${error.message}`);
  process.exitCode = 1;
}
