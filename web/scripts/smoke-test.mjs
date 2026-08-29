// Build smoke test: run after `npm run build` (CI and Vercel do this).
// Verifies output, required models, SPA routing, and the Vercel fallback.
import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createServer } from "node:net";
import { basename, join } from "node:path";

const DIST = "dist";
const PUBLIC = "public";
const ROUTES = ["/", "/articles", "/acdf", "/accf", "/pcdf", "/pcf"];
const REQUIRED_RUNTIME_ASSETS = [
  "draco/draco_decoder.js",
  "draco/draco_decoder.wasm",
  "draco/draco_wasm_wrapper.js",
];
const REQUIRED_EDITORIAL_UPDATES = [
  "Shinya Yamaguchi's author profile now links to his portfolio",
  "Procedure pages now show a branded transition while each 3D scene prepares",
  "Procedure navigation and explanation controls were redesigned for desktop and mobile",
  "Procedure models now support orbit, zoom, pan, and synchronized reversible step transitions",
  "https://shinyanogit.github.io/",
];
const HOST = "127.0.0.1";

let failed = false;
const fail = (msg) => {
  console.error(`FAIL  ${msg}`);
  failed = true;
};
const pass = (msg) => console.log(`PASS  ${msg}`);
const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const availablePort = () =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, HOST, () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });

const waitForPreview = async (url) => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The preview process is still starting.
    }
    await delay(100);
  }
  throw new Error("preview server did not become ready within 5 seconds");
};

if (!existsSync(DIST)) {
  fail(`"${DIST}/" not found — run \`npm run build\` first`);
} else {
  existsSync(join(DIST, "index.html"))
    ? pass("index.html")
    : fail("missing SPA shell: index.html");

  const assetsDir = join(DIST, "assets");
  if (!existsSync(assetsDir)) {
    fail("missing assets directory");
  } else {
    const builtJs = readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
    builtJs.length > 0
      ? pass(`built JS bundle (${builtJs.length})`)
      : fail("missing built JS bundle");

    const builtSource = builtJs
      .map((file) => readFileSync(join(assetsDir, file), "utf8"))
      .join("\n");
    for (const update of REQUIRED_EDITORIAL_UPDATES) {
      builtSource.includes(update)
        ? pass(`editorial update: ${update}`)
        : fail(`missing editorial update: ${update}`);
    }
  }

  const requiredGlb = readdirSync(PUBLIC)
    .filter((f) => f.toLowerCase().endsWith(".glb"))
    .map((f) => basename(f));

  if (requiredGlb.length === 0) {
    fail(`no .glb assets found in ${PUBLIC}/`);
  } else {
    for (const asset of requiredGlb) {
      existsSync(join(DIST, asset))
        ? pass(asset)
        : fail(`missing .glb asset: ${asset}`);
    }
  }

  for (const asset of REQUIRED_RUNTIME_ASSETS) {
    existsSync(join(DIST, asset))
      ? pass(asset)
      : fail(`missing runtime asset: ${asset}`);
  }
}

try {
  const config = JSON.parse(readFileSync("vercel.json", "utf8"));
  const hasSpaFallback = config.rewrites?.some(
    ({ source, destination }) =>
      source === "/((?!.*\\.).*)" && destination === "/index.html",
  );
  hasSpaFallback
    ? pass("Vercel SPA fallback")
    : fail("missing Vercel SPA fallback");
  config.outputDirectory === DIST
    ? pass("Vercel output directory")
    : fail(`Vercel outputDirectory must be "${DIST}"`);
} catch (error) {
  fail(`invalid vercel.json: ${error.message}`);
}

if (existsSync(join(DIST, "index.html"))) {
  const port = await availablePort();
  const baseURL = `http://${HOST}:${port}`;
  const viteCLI = join("node_modules", "vite", "bin", "vite.js");
  const preview = spawn(
    process.execPath,
    [
      viteCLI,
      "preview",
      "--host",
      HOST,
      "--port",
      String(port),
      "--strictPort",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  let previewError = "";
  preview.stderr.on("data", (chunk) => {
    previewError += chunk.toString();
  });

  try {
    await waitForPreview(baseURL);
    for (const route of ROUTES) {
      const response = await fetch(`${baseURL}${route}`);
      const body = await response.text();
      if (response.ok && body.includes('<div id="root"></div>')) {
        pass(`route ${route}`);
      } else {
        fail(`route ${route} did not return the SPA shell`);
      }
    }
  } catch (error) {
    const detail = previewError.trim();
    fail(`preview routing: ${error.message}${detail ? ` (${detail})` : ""}`);
  } finally {
    preview.kill("SIGTERM");
  }
}

if (failed) {
  console.error("\nSmoke test failed.");
  process.exit(1);
}
console.log("\nSmoke test passed.");
