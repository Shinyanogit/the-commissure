# iOS App Store Roadmap

Status: implementation sequence frozen after Phase 0 review
Branch: `feat/ios-native-app`
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

## 4. Phase 0 — concept and specification freeze (current)

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

## 5. Phase 1 — safe monorepo separation

Work:

1. Move the current React/Vite product with `git mv` into `web/`.
2. Create explicit `ios/`, `content/`, and `tooling/` boundaries.
3. Update npm, smoke tests, path-filtered GitHub Actions, and contributor docs.
4. Change Vercel Root Directory to `web/` and regenerate a preview.
5. Verify all five routes, models, and production fallback before merge.

Exit criteria:

- `web/` build/test passes from a clean checkout.
- Vercel preview reproduces the current production routes and 3D assets.
- Web, iOS, and content CI use path filters and separate working directories.
- No local `.claude/`, credentials, Blender sources, or `FOR*.md` enter Git.
- File history remains traceable through `git mv`.

Rollback: revert the Vercel Root Directory and leave the last successful
production deployment active; do not merge a relocation with a broken preview.

## 6. Phase 2 — native asset and performance spikes

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
optimization plan is accepted before product feature work expands.

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
