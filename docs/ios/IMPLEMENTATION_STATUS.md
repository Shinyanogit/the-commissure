# Native functional completion

> Session paused at the owner's request near 2% weekly remaining. First next
> task: reproduce the Web UI faithfully, then refine for iPhone/iPad. The
> temporary UI is explicitly rejected as the design baseline. See
> [session handoff](SESSION_HANDOFF_2026-09-12.md). No phase is closed.


Date: 2026-09-12
Branch: `codex/ios-functional-completion`
Execution mode: `ROOT_CODEX`

## Owner-directed sequencing change

The owner explicitly requested a temporary UI and accelerated completion of all
non-UI iOS work, following the existing roadmap with documented adaptations.
The Phase 5R static composition and production visual-author gates are deferred
for this engineering branch. Codex may connect and minimally adapt the existing
shell to exercise native functions. This is temporary UI, not visual acceptance.
The Sterile Field concept and final visual review remain release requirements.
This direction supersedes the earlier prohibition on native integration before
5R1B/5R2 for this branch only. No architecture or medical/rights gate is relaxed.

## Execution sequence

1. Phase 6: real ACDF runtime, deterministic transitions, manipulation, locale,
   local progress and offline reopen using the temporary shell.
2. Phase 7: complete ACCF/PCDF/PCF model conversion and all 26 runtime states,
   integrity/negative tests and physical-device functional hardening.
3. Phase 8: signed static content publication and verified runtime updates,
   native CI and protected TestFlight automation. Independent tooling may be
   implemented in parallel with Phases 6/7.
4. Phase 9: local release audit, privacy and metadata preparation, exact missing
   owner/configuration/rights/device requirements. External publication requires
   the actual release gates; preparation is not submission evidence.

## Current work

Implementation in progress. No new phase exit is claimed yet. The current
upstream Web baseline is PR #82 (`af7e263`) and is merged into the work branch.
Open-door laminoplasty is now shipped on Web but remains outside native 1.0.

## Session stop condition

The owner requested monitoring weekly usage and stopping if remaining usage
resets to 100%. A 15-second local log monitor is active for this work session.
On detection, stop all workers and preserve current edits without claiming
phase completion. This operational condition does not become a product feature.

## UI direction reaffirmed

The owner requires the temporary UI to follow the design concept and the Web
interaction philosophy precisely: anatomy first, minimal chrome, intuitive
icons and state, no implementation or temporary-build explanations in the
product flow. This is also a requirement for engineering previews.

## Reusable UI boundary

The owner explicitly requires later UI refinements to reuse the implementation
instead of causing a redesign from scratch. Layout-only revisions must preserve
AppAction, ViewState, procedure session, scene runtime and infrastructure.
Disclosure state belongs in the model and persisted preferences, not duplicate
view-local copies. Regression tests target behavior independently of layout.

## Engineering evidence (2026-09-12 16:31 JST)

- Core: 15 tests pass. Content validator: four procedures, 26 steps, EN/JA
  parity and all 26 negative fixtures pass.
- iPhone 17 Pro iOS 26.2 Simulator: 42 app tests and four UI tests pass in the
  integrated build, including real USDZ binding for all four procedures,
  canonical states, 50 interrupted/reversed cycles, progress resume,
  locale changes retaining the runtime, closing during locale reload,
  signature tampering, replay/equivocation, immutable versions, cancellation,
  queued cancellation and same-version cache repair.
- Root additionally operated the running native app: Library → ACDF, next,
  previous and accessibility zoom controls. This is a limited functional
  observation, not independent visual or medical acceptance.
- All four USDZs total 26,353,196 bytes (25.13 MiB), 597,017 triangles and 189
  named entities. The 20 MB combined target is missed; the 35 MB hard limit
  and individual pack size targets pass.
- `ProcedureLoad` and `StepTransition` signposts expose native timing to
  Instruments; MetricKit subscriptions remain native diagnostics.
- M1 iPad attempts did not reach execution: the first used the certificate CN
  identifier instead of the OU Team ID; the second tried an Xcode-managed
  wildcard profile in manual signing mode. Existing development and other-app
  Store profiles are present; current membership/App Store permissions and
  this app's automatic signing remain to be verified.
- Unsigned iOS archive succeeds. Publication tests pass 8 cases and release
  readiness tests pass 5 cases. Strict Swift formatting and Git diff checks pass.
- Publication and release gates are covered by local negative tests. Production
  endpoints, keys, signing, protected environments and uploads remain unset.
- Runtime/catalog unit tests do not constitute an end-to-end production CDN
  update test. Clean hosted CI, distribution archive, floor-device performance,
  30-minute thermal/memory soak, complete accessibility and final visual review
  remain unverified.

The engineering checkpoint does not close Phase 6/7/8/9 exit gates. Medical,
rights, physical-device, final-UI and exact signed-candidate evidence remain
required. See `RELEASE_READINESS.md` for the fail-closed release checklist.

## Runtime boundaries

- Views render immutable `ViewState` and emit `AppAction`; they do not load
  files, verify signatures or mutate RealityKit entities.
- `FoundationAppModel` owns navigation, progress and localization. The active
  remote model URL pins locale reprojection to the same immutable pack version.
- `ProcedureSceneRuntime` owns one scene lifecycle, gesture interpretation and
  frame updates. `RealitySceneAdapter` maps absolute scene states onto captured
  archive baselines and restores visibility/opacity after interrupted motion.
- `ContentDelivery` coordinates signed catalog refresh and explicit update
  requests. Downloaded candidates activate only after the actual native model
  loads and binds; failure selects retained installed content or the bundle.
- Shared teaching content and all Web runtime sources remain unchanged. All
  four baseline native procedures work without a production endpoint.

## Local-only boundary

The owner explicitly prohibits pushing, publishing, deploying, or changing the
current Web application during this work. Implementation and workflow checks
remain local on the iOS branch. No remote branch, PR, deployment, TestFlight
upload, or App Store submission is authorized by this session.

## Independent review status

Asset QC returned FAIL: flattened USD metadata includes an absolute checkout
path, so cross-checkout byte determinism is not achieved. Document cross-reference
errors were corrected; converter repair and independent retest remain open.
The app/tooling QC was interrupted for the owner-directed checkpoint and has no
verdict. Its tests attempted in the reviewer's read-only sandbox cannot close
filesystem fixture gates. Run the next read-only review with a writable scratch
area, while keeping production files immutable. These are WIP checkpoints.
