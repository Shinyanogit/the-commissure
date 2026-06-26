// Build smoke test: run after `npm run build` (CI does this).
// Verifies the multi-page build produced every page and copied the 3D assets,
// so a broken vite.config or missing entry fails CI before any deploy.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
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
  const glb = readdirSync(DIST).filter((f) => f.toLowerCase().endsWith('.glb'));
  glb.length > 0 ? pass(`${glb.length} .glb model(s) copied`) : fail('no .glb assets in dist/');
}

if (failed) {
  console.error('\nSmoke test failed.');
  process.exit(1);
}
console.log('\nSmoke test passed.');
