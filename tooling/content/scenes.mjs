const identity = () => ({
  translation: [0, 0, 0],
  rotation: { axis: [1, 0, 0], radians: 0 },
  opacity: 1,
  isVisible: true
});

const camera = (position, target = [0, 0.2, 0], up = [0, 1, 0], fieldOfView = 75) => ({
  position,
  target,
  up,
  fieldOfView
});

const part = (id, sourceEntity, group = "anatomy", implantId) => ({
  id,
  sourceEntity,
  entityPath: `/root/procedure_PROCEDURE/${group}/${id}`,
  dynamic: true,
  ...(implantId ? { implantId } : {})
});

const clone = (value) => structuredClone(value);

const stepIds = {
  acdf: ["overview", "indications", "discectomy", "cage_types", "cage_implantation", "anterior_fixation", "summary"],
  accf: ["overview", "indications", "posterior_lesion", "discectomy_corpectomy", "reconstruction", "anterior_fixation", "summary"],
  pcdf: ["overview", "indications", "laminectomy", "post_laminectomy_kyphosis", "posterior_fixation", "summary"],
  pcf: ["overview", "indications", "laminoforaminotomy", "microdiscectomy", "preserved_motion", "summary"]
};

function scene(procedureId, parts, cameras, resolve) {
  const normalizedParts = parts.map((value) => ({
    ...value,
    entityPath: value.entityPath.replace("PROCEDURE", procedureId)
  }));
  const baselineParts = Object.fromEntries(normalizedParts.map(({ id }) => [id, identity()]));
  const baseState = { camera: cameras[0], parts: resolve(1, clone(baselineParts)) };
  return {
    schemaVersion: 1,
    procedureId,
    assetId: `${procedureId}_model`,
    assetVersion: "1.0.0",
    rootEntityPath: `/root/procedure_${procedureId}`,
    parts: normalizedParts,
    baseState,
    steps: cameras.map((stepCamera, index) => ({
      id: `${procedureId}_${stepIds[procedureId][index]}`,
      viewPolicy: index === 0 ? "preserveAdjustment" : "reframe",
      state: {
        camera: stepCamera,
        parts: resolve(index + 1, clone(baselineParts))
      },
      entrance: []
    }))
  };
}

const hide = (states, ids, translation = [0, 0, 0]) => {
  for (const id of ids) {
    states[id] = { ...identity(), translation, opacity: 0, isVisible: false };
  }
};

const translate = (states, ids, translation) => {
  for (const id of ids) states[id] = { ...states[id], translation };
};

const show = (states, ids) => {
  for (const id of ids) states[id] = identity();
};

function acdf() {
  const operative = ["disc_c4_c5", "nucleus_c4_c5", "vertebra_c5", "medulla_c5", "nerve_root_c5"];
  const discs = ["disc_c4_c5", "nucleus_c4_c5"];
  const plates = ["plate_1", "plate_2"];
  const screws = ["screw_1", "screw_2", "screw_3", "screw_4"];
  const implants = [...plates, ...screws];
  const parts = [
    part("disc_c4_c5", "c4-c5 disk"),
    part("nucleus_c4_c5", "c4-c5 nucleus pulposus"),
    part("vertebra_c5", "c5 bone"),
    part("medulla_c5", "c5 nerve medulla"),
    part("nerve_root_c5", "c5 nerve"),
    part("interbody_spacer", "interbody spacer.004", "implants", "interbody_cage"),
    ...plates.map((id, index) => part(id, `plate ${index + 1}`, "implants", "anterior_plate_system")),
    ...screws.map((id, index) => part(id, `screw ${index + 1}`, "implants", "anterior_plate_system"))
  ];
  const cameras = [
    camera([0.2, 0.2, 0]),
    camera([0, 0.4, -0.9], [0, 0.2, -1], [0, 0, -1], 25),
    camera([0, 0.2, 0.2], [0, 0.2, 0], [0, 1, 0], 15),
    camera([0.2, 0.3, 0.3], [0, 0.2, 0.42], [0, 1, 0], 15),
    camera([0.12, 0.2, 0.02], [0, 0.2, 0.02]),
    camera([0.2, 0.2, 0.4], [0, 0.2, 0], [0, 1, 0], 15),
    camera([-0.2, 0.2, 0.4], [0, 0.2, 0], [0, 1, 0], 15)
  ];
  return scene("acdf", parts, cameras, (step, states) => {
    hide(states, ["interbody_spacer"], [0, -0.4, 0]);
    states.interbody_spacer.rotation = { axis: [1, 0, 0], radians: -2 * Math.PI / 9 };
    hide(states, implants, [0, -0.2, 0]);
    if (step === 2) translate(states, operative, [0, 1, 0]);
    if (step >= 3) hide(states, discs);
    if (step === 4) {
      states.interbody_spacer = {
        ...identity(),
        translation: [0, -0.4, 0],
        rotation: { axis: [1, 0, 0], radians: -2 * Math.PI / 9 }
      };
    }
    if (step >= 5) show(states, ["interbody_spacer"]);
    if (step >= 6) show(states, implants);
    return states;
  });
}

function accf() {
  const operative = [
    "disc_c4_c5", "disc_c5_c6", "nucleus_c4_c5", "nucleus_c5_c6",
    "vertebra_c5_removed_solid", "vertebra_c5_removed_transparent",
    "vertebra_c5_solid", "vertebra_c5_transparent",
    "medulla_c5", "nerve_root_c5"
  ];
  const removed = [
    "disc_c4_c5", "disc_c5_c6", "nucleus_c4_c5", "nucleus_c5_c6",
    "vertebra_c4_removed", "vertebra_c5_removed_solid", "vertebra_c5_removed_transparent",
    "vertebra_c6_removed"
  ];
  const transparent = ["vertebra_c5_removed_transparent", "vertebra_c5_transparent"];
  const cages = ["cage_sheath", "cage_shaft"];
  const screws = ["screw_1", "screw_2", "screw_3", "screw_4"];
  const parts = [
    part("disc_c4_c5", "c4-c5 disk"), part("disc_c5_c6", "c5-c6 disk"),
    part("nucleus_c4_c5", "c4-c5 nucleus pulposus"), part("nucleus_c5_c6", "c5-c6 nucleus pulposus"),
    part("vertebra_c4_removed", "c4 bone removed"),
    part("vertebra_c5_removed_solid", "c5 bone removed solid"),
    part("vertebra_c5_removed_transparent", "c5 bone removed transparent"),
    part("vertebra_c5_solid", "c5 bone solid"),
    part("vertebra_c5_transparent", "c5 bone transparent"),
    part("vertebra_c6_removed", "c6 bone removed"),
    part("medulla_c5", "c5 nerve medulla"), part("nerve_root_c5", "c5 nerve"),
    part("cage_sheath", "vertebral body cage sheath", "implants", "vertebral_body_cage"),
    part("cage_shaft", "vertebral body cage shaft", "implants", "vertebral_body_cage"),
    part("plate", "plate", "implants", "anterior_plate_system"),
    ...screws.map((id, index) => part(id, `screw ${index + 1}`, "implants", "anterior_plate_system"))
  ];
  const cameras = [
    camera([0.2, 0.2, 0]),
    camera([0, 0.4, -0.9], [0, 0.2, -1], [0, 0, -1], 25),
    camera([0.2, 0.2, -1], [0, 0.2, -1], [0, 1, 0], 25),
    camera([0, 0.1, 0.2], [0, 0.2, 0], [0, 1, 0], 25),
    camera([-0.1, 0.1, 0.2], [0, 0.2, 0], [0, 1, 0], 25),
    camera([0.2, 0.2, 0.4], [0, 0.2, 0], [0, 1, 0], 15),
    camera([-0.1, 0.1, 0.2], [0, 0.2, 0], [0, 1, 0], 15)
  ];
  return scene("accf", parts, cameras, (step, states) => {
    hide(states, cages, [0, -0.4, 0]);
    hide(states, ["plate", ...screws], [0, -0.2, 0]);
    if (step === 2 || step === 3) translate(states, operative, [0, 1, 0]);
    if (step === 3) hide(states, transparent, [0, 1, 0]);
    if (step >= 4) hide(states, removed);
    if (step >= 5) {
      show(states, cages);
      states.cage_shaft.translation = [0, -0.00125, 0.0025];
    }
    if (step >= 6) show(states, ["plate", ...screws]);
    return states;
  });
}

function pcdf() {
  const removed = ["lamina_c5", "lamina_removed", "ligamentum_flavum_removed"];
  const operative = ["vertebra_c5", "lamina_c5", "nerve_root_c5", "medulla_c5"];
  const discs = [
    "disc_c2_c3", "disc_c3_c4", "disc_c4_c5", "disc_c5_c6", "disc_c6_c7", "disc_c7_t1",
    "disc_t1_t2", "disc_t2_t3", "disc_t3_t4", "disc_t4_t5", "disc_t5_t6", "disc_t6_t7"
  ];
  const softTissue = [
    ...discs,
    "ligamentum_flavum", "ligamentum_flavum_2", "ligamentum_flavum_3",
    "posterior_longitudinal_ligament", "central_nerve", "nerve_root_c5", "medulla_c5"
  ];
  const kyphosis = {
    cranium: [[0, -0.05, -0.05], Math.PI / 5],
    vertebra_c1: [[0, -0.045, -0.01], Math.PI / 5],
    vertebra_c2: [[0, -0.04, -0.005], Math.PI / 5],
    vertebra_c3: [[0, -0.023, 0], Math.PI / 5],
    vertebra_c4: [[0, -0.013, 0], Math.PI / 10],
    vertebra_c5: [[0, -0.007, 0], Math.PI / 20],
    vertebra_c6: [[0, -0.004, 0], Math.PI / 40],
    vertebra_c7: [[0, -0.001, 0], Math.PI / 80]
  };
  const screwParts = [];
  for (let index = 1; index <= 10; index += 1) {
    for (const component of ["shaft", "saddle", "cap"]) {
      screwParts.push(part(`screw_${component}_${index}`, `screw ${component} ${index}`, "implants", `lateral_mass_screw_${index}`));
    }
  }
  const rodParts = [1, 2].map((index) => part(`rod_${index}`, `rod ${index}`, "implants", `posterior_rod_${index}`));
  const parts = [
    part("cranium", "cranium bone"),
    ...Array.from({ length: 7 }, (_, index) => part(`vertebra_c${index + 1}`, `c${index + 1} bone`)),
    ...discs.map((id) => part(id, `${id.slice(5).replaceAll("_", "-")} disk`)),
    part("ligamentum_flavum", "ligament flavum"),
    part("ligamentum_flavum_2", "ligament flavum.002"),
    part("ligamentum_flavum_3", "ligament flavum.003"),
    part("posterior_longitudinal_ligament", "posterior longitudinal ligament"),
    part("central_nerve", "central nerve"),
    part("lamina_c5", "c5 removed bone"), part("lamina_removed", "removed bone"),
    part("ligamentum_flavum_removed", "removed ligament flavum.002"),
    part("nerve_root_c5", "c5 nerve.001"), part("medulla_c5", "c5 nerve medulla"),
    ...screwParts,
    ...rodParts
  ];
  const cameras = [
    camera([0.2, 0.2, 0]),
    camera([0, 0.4, -1], [0, 0.2, -1], [0, 0, -1], 25),
    camera([0, 0.2, -0.2]),
    camera([0.2, 0.2, 0]),
    camera([0, 0.2, -0.2]),
    camera([-0.2, 0.2, 0])
  ];
  return scene("pcdf", parts, cameras, (step, states) => {
    const screwIds = screwParts.map(({ id }) => id);
    const rodIds = rodParts.map(({ id }) => id);
    hide(states, screwIds, [0, 0.2, 0]);
    hide(states, rodIds, [0, 0, -0.2]);
    if (step === 2) translate(states, operative, [0, 1, 0]);
    if (step >= 3) hide(states, removed);
    if (step === 4) {
      hide(states, softTissue);
      for (const [id, [translation, radians]] of Object.entries(kyphosis)) {
        states[id] = { ...states[id], translation, rotation: { axis: [1, 0, 0], radians } };
      }
    }
    if (step >= 5) show(states, [...screwIds, ...rodIds]);
    return states;
  });
}

function pcf() {
  const operative = [
    "vertebra_c5", "vertebra_c5_removed",
    "disc_c4_c5", "nucleus_c4_c5_herniated", "nucleus_c4_c5_normal",
    "nerve_root_c5", "medulla_c5"
  ];
  const removed = [
    "vertebra_c4_removed", "vertebra_c5_removed",
    "ligamentum_flavum_removed_1", "ligamentum_flavum_removed_2"
  ];
  const pulposus = ["nucleus_c4_c5_herniated", "nucleus_c4_c5_normal"];
  const parts = [
    part("vertebra_c5", "c5 bone"),
    part("vertebra_c4_removed", "c4 bone removed"), part("vertebra_c5_removed", "c5 bone removed"),
    part("ligamentum_flavum_removed_1", "ligamentum flavum removed"),
    part("ligamentum_flavum_removed_2", "ligamentum flavum removed.001"),
    part("disc_c4_c5", "c4-c5 disk"),
    part("nucleus_c4_c5_herniated", "c4-c5 nucleus pulposus herniated"),
    part("nucleus_c4_c5_normal", "c4-c5 nucleus pulposus normal"),
    part("nerve_root_c5", "c5 nerve"), part("medulla_c5", "c5 nerve medulla")
  ];
  const cameras = [
    camera([0.2, 0.2, 0]),
    camera([0, 0.4, -0.9], [0, 0.2, -1], [0, 0, -1], 25),
    camera([0.045, 0.205, -0.1], [0.015, 0.205, 0], [0, 1, 0], 20),
    camera([0.045, 0.205, -0.1], [0.015, 0.205, 0], [0, 1, 0], 20),
    camera([0.2, 0.2, 0]),
    camera([0.045, 0.205, -0.1], [0.015, 0.205, 0], [0, 1, 0], 35)
  ];
  return scene("pcf", parts, cameras, (step, states) => {
    hide(states, ["nucleus_c4_c5_normal"]);
    if (step === 2) translate(states, operative, [0, 1, 0]);
    if (step >= 3) hide(states, removed);
    if (step >= 4) hide(states, pulposus);
    return states;
  });
}

export const scenes = { acdf: acdf(), accf: accf(), pcdf: pcdf(), pcf: pcf() };
