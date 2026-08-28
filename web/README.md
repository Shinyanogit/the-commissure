# The Commissure Web

This directory is the existing production React/Vite application.

```bash
npm ci
npm run dev
npm run build
npm test
```

Routes: `/`, `/acdf`, `/accf`, `/pcdf`, `/pcf`, and `/pcl_open`.

- `src/pages/` owns React route pages.
- `src/components/` owns shared Web chrome.
- `src/scenes/` owns imperative Three.js/GSAP rendering.
- `src/content/` is the current editorial source until the validated content
  migration is complete.
- `public/` contains the shipped Web models, images, fonts, and Draco decoder.
- `script/` contains the existing editorial DOCX sources and is not deployed.

## Procedure interaction contract

- Orbit, zoom, and pan are always available on every procedure route; there is
  no separate interactive mode.
- One-finger drag orbits. Two-finger touch combines pinch zoom with screen-space
  panning so the anatomy can be repositioned horizontally and vertically.
- Changing explanations restores the authored scene view. Forward scene motion
  is replayed in reverse when navigating backward. Scene motion starts after
  the 0.5-second explanation snap completes, so rejected or unfinished swipes
  never move the anatomy.
- Explanation steps form one horizontal carousel. Dragging follows the pointer,
  then always snaps to the adjacent step or back to the current step on release.
  Swipes can begin on linked body copy, and icon-only arrow controls provide the
  same navigation. An input made during scene motion is retained and runs when
  that motion completes.
- The panel docks on the right in landscape and at the absolute bottom in
  portrait. Its centered edge control both collapses the panel and resizes it by
  dragging; layout switching uses Tailwind orientation variants. The portrait
  panel uses a translucent glass content surface, defaults to 28dvh, and is
  capped at 42dvh. Its transparent arrow/progress overlay does not consume copy
  height; the progress dots sit at the lower edge and the scroll content adds a
  matching end spacer. Carousel clipping occurs before inner spacing, so
  adjacent copy never leaks into view. The portrait toggle is a slim tab built
  into the glass panel's top edge, using a borderless low-contrast gradient so
  it reads as part of the surface. The camera projection keeps the anatomy
  centered in the remaining space to the left or above the open panel and
  returns it to screen center when the panel closes.
- Once the 0.5-second panel close completes, the procedure logo and hamburger
  fade out. Reopening the panel restores them immediately; the reopen trigger
  remains available while the panel is stowed.
- Procedure routes do not render the global footer. The footer is reserved for
  the home route.

Vercel must use `web/` as its Root Directory. `vercel.json` deliberately runs
both build and smoke tests before a deployment can become ready.

Native Swift or RealityKit code does not belong here. See
[`../docs/ios/README.md`](../docs/ios/README.md).
