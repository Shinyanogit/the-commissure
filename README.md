# The Commissure

Interactive 3D education for cervical spine surgery (ACDF, ACCF, PCDF, and
PCF). This monorepo keeps the production React/Three.js website and the native
SwiftUI/RealityKit App Store implementation in explicit, independent roots.

## Repository map

- `web/` — current React/Vite/Three.js product and its Vercel configuration
- `ios/` — native app source boundary
- `content/` — renderer-neutral copy, localization, metadata, and schemas
- `tooling/` — content validation and asset conversion tools
- `docs/DESIGN_CONCEPT.md` — shared visual and interaction contract
- `docs/CHANGELOG.md` — dated Web and native product changes
- `docs/WEB_SEARCH_DISCOVERY.md` — Web search metadata and indexing contract
- `docs/ios/` — native product, architecture, delivery, and release contracts

Web source, native source, shared content, and tooling must not be mixed across
these roots. Renderer-specific animation remains in its owning product.

## Run the Web product

```bash
cd web
npm ci
npm run dev      # start the dev server (Vite)
npm run build    # production build -> dist/
npm run preview  # preview the production build
npm test         # verify the SPA shell and required 3D assets
```

Vercel's Root Directory is `web/`. GitHub integration owns deployment: a pull
request receives a preview and a successful `main` build becomes production.
The Web workflow runs only for `web/**` changes.

## Native iOS implementation

The approved concept and implementation contracts are versioned in
[`docs/DESIGN_CONCEPT.md`](docs/DESIGN_CONCEPT.md) and
[`docs/ios/`](docs/ios/README.md). Native code belongs only in `ios/`; the app
does not embed the website. Shared prose and metadata move into `content/` only
through the validated schema migration described in the roadmap.

## 3D source files (`.blend`) are NOT in this repository

The Blender source files in `blender/` are large (several exceed GitHub's 100 MB
file limit) and are excluded via `.gitignore`. The Web app loads the exported
`.glb` models in `web/public/`, so it runs fine without the `.blend` files.

If you need to edit the 3D models, ask a maintainer for the Blender source files
(shared separately, e.g. via Google Drive). After editing, export the updated
`.glb` into `web/public/` and commit that.

The committed `.glb` files under `web/public/` are Web exports. Native USDZ
exports follow the semantic-ID and provenance contract in
`docs/ios/ASSET_DELIVERY.md`; neither renderer format is the editable source.
