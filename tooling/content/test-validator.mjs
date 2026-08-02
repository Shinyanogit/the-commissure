import assert from "node:assert/strict";

import { loadRepository, validateDataset } from "./validate-content.mjs";

const baseline = await loadRepository();
assert.deepEqual(await validateDataset(structuredClone(baseline)), []);

for (const [procedureId, bundle] of Object.entries(baseline.procedures)) {
  const index = Math.min(2, bundle.procedure.steps.length - 1);
  const step = bundle.procedure.steps[index];
  const sceneBefore = JSON.stringify(bundle.scene.steps[index]);
  const englishProjection = {
    stepId: step.id,
    title: bundle.en.strings[step.titleKey],
    body: bundle.en.strings[step.bodyKey]
  };
  const japaneseProjection = {
    stepId: step.id,
    title: bundle.ja.strings[step.titleKey],
    body: bundle.ja.strings[step.bodyKey]
  };
  assert.equal(englishProjection.stepId, japaneseProjection.stepId, `${procedureId}: locale changed step identity`);
  assert.notEqual(englishProjection.title, japaneseProjection.title, `${procedureId}: locale did not change presentation`);
  assert.equal(JSON.stringify(bundle.scene.steps[index]), sceneBefore, `${procedureId}: locale projection mutated scene state`);
}

const pcdf = baseline.procedures.pcdf.scene;
const pcdfKyphosis = pcdf.steps.find(({ id }) => id === "pcdf_post_laminectomy_kyphosis").state.parts;
const pcdfFixation = pcdf.steps.find(({ id }) => id === "pcdf_posterior_fixation").state.parts;
for (const partId of [
  "disc_c2_c3", "disc_t6_t7", "ligamentum_flavum",
  "posterior_longitudinal_ligament", "central_nerve", "nerve_root_c5", "medulla_c5"
]) {
  assert.equal(pcdfKyphosis[partId].isVisible, false, `pcdf: ${partId} must hide during kyphosis`);
  assert.equal(pcdfFixation[partId].isVisible, true, `pcdf: ${partId} must restore for fixation`);
}
assert.deepEqual(
  baseline.procedures.accf.scene.steps[1].state.parts.vertebra_c4_removed.translation,
  [0, 0, 0],
  "accf: C4 removed body is not part of the C5 indication translation"
);
assert.equal(
  baseline.procedures.pcf.scene.steps[0].state.parts.nucleus_c4_c5_normal.isVisible,
  false,
  "pcf: normal nucleus is hidden in the initial herniation state"
);
assert.match(
  baseline.procedures.pcf.ja.strings["step.preserved_motion.body"],
  /前方頸椎椎間板切除固定術（ACDF）/,
  "pcf/ja: ACDF cross-link uses the canonical Japanese procedure title"
);

const cases = [
  {
    name: "missing translation",
    expected: "missing translation keys",
    mutate(dataset) {
      delete dataset.procedures.acdf.ja.strings["step.summary.body"];
    }
  },
  {
    name: "duplicate ID",
    expected: "duplicate step ID",
    mutate(dataset) {
      dataset.procedures.accf.procedure.steps[1].id = "accf_overview";
    }
  },
  {
    name: "relative transform",
    expected: "must NOT have additional properties",
    mutate(dataset) {
      dataset.procedures.pcdf.scene.steps[1].state.parts.vertebra_c5.delta = [0, 0, 1];
    }
  },
  {
    name: "unknown field",
    expected: "must NOT have additional properties",
    mutate(dataset) {
      dataset.procedures.pcf.procedure.remoteOperation = "execute";
    }
  },
  {
    name: "unknown easing",
    expected: "must be equal to one of the allowed values",
    mutate(dataset) {
      const scene = dataset.procedures.acdf.scene;
      scene.steps[1].entrance.push({ duration: 1, easing: "spring", target: structuredClone(scene.steps[1].state) });
    }
  },
  {
    name: "missing entity",
    expected: "missing source entity",
    mutate(dataset) {
      dataset.procedures.pcf.scene.parts[0].sourceEntity = "not in source model";
    }
  },
  {
    name: "unreviewed locale revision",
    expected: "must be equal to constant",
    mutate(dataset) {
      dataset.procedures.pcdf.ja.review.status = "draft";
    }
  },
  {
    name: "release-gate bypass",
    expected: "unconfirmed rights must remain release-blocking",
    mutate(dataset) {
      dataset.procedures.acdf.provenance.rightsReview.releaseGate = false;
    }
  },
  {
    name: "catalog path traversal",
    expected: "catalog path mismatch",
    mutate(dataset) {
      dataset.catalog.procedures[0].files[0].path = "content/procedures/acdf/../pcf/procedure.json";
    }
  },
  {
    name: "divergent final entrance beat",
    expected: "final entrance target differs from canonical state",
    mutate(dataset) {
      const scene = dataset.procedures.acdf.scene;
      const target = structuredClone(scene.steps[1].state);
      target.camera.fieldOfView = 26;
      scene.steps[1].entrance.push({ duration: 1, easing: "easeInOut", target });
    }
  },
  {
    name: "degenerate camera",
    expected: "camera position equals target",
    mutate(dataset) {
      const camera = dataset.procedures.accf.scene.steps[1].state.camera;
      camera.target = [...camera.position];
    }
  },
  {
    name: "zero rotation axis",
    expected: "rotation axis is zero",
    mutate(dataset) {
      dataset.procedures.pcdf.scene.steps[1].state.parts.vertebra_c5.rotation.axis = [0, 0, 0];
    }
  },
  {
    name: "duplicate source binding",
    expected: "duplicate source entity binding",
    mutate(dataset) {
      dataset.procedures.pcf.scene.parts[1].sourceEntity = dataset.procedures.pcf.scene.parts[0].sourceEntity;
    }
  },
  ...[
    "ftp://host/path",
    "file:///tmp/content",
    "mailto:person@example.com",
    "//host/path",
    "www.host.example/path",
    "**//host/path**",
    "。//host/path",
    ",//host/path"
  ].map((url) => ({
    name: `external URL ${url}`,
    expected: "external or executable URL",
    mutate(dataset) {
      dataset.procedures.acdf.ja.strings["step.summary.body"] += ` ${url}`;
    }
  })),
  {
    name: "locale identity swap",
    expected: "locale identity mismatch",
    mutate(dataset) {
      dataset.procedures.acdf.en.locale = "ja";
      dataset.procedures.acdf.ja.locale = "en";
    }
  },
  {
    name: "provenance revision divergence",
    expected: "provenance content revision mismatch",
    mutate(dataset) {
      dataset.procedures.accf.provenance.contentRevision += 1;
    }
  },
  {
    name: "view policy divergence",
    expected: "procedure/scene view policy mismatch",
    mutate(dataset) {
      const step = dataset.procedures.pcdf.scene.steps[1];
      step.viewPolicy = step.viewPolicy === "reframe" ? "preserveAdjustment" : "reframe";
    }
  },
  {
    name: "noncanonical procedure root",
    expected: "canonical scene root mismatch",
    mutate(dataset) {
      const scene = dataset.procedures.pcdf.scene;
      scene.rootEntityPath = "/root/procedure_other";
      for (const part of scene.parts) part.entityPath = part.entityPath.replace("/root/procedure_pcdf/", "/root/procedure_other/");
    }
  },
  {
    name: "internal procedure label divergence",
    expected: "internal link label mismatch",
    mutate(dataset) {
      dataset.procedures.pcf.ja.strings["step.preserved_motion.body"] = dataset.procedures.pcf.ja.strings["step.preserved_motion.body"]
        .replace("前方頸椎椎間板切除固定術（ACDF）", "前方頸椎椎間板切除術（ACDF）");
    }
  }
];

for (const testCase of cases) {
  const dataset = structuredClone(baseline);
  testCase.mutate(dataset);
  const errors = await validateDataset(dataset);
  assert.ok(errors.some((error) => error.includes(testCase.expected)), `${testCase.name}: ${errors.join(" | ")}`);
}

console.log(`Validator negative fixtures passed: ${cases.length}.`);
