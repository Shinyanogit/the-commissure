import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { procedureText } from "../../web/src/content/procedureText.js";
import { japanese } from "./japanese.mjs";
import { scenes } from "./scenes.mjs";

const toolingDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(toolingDirectory, "../..");
const sourcePath = "web/src/content/procedureText.js";
const revisionDate = "2026-08-02";

const englishNormalizations = {
  pcf: [
    ["pressure on spine cord", "pressure on the spinal cord"],
    ["posterior cervical discectomy and fusion (PCDF)", "posterior cervical decompression and fusion (PCDF)"],
    ["anterior cervical discectomy (ACDF)", "anterior cervical discectomy and fusion (ACDF)"]
  ]
};

const metadata = {
  acdf: {
    abbreviation: "ACDF",
    assetPath: "web/public/Anterior Cervical Discectomy and Fusion (ACDF) Light.glb",
    stepIds: ["overview", "indications", "discectomy", "cage_types", "cage_implantation", "anterior_fixation", "summary"]
  },
  accf: {
    abbreviation: "ACCF",
    assetPath: "web/public/Anterior Cervical Corpectomy and Fusion (ACCF) Light.glb",
    stepIds: ["overview", "indications", "posterior_lesion", "discectomy_corpectomy", "reconstruction", "anterior_fixation", "summary"]
  },
  pcdf: {
    abbreviation: "PCDF",
    assetPath: "web/public/Posterior Cervical Decompression and Fusion (PCDF) Light.glb",
    stepIds: ["overview", "indications", "laminectomy", "post_laminectomy_kyphosis", "posterior_fixation", "summary"]
  },
  pcf: {
    abbreviation: "PCF",
    assetPath: "web/public/Posterior Cervical Foraminotomy (PCF) Light.glb",
    stepIds: ["overview", "indications", "laminoforaminotomy", "microdiscectomy", "preserved_motion", "summary"]
  }
};

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function glbNodeNames(bytes) {
  if (
    bytes.readUInt32LE(0) !== 0x46546c67 ||
    bytes.readUInt32LE(4) !== 2 ||
    bytes.readUInt32LE(8) !== bytes.length
  ) {
    throw new Error("Expected a binary glTF 2.0 asset");
  }
  const jsonLength = bytes.readUInt32LE(12);
  if (bytes.readUInt32LE(16) !== 0x4e4f534a || 20 + jsonLength > bytes.length) {
    throw new Error("Missing or truncated GLB JSON chunk");
  }
  const document = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8").trim());
  return (document.nodes ?? []).map(({ name }) => name).filter(Boolean);
}

function restrictedMarkdown(html, procedureId) {
  let value = html
    .trim()
    .replaceAll('<span class="highlight-red">', "**")
    .replaceAll("</span>", "**")
    .replace(/<a href="\/([a-z]+)">([^<]+)<\/a>/g, "[$2](procedure:$1)")
    .replaceAll("<ul>", "")
    .replaceAll("</ul>", "")
    .replaceAll("<li>", "- ")
    .replaceAll("</li>", "\n")
    .split("\n")
    .map((line) => line.trim().replace(/ +/g, " "))
    .filter(Boolean)
    .join("\n");
  for (const [from, to] of englishNormalizations[procedureId] ?? []) value = value.replaceAll(from, to);
  return value;
}

function localization(procedureId, locale, entries, sourceDigest, reviewer) {
  const strings = {
    "procedure.title": entries[0].title,
    "procedure.summary": entries[0].body.split("\n")[0]
  };
  for (const [index, entry] of entries.entries()) {
    const prefix = `step.${metadata[procedureId].stepIds[index]}`;
    strings[`${prefix}.title`] = entry.title;
    strings[`${prefix}.body`] = entry.body;
    strings[`${prefix}.accessibility`] = `${entry.title}. ${entry.body.split("\n")[0]}`;
  }
  return {
    schemaVersion: 1,
    procedureId,
    locale,
    revision: 1,
    review: {
      status: "editorialReviewed",
      reviewer,
      reviewedAt: revisionDate,
      sourceDigest
    },
    strings
  };
}

async function writeJSON(path, value) {
  const absolutePath = resolve(repositoryRoot, path);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const rawEnglishSource = await readFile(resolve(repositoryRoot, sourcePath));
const englishSourceDigest = sha256(rawEnglishSource);
const catalogEntries = [];

for (const procedureId of Object.keys(metadata)) {
  const configuration = metadata[procedureId];
  const websiteEntries = procedureText[procedureId].scenes.map((entry) => ({
    title: entry.title,
    body: restrictedMarkdown(entry.paragraph, procedureId)
  }));
  if (websiteEntries.length !== configuration.stepIds.length) {
    throw new Error(`${procedureId}: website step count changed`);
  }
  if (japanese[procedureId].length !== configuration.stepIds.length) {
    throw new Error(`${procedureId}: Japanese step count differs from English`);
  }

  const englishDigest = sha256(JSON.stringify(websiteEntries));
  const english = localization(
    procedureId,
    "en",
    websiteEntries,
    englishDigest,
    "Codex mechanical source migration verification"
  );
  const japaneseLocale = localization(
    procedureId,
    "ja",
    japanese[procedureId],
    sha256(JSON.stringify(english.strings)),
    "Codex bilingual editorial pass"
  );
  const steps = configuration.stepIds.map((stepId) => ({
    id: `${procedureId}_${stepId}`,
    titleKey: `step.${stepId}.title`,
    bodyKey: `step.${stepId}.body`,
    accessibilitySummaryKey: `step.${stepId}.accessibility`,
    viewPolicy: stepId === "overview" ? "preserveAdjustment" : "reframe"
  }));
  const procedure = {
    schemaVersion: 1,
    id: procedureId,
    abbreviation: configuration.abbreviation,
    version: "1.0.0",
    revision: 1,
    titleKey: "procedure.title",
    summaryKey: "procedure.summary",
    asset: { id: `${procedureId}_model`, version: "1.0.0" },
    sceneFile: `content/ios-scenes/${procedureId}.json`,
    locales: ["en", "ja"],
    steps
  };
  const assetBytes = await readFile(resolve(repositoryRoot, configuration.assetPath));
  const sourceEntities = glbNodeNames(assetBytes);
  await writeJSON(`content/source-entities/${procedureId}.json`, {
    schemaVersion: 1,
    procedureId,
    assetPath: configuration.assetPath,
    assetSha256: sha256(assetBytes),
    entities: sourceEntities
  });
  const provenance = {
    schemaVersion: 1,
    id: `${procedureId}_provenance`,
    procedureId,
    contentRevision: 1,
    englishSource: {
      path: sourcePath,
      sha256: englishSourceDigest,
      migration: "mechanical-html-to-restricted-markdown",
      normalizations: (englishNormalizations[procedureId] ?? []).map(([from, to]) => ({
        from,
        to,
        reason: "terminologyCorrection"
      }))
    },
    translationReview: {
      status: "editorialReviewed",
      reviewer: "Codex bilingual editorial pass",
      reviewedAt: revisionDate
    },
    medicalReview: {
      status: "inheritedWebsiteSource",
      releaseGate: true
    },
    rightsReview: {
      status: "ownerConfirmationRequired",
      releaseGate: true
    },
    assetSource: {
      path: configuration.assetPath,
      sha256: sha256(assetBytes)
    },
    license: "Repository-controlled educational asset",
    authors: ["The Commissure contributors"]
  };

  const files = [
    ["procedure", `content/procedures/${procedureId}/procedure.json`, procedure],
    ["scene", `content/ios-scenes/${procedureId}.json`, scenes[procedureId]],
    ["localization-en", `content/procedures/${procedureId}/en.json`, english],
    ["localization-ja", `content/procedures/${procedureId}/ja.json`, japaneseLocale],
    ["provenance", `content/procedures/${procedureId}/provenance.json`, provenance]
  ];
  for (const [, path, value] of files) await writeJSON(path, value);

  const fileRecords = [];
  for (const [role, path] of files) {
    const bytes = await readFile(resolve(repositoryRoot, path));
    fileRecords.push({ role, path, sha256: sha256(bytes), bytes: bytes.byteLength });
  }
  catalogEntries.push({
    id: procedureId,
    version: "1.0.0",
    revision: 1,
    sceneSchemaVersion: 1,
    minimumAppBuild: 1,
    locales: ["en", "ja"],
    requiredCapabilities: ["absoluteSceneState", "restrictedMarkdown", "bilingualV1"],
    files: fileRecords,
    provenanceId: `${procedureId}_provenance`
  });
}

await writeJSON("content/catalog/catalog.json", {
  schemaVersion: 1,
  generation: 1,
  publishedAt: "2026-08-02T00:00:00Z",
  procedures: catalogEntries
});

console.log(`Migrated ${catalogEntries.length} procedures and ${catalogEntries.reduce((sum, entry) => sum + metadata[entry.id].stepIds.length, 0)} steps.`);
