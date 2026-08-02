import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { procedureText } from "../../web/src/content/procedureText.js";

const toolingDirectory = dirname(fileURLToPath(import.meta.url));
const defaultRoot = resolve(toolingDirectory, "../..");
const procedureIds = ["acdf", "accf", "pcdf", "pcf"];
const schemaNames = ["catalog", "procedure", "localization", "scene", "provenance", "source-entities"];
const englishNormalizations = {
  pcf: [
    ["pressure on spine cord", "pressure on the spinal cord"],
    ["posterior cervical discectomy and fusion (PCDF)", "posterior cervical decompression and fusion (PCDF)"],
    ["anterior cervical discectomy (ACDF)", "anterior cervical discectomy and fusion (ACDF)"]
  ]
};

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
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

async function readJSON(root, path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}

export async function loadRepository(root = defaultRoot) {
  const schemas = Object.fromEntries(
    await Promise.all(schemaNames.map(async (name) => [name, await readJSON(root, `content/schema/${name}.schema.json`)]))
  );
  const catalog = await readJSON(root, "content/catalog/catalog.json");
  const procedures = {};
  for (const id of procedureIds) {
    procedures[id] = {
      procedure: await readJSON(root, `content/procedures/${id}/procedure.json`),
      scene: await readJSON(root, `content/ios-scenes/${id}.json`),
      en: await readJSON(root, `content/procedures/${id}/en.json`),
      ja: await readJSON(root, `content/procedures/${id}/ja.json`),
      provenance: await readJSON(root, `content/procedures/${id}/provenance.json`),
      inventory: await readJSON(root, `content/source-entities/${id}.json`),
      nativeManifest: ["acdf", "pcdf"].includes(id)
        ? await readJSON(root, `tooling/native-assets/manifests/${id}.json`)
        : null
    };
  }
  return { root, schemas, catalog, procedures };
}

function duplicateValues(values) {
  const seen = new Set();
  return values.filter((value) => seen.has(value) || !seen.add(value));
}

function markdownErrors(value) {
  const errors = [];
  if (/[<>]/.test(value)) errors.push("raw HTML");
  if (/^\s*(#|>|```|\d+\.)/m.test(value)) errors.push("unsupported block syntax");
  const linksRemoved = value.replace(/\[[^\]\n]+\]\(procedure:(acdf|accf|pcdf|pcf)\)/g, "");
  if (
    /\b(?:https?|ftp|file|mailto|javascript|data|blob|wss?|tel|sms):/i.test(linksRemoved)
    || /\b[a-z][a-z0-9+.-]*:(?:\/\/|\/|[^\s])/i.test(linksRemoved)
    || /\/\//.test(linksRemoved)
    || /\bwww\.[^\s)\]]+/i.test(linksRemoved)
  ) errors.push("external or executable URL");
  if (/[\[\]]|\]\(/.test(linksRemoved)) errors.push("unsupported link");
  const boldCount = (value.match(/\*\*/g) ?? []).length;
  if (boldCount % 2 !== 0) errors.push("unbalanced emphasis");
  if (value.replaceAll("**", "").includes("*")) errors.push("unsupported emphasis");
  return errors;
}

function schemaErrors(validate, value, label) {
  if (validate(value)) return [];
  return (validate.errors ?? []).map((error) => `${label}: schema ${error.instancePath || "/"} ${error.message}`);
}

function magnitude([x, y, z]) {
  return Math.hypot(x, y, z);
}

function stateSemanticErrors(state, label) {
  const errors = [];
  const view = state.camera.target.map((value, index) => value - state.camera.position[index]);
  const up = state.camera.up;
  const cross = [
    view[1] * up[2] - view[2] * up[1],
    view[2] * up[0] - view[0] * up[2],
    view[0] * up[1] - view[1] * up[0]
  ];
  if (magnitude(view) < 1e-6) errors.push(`${label}: camera position equals target`);
  if (magnitude(up) < 1e-6) errors.push(`${label}: camera up vector is zero`);
  if (magnitude(cross) < 1e-6) errors.push(`${label}: camera up vector is parallel to view`);
  for (const [partId, partState] of Object.entries(state.parts)) {
    if (magnitude(partState.rotation.axis) < 1e-6) errors.push(`${label}/${partId}: rotation axis is zero`);
  }
  return errors;
}

export async function validateDataset(dataset) {
  const { root, schemas, catalog, procedures } = dataset;
  const errors = [];
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validators = Object.fromEntries(
    Object.entries(schemas).map(([name, schema]) => [name, ajv.compile(schema)])
  );
  errors.push(...schemaErrors(validators.catalog, catalog, "catalog"));

  const catalogIds = catalog.procedures.map(({ id }) => id);
  const duplicates = duplicateValues(catalogIds);
  if (duplicates.length) errors.push(`catalog: duplicate procedure ID ${duplicates.join(", ")}`);
  if (catalogIds.join(",") !== procedureIds.join(",")) {
    errors.push(`catalog: expected ordered procedures ${procedureIds.join(",")}`);
  }

  const rawEnglishSource = await readFile(resolve(root, "web/src/content/procedureText.js"));
  const rawEnglishDigest = sha256(rawEnglishSource);
  const globalStepIds = new Set();

  for (const catalogEntry of catalog.procedures) {
    const id = catalogEntry.id;
    const bundle = procedures[id];
    if (!bundle) {
      errors.push(`${id}: missing procedure bundle`);
      continue;
    }
    const { procedure, scene, en, ja, provenance, inventory, nativeManifest } = bundle;
    errors.push(...schemaErrors(validators.procedure, procedure, `${id}/procedure`));
    errors.push(...schemaErrors(validators.scene, scene, `${id}/scene`));
    errors.push(...schemaErrors(validators.localization, en, `${id}/en`));
    errors.push(...schemaErrors(validators.localization, ja, `${id}/ja`));
    errors.push(...schemaErrors(validators.provenance, provenance, `${id}/provenance`));
    errors.push(...schemaErrors(validators["source-entities"], inventory, `${id}/inventory`));

    for (const value of [procedure.id, scene.procedureId, en.procedureId, ja.procedureId, provenance.procedureId, inventory.procedureId]) {
      if (value !== id) errors.push(`${id}: cross-file procedure ID mismatch (${value})`);
    }
    if (catalogEntry.version !== procedure.version || procedure.asset.version !== scene.assetVersion) {
      errors.push(`${id}: version mismatch`);
    }
    if (procedure.asset.id !== scene.assetId) errors.push(`${id}: asset ID mismatch`);
    if (procedure.sceneFile !== `content/ios-scenes/${id}.json`) errors.push(`${id}: scene file path mismatch`);
    if (scene.rootEntityPath !== `/root/procedure_${id}`) errors.push(`${id}: canonical scene root mismatch`);
    if (catalogEntry.revision !== procedure.revision || procedure.revision !== en.revision || en.revision !== ja.revision) {
      errors.push(`${id}: content revision mismatch`);
    }
    if (provenance.contentRevision !== procedure.revision) errors.push(`${id}: provenance content revision mismatch`);
    if (en.locale !== "en" || ja.locale !== "ja") errors.push(`${id}: locale identity mismatch`);
    if (catalogEntry.provenanceId !== provenance.id) errors.push(`${id}: provenance ID mismatch`);
    if (provenance.medicalReview.status === "inheritedWebsiteSource" && !provenance.medicalReview.releaseGate) {
      errors.push(`${id}: inherited medical review must remain release-blocking`);
    }
    if (provenance.rightsReview.status === "ownerConfirmationRequired" && !provenance.rightsReview.releaseGate) {
      errors.push(`${id}: unconfirmed rights must remain release-blocking`);
    }

    const stepIds = procedure.steps.map(({ id: stepId }) => stepId);
    const duplicateSteps = duplicateValues(stepIds);
    if (duplicateSteps.length) errors.push(`${id}: duplicate step ID ${duplicateSteps.join(", ")}`);
    for (const stepId of stepIds) {
      if (globalStepIds.has(stepId)) errors.push(`${id}: globally duplicate step ID ${stepId}`);
      globalStepIds.add(stepId);
    }
    if (stepIds.length !== scene.steps.length) errors.push(`${id}: procedure/scene step count mismatch`);
    if (scene.steps.map(({ id: stepId }) => stepId).join(",") !== stepIds.join(",")) {
      errors.push(`${id}: procedure/scene step ID mismatch`);
    }
    for (const [index, step] of procedure.steps.entries()) {
      if (scene.steps[index]?.viewPolicy !== step.viewPolicy) {
        errors.push(`${id}/${step.id}: procedure/scene view policy mismatch`);
      }
    }

    const expectedKeys = new Set([procedure.titleKey, procedure.summaryKey]);
    for (const step of procedure.steps) {
      expectedKeys.add(step.titleKey);
      expectedKeys.add(step.bodyKey);
      expectedKeys.add(step.accessibilitySummaryKey);
    }
    const enKeys = Object.keys(en.strings);
    const jaKeys = Object.keys(ja.strings);
    for (const [locale, keys] of [["en", enKeys], ["ja", jaKeys]]) {
      const missing = [...expectedKeys].filter((key) => !keys.includes(key));
      const extra = keys.filter((key) => !expectedKeys.has(key));
      if (missing.length) errors.push(`${id}/${locale}: missing translation keys ${missing.join(", ")}`);
      if (extra.length) errors.push(`${id}/${locale}: extra translation keys ${extra.join(", ")}`);
    }
    if (enKeys.sort().join("\n") !== jaKeys.sort().join("\n")) errors.push(`${id}: locale key parity mismatch`);
    for (const [locale, localization] of [["en", en], ["ja", ja]]) {
      for (const [key, value] of Object.entries(localization.strings)) {
        for (const error of markdownErrors(value)) errors.push(`${id}/${locale}/${key}: ${error}`);
        for (const match of value.matchAll(/\[([^\]\n]+)\]\(procedure:(acdf|accf|pcdf|pcf)\)/g)) {
          const [, label, targetId] = match;
          const target = procedures[targetId];
          const targetTitle = target?.[locale]?.strings[target?.procedure?.titleKey];
          if (!targetTitle || label.toLocaleLowerCase(locale) !== targetTitle.toLocaleLowerCase(locale)) {
            errors.push(`${id}/${locale}/${key}: internal link label mismatch for ${targetId}`);
          }
        }
      }
    }

    const websiteEntries = procedureText[id].scenes.map((entry) => ({
      title: entry.title,
      body: restrictedMarkdown(entry.paragraph, id)
    }));
    if (en.review.sourceDigest !== sha256(JSON.stringify(websiteEntries))) {
      errors.push(`${id}/en: source digest mismatch`);
    }
    if (ja.review.sourceDigest !== sha256(JSON.stringify(en.strings))) {
      errors.push(`${id}/ja: source digest mismatch`);
    }
    for (const [index, step] of procedure.steps.entries()) {
      if (en.strings[step.titleKey] !== websiteEntries[index]?.title) errors.push(`${id}/en: title drift at ${step.id}`);
      if (en.strings[step.bodyKey] !== websiteEntries[index]?.body) errors.push(`${id}/en: body drift at ${step.id}`);
    }
    if (provenance.englishSource.sha256 !== rawEnglishDigest) errors.push(`${id}: English provenance digest mismatch`);
    const expectedNormalizations = (englishNormalizations[id] ?? []).map(([from, to]) => ({
      from,
      to,
      reason: "terminologyCorrection"
    }));
    if (JSON.stringify(provenance.englishSource.normalizations) !== JSON.stringify(expectedNormalizations)) {
      errors.push(`${id}: English normalization record mismatch`);
    }

    const assetBytes = await readFile(resolve(root, inventory.assetPath));
    const assetDigest = sha256(assetBytes);
    if (inventory.assetSha256 !== assetDigest || provenance.assetSource.sha256 !== assetDigest) {
      errors.push(`${id}: asset provenance digest mismatch`);
    }
    if (inventory.assetPath !== provenance.assetSource.path) errors.push(`${id}: asset provenance path mismatch`);

    const partIds = scene.parts.map(({ id: partId }) => partId);
    const duplicateParts = duplicateValues(partIds);
    if (duplicateParts.length) errors.push(`${id}: duplicate part ID ${duplicateParts.join(", ")}`);
    const duplicatePaths = duplicateValues(scene.parts.map(({ entityPath }) => entityPath));
    if (duplicatePaths.length) errors.push(`${id}: duplicate entity path ${duplicatePaths.join(", ")}`);
    const duplicateSources = duplicateValues(scene.parts.map(({ sourceEntity }) => sourceEntity));
    if (duplicateSources.length) errors.push(`${id}: duplicate source entity binding ${duplicateSources.join(", ")}`);
    const inventorySet = new Set(inventory.entities);
    if (nativeManifest) {
      if (nativeManifest.procedure !== id) errors.push(`${id}: native manifest procedure mismatch`);
      if (nativeManifest.rootEntity !== `procedure_${id}`) errors.push(`${id}: native manifest root mismatch`);
      if (nativeManifest.input !== inventory.assetPath) errors.push(`${id}: native manifest asset path mismatch`);
    }
    for (const binding of scene.parts) {
      if (!inventorySet.has(binding.sourceEntity)) errors.push(`${id}: missing source entity ${binding.sourceEntity}`);
      const convertedBinding = nativeManifest?.bindings[binding.sourceEntity];
      if (nativeManifest && !convertedBinding) errors.push(`${id}: source entity missing from native manifest ${binding.sourceEntity}`);
      if (convertedBinding && binding.id !== convertedBinding.id) {
        errors.push(`${id}: canonical part ID disagrees with native manifest for ${binding.sourceEntity}`);
      }
      const group = convertedBinding?.group ?? (binding.implantId ? "implants" : "anatomy");
      const expectedPath = `${scene.rootEntityPath}/${group}/${binding.id}`;
      if (binding.entityPath !== expectedPath) errors.push(`${id}: noncanonical entity path ${binding.entityPath}`);
    }
    const dynamicIds = scene.parts.filter(({ dynamic }) => dynamic).map(({ id: partId }) => partId).sort();
    for (const [label, state] of [["baseState", scene.baseState], ...scene.steps.map((step) => [step.id, step.state])]) {
      errors.push(...stateSemanticErrors(state, `${id}/${label}`));
      const stateIds = Object.keys(state.parts).sort();
      const missing = dynamicIds.filter((partId) => !stateIds.includes(partId));
      const extra = stateIds.filter((partId) => !dynamicIds.includes(partId));
      if (missing.length) errors.push(`${id}/${label}: incomplete resolved state missing ${missing.join(", ")}`);
      if (extra.length) errors.push(`${id}/${label}: unknown state part ${extra.join(", ")}`);
    }
    for (const step of scene.steps) {
      for (const [index, beat] of step.entrance.entries()) {
        errors.push(...stateSemanticErrors(beat.target, `${id}/${step.id}/beat_${index}`));
        const beatIds = Object.keys(beat.target.parts).sort();
        if (beatIds.join(",") !== dynamicIds.join(",")) errors.push(`${id}/${step.id}/beat_${index}: incomplete target`);
      }
      if (step.entrance.length && !isDeepStrictEqual(step.entrance.at(-1).target, step.state)) {
        errors.push(`${id}/${step.id}: final entrance target differs from canonical state`);
      }
    }

    const roles = catalogEntry.files.map(({ role }) => role).sort();
    const expectedRoles = ["localization-en", "localization-ja", "procedure", "provenance", "scene"];
    if (roles.join(",") !== expectedRoles.join(",")) errors.push(`${id}: catalog file roles incomplete or duplicate`);
    const expectedPaths = {
      procedure: `content/procedures/${id}/procedure.json`,
      scene: `content/ios-scenes/${id}.json`,
      "localization-en": `content/procedures/${id}/en.json`,
      "localization-ja": `content/procedures/${id}/ja.json`,
      provenance: `content/procedures/${id}/provenance.json`
    };
    for (const file of catalogEntry.files) {
      if (file.path !== expectedPaths[file.role]) {
        errors.push(`${id}/${file.role}: catalog path mismatch`);
        continue;
      }
      const bytes = await readFile(resolve(root, file.path));
      if (file.bytes !== bytes.byteLength) errors.push(`${id}/${file.role}: byte count mismatch`);
      if (file.sha256 !== sha256(bytes)) errors.push(`${id}/${file.role}: file hash mismatch`);
    }
  }
  return errors;
}

export async function validateRepository(root = defaultRoot) {
  return validateDataset(await loadRepository(root));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = await validateRepository();
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log("Content validation passed: 4 procedures, 26 steps, en/ja parity, absolute scenes, provenance, and catalog hashes.");
  }
}
