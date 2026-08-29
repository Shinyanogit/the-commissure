// Build smoke test: run after `npm run build` (CI and Vercel do this).
// Verifies output, required models, SPA routing, and the Vercel fallback.
import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createServer } from "node:net";
import { basename, join } from "node:path";

const DIST = "dist";
const PUBLIC = "public";
const SITE_URL = "https://the-commissure.vercel.app";
const ROUTE_EXPECTATIONS = [
  {
    route: "/",
    filename: "index.html",
    title: "The Commissure | Interactive Spine Surgery Education",
  },
  {
    route: "/articles",
    filename: "articles.html",
    title: "Cervical Spine Surgery Articles | The Commissure",
  },
  {
    route: "/acdf",
    filename: "acdf.html",
    title: "ACDF Interactive 3D Guide | The Commissure",
  },
  {
    route: "/accf",
    filename: "accf.html",
    title: "ACCF Interactive 3D Guide | The Commissure",
  },
  {
    route: "/pcdf",
    filename: "pcdf.html",
    title: "PCDF Interactive 3D Guide | The Commissure",
  },
  {
    route: "/pcf",
    filename: "pcf.html",
    title: "PCF Interactive 3D Guide | The Commissure",
  },
  {
    route: "/pcl_open",
    filename: "pcl_open.html",
    title: "Open-door PCL Interactive 3D Guide | The Commissure",
  },
];
const REQUIRED_RUNTIME_ASSETS = [
  "draco/draco_decoder.js",
  "draco/draco_decoder.wasm",
  "draco/draco_wasm_wrapper.js",
];
const REQUIRED_EDITORIAL_UPDATES = [
  "Search metadata and a sitemap were added for all published procedure guides",
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

  for (const { route, filename, title } of ROUTE_EXPECTATIONS) {
    const path = join(DIST, filename);
    if (!existsSync(path)) {
      fail(`missing static route document: ${filename}`);
      continue;
    }

    const html = readFileSync(path, "utf8");
    const canonical = route === "/" ? `${SITE_URL}/` : `${SITE_URL}${route}`;
    const canonicalCount = (html.match(/rel="canonical"/g) ?? []).length;
    html.includes(`<title data-seo-managed="true">${title}</title>`)
      ? pass(`title ${route}`)
      : fail(`incorrect title for ${route}`);
    html.includes(`rel="canonical" href="${canonical}"`)
      ? pass(`canonical ${route}`)
      : fail(`incorrect canonical for ${route}`);
    canonicalCount === 1
      ? pass(`single canonical ${route}`)
      : fail(`expected one canonical for ${route}, found ${canonicalCount}`);
    html.includes('name="description"')
      ? pass(`description ${route}`)
      : fail(`missing description for ${route}`);

    const structuredDataMatch = html.match(
      /<script[^>]+id="route-structured-data"[^>]*>([\s\S]*?)<\/script>/,
    );
    if (!structuredDataMatch) {
      fail(`missing structured data for ${route}`);
    } else {
      try {
        const structuredData = JSON.parse(structuredDataMatch[1]);
        structuredData["@context"] === "https://schema.org"
          ? pass(`structured data ${route}`)
          : fail(`incorrect structured data context for ${route}`);
      } catch (error) {
        fail(`invalid structured data for ${route}: ${error.message}`);
      }
    }
  }

  const robotsPath = join(DIST, "robots.txt");
  if (!existsSync(robotsPath)) {
    fail("missing robots.txt");
  } else {
    const robots = readFileSync(robotsPath, "utf8");
    robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)
      ? pass("robots.txt sitemap declaration")
      : fail("robots.txt does not declare the canonical sitemap");
  }

  const sitemapPath = join(DIST, "sitemap.xml");
  if (!existsSync(sitemapPath)) {
    fail("missing sitemap.xml");
  } else {
    const sitemap = readFileSync(sitemapPath, "utf8");
    for (const { route } of ROUTE_EXPECTATIONS) {
      const canonical = route === "/" ? `${SITE_URL}/` : `${SITE_URL}${route}`;
      sitemap.includes(`<loc>${canonical}</loc>`)
        ? pass(`sitemap ${route}`)
        : fail(`sitemap missing ${route}`);
    }
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
  for (const { route, filename } of ROUTE_EXPECTATIONS.filter(({ route }) => route !== "/")) {
    const hasStaticRewrite = config.rewrites?.some(
      ({ source, destination }) => source === route && destination === `/${filename}`,
    );
    hasStaticRewrite
      ? pass(`Vercel static rewrite ${route}`)
      : fail(`missing Vercel static rewrite for ${route}`);
  }
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
    for (const { route, title } of ROUTE_EXPECTATIONS) {
      const response = await fetch(`${baseURL}${route}`);
      const body = await response.text();
      if (
        response.ok
        && body.includes('<div id="root"></div>')
        && body.includes(`<title data-seo-managed="true">${title}</title>`)
      ) {
        pass(`route ${route}`);
      } else {
        fail(`route ${route} did not return its static route shell`);
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
