# Native Asset Tooling

This directory owns the reproducible GLB-to-USDZ production pipeline. It deliberately
uses the tracked Light GLB files as inputs, so a collaborator does not need the
ignored Blender source files to regenerate the four native assets.

## Pinned toolchain

- Blender 5.2.0 LTS (`fbe6228777e7`)
- Apple USD Tools 0.25.2 from Xcode 26.2

Install Blender with `brew install --cask blender`. The wrapper rejects a
different Blender version instead of silently producing a different archive.

## Generate and verify conversion manifests

```sh
python3 tooling/native-assets/generate_manifests.py
python3 tooling/native-assets/generate_manifests.py --check
```

The generator derives the complete ACDF, ACCF, PCDF, and PCF inventories from
`content/source-entities/<id>.json` and derives every dynamic semantic ID and
entity path from `content/ios-scenes/<id>.json`. Static anatomy uses the same
canonical semantic IDs across procedures. Conversion-only material and
decimation policy stays in the generator. A changed GLB digest, missing source
entity, duplicate ID/path, or noncanonical scene path fails closed.

## Export one asset

```sh
tooling/native-assets/export-usdz.sh acdf
tooling/native-assets/export-usdz.sh accf
tooling/native-assets/export-usdz.sh pcdf
tooling/native-assets/export-usdz.sh pcf
```

The command imports the tracked Draco GLB, requires the exact source entity
inventory in its manifest, replaces runtime substring styling with
explicit semantic bindings and native materials, applies the declared
decimation policy, flattens the composed layer into canonical order, exports
USDZ, and runs strict ARKit validation. ZIP timestamps are normalized, so the
same pinned input, manifest and toolchain produce byte-identical output.
Flattening disables source-file comments so absolute checkout paths are not
embedded in the layer. All four production exports matched byte-for-byte in
a separate checkout on September 19. Generated
assets and reports are kept under `tooling/native-assets/output/` and are not
committed.

An export fails when a source entity is missing, duplicated, unexpected, or
mapped twice. The finished USDZ is reopened and every recorded entity and mesh
path is required to exist exactly once before the report is written. Runtime
code consumes those final archive paths; it never searches by the original
Blender names, substrings, or array order.

## Build the four-asset iOS bundle

```sh
tooling/native-assets/build-all.sh
```

This regenerates all conversion manifests, exports and strictly validates all
four USDZ archives, then copies verified output to the ignored production
resource directory:

```text
ios/Resources/NativeAssets/
├── manifest.json
├── acdf/model.usdz
├── accf/model.usdz
├── pcdf/model.usdz
└── pcf/model.usdz
```

`manifest.json` has `schemaVersion: 1` and one sorted record per procedure with
`id`, `filename`, `sha256`, `bytes`, `triangles`, `entityCount`, and
`entityPaths`. The extra `entities` records retain exact source-name-to-path
evidence for audits. The bundle builder verifies archive hashes, byte counts,
the single `model.usdc` USDZ member, all conversion entity paths, every required
iOS scene path, and the pinned USD tool version before copying.

Run the integrity checks with:

```sh
python3 tooling/native-assets/test_integrity.py
```

The negative checks prove that a modified USDZ and a scene path absent from its
USDZ report are rejected. The 2026-09-12 output is 26,353,196 bytes (25.13 MiB):
all individual 8 MB targets and the 35 MB combined hard limit pass, while the
20 MB combined target does not. Asset rights, medical visual review, App
Thinning, and ACCF/PCF device performance remain release gates.


## Checkout portability regression

After building all four reference exports, run:

```sh
blender --background --factory-startup --python tooling/native-assets/test_canonicalization.py
python3 tooling/native-assets/test_reproducibility.py
python3 tooling/native-assets/test_integrity.py
```

The first check compares canonical USD layers at different absolute paths. The
second copies all source inputs into a separate temporary checkout, regenerates
all four production archives, and compares exact bytes against the references.
The final check rejects corrupt archives and scene bindings absent from them.
