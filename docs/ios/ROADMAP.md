# iOS App Store Roadmap

Status: App Review Guideline 4.2.2 remediation active (2026-09-22). The first gate is to establish exactly what shipped in App Store build 1.0 (1) before deciding whether to request reconsideration or rebuild.
Repository baseline: `main`; the historical phase record below is retained. Each remediation phase uses a dedicated branch/PR.
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

## 3A. Priority override — App Store Guideline 4.2.2 remediation (active 2026-09-22)

Apple rejected App Store version 1.0 (1) under Guideline 4.2.2 (Minimum
Functionality), stating that the reviewed app did not sufficiently differ from
a Web browsing experience. This track temporarily overrides the old
"Phase 5B visual refinement next" sequence. The release blocker is no longer
visual polish; it is proving and shipping meaningful native 3D functionality
in the production target.

The current repository documents a stronger intended 1.0 than the production
wiring visibly proves: the release specification describes interactive
RealityKit anatomy, offline content, local progress, haptics, and accessibility,
while the current production path still instantiates
`AnatomyFieldPlaceholder()`, leaves `sceneReadiness` at `.preparing`, and
keeps the proven RealityKit implementation under `ios/Spikes/NativeAssetSpike`.
The remediation therefore starts with a provenance audit rather than assuming
that the reviewed binary and `main` were identical.

### R0 — establish the truth about submitted build 1.0 (1)

Goal: determine what the reviewer actually received before changing code or
arguing with App Review.

Work, in order:

1. Record the immutable review facts: marketing version/build, upload/submission
   date, review date/device, and the exact App Store Connect build selected for
   review. Do not commit submission IDs, account identifiers, or private Apple
   metadata to this public repository.
2. Install the exact submitted/TestFlight build on a physical iPhone or iPad if
   it remains available. Record a short screen capture of Library -> procedure
   -> scene -> step navigation with Wi-Fi/cellular enabled, then repeat the
   relevant procedure launch in Airplane Mode.
3. Answer these binary questions from the submitted build itself:
   - Does the Procedure Theater display real interactive anatomy or the
     `AnatomyFieldPlaceholder` shell?
   - Can the user orbit and pinch the actual model?
   - Do previous/next/direct-step actions visibly change anatomical state?
   - Does at least one complete procedure reopen and remain useful offline?
   - Is progress restored after leaving/reopening a procedure?
4. Locate the local Xcode Organizer archive or CI artifact used for the upload,
   when available, and inspect the packaged `.app` rather than source intent:
   - final `CFBundleShortVersionString` and `CFBundleVersion`;
   - packaged USDZ/Reality assets and their byte sizes;
   - bundled `content/` procedure files;
   - app executable/resource inventory;
   - archive creation time and any recorded source/CI revision.
5. Build current `main` locally with the same Release configuration and compare
   the user-visible procedure path and packaged resource inventory against the
   submitted archive/TestFlight build.
6. Save the result as a short evidence note in the PR or release log:
   `submitted-build == current-production-shell`,
   `submitted-build contains production RealityKit integration`, or
   `provenance unresolved`.

Decision gate:

- **If the submitted build already contains real production RealityKit 3D and
  the reviewer path can reproduce it:** pause code remediation, prepare a
  concise App Review reply requesting reconsideration, provide exact reviewer
  steps, and only then decide whether an App Review Board appeal is warranted.
- **If the submitted build matches the current placeholder/shell behavior:**
  do not lead with a formal appeal. Proceed directly through R1-R6 and resubmit
  a materially stronger build.
- **If provenance cannot be proven:** fail closed and treat the submitted build
  as insufficient. Proceed through R1-R6 rather than asserting functionality
  that cannot be demonstrated from the reviewed binary.

R0 exit criteria:

- One of the three provenance outcomes above is explicitly recorded.
- A physical-device capture exists for the submitted/TestFlight build when the
  build remains installable.
- The team knows whether a reviewer can see real 3D anatomy without relying on
  design docs, spike targets, or source-code claims.
- No implementation work starts on the assumption that docs equal shipped
  behavior.

### R1 — freeze the 4.2.2 compliance target

Goal: define the smallest product that is clearly an iOS learning tool rather
than a repackaged Web experience.

Required native-value contract:

- The production App target uses SwiftUI + RealityKit; no `WKWebView` renders
  the educational experience.
- Real anatomical models are rendered in the Procedure Theater.
- Orbit and pinch manipulate the model directly.
- Procedure navigation changes the actual anatomical state, not only prose.
- Forward, reverse, and direct step selection converge to the same canonical
  scene state.
- At least one complete procedure is available from a fresh install without a
  network request; the release goal remains all four procedures.
- The app remains educationally useful in Airplane Mode after install.
- Leaving and reopening a procedure restores local step progress.
- English/Japanese switching does not reload the model or reset the step.
- Every gesture has a visible/accessibility-equivalent action.
- The reviewer can discover the above within roughly one minute without an
  account, hidden debug gesture, or external documentation.

Explicit non-goals for this remediation:

- Do not add quizzes, accounts, push notifications, AR, social features, or a
  backend merely to appear more "app-like".
- Do not change the Web product unless shared content/schema work requires it.
- Do not claim that faster loading alone satisfies Guideline 4.2.2. Local 3D
  assets and caching are supporting evidence for offline/responsive use, not
  the sole native-value argument.
- Do not ship placeholder/coming-soon primary procedure cards in the App Store
  build.

R1 exit criteria:

- The checklist above is represented by executable tests or manual release
  gates.
- Reviewer Notes can point to each native behavior by an exact tap/gesture path.
- The product scope is frozen before production RealityKit integration begins.

### R2 — promote the proven RealityKit spike into the production architecture

Goal: replace the production scene placeholder with a real scene implementation
without creating a second competing state model.

Codex work:

1. Audit `ios/Spikes/NativeAssetSpike` and identify reusable concepts versus
   disposable spike-only code. Preserve the spike's proven loading, semantic
   binding, canonical-state, orbit, pinch, and performance lessons; do not
   import the spike target wholesale.
2. Add a production `RealityView` scene owned under `ios/App/Scene/**`.
   It must load the selected procedure's packaged native model, bind exact
   semantic entities, and report preparing/ready/transitioning/failed state to
   presentation.
3. Connect `ProcedureSessionController` / canonical `SceneState` to
   `RealitySceneAdapter`. The production app must have one source of truth for
   the selected step and resolved anatomical state.
4. Wire the scene into `FoundationView -> ProcedureTheaterView`; remove the
   default placeholder from the shipping path. Keeping a preview-only
   placeholder is acceptable only when it cannot be reached in Release.
5. Promote the required USDZ/native assets from the spike/tooling pipeline into
   the production resource pipeline with deterministic semantic IDs and
   provenance. Verify final archive contents rather than assuming Xcode copied
   them.
6. Implement scene lifecycle ownership: one live heavy procedure model at a
   time, deterministic release on exit, no duplicate parsing during rapid
   navigation, and latest-target behavior while loading.
7. Keep file/hash/network work off the main actor; only RealityKit presentation
   remains main-actor-owned.

R2 tests:

- A production-target test proves a real model is loaded and expected entity
  paths bind uniquely.
- Sequential and direct navigation produce equal resolved states.
- `1 -> 6 -> 3 -> 7 -> 1` returns to the exact clean step-1 state for ACDF.
- Fifty forward/back cycles show zero transform/visibility/opacity drift.
- Input issued before scene readiness resolves to the latest valid target.
- The Release build contains the expected native model assets and no production
  code path instantiates the placeholder.

R2 exit criteria:

- ACDF in the real App target renders interactive anatomy on a physical device.
- Orbit, pinch, previous, next, and direct step selection all operate on the
  production model.
- Scene readiness becomes `.ready` from actual loader state.
- The production app can no longer be truthfully described as a text/content
  shell with a placeholder scene.

### R3 — complete the ACDF native vertical slice

Goal: make one procedure end-to-end complete before expanding to all four.

Work:

- Fresh launch -> Library -> ACDF -> real 3D scene without a network dependency.
- Seven canonical reversible ACDF states.
- Explanation text and 3D state stay synchronized during rapid/interrupted input.
- Orbit, pinch, reset, previous/next, and direct selection share the established
  intent/state pipeline.
- Save selected step locally when leaving ACDF and restore it on reopen.
- Runtime language switch updates UI/prose in place without scene reload or
  progress reset.
- Add subtle native haptic acknowledgement for committed step/reset/error events
  if the implementation remains semantically useful with haptics disabled.
- VoiceOver/Dynamic Type/Reduce Motion retain complete navigation and teaching
  access.
- Airplane Mode relaunch remains fully useful.

R3 physical-device evidence:

- screen recording of step 1 -> later step -> reverse -> direct jump;
- orbit and pinch on real anatomy;
- quit/reopen with restored step;
- English <-> Japanese switch without model reload;
- Airplane Mode launch and full ACDF walkthrough;
- memory/FPS/input latency sanity against the established hard gates.

R3 exit criteria:

- ACDF alone satisfies the frozen R1 native-value contract.
- No fixture-backed transfer/progress/scene state is presented as production
  behavior.
- No blocker/high issue remains in an independent code + visual QC pass.

### R4 — extend the same production path to ACCF, PCDF, and PCF

Goal: ship one coherent native product, not one polished procedure plus three
content shells.

Work:

- Export/package production native assets for ACCF, PCDF, and PCF using the same
  semantic-ID/provenance rules.
- Bind all procedure parts and all 26 canonical steps through the same
  `ProcedureSession -> SceneState -> RealitySceneAdapter` path.
- Reuse the same gestures, progress persistence, locale behavior, accessibility,
  and lifecycle ownership; procedure-specific branching belongs in validated
  data, not SwiftUI.
- Resolve known source inconsistencies during conversion rather than adding
  renderer-specific hacks.
- Remove any App Store-visible procedure card that cannot pass the complete
  native path. The preferred 1.0 remediation outcome is all four procedures.

R4 exit criteria:

- All four procedures render real interactive anatomy in the production target.
- All 26 steps pass direct/sequential equality and entity-binding validation.
- Every App Store-visible card opens a complete experience.
- PCDF remains the worst-case memory/FPS/thermal gate and passes on required
  physical hardware.

### R5 — make the Web-to-native difference measurable and reviewer-visible

Goal: turn the legitimate loading/caching advantage into demonstrable product
behavior rather than a policy argument.

Work:

- Ensure the release bundles the agreed offline baseline and does not await a
  catalog request before first usefulness.
- Verify repeated procedure opens reuse packaged/verified local assets rather
  than re-downloading heavy 3D resources.
- Persist local step progress and user language preference.
- Expose calm, accurate offline/error states; no generic indefinite spinner.
- Keep adaptive iPhone/iPad portrait/landscape layouts and native
  accessibility controls.
- Measure cold launch/procedure-open/first-frame behavior on physical devices;
  record numbers in release evidence, not marketing claims.
- Verify that the app remains useful with networking disabled before launch,
  not merely after a successful online session.

R5 exit criteria:

- Airplane Mode is a first-class supported test case.
- Returning to a procedure avoids a repeat network fetch of bundled/cached
  models.
- Reviewer Notes can accurately state why local native assets matter:
  immediate/repeatable offline 3D learning, not simply "the app is faster than
  Safari".

### R6 — App Review package, response, and resubmission

Goal: make the native value impossible to miss during the next review.

Before upload:

1. Run all functional, content, accessibility, physical-device, archive, and
   App Store review gates on the exact signed candidate.
2. Inspect the final `.xcarchive` / exported app for:
   - correct 1.0.x marketing/build version;
   - bundled native 3D assets;
   - expected bilingual content;
   - no placeholder scene in the production path;
   - no accidental `WKWebView` dependency used for the core experience;
   - privacy/support metadata consistent with the binary.
3. Capture evidence from the exact candidate:
   - Library -> ACDF -> real 3D;
   - orbit/pinch;
   - forward/reverse/direct step changes with visible anatomy change;
   - local progress resume;
   - in-place language switch;
   - Airplane Mode reopen/use.
4. Update screenshots/App Preview so at least one asset clearly shows the real
   interactive 3D Procedure Theater rather than a content/library shell.

Reviewer Notes must state, concretely:

- the app is an independent SwiftUI/RealityKit implementation and does not embed
  the website;
- no login is required;
- exact taps to open a bundled procedure;
- exact gestures/buttons to orbit, zoom, reverse, and directly select steps;
- that anatomical state changes with the selected procedure step;
- that bundled content works in Airplane Mode;
- that local progress resumes on reopen;
- where the language/accessibility controls are;
- that remote content, if enabled, is data/media only and cannot execute code.

Communication rule:

- If R0 proved that the rejected build already contained all of this, use the
  evidence first in a respectful reconsideration request and escalate to formal
  appeal only if necessary.
- If R0 proved that the rejected build was the placeholder shell, reply briefly
  that the app has been materially revised, submit the new build, and focus the
  review conversation on the new native functionality rather than arguing that
  the old build should have passed.
- Never tell App Review that functionality existed in the rejected binary unless
  R0 demonstrated it on that exact build.

R6 exit criteria:

- The exact uploaded build is the exact tested build.
- Reviewer Notes contain a reproducible <1-minute path to the native 3D value.
- App Store Connect screenshots/preview match shipped behavior.
- App review scan has zero blocker/high finding.
- The resubmitted build contains no primary placeholder or incomplete procedure.

### Codex execution contract for this remediation

After Shinya initiates Codex, Codex should continue autonomously through the
next unblocked remediation gate and interrupt only for the existing user-touch
gates. Engineering work should be split into reviewable branches/PRs with
durable evidence.

Recommended PR sequence:

1. `audit/app-store-1.0-build-provenance` — R0 evidence only; no speculative
   feature changes.
2. `feat/ios-production-realitykit-acdf` — R1/R2 production RealityKit wiring
   and ACDF integration.
3. `feat/ios-acdf-native-vertical-slice` — R3 persistence/offline/accessibility
   completion.
4. `feat/ios-all-procedures-native` — R4 remaining procedure integration and
   performance hardening.
5. `release/ios-app-review-4.2.2` — R5/R6 final release evidence, metadata,
   screenshots, reviewer notes, signed candidate validation.

For every PR, Codex must:

- state the App Review risk being closed;
- list source-of-truth files changed;
- run relevant unit/UI/content tests and archive/resource checks;
- include physical-device evidence whenever the exit criterion requires it;
- run an independent machine QC pass after the diff is frozen;
- update ROADMAP/RELEASE_SPEC/architecture docs when behavior actually changes;
- avoid unrelated Web redesign or feature inflation;
- stop rather than silently weakening a fail-closed release gate.

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

## 6. Phase 2 — native asset and performance spikes (complete 2026-08-02)

Exit evidence (2026-08-02):

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
- Physical tests ran cable-free after persistent pairing on a 2021 iPad Pro
  12.9-inch (5th generation, M1), iPadOS 26.5.2. ACDF 20-launch p50/p95 was
  185/198 ms decode, 211/220 ms first frame, 314/317 MB steady memory, and
  327/328 MB peak parse memory. PCDF was 216/218 ms decode, 240/249 ms first
  frame, 318/321 MB steady memory, and 331/331 MB peak parse memory.
- A 900-second PCDF continuous orbit/zoom run passed its executable hard gates:
  FPS p05 54 / p50 60, input p95 18 ms, steady memory 316 MB, peak memory
  329 MB, and worst thermal state nominal. The test itself rejects first frame
  over 4.5 seconds, input p95 over 150 ms, FPS p05 below 45, steady memory over
  350 MB, peak memory over 450 MB, or serious/critical thermal state.
- This closes the Phase 2 architecture-expansion gate. The 250 MB steady-memory
  target is missed and remains an optimization item; hard limits were not
  relaxed. Oldest-supported hardware and iOS 18 performance remain unmeasured
  and are a fail-closed Phase 7 release gate before external TestFlight or App
  Store submission. Simulator or M1 results never substitute for that gate.

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
status: size, geometry, semantic, state, build, simulator, and representative
physical-device hard gates pass. Exact floor-device performance, ACCF/PCF total
payload, and App Thinning remain explicitly unpassed release gates.

## 7. Phase 3 — content contract and bilingual migration (complete 2026-08-02)

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

Exit evidence (2026-08-02):

- Closed JSON Schema v1 contracts now cover catalog, procedure, localization,
  iOS scene, provenance, and source-entity inventories. Four procedure bundles
  and all 26 steps validate with stable procedure/step/part IDs.
- English title/body values are mechanically converted from the current Web
  source into restricted Markdown, with three provenance-recorded PCF
  terminology corrections, and hash-checked against it. Japanese uses the same
  86 presentation keys, with an explicit editorial review record.
- Every iOS scene step contains a complete absolute camera/part snapshot.
  Canonical entity paths are distinct from exact legacy GLB names; inventories
  are tied to each source asset SHA-256, and accepted ACDF/PCDF native manifests
  additionally pin IDs and `/root/procedure_<id>/...` paths. The PCDF kyphosis
  state includes the Web-defined disc/ligament/nerve visibility. GSAP remains
  Web-only.
- Content CI regenerates deterministically, rejects dirty output, validates all
  catalog file hashes/sizes and provenance, audits its pinned dependencies, and
  runs 26 negative fixtures. These cover the original contract failures plus
  eight non-HTTP/protocol-relative URL forms, locale-file identity, provenance revision,
  procedure/scene view-policy parity, canonical procedure root, and canonical
  localized internal-link labels.
- Schema/editorial completion does not imply owner medical or rights approval.
  Provenance keeps both as fail-closed release gates before external TestFlight
  or App Store submission.
- Three fresh independent QC passes found and drove corrections before commit:
  native entity-path/screw mismatches, incomplete PCDF kyphosis state, weak
  scene-state geometry checks, a Japanese ACDF label omission, URL allowlist
  gaps, missing cross-file invariants, and punctuation-prefixed protocol-relative
  URL bypasses. The fourth frozen candidate passed independent QC, commit
  `958f794` passed Content CI/Vercel in PR #53, and merged as `0d71da8` with
  local `main == origin/main`.

## 8. Phase 4 — native foundation (independent QC passed 2026-08-02)

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

Exit evidence:

- A tracked Xcode project targets iOS/iPadOS 18 with Swift 6 strict concurrency
  and embeds the shared `content/` tree as the offline baseline.
- The Foundation-only `CommissureCore` package implements content values,
  `SceneStateResolver`, `ProcedureSession`, `GestureIntentResolver`, pack
  presentation, and stale/replay catalog decisions. Its fifteen tests pass and
  the source imports neither SwiftUI nor RealityKit.
- Concrete app infrastructure implements bundled bilingual loading,
  `RealitySceneAdapter`, locale preferences, structured diagnostics, and an
  `AssetStore` actor. Twenty deterministic app tests cover equal-request
  deduplication, cross-pack serialization, pre/post-transfer low storage,
  corruption rollback, cancellation, verified offline cached reopen, staging recovery,
  protected eviction, exact cached file sets, unsafe path/pack-key preflight,
  exact RealityKit hierarchy binding, language reprojection, and all four content bundles.
- Two UI tests launch without network setup and display the bundled ACDF fixture
  in English and Japanese. Swift format, simulator tests, XcodeGen regeneration,
  boundary/secret audits, and the unsigned generic-device archive pass on Xcode
  26.2; the archive is 3.4 MB before native models/signing, and its app payload
  contains the four procedure JSON bundles plus both localized String Catalog
  outputs. The bundle version is sourced from the Xcode build settings rather
  than duplicated in the generated Info.plist.
- The first independent QC found six contract gaps in gesture arbitration,
  scene identity, cache-file exactness, pack-key preflight, and runtime locale
  projection. The repair covers each with explicit negative/regression tests.
  A fresh `gpt-5.6-sol` / xhigh QC passed with zero open findings against the
  frozen 34-file identity; simulator execution was the only environment-limited
  item (`NSMachErrorDomain -308`). Commit `14de026`, PR #54, CI, merge `f2a81d7`,
  and local `main == origin/main` closed the phase. Production visual acceptance
  remains Phase 5.

## 9. Phase 5 — visual system and native shell (Claude Design → Opus 5)

2026-09-22 priority override: Phase 5B visual-only refinement is paused until the
App Review remediation track above has connected real RealityKit anatomy to the
production target. Visual polish may proceed only when it directly supports the
R1-R6 exit criteria.

The visual handoff is frozen in [`CLAUDE_DESIGN_BRIEF.md`](CLAUDE_DESIGN_BRIEF.md).
Claude Design project: `The Commissure — Sterile Field iOS` (`dfa74f8d-774a-4b68-b35e-ee6ba5700e3d`).
Synced brief path: `brief/CLAUDE_DESIGN_BRIEF.md`. The project stores static
references only; SwiftUI source remains in GitHub.

Sequence:

1. Codex freezes design tokens, fixture `ViewState`, accessibility contracts,
   icon semantics, and MECE ownership for each screen in the brief.
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

### Phase 5A machine-gated visual shell (completed 2026-08-02; PR #56)

The first native presentation shell was implemented on
`feat/ios-phase5-visual-shell` from the Phase 5 docs merge and merged as
`fece5e8`. The Claude Design project remains a static reference
surface; its synced brief is not a runtime dependency. Opus agent routing was not
available in this session, so Codex implemented the same strict visual allowlist
from the frozen brief without allowing visual code to cross into domain or I/O
ownership.

Completed candidate scope:

- `DesignTokens`, semantic `AppAction` descriptors, bilingual String Catalog
  labels/hints, and deterministic `ViewState`/preview fixtures.
- Dark 7:2:1 Library shell with explicit bundled/cached/download/transfer/failure
  presentation states, icon-first cards, language/settings/about controls, and
  safe-area-aware material surfaces.
- Procedure Theater shell with a full-bleed scene slot, explanation owner, reset/
  back actions, and Compact/Expanded Bottom Step Tray using the same intents.
- Codex-owned projection from `ContentStore` and `ProcedureSessionController`:
  opening a real bundled procedure, forward/back/direct step intents, and locale
  reprojection preserve the active session step.
- Colophon/settings shells, Dynamic Type-compatible system typography, localized
  icon accessibility metadata, and a non-gesture action path for every routine
  control.

Phase exit evidence: Swift format/lint passed; XcodeGen regeneration,
simulator build/run, and 26 simulator tests (23 app-unit tests plus three UI
tests, including explicit app-preference Japanese String Catalog coverage). The
existing Web/content boundary audits also pass. This is not final visual
acceptance: the scene is still a preparing placeholder, download states are
fixture-backed, and Japanese medical copy remains the existing content source
pending the next editorial/design pass. Phase 5B will refine visual hierarchy
and copy against screenshots before Phase 6 RealityKit integration.

## 10. Phase 6 — ACDF vertical slice

2026-09-22 status: this historical phase is now executed through remediation
R2-R3 above; those stricter App Review gates control ordering and completion.

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
- The oldest-supported hardware/OS performance suite is fail-closed before any
  external TestFlight or App Store submission; absence of that device or trace
  is an incomplete gate, not presumed equivalence with the M1 iPad result.
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
