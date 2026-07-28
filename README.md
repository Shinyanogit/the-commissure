# The Commissure

Interactive 3D education for cervical spine surgery (ACDF, ACCF, PCDF, and
PCF). The current production app is React/Three.js on the Web; a native
SwiftUI/RealityKit App Store version is specified for the same repository.

## Getting started

```bash
npm install
npm run dev      # start the dev server (Vite)
npm run build    # production build -> dist/
npm run preview  # preview the production build
```

## Current Web structure

- `src/pages/` — React route pages
- `src/components/` — shared Web chrome
- `src/scenes/` — imperative Three.js/GSAP scenes
- `src/content/` — current procedure prose
- `public/` — runtime assets (`.glb` 3D models, images, fonts)
- `.github/workflows/ci.yml` — Web build/test gate

## Native iOS plan

The approved concept and implementation contracts are versioned in
[`docs/DESIGN_CONCEPT.md`](docs/DESIGN_CONCEPT.md) and
[`docs/ios/`](docs/ios/README.md). Native implementation has not started on this
branch yet.

The first implementation phase will move the current Web product with
`git mv` into `web/`, then create separate `ios/`, `content/`, and `tooling/`
boundaries. Until that guarded migration is verified against a Vercel preview:

- do not place Swift/Xcode files among the current root Web files;
- do not move Web files piecemeal;
- treat `docs/ios/ROADMAP.md` as the migration order.

## 3D source files (`.blend`) are NOT in this repository

The Blender source files in `blender/` are large (several exceed GitHub's 100 MB
file limit) and are excluded via `.gitignore`. The app loads the exported `.glb`
models in `public/`, so it runs fine without the `.blend` files.

If you need to edit the 3D models, ask a maintainer for the Blender source files
(shared separately, e.g. via Google Drive). After editing, export the updated
`.glb` into `public/` and commit that.

The committed `.glb` files are Web exports. Native USDZ exports follow the
semantic-ID and provenance contract in `docs/ios/ASSET_DELIVERY.md`; do not
treat either renderer format as the editable source.
