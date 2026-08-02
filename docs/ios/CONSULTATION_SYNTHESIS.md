# Architecture Consultation Synthesis

Status: resolved Phase 0 decision log
Date: 2026-07-28

## 1. Inputs

- Fresh, repository-grounded Claude Fable 5 consultation.
- Fresh ChatGPT Pro consultation using the signed-in Web subscription.
- Codex audit of every current Web scene, model inventory, repository state, and
  existing local documentation.
- Independent check of Apple, GitHub, Cloudflare, and fastlane primary sources.
- Product additions from Shinya: icon-first interaction, MECE screen information,
  English/Japanese in-app switching, and current website prose as the initial
  editorial source.

The consultants were not asked to vote. Agreement establishes a strong default;
disagreement is resolved by simplicity, Apple constraints, current evidence,
and a measured spike.

## 2. Strong convergence

Fable and GPT Pro independently converged on:

- iOS/iPadOS 18 minimum, SwiftUI, RealityKit `RealityView`, Swift 6 strict
  concurrency, and no `WKWebView` shell.
- No application backend, account, database, or analytics SDK for 1.0.
- A complete bundled/offline baseline with a source-independent path for signed,
  immutable, data-only updates.
- Static HTTPS distribution plus verified local persistence; native code updates
  remain App Store releases.
- Absolute, idempotent scene snapshots resolved from immutable baseline; never
  replay the current relative GSAP mutations.
- Stable semantic IDs and exact platform bindings rather than substring search,
  export order, or array-index identity.
- Authored instructional state separated from transient orbit/zoom adjustment.
- Intent-driven input, interruptible latest-target transitions, and accessible
  non-gesture alternatives.
- One heavy model and one model parse at a time; hashing/file/network work off
  `MainActor`.
- A safe monorepo split with a mechanical Web move and Vercel preview before
  merge.
- Fixed-schema content validation, signatures, hashes, atomic activation,
  rollback, and no remotely executable logic.
- ACDF as the first broad correctness spike and PCDF as the worst current
  performance case.
- GitHub automation divided into content publication, native CI/TestFlight, and
  protected App Store submission.
- App Store review positioning as native, offline medical education—not
  diagnostic, patient-specific, intraoperative, or independent surgical
  guidance.
- Aggressive v1 simplification: no accounts, sync, server CMS, SwiftData/Core
  Data, generic renderer framework, remote scripting, AR, audio, quizzes, or
  speculative plug-in architecture.

These are fixed in the product, architecture, asset, roadmap, and release
contracts.

## 3. Resolved differences

| Question | Fable emphasis | GPT Pro emphasis | Resolution |
|---|---|---|---|
| Initial asset split | Current assets are small enough to prefer bundling all, while retaining a remote seam | Bundle all four as the offline baseline, with a strict conversion fallback | **Bundle all four by default.** If the measured thinned/pack/device hard gates fail after one optimization pass, bundle ACDF and make the other three optional downloads. |
| Size budget | Provisional app target 80 MB, hard 150 MB; pack target 15 MB, hard 30 MB | Much stricter thinned app target 35 MB/hard 50 MB; bundled procedures 20/35 MB; pack 8/20 MB | Adopt the stricter GPT Pro gates because low download weight is an explicit product goal and current GLBs are small. |
| Static host | Keep origin replaceable; R2 is a strong near-zero-cost production option | GitHub Releases + Pages is the simplest v1 topology | Use **GitHub Releases + Pages in 1.0**, requiring no new account and matching collaborator push workflows. Move to R2 only when measured latency/reliability/traffic warrants it. Bundled content makes host outage non-critical. |
| Swift packages | One app plus one pure local `CommissureCore` package | Three local packages for Core, Assets, and RealityKit | Start with **one pure Core package and concrete app infrastructure**. Package boundaries are not created for hypothetical scale; Assets/RealityKit may split only after independent reuse/build pressure exists. |
| Asset lifecycle | One explicit lifecycle enum is easy to understand and test | Bundled, installed, offered, transfer, failure, compatibility, and in-use facts overlap | Store **orthogonal facts** in `PackRecord`; derive one exhaustive `PackPresentationState` for UI. This preserves readability without losing simultaneous fallback/update/failure state. |
| Downloads | Up to two pack downloads | One pack, up to two file transfers | Use **one pack at a time and at most two files within it** to reduce I/O, memory, and thermal contention. |
| Cache | 512 MB provisional cache | 256 MB soft / 512 MB hard | Use **256 MB soft / 512 MB hard**, LRU for optional inactive versions, with active/bundled/last-known-good protection. |
| Content package | Logical versioned pack | Explicitly avoid a wrapper ZIP | Download the small file set separately into staging. USDZ is already a container; no extra archive dependency is added. |
| Camera adjustment | Centralize authored camera and user-adjustment reset policy | Closed `preserveView` / `reframe` policy, preserve by default | Adopt a closed `preserveAdjustment / reframe` enum. Preserve is default; medically necessary reframe is explicit. Reset always returns to the current canonical camera. |
| Gesture constants | 22-point edge, 12-point deadband, 60-point commit as a safe starting point | 24-point edge, 8-point deadband, 1.35 axis claim, 44-point commit | Adopt GPT Pro's more explicit provisional arena and tune on physical devices. The architectural decision is centralization/capability ownership, not the initial number. |

## 4. User-directed additions

These arrived after the original consultant prompt and therefore override any
generic screen recommendation:

### Icon-first, not text-button-first

- Routine navigation/manipulation uses familiar icons, placement, enabled state,
  selection, and motion.
- `AppAction` is the semantic source for SF Symbol, English/Japanese
  accessibility label/hint, pointer help, and keyboard equivalent.
- Written UI remains for procedure/content text, exact size and consent, errors,
  unfamiliar choices, and destructive/safety-relevant confirmation.
- Icon-only never means accessibility-label-free.

### MECE screen information

- Top bar owns destination and reset.
- 3D field owns anatomical state.
- Explanation owns the current teaching point.
- Bottom Step Tray owns step position and movement.
- Library card/status owns acquisition and compatibility.
- Colophon/settings own sources, authors, licenses, privacy, and preferences.

Views receive a structured `ViewState` reflecting these non-overlapping owners.
No title, progress value, state, or action is repeated merely to simplify layout.

### English/Japanese switching without branching sprawl

- `followSystem`, `english`, and `japanese` resolve once in `LocaleStore`.
- App chrome uses String Catalogs; procedure prose uses identical stable keys in
  pack-local `en.json` and `ja.json`.
- Current website prose is migrated unchanged as the initial English source.
- Japanese is a reviewed key-matched translation and is required for 1.0.
- Locale changes replace presentation values only; the scene, active model, and
  selected step remain intact.
- CI rejects missing/extra locale keys and unreviewed content revisions.

## 5. Repository/source audit consequences

The current four procedure GLBs total 6.64 MiB, not the stale ~150 MB described
in earlier local docs. With the homepage model, runtime GLBs total 7.27 MiB.

The more important risks are:

- roughly 2.28 million triangles across the four procedure models;
- PCDF at roughly 997k triangles, already above the provisional 500k native hard
  gate before optimization;
- required Draco compression, whose ratio cannot be assumed after USDZ export;
- flat root meshes, no authored materials/animations, and fragile JS substring
  bindings;
- forward-only relative transforms, fixed lockout, missed cleanup, and state
  races in the current scene implementation.

Therefore:

- native delivery is decided from App Thinning, optimized USDZ, first-frame,
  frame-time, memory, and thermal measurements—not GLB byte count;
- current JavaScript timeline mechanics are evidence for intended choreography,
  not reusable runtime logic;
- stable semantic bindings, absolute snapshots, cancellation, and full scene
  validation are release requirements;
- PCDF must be optimized or split before it can pass the current triangle gate.

## 6. Fixed decisions versus measured gates

### Fixed now

- Native iOS/iPadOS 18 SwiftUI/RealityKit app.
- One pure Core package; concrete app infrastructure.
- English/Japanese 1.0, icon-first UI, MECE information architecture.
- Bundled all-four intent plus remote-update capability.
- No backend/database/account; static GitHub distribution in 1.0.
- Absolute semantic scene states and a closed fixed schema.
- Orthogonal asset facts, derived UI state, atomic known-good activation.
- GitHub content and native pipelines remain legally/operationally distinct.
- Opus 5 owns only visual SwiftUI; Codex owns all logic and integration.

### Measured before expansion

- RealityKit fidelity/performance after ACDF USDZ conversion.
- ACDF/PCDF geometry, mesh, material, memory, frame, load, and thermal budgets.
- Bundle all four versus ACDF-starter fallback under the strict size gates.
- Exact floor device within iOS 18-capable hardware.
- Hosting migration from GitHub only if observed service metrics justify it.

### Phase 2 evidence update (2026-08-02)

- ACDF: 475,227 → 159,465 triangles; 7,424,303-byte USDZ; 39 exact semantic
  entities.
- PCDF: 996,503 → 144,556 triangles; 6,171,993-byte USDZ; 68 exact semantic
  entities.
- Both strict-ARKit-valid packs pass the stricter GPT Pro size/geometry targets,
  so the Fable/GPT Pro bundle-all synthesis remains the default.
- Absolute-state invariants, simulator interaction, and representative physical
  iPad testing pass. On an M1 iPad Pro, 20-launch ACDF/PCDF first-frame p95 was
  220/249 ms and peak-memory p95 was 328/331 MB. A 900-second PCDF run measured
  FPS p05 54 / p50 60, input p95 18 ms, memory 316 MB, peak 329 MB, and nominal
  worst thermal state.
- A fresh repository-grounded Fable gate review returned
  `PROCEED_WITH_REQUIRED_MITIGATION`: current-device hard-stop evidence closes
  the architecture-expansion gate, while the missed 250 MB memory target,
  oldest-supported hardware/OS, ACCF/PCF total payload, App Thinning, and
  measurement-method limitations remain explicit unpassed release risks.
- Floor-device performance is therefore fail-closed in Phase 7 before external
  TestFlight/App Store submission. Neither simulator nor M1 iPad evidence may
  be presented as proof for A12-class hardware or iOS/iPadOS 18 behavior.

### Phase 3 contract resolution (2026-08-02)

- The fixed remote-data boundary is now executable rather than prose-only:
  closed schemas and one validator own IDs, restricted Markdown, translation
  parity/review records, complete absolute state, bindings, versions, catalog
  hashes/sizes, and provenance.
- Exact legacy GLB names are retained in hash-bound source inventories, but
  canonical IDs/entity paths are the only runtime identity. This resolves the
  audited substring and array-index coupling without rewriting Web timelines.
  ACDF/PCDF paths include the loader's `/root` prefix and must match the accepted
  native conversion manifest; PCDF screw component IDs use
  `screw_<component>_<index>`.
- English remains meaning-equivalent to the adopted website source through
  deterministic mechanical conversion plus three recorded PCF terminology
  corrections. Japanese is key-matched and editorially reviewed; owner medical
  wording approval and asset/text rights are still explicit release gates rather
  than inferred from schema success.
- Twenty-six negative fixtures prove the validator fails closed for every
  Phase 3 exit example plus divergent final entrance state, degenerate
  camera/rotation, duplicate binding, path traversal, non-HTTP URL forms,
  locale identity, provenance revision, view-policy divergence, canonical-root
  substitution, and localized internal-link label drift. The schema never
  accepts downloaded code, expressions, arbitrary URLs, relative mutation, or
  a renderer-specific GSAP operation.

## 7. Apple and operating constraints

- Apple documents `RealityView` for iOS 18+
  ([RealityKit](https://developer.apple.com/documentation/realitykit/realityview)).
- Downloaded code cannot add or change app functionality; remote packs are
  restricted to the shipped renderer's fixed data schema
  ([Guideline 2.5.2](https://developer.apple.com/app-store/review/guidelines/#software-requirements)).
- A required initial resource download must disclose size and request user
  action; the bundled baseline removes this as a launch dependency
  ([Guideline 4.2](https://developer.apple.com/app-store/review/guidelines/#minimum-functionality)).
- Apple-hosted/managed Background Assets require iOS 26+ and remain a future
  `AssetSource`, while On-Demand Resources is deprecated beginning in iOS 27
  ([Background Assets](https://developer.apple.com/documentation/backgroundassets),
  [ODR reference](https://developer.apple.com/help/app-store-connect/reference/app-uploads/on-demand-resources-size-limits)).
- GitHub Releases/Pages have documented limits but no mobile-CDN SLA; full
  offline baseline is the reliability boundary
  ([Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases),
  [Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)).

### Phase 4 implementation resolution (2026-08-02)

- The one-package recommendation is now concrete: `CommissureCore` is a single
  Foundation-only package, while network, disk, RealityKit, preferences, and
  MetricKit remain concrete app infrastructure.
- The cache boundary is executable and tested rather than represented by UI
  flags: bundled, installed, offered, transfer, compatibility, failure, and
  in-use facts remain orthogonal; the presentation state is derived.
- App startup consumes bundled fixtures only. Static remote delivery is an
  optional `AssetSource` seam and cannot delay the first Library frame.
- The Phase 4 shell is test scaffolding. It does not settle Phase 5 layout,
  bottom-bar behavior, visual hierarchy, or icon treatment.
- The generated Info.plist reads marketing/build versions from Xcode settings,
  keeping the release identity in one place while the Phase 4 candidate remains
  a development build (`0.1.0`, build `1`).
- The first native independent QC was intentionally fail-closed: it exposed
  mismatched gesture-axis semantics, touch-count cancellation, nested scene-path
  and asset-version acceptance, non-exact cache-file verification, unsafe pack
  identities, and missing runtime locale reprojection. The repair candidate
  centralizes and tests each boundary before a fresh QC freeze; no visual or
  App Store conclusion is inferred from the interim archive.

### Phase 4 independent QC closeout (2026-08-02)

- The repair reverses vertical semantics to match the product contract (down
  advances, up goes back), rejects missing-leading-slash, duplicate-slash, and
  trailing-slash entity paths, and adds regression coverage for all variants.
- The frozen 34-file candidate passed a fresh read-only `gpt-5.6-sol` / xhigh
  audit with zero open findings. Core 15/15, app 20, UI 2 compile/archive
  evidence, exact cache and hierarchy checks, bilingual reprojection, and
  offline-launch boundaries passed. Simulator execution was separately recorded
  as environment-limited after worker startup (`NSMachErrorDomain -308`).
- This closes Phase 4's machine-verifiable foundation gate. It does not approve
  Phase 5 visual acceptance, physical-device performance, medical/rights review,
  signing, or App Store submission.

### Phase 5 visual handoff resolution (2026-08-02)

- Fable's independent repository-grounded recommendation is adopted: Claude
  Design is a reference/token exploration surface, not a code source or build
  dependency. Codex freezes the brief and presentation fixtures first; Opus 5
  hand-writes SwiftUI only in the visual allowlist; Codex owns integration,
  logic, accessibility plumbing, tests, and performance gates.
- [`CLAUDE_DESIGN_BRIEF.md`](CLAUDE_DESIGN_BRIEF.md) derives every visual
  decision from `DESIGN_CONCEPT.md`: 7:2:1 hierarchy, icon-first controls,
  contextual Bottom Step Tray, MECE ownership, EN/JA metadata, responsive
  layouts, and Reduce Motion/Dynamic Type/VoiceOver equivalents.
- A Claude Design project was created for static references only:
  `dfa74f8d-774a-4b68-b35e-ee6ba5700e3d`. The frozen brief was uploaded as
  `brief/CLAUDE_DESIGN_BRIEF.md`; no generated code is trusted or imported.
- The existing Phase 0 GPT Pro synthesis remains the architecture authority.
  A new Phase 5 browser consultation was not claimed because the signed-in Web
  connector had no source window; this does not block the brief because its
  decisions are already covered by the approved concept and Fable handoff.

## 8. First five implementation tasks

After Shinya performs the Phase 0 compact checkpoint:

1. **Complete:** record the latest Web baseline, mechanically move the unchanged
   product into `web/`, and verify the real Vercel preview and rollback boundary.
2. Convert/instrument ACDF as an iOS 18 RealityKit spike and measure the strict
   size, fidelity, frame, memory, loading, and thermal gates.
3. Freeze schema v1 and encode ACDF as stable bindings plus complete canonical
   states, bilingual keys, provenance, and shared validator fixtures.
4. Create the Xcode project and `CommissureCore`, then implement bundled loading,
   deterministic direct/reverse navigation, and diagnostics.
5. Complete the ACDF vertical slice with Bottom Step Tray, gesture arena,
   accessible icon actions, locale switching, signed update install/rollback,
   cache/offline behavior, and physical-device verification before converting
   the remaining procedures.

This order deliberately proves the riskiest facts before a large UI or full
content conversion makes them expensive to change.
