// Build smoke test: run after `npm run build` (CI does this).
// Verifies the SPA shell, JS bundle, and copied 3D assets exist, so a broken
// Vite build or missing public asset fails CI before any deploy.
import { existsSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const DIST = 'dist';
const PUBLIC = 'public';

let failed = false;
const fail = (msg) => { console.error(`FAIL  ${msg}`); failed = true; };
const pass = (msg) => console.log(`PASS  ${msg}`);

if (!existsSync(DIST)) {
  fail(`"${DIST}/" not found — run \`npm run build\` first`);
} else {
  existsSync(join(DIST, 'index.html')) ? pass('index.html') : fail('missing SPA shell: index.html');

  const assetsDir = join(DIST, 'assets');
  if (!existsSync(assetsDir)) {
    fail('missing assets directory');
  } else {
    const builtJs = readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
    builtJs.length > 0 ? pass(`built JS bundle (${builtJs.length})`) : fail('missing built JS bundle');
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
