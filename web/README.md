# The Commissure Web

This directory is the existing production React/Vite application.

```bash
npm ci
npm run dev
npm run build
npm test
```

Routes: `/`, `/acdf`, `/accf`, `/pcdf`, and `/pcf`.

- `src/pages/` owns React route pages.
- `src/components/` owns shared Web chrome.
- `src/scenes/` owns imperative Three.js/GSAP rendering.
- `src/content/` is the current editorial source until the validated content
  migration is complete.
- `public/` contains the shipped Web models, images, fonts, and Draco decoder.
- `script/` contains the existing editorial DOCX sources and is not deployed.

Vercel must use `web/` as its Root Directory. `vercel.json` deliberately runs
both build and smoke tests before a deployment can become ready.

Native Swift or RealityKit code does not belong here. See
[`../docs/ios/README.md`](../docs/ios/README.md).
