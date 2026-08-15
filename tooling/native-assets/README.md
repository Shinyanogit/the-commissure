# Native Asset Tooling

This directory owns the reproducible GLB-to-USDZ spike pipeline. It deliberately
uses the tracked Light GLB files as inputs, so a collaborator does not need the
ignored Blender source files to regenerate a native test asset.

## Pinned toolchain

- Blender 5.2.0 LTS (`fbe6228777e7`)
- Apple USD Tools 0.25.2 from Xcode 26.2

Install Blender with `brew install --cask blender`. The wrapper rejects a
different Blender version instead of silently producing a different archive.

## Export a spike asset

```sh
tooling/native-assets/export-usdz.sh acdf
tooling/native-assets/export-usdz.sh pcdf
```

The command imports the tracked Draco GLB, requires the exact source entity
inventory in its manifest, replaces runtime substring styling with
explicit semantic bindings and native materials, applies the declared spike
decimation policy, flattens the composed layer into canonical order, exports
USDZ, and runs strict ARKit validation. ZIP timestamps are normalized, so the
same pinned input, manifest, and toolchain produce byte-identical output. Generated
assets and reports are kept under `tooling/native-assets/output/` and are not
committed.

An export fails when a source entity is missing, duplicated, unexpected, or
mapped twice. The finished USDZ is reopened and every recorded entity and mesh
path is required to exist exactly once before the report is written. Runtime
code consumes those final archive paths; it never searches by the original
Blender names, substrings, or array order.
