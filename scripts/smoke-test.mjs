// Build smoke test: run after `npm run build` (CI does this).
// Verifies the multi-page build produced every page and copied the 3D assets,
// so a broken vite.config or missing entry fails CI before any deploy.
import { existsSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const DIST = 'dist';
const PUBLIC = 'public';
const REQUIRED_PAGES = ['index.html', 'accf.html', 'acdf.html', 'pcdf.html', 'pcf.html'];

let failed = false;
const fail = (msg) => { console.error(`FAIL  ${msg}`); failed = true; };
const pass = (msg) => console.log(`PASS  ${msg}`);

if (!existsSync(DIST)) {
  fail(`"${DIST}/" not found — run \`npm run build\` first`);
} else {
  for (const page of REQUIRED_PAGES) {
    existsSync(join(DIST, page)) ? pass(page) : fail(`missing page: ${page}`);
  }
  const requiredGlb = readdirSync(PUBLIC)
    .filter((f) => f.toLowerCase().endsWith('.glb'))
    .map((f) => basename(f));

  if (requiredGlb.length === 0) {
    fail(`no .glb assets found in ${PUBLIC}/`);
  } else {
    for (const asset of requiredGlb) {
      existsSync(join(DIST, asset)) ? pass(asset) : fail(`missing .glb asset: ${asset}`);
    }
  }
}

if (failed) {
  console.error('\nSmoke test failed.');
  process.exit(1);
}
console.log('\nSmoke test passed.');
