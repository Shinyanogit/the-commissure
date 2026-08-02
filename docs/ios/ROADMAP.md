# iOS App Store Roadmap

Status: Phase 2 machine spike complete; physical-device gate pending
Repository baseline: `main` through PR #51; each phase uses a dedicated branch.
This is an engineering order, not a calendar estimate.

## 1. Objective and priority

Rebuild the existing educational value as a native SwiftUI/RealityKit app,
release it through TestFlight and the App Store, and make later content updates
safe for collaborators to publish from GitHub.

Priority order:

1. Correct and comprehensible learning experience.
2. Fast first usefulness and instant verified-cache reuse.
3. Deterministic 3D state, stability, accessibility, and App Store compliance.
4. Readable code and low-cost operation.
5. Gesture, procedure, and platform extensibility.

## 2. Responsibility boundaries

| Owner | Scope |
|---|---|
| Shinya | Product/medical final approval, Apple owner-only actions, compact operation |
| Fable + GPT Pro | Independent architecture challenge and decision review |
| Opus 5 | SwiftUI visual layer only: views, design tokens, layout, visual motion, previews |
| Codex | Domain, RealityKit, gestures, localization plumbing, assets/cache, persistence, tests, CI/CD, App Store preparation |
| Collaborators | Reviewed medical copy and 3D/content changes that pass the fixed schema |

Opus 5 may edit `ios/App/DesignSystem/**`, `ios/App/Features/*/Views/**`, and
`ios/App/PreviewContent/**`. It may not own view models, network/file work,
RealityKit entity lookup, content schemas, gesture classification, or domain
state. Codex supplies fixture `ViewState` values first, integrates the UI, and
removes accidental logic/dependency creep before merge.

## 3. Decision rule

- Fable/GPT Pro agreement becomes the default when it fits Apple constraints
  and the approved design concept.
- Disagreement about measurable behavior becomes an ACDF/PCDF spike gate rather
  than an architectural bet.
- App Review, data integrity, medical provenance, and rollback safety override
  aesthetic convenience.
- Only an owner-only Apple action, a new credential/account, a medically
  consequential ambiguity, or projected recurring infrastructure above
  ¥500/month should interrupt Shinya.

### Phase completion protocol

Every phase closes in this order:

1. Satisfy the phase exit criteria and run its relevant build, test, performance,
   and release checks.
2. Update the source-of-truth specification plus every coupled roadmap,
   architecture, status, release, and local `FORshinya.md` handoff section.
3. Freeze the scoped diff and complete independent machine QC; interactive UI
   phases also require active visual QC.
4. Stage only phase-owned files and create an English commit naming the completed
   outcome.
5. Open a pull request, merge it only after required CI/preview gates pass, and
   verify the resulting `main` state before beginning the next phase.

Shinya alone operates compact. When a compact checkpoint is chosen, documentation
and the phase commit must already be durable before Codex asks for compact.

## 4. Phase 0 — concept and specification freeze (complete)

Deliverables:

- [Design concept](../DESIGN_CONCEPT.md)
- [Product specification](PRODUCT_SPEC.md)
- [Architecture](ARCHITECTURE.md)
- [Asset delivery/cache specification](ASSET_DELIVERY.md)
- This roadmap, [release specification](RELEASE_SPEC.md), and consultation log
- Dedicated iOS branch with no Web implementation mixed into the commit

Exit criteria:

- The Sterile Field, fixed 7:2:1 hierarchy, icon-first UI, Bottom Step Tray,
  MECE screen ownership, and English/Japanese switching agree across documents.
- First-use transfer, cached reopen, and update transfer are separate states.
- Fable, GPT Pro, Apple-source research, and current source/asset audit have been
  reconciled.
- Documentation is validated and committed.

### Compact checkpoint

After the Phase 0 documentation commit, stop before implementation and wait for
Shinya to operate compact. The agent does not trigger compact.

## 5. Phase 1 — safe monorepo separation (complete 2026-07-28)

Completed work:

1. [x] Move the latest React/Vite product with `git mv` into `web/`.
2. [x] Create explicit `ios/`, `content/`, and `tooling/` boundaries.
3. [x] Update smoke tests, path-filtered Web CI, ignore guards, and contributor docs.
4. [x] Change Vercel Root Directory to `web/` and generate a real preview.
5. [x] Verify all five routes, five models, Draco, and rendered homepage/ACDF/PCDF.

Exit evidence:

- `npm ci`, `npm run build`, and the expanded route/asset smoke test pass from
  `web/`; the output bundle hashes match the pre-move baseline.
- Vercel reports Root Directory `web`; its preview ran build plus smoke and
  returned authenticated HTTP 200 with exact byte counts for every GLB and the
  Draco WASM. Rendered homepage, ACDF, and worst-case Web model PCDF showed one
  correctly sized canvas and no app-origin console warning/error.
- Web CI has a `web/**` path filter and `web` working directory. Native and
  content workflows are created when Phases 3/4 provide runnable validators and
  tests; no misleading no-op workflow is committed.
- Local `.claude/`, credentials, Blender sources, generated output, and
  `FOR*.md` remain ignored. Root and Web `.vercelignore` files prevent fallback
  CLI uploads from traversing local Blender/native/private directories.
- The latest upstream Web additions were included, and all moved tracked blobs
  remain traceable through rename detection.

Rollback: set the Vercel Root Directory back to the repository root and leave
the last successful production deployment active; revert the Phase 1 commit by
PR if necessary. No force-push or destructive reset is required.

## 6. Phase 2 — native asset and performance spikes

Machine-complete evidence (2026-08-02):

- Pinned Blender 5.2.0 LTS plus Apple USD Tools 0.25.2 now regenerate
  byte-identical, strict-ARKit-valid USDZ from the tracked Draco GLBs.
- ACDF is 159,465 triangles / 7,424,303 bytes across 39 semantic entities;
  PCDF is 144,556 triangles / 6,171,993 bytes across 68 semantic entities.
  Both pass the individual-pack and triangle targets, not merely the hard gates.
- Six pure Swift tests prove complete absolute states, direct/sequential
  equality, `1 → 6 → 3 → 7 → 1`, fifty drift-free cycles, loading-time
  latest-wins, and invalid-step containment.
- Simulator RealityKit loading, exact ACDF/PCDF path binding, verified ACDF
  transform/opacity/visibility across all seven canonical views,
  forward/reverse/direct navigation, vertical flick, horizontal orbit, and
  pinch pass. PCDF also loads and sustains 60 fps in the simulator.
- Simulator decode/memory/FPS are diagnostic observations only. The attached
  iPad Pro is unavailable, so oldest-supported/current-device percentiles,
  peak parse memory, input latency, and 15-minute thermal acceptance remain a
  hard human/device gate. Phase 3 must not begin until that gate is recorded.

### ACDF correctness spike

ACDF is first because its Blender source exists and it exercises materials,
transparency, removal, cage rotation/translation, plate, and screws.

Work:

- Establish a repeatable semantic-ID USDZ export.
- Implement all seven absolute canonical states in RealityView.
- Exercise direct jumps, reverse navigation, interruption, orbit, and pinch.
- Measure archive size, cold decode, first frame, memory, FPS, and thermal state
  on physical hardware.

Required invariants:

- `1 → 6 → 3 → 7 → 1` equals a clean load of step 1.
- Sequential and direct paths to the same step produce equal resolved states.
- Fifty forward/back cycles cause zero transform/opacity/visibility drift.
- Loading-time input applies the latest requested step after readiness.
- Every expected entity path is verified by tooling.

### PCDF worst-case spike

Repeat performance tests with the roughly 997k-triangle PCDF model. The measured
ACDF/PCDF results choose bundle-all versus hybrid delivery according to
[ASSET_DELIVERY.md](ASSET_DELIVERY.md), then update that decision in docs.

Exit criteria: both spikes pass the release-stop thresholds or a concrete model
optimization plan is accepted before product feature work expands. Current
status: size, geometry, semantic, state, build, and simulator gates pass;
physical-device performance remains open.

## 7. Phase 3 — content contract and bilingual migration

Work:

- Define catalog, procedure, iOS scene, localization, and provenance schemas.
- Migrate current website prose as the English source without changing meaning.
- Produce key-matched Japanese translations and clinical/editorial review data.
- Normalize stable procedure/step/part IDs and source naming inconsistencies.
- Build validators for IDs, entity paths, complete resolved states, restricted
  Markdown, translation parity, versions, hashes, sizes, and provenance.

Exit criteria:

- All four procedures pass schema and English/Japanese key-parity validation.
- Switching locale changes only presentation strings, never step/session state.
- Missing translation, duplicate ID, relative transform, unknown field/easing,
  or missing entity fails CI.
- Web may consume shared prose/metadata, while its GSAP and the iOS scene states
  remain separate renderer-specific representations.

## 8. Phase 4 — native foundation

Work:

- Xcode project, Swift 6 strict concurrency, local `CommissureCore` package.
- `ProcedureSession`, pure state resolver, `GestureIntentResolver`.
- `RealitySceneAdapter`, `ContentStore`, `AssetStore` actor, preferences.
- Structured logging, signposts, MetricKit integration, test fixtures.
- CI build, unit tests, lint/format policy, and archive smoke check.

Exit criteria:

- Library fixtures appear without network access.
- Domain tests import neither SwiftUI nor RealityKit.
- Duplicate downloads share a task; corrupt installs cannot replace valid data.
- Offline launch, stale catalog, low storage, cancellation, and cache recovery
  have deterministic tests.
- App launch never awaits a catalog request.

## 9. Phase 5 — visual system and native shell (Opus 5 boundary)

Sequence:

1. Codex freezes design tokens, fixture `ViewState`, accessibility contracts,
   icon semantics, and MECE ownership for each screen.
2. Opus 5 implements only the approved SwiftUI visual directories.
3. Codex checks dependency direction, removes embedded logic, connects intents,
   and runs previews/tests.
4. Screenshot comparison and device review decide acceptance.

Deliverables:

- Library, Procedure Theater chrome, Bottom Step Tray, explanation presentation,
  download/error states, locale control, Colophon, and settings.
- Reusable icon button, material, typography, progress, and state components.
- Dynamic Type, VoiceOver, Reduce Motion, pointer/keyboard, portrait/landscape,
  and iPhone/iPad previews.

Exit criteria:

- Every routine action is visually legible from icon/position/state, while all
  icons have localized accessibility labels and hints.
- Every screen passes its MECE inventory with no missing or duplicate category.
- The 7:2:1 hierarchy holds in light-controlled screenshot review.
- No UI file performs network/file I/O or searches RealityKit entities.
- Maximum Dynamic Type and VoiceOver retain every essential action.

## 10. Phase 6 — ACDF vertical slice

Integrate Library → availability/download → ACDF theater → seven reversible
steps → locale change → progress resume → offline cached reopen.

Exit criteria:

- Fresh install, bundled/first-use, cancel/retry, verification, cache hit,
  update, and offline paths work on physical devices.
- Rapid input and interrupted animation never desynchronize model and prose.
- Locale changes in place without model reload or step reset.
- ACDF passes accessibility, memory, frame pacing, and medical review gates.

## 11. Phase 7 — remaining procedures and hardening

Add ACCF, PCDF, and PCF through the same domain and adapter. Normalize known
source problems rather than reproducing them: unstable substring bindings,
array-index implant identity, invisible-but-not-restored entities, step-count
mismatch, inconsistent anatomy names, and relative transforms.

Exit criteria:

- All 26 canonical steps and entity mappings validate.
- Procedure-specific conditions do not leak into views or the gesture resolver.
- Thirty minutes of repeated use shows no unbounded memory growth.
- Oldest-supported iPhone and representative iPad pass performance, rotation,
  thermal, offline, bilingual, and accessibility tests.
- No blocker/high defect remains.

## 12. Phase 8 — GitHub delivery automation

Create separate workflows:

- `web-ci`: Web build/test; Vercel remains its deployment owner.
- `ios-ci`: Swift build/unit/UI tests and unsigned archive checks.
- `content-ci`: schema, key parity, entity, hash, size, provenance, and pack tests.
- `content-publish`: signed immutable packs and atomic catalog publication.
- `ios-beta`: signed archive and TestFlight upload after protected main/tag gate.

Exit criteria:

- An authorized collaborator's validated merge can publish content without
  Xcode or a manually operated server.
- Secrets never enter source, artifacts, logs, or the app binary.
- Prior catalog/pack versions remain available for rollback.
- Native-code pushes cannot bypass App Store signing/review.
- A clean CI runner reproduces the TestFlight upload.

## 13. Phase 9 — App Store readiness and release

Work:

- Run the `app-store-review` skill before external TestFlight and again on the
  exact release candidate.
- Complete privacy manifest/labels, medical disclaimer, rights/provenance,
  support/privacy URLs, metadata, real screenshots, reviewer notes, and demo
  path using bundled content.
- Validate archive, run internal/external TestFlight, then execute protected
  fastlane submission.

Exit criteria:

- App Store scan has zero blocker/high finding.
- Release tests and archive validation pass from the signed tag.
- Reviewer can experience a complete native procedure without an account or
  network dependency.
- Fastlane uploads the approved build/metadata and submits it for review.
- App Store Connect displays the build as submitted.

## 14. User-touch gates

Codex continues autonomously until one of these is encountered:

- Apple Developer Program enrollment, updated legal agreement, tax/banking, or
  another owner-only App Store Connect action.
- Creation/approval of signing or App Store Connect credentials not already
  configured.
- Creation of a Cloudflare account/token if the measured asset gate selects R2.
- A genuinely ambiguous medical wording or asset-rights decision.
- Forecast recurring infrastructure cost above ¥500/month.

These are reported with the exact requested action and why it cannot be safely
automated. Ordinary design, code, tests, content conversion, and CI work do not
interrupt Shinya.

The infrastructure ceiling does not include the mandatory Apple Developer
Program membership or Apple-controlled release fees; those are unavoidable for
App Store distribution and are handled only when the owner action becomes due.
