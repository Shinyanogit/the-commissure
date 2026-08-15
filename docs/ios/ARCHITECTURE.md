# Native iOS Architecture

Status: implementation contract
Stack: Swift 6.2, SwiftUI, RealityKit, structured concurrency
Minimum deployment: iOS/iPadOS 18

Phase 5A implementation status (2026-08-02, merged in PR #56 as `fece5e8`): the
tracked Xcode project and local pure-Foundation package implement the ownership
graph below. The SwiftUI shell
now consumes immutable presentation projections for Library, Theater, Bottom
Step Tray, Colophon, and Settings. The scene slot and transfer states remain
explicit placeholders until Phase 5B/6; domain, RealityKit, and I/O ownership
remain outside the visual allowlist.

## 1. Architecture goals

- Deterministic forward, backward, and random-access scene navigation.
- Smooth interaction with parsing, hashing, and file work kept off the main
  actor.
- A readable codebase where UI, domain state, 3D adaptation, and distribution
  have clear ownership.
- Extension by adding an intent, capability, or content field without rewriting
  the scene engine.
- No backend dependency for core learning.

## 2. Repository target

The final monorepo boundary is:

```text
/
├── web/                         # Existing React/Vite product
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vercel.json
├── ios/
│   ├── TheCommissure.xcodeproj
│   ├── App/                     # SwiftUI app, features, infrastructure
│   ├── Packages/
│   │   └── CommissureCore/      # Pure Foundation domain package
│   ├── Resources/               # Bundled manifest/content/assets
│   ├── Tests/
│   ├── UITests/
│   └── fastlane/
├── content/
│   ├── schema/                  # JSON Schema and version fixtures
│   ├── procedures/              # Shared metadata/text source
│   ├── ios-scenes/              # iOS scene state definitions
│   └── catalog/                 # Release manifest source
├── tooling/                     # Validators, converters, pack builder
├── docs/
└── .github/workflows/
```

Phase 1 moved the existing Web product unchanged into `web/` with `git mv`.
Vercel's Root Directory is `web`, the build still reads `web/vercel.json`, and a
real preview verified all five routes, all five GLBs, and the Draco decoder.
GitHub Actions runs Web CI from `web/` only when `web/**` or its workflow changes.
The `ios/`, `content/`, and `tooling/` roots now exist as explicit ownership
boundaries; runnable native/content workflows are added with their implementations
rather than as no-op placeholders.

## 3. Runtime ownership

```text
SwiftUI gesture/button
        ↓ ProcedureIntent
ProcedureSession reducer (MainActor)
        ↓ resolved target
SceneStateResolver (pure domain)
        ↓ ResolvedSceneState
RealitySceneAdapter (MainActor)
        ↓ presentation transition
RealityKit entities + camera

AssetSource → AssetStore actor → verified local pack → ContentStore → session
```

### `CommissureCore`

A local Swift package importing Foundation only. It owns:

- procedure, step, scene, camera, and part value types;
- manifest and pack metadata;
- `ProcedureIntent` and session state transitions;
- absolute-state resolution and validation;
- pure gesture intent resolution;
- compatibility and content-version rules.

It does not import SwiftUI, RealityKit, `URLSession`, or persistence frameworks.

### App target

- **LibraryFeature:** catalog presentation and download actions.
- **ProcedureFeature:** `ProcedureSession`, theater UI, step tray, explanation.
- **ColophonFeature:** sources, authors, licenses, disclaimer, diagnostics info.
- **RealitySceneAdapter:** maps stable part IDs to RealityKit entity paths and
  presents resolved states.
- **AssetStore actor:** downloads, verifies, installs, evicts, and deduplicates
  asset work.
- **ContentStore actor:** loads bundled/cached definitions and localized text,
  validates compatibility, and returns immutable domain values.
- **LocaleStore:** owns `followSystem / english / japanese`, resolves one locale,
  and projects keyed content without touching scene/session state.
- **AppPreferences:** small `UserDefaults` values only.
- **Diagnostics:** `Logger`, signposts, and MetricKit hooks.

`ProcedureSession` and the scene adapter are concrete types. A protocol is
introduced only at a real substitution boundary: `AssetSource` may have bundled,
remote-static, and test implementations. Avoid coordinator/router frameworks,
dependency-injection containers, a generic renderer hierarchy, and Combine.

## 4. Domain model

Phase 3 freezes six closed JSON Schema v1 documents under `content/schema/`:

| Contract | Ownership |
|---|---|
| catalog | version/capabilities plus exact file path, SHA-256, and byte count |
| procedure | renderer-neutral identity, localization keys, ordered step IDs, view policy |
| localization | one locale, revision, review record, and restricted-Markdown strings |
| scene | iOS-only bindings, absolute base/step snapshots, and allowlisted entrance beats |
| provenance | Web-text migration, asset digest, review, rights, and authorship status |
| source entities | asset-digest-bound exact legacy GLB names used to verify bindings |

Legacy `sourceEntity` spelling is retained only as conversion input. Runtime
state addresses the normalized `entityPath`; source array order and substrings
are never identity. The Phase 3 generator maps model-local animation offsets to
the canonical converted USDZ coordinate convention before emitting complete
snapshots. Absolute paths include the USDZ loader's `/root` entity; ACDF/PCDF
IDs and paths are cross-checked against their accepted native conversion
manifests. Catalog hashes are calculated after deterministic JSON generation.

```swift
struct ProcedureDefinition: Decodable, Identifiable, Sendable {
    let schemaVersion: Int
    let id: String
    let asset: AssetReference
    let parts: [PartBinding]
    let baseState: SceneState
    let steps: [ProcedureStep]
}

struct ProcedureStep: Decodable, Identifiable, Sendable {
    let id: String
    let titleKey: String
    let bodyKey: String
    let accessibilitySummaryKey: String
    let viewPolicy: ViewPolicy
    let state: SceneState
    let entrance: [TransitionBeat]
}

enum ViewPolicy: String, Decodable, Sendable {
    case preserveAdjustment
    case reframe
}

struct SceneState: Decodable, Sendable {
    let camera: CameraPose?
    let parts: [String: PartState]
}

struct PartState: Decodable, Sendable {
    let pose: Pose?
    let opacity: Float?
    let isVisible: Bool?
}

enum ProcedureIntent: Equatable, Sendable {
    case nextStep
    case previousStep
    case selectStep(String)
    case orbit(yaw: Float, pitch: Float)
    case zoom(scale: Float)
    case resetView
}
```

The decoded `SceneState` may omit values unchanged from `baseState`. Before
rendering, `SceneStateResolver` produces a `ResolvedSceneState` containing the
camera and every dynamic part. A target is always resolved from immutable asset
baseline plus the selected canonical state—never from current render values.

Rules:

- Relative mutations such as `+=`, `-=`, and array-order coupling are forbidden.
- Every dynamic part has a stable semantic ID and an exact USDZ entity path.
- Components of an implant share an explicit implant ID; index position is not
  identity.
- `entrance` is restricted to explanatory choreography such as staggered screw
  insertion or transient flexion. Its final beat must equal the step's canonical
  state.
- A beat is an allowlisted duration/easing plus absolute target data. It cannot
  branch, loop, call an operation, reference current render values, or contain an
  expression. CI bounds beat count/duration and resolves every beat to a complete
  snapshot before publication; compiled Swift owns interpolation/cancellation.
- Validation also requires the last entrance target to equal the canonical step
  state, a nondegenerate camera basis, and a nonzero axis for every rotation.
- Cross-file validation fixes `en` and `ja` to their named files, matches the
  provenance revision and procedure/scene view policy, and requires the exact
  `/root/procedure_<id>` root. Changing every path consistently to another root
  is still invalid.
- Restricted Markdown accepts only canonical `procedure:<id>` links whose label
  matches that procedure's title in the active locale. URI schemes,
  protocol-relative URLs, and bare `www.` hosts are rejected fail-closed.
- Authored camera pose and user yaw/pitch/zoom adjustment are separate values.
  `preserveAdjustment` is the default; a medically justified `reframe` resets
  adjustment and moves to the authored camera. Reset always returns to the
  current step's authored camera. Policy is a closed enum owned by
  `ProcedureSession`, not arbitrary remote camera logic.

## 5. Session and transition semantics

`@MainActor @Observable ProcedureSession` is the single source of truth for the
active procedure. It holds content readiness, selected step ID, authored target,
user camera adjustment, and transition status.

Intent handling is reducer-like and synchronous:

1. Validate the intent against current capabilities and bounds.
2. Update the selected domain state immediately.
3. Resolve a complete target snapshot.
4. Ask the adapter to retarget from its current presentation state.

There is one active presentation transition. A new target cancels/rebases it;
input is not discarded behind an arbitrary timer. If content is preparing, only
the latest target step is retained and applied once the adapter is ready.

## 6. Gesture extensibility

`GestureIntentResolver` is a pure state machine that consumes normalized touch
samples and emits zero or more `ProcedureIntent` values. SwiftUI gestures do not
call RealityKit directly.

The resolver owns:

- edge exclusion and control hit precedence;
- touch-count claims;
- deadband, axis lock, distance, and velocity thresholds;
- cancellation and interruption;
- capability checks such as `canGoNext`, `canOrbit`, and `canZoom`.

Adding trackpad, Pencil, game controller, or a future gesture creates an input
adapter that emits existing intents whenever possible. Adding a new intent adds
one exhaustive reducer case and tests; it does not add per-procedure branches.

## 7. Presentation, icons, and localization

Views receive an immutable, MECE presentation value instead of reaching into
stores independently:

```swift
struct TheaterViewState: Equatable, Sendable {
    let navigation: NavigationPresentation
    let scene: ScenePresentation
    let explanation: ExplanationPresentation
    let progress: StepTrayPresentation
    let utility: UtilityPresentation
}
```

Each field has one view owner. A procedure title, step index, or action is not
copied into two fields to make layout convenient. Debug assertions and snapshot
reviews compare the screen inventory against this ownership contract.

Routine control meaning is centralized as semantic actions, then mapped to SF
Symbols and localized accessibility copy in the design system:

```swift
enum AppAction: Hashable, Sendable {
    case back, resetView, previousStep, nextStep
    case selectStep, zoomIn, zoomOut, changeLanguage
    case download, cancelDownload, retry
}
```

Views do not choose ad-hoc icons or embed English labels. An unfamiliar,
destructive, consent, or error action may display text in addition to its icon.

System UI uses Xcode String Catalogs. Procedure prose uses versioned `en.json`
and `ja.json` with identical stable keys. `LocaleStore` resolves the effective
locale once and `ContentStore` returns localized values; feature views never
scatter `if language == ...` branches. Changing locale rebuilds presentation
values only—it does not decode/reload USDZ, recreate `ProcedureSession`, or
alter the active step. CI rejects missing/extra keys and unreviewed locale
revisions.

While Web still imports `procedureText.js`, content validation mechanically
recreates the English restricted-Markdown projection, applies only its three
provenance-recorded terminology corrections, and rejects all other drift. This
is a migration guard, not a shared renderer: Web GSAP remains in `web/`, while
the iOS absolute scene contract remains in `content/ios-scenes/`.

## 8. Concurrency and responsiveness

- Swift 6 strict concurrency is enabled from the first commit.
- SwiftUI state and RealityKit mutation remain on `MainActor`.
- Manifest fetch, file download, streaming SHA-256 verification, JSON decoding,
  and cache indexing run in actors/background tasks.
- `AssetStore` deduplicates in-flight requests by pack ID/version so multiple
  views cannot download or verify the same asset twice.
- Downloads use background-capable `URLSession`; only one pack downloads and
  one model parses at a time. UI observes value snapshots,
  not mutable task objects.
- Cancellation is propagated when work is no longer useful, except an atomic
  install already committing to disk.
- One procedure model is live. Library previews are still images, not hidden 3D
  scenes. Step neighbors may be state-precomputed, but extra models are not
  preloaded.

## 9. Error boundaries

- Domain decoding returns structured validation failures with procedure, field,
  and schema version.
- A failed remote refresh never replaces a valid bundled or cached catalog.
- A pack becomes `ready` only after signature/manifest checks, byte hash,
  schema validation, entity-binding validation, and atomic rename all pass.
- Scene adapter errors surface a stable recovery UI and diagnostics code; they
  do not leave a partially mutated model onscreen.

## 10. Test architecture

### Pure unit tests

- Every step path and random jump resolves to the expected complete snapshot.
- Repeated navigation has zero drift.
- Intent bounds, latest-wins cancellation, and pre-load intent behavior.
- Gesture thresholds, direction locking, edge exclusion, and cancellation.
- Locale resolution/key parity and in-place language changes with stable session
  identity.
- MECE presentation ownership and centralized icon/action mappings.
- Manifest compatibility, signature fixture, hash mismatch, and version rules.
- Orthogonal bundled/installed/offered/transfer/failure facts and the derived UI
  state, including a failed update beside a still-ready prior version.
- Cache eviction protects the active pack and never deletes bundled content.

### Adapter/integration tests

- Every required semantic ID maps to exactly one expected USDZ entity.
- Canonical screenshots and entity transforms for all 26 steps.
- Download interruption, resume/retry, corrupt pack, no network, Low Data Mode,
  low storage, and stale manifest.
- Locale fallback and restricted-Markdown parsing.

### UI and physical-device tests

- iPhone and iPad, portrait and landscape, large Dynamic Type, VoiceOver,
  Reduce Motion, dark appearance, and offline relaunch.
- ACDF is the correctness spike; PCDF is the worst-case performance gate.
- Phase 2 implements the proof as disposable `ios/Spikes/NativeAssetSpike`,
  backed by a pure Swift package whose canonical snapshots contain no SwiftUI
  or RealityKit. The adapter captures entity baselines once, resolves every
  target from an absolute snapshot, cancels active playback controllers, and
  retargets the latest intent. This shape is evidence for Phase 4, not a second
  production architecture.
- The spike keeps ordinary correctness UI tests separate from its opt-in
  `NativeAssetSpikePhysical` scheme. That physical scheme owns repeated process
  launch sampling and the 900-second endurance gate, keeps the display awake
  only while endurance is requested, exposes machine-readable metrics through
  accessibility values, and enforces the hard latency/FPS/memory/thermal limits
  in XCTest. The development team is supplied locally at invocation and is not
  committed.
- Native conversion lives in `tooling/native-assets`: tracked GLB inputs plus
  exact manifests yield canonical semantic USDZ. Source spelling/index order
  never enters runtime binding. Generated USDZ, reports, and Xcode projects are
  ignored so Web deployment and repository weight remain unchanged.

## 11. Coding rules

- Feature folders own views and their local presentation types.
- Business rules do not live in SwiftUI view bodies or RealityKit callbacks.
- Prefer value types and exhaustive enums; mutable singletons are prohibited.
- Avoid a protocol with one production conformer except the documented asset
  seam.
- Comments explain non-obvious constraints, not syntax.
- Public names use medical terminology consistently: `disc`, `cranium`, and
  `ligamentumFlavum`; source-file typos are normalized at conversion time.
- Locale conditionals, literal SF Symbol names, and user-facing strings do not
  appear in feature view bodies.
- Phase 5 visual ownership is bounded by
  [`CLAUDE_DESIGN_BRIEF.md`](CLAUDE_DESIGN_BRIEF.md): `DesignSystem`, feature
  views, and preview fixtures may be visual-only; view models, domain state,
  RealityKit lookup, I/O, and localization loading remain Codex-owned.

### Phase 5A presentation projection

`FoundationAppModel` projects bundled `LibraryItem` and `ProcedureBundle` values
into `LibraryViewState` and `TheaterViewState`. `ProcedureSessionController`
remains the only step reducer; view actions are exhaustive `AppAction` values and
never resolve content or RealityKit entities. The model keeps the session identity
and selected step while `AppPreferences` triggers a localized text reprojection.
Dynamic system labels use the selected `lproj` resource bundle explicitly, and
`LOCALIZATION_PREFERS_STRING_CATALOGS=YES` keeps every catalog key in the app
bundle even when the key is resolved from a presentation projection rather than
directly in a SwiftUI body. The visible theater uses `.preparing` until the Phase
6 RealityKit adapter binds the verified scene; the placeholder is not release
evidence.

## 12. Phase 4 executable evidence

- `CommissureCore` contains only Foundation imports and owns decoded content,
  absolute-state resolution, deterministic session intents, gesture resolution,
  pack presentation facts, and replay/stale-catalog policy.
- The app owns concrete `ContentStore` and `AssetStore` actors,
  `ProcedureSessionController`, `RealitySceneAdapter`, preferences, `Logger`,
  signposts, and MetricKit subscription. App launch reads the bundled `content/`
  folder and never creates or awaits a catalog request.
- `AssetStore` deduplicates equal requests, serializes different packs, rejects
  unsafe paths and pack identities before filesystem/network access, verifies
  exact cached file sets/bytes/SHA-256,
  checks free space before transfer and again before activation, stages writes,
  and atomically moves only a complete version. Existing versions are not
  replaced by a corrupt update, protected versions cannot be evicted, and
  staging recovery never removes ready packs.
- Swift format, fifteen Core tests, twenty app unit tests, two offline-launch UI
  tests, deterministic XcodeGen regeneration, and an unsigned generic-device
  archive pass with Swift 6.2.3/Xcode 26.2. The archive embeds the four
  procedure JSON fixtures and both localized String Catalog outputs and is
  3.4 MB before models, signing, and App Store processing. Marketing/build
  versions are sourced from Xcode build settings in the generated Info.plist.
- The Phase 4 repair rejects nested noncanonical scene paths and asset-version
  drift, resolves RealityKit bindings by complete hierarchy rather than leaf
  name, cancels a one-finger drag on a second touch, maps vertical flicks to
  steps and horizontal claims to orbit, rejects unsafe pack IDs, and reprojects
  the active library when the language changes. Fresh simulator execution remains
  environment-limited after worker startup (`NSMachErrorDomain -308`); this does
  not change the compile/archive or prior successful runtime evidence.
