# The Commissure

Interactive 3D educational website for cervical spine surgery (ACDF, ACCF, PCDF, PCF),
built with [Three.js](https://threejs.org/) and [Vite](https://vitejs.dev/).

## Getting started

```bash
npm install
npm run dev      # start the dev server (Vite)
npm run build    # production build -> dist/
npm run preview  # preview the production build
```

## Project structure

- `index.html`, `acdf.html`, `accf.html`, `pcdf.html`, `pcf.html` — pages
- `src/` — JavaScript entry points and shaders
- `public/` — runtime assets (`.glb` 3D models, images, fonts)
- `stash/` — older/experimental scripts kept for reference

## 3D source files (`.blend`) are NOT in this repository

The Blender source files in `blender/` are large (several exceed GitHub's 100 MB
file limit) and are excluded via `.gitignore`. The app loads the exported `.glb`
models in `public/`, so it runs fine without the `.blend` files.

If you need to edit the 3D models, ask a maintainer for the Blender source files
(shared separately, e.g. via Google Drive). After editing, export the updated
`.glb` into `public/` and commit that.
