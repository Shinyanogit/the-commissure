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

## PCDF interaction contract

- Orbit and zoom are always available; there is no separate interactive mode.
- One-finger drag orbits. Two-finger touch combines pinch zoom with screen-space
  panning so the anatomy can be repositioned horizontally and vertically.
- Changing explanations restores the authored scene view. Forward scene motion
  is replayed in reverse when navigating backward.
- Horizontal swipes inside the explanation panel move between steps. The same
  actions remain available through the icon-only arrow controls.
- Explanation copy slides left/right with navigation direction while the panel
  shell, arrows, and progress dots remain fixed.
- The panel docks on the right in landscape and at the absolute bottom in
  portrait. Its centered edge control both collapses the panel and resizes it by
  dragging; layout switching uses Tailwind orientation variants.
- Procedure routes do not render the global footer. The footer is reserved for
  the home route.

Vercel must use `web/` as its Root Directory. `vercel.json` deliberately runs
both build and smoke tests before a deployment can become ready.

Native Swift or RealityKit code does not belong here. See
[`../docs/ios/README.md`](../docs/ios/README.md).
