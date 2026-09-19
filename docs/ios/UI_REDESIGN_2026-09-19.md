# Native UI redesign, 2026-09-19

## Owner direction

The owner requested a fresh native composition informed by the shared design
concept and functional requirements, followed by alignment with the existing
Web UI/UX. Existing UI detail specifications were intentionally excluded from
the initial design inputs. This supersedes the September 12 instruction to
reproduce Web UI first. The blue spine behind the Web home page is a required
native asset.

The design source of truth remains `../DESIGN_CONCEPT.md`. This file records
implementation and evidence; it does not introduce a separate design concept.

## Owner clarification: platform differences are acceptable

The owner confirmed that intentional differences for phone, iPad and desktop
are acceptable. Web alignment means coherent branding and equivalent learning
capabilities, not identical layout or blindly reproducing browser mechanics.
Web source must remain untouched. Compare each difference by learner outcome,
record the native rationale, and verify it in the applicable device layout.

The adaptive one/two-column Library, native settings form, readable titled step
picker, and portrait/landscape teaching layout are deliberate native choices.
Two-finger panning, internal-link routing, and interaction completeness were not
implemented in the initial redesign and must not be retroactively described as
intentional design decisions. Audit and address real gaps while preserving
justified native ergonomics. This clarification supersedes any implication in
the matrix below that every Web layout or timing detail must be copied exactly.

## Web alignment audit (2026-09-19)

The initial native composition and functional test run are complete. Full Web
UI/UX alignment is NOT complete. The previous user-facing completion wording
was too broad; the owner asked explicitly whether alignment was finished.
The source behavior in `web/README.md` and `web/src/pages/ProcedurePage.jsx`
proves the remaining differences below. Passing native tests is not parity
acceptance. Close these before resuming final App Store candidate preparation.

| Behavior | Current native state | Remaining work |
| --- | --- | --- |
| Home branding | Actual blue spine render and wordmark reused | Compare editorial hierarchy and procedure discovery with live Web |
| Procedure field | Separate scene viewport and teaching panel | Match edge-docked glass panel, full-screen field and panel-driven framing |
| Explanation navigation | Arrow actions and titled picker | Implement horizontal tracking carousel, snap/cancel, and scene timing |
| Panel resizing | Fixed computed size | Add drag resizing with bounded dimensions and accessible alternatives |
| Panel stow | Heading and step tray remain visible | Match collapse/reopen behavior and coordinated chrome hiding |
| Model manipulation | Orbit and pinch; no two-finger pan | Match simultaneous two-finger zoom and screen-space pan |
| Navigation | Back, abbreviation, reset and overflow menu | Align procedure logo/menu and direct procedure switching |
| Scene transitions | Absolute-state interpolation | Verify authored forward/reverse choreography against all Web steps |
| Cross-procedure text links | Markdown links rendered | Verify native routing and gesture interaction |
| Loading | Native progress banner | Match branded preparation and resilient failure/retry behavior |

The current concept's independent composition details and Web interaction
behavior must be reconciled explicitly. Preserve native accessibility, offline
operation and validated content; do not claim matching behavior from shared
colors alone. The browser plugin failed to initialize in this audit because
its runtime references a missing `browser-service.mjs`; this is a tool setup
failure, not evidence that Web interaction verification passed.

## Implemented composition

Library uses the actual Web blue spine render as its deepest background, the
unchanged Web wordmark, and four direct procedure choices. Phone uses one
column, larger widths use two, and accessibility text uses one. Cards consume
validated localized procedure titles and step counts. Offline availability is
shown once when all procedures are bundled or cached. Language, settings, and
about remain secondary actions. The home background is a bundled 236 KiB JPEG,
so opening the Library needs neither network nor a second 3D runtime.

Theater has one procedure identity, an unobscured anatomy viewport, one teaching
panel, and one bottom step tray. Portrait places the panel beneath the model;
landscape places it alongside. `AnyLayout` changes composition without replacing
the active `RealityView`. Step selection uses scrollable full titles with a
selected checkmark. The current step remains visible when the explanation is
collapsed. Changing steps resets the explanation scroll position. Previous,
next, reset, language, orbit and zoom actions retain the existing domain intents.

Settings uses a scrollable native form and shows the selected language.
Destructive progress and download actions retain separate confirmations.
The selected locale is applied outside the sheet modifiers so settings and
colophon inherit the same language as the main app.

## Functional fix found during UI testing

`AppPreferences.trayExpanded` and `explanationExpanded` were computed directly
from `UserDefaults`. Their setters persisted changes without invalidating
Observation consumers, so disclosure could fail to update immediately. They
are now observable stored properties initialized from defaults and persisted in
`didSet`. A regression test watches the projected `TheaterViewState`, verifies
both invalidations, and checks restoration from persisted preferences.

## Design provenance

The first visual exploration used the v0 skill with only the canonical concept
and domain requirements: https://v0.app/chat/iE2qvKgMAoy . Its mock medical copy,
capacities, and invented placeholder graphics were not adopted. Native code
uses repository content exclusively. Web home and ACDF were inspected only
after the initial native composition was written. Their real logo, blue spine,
dark surfaces, cyan state accent and explanatory hierarchy informed alignment.
Web source and shared clinical content are unchanged.

Asset provenance is in `../../ios/App/Assets.xcassets/SOURCE.md`.

## Verification

The production candidate passed 50 tests on each of iPhone 17 Pro and iPad Pro
11-inch (M5), both iOS 26.2 Simulator: 43 app tests and seven UI tests per device,
zero failures or skips. The separate Foundation-only Core suite passed 15 tests.

Coverage includes all four real bundled models, step selection, forward/reverse
navigation and persisted reopen, disclosure changes, portrait/landscape rotation,
English/Japanese switching, settings, and maximum accessibility text. A focused
additional run also passed expanded explanation at maximum text size on both devices.
Screenshots were visually inspected for phone and tablet composition. Formatting,
localization key parity, unchanged Web/content sources, and byte-identical Web
wordmark reuse also pass.

Local result bundles and logs: `/tmp/commissure-ui-20260919/verified.xcresult`,
`large-text.xcresult`, `verified-tests.log`, and `core-tests.log`.
Review gallery: `../../ios/ui-review.local/index.html` (ignored local evidence).

Reproduce with `swift test` in `ios/Packages/CommissureCore`, then run the
`TheCommissure` scheme tests on an iPhone and iPad simulator. Build commands and
resource setup remain in `../../ios/README.md`.

This is a locally verified UI implementation, not owner visual acceptance or an
App Store release. Physical-device performance, medical-content review, existing
asset-portability findings, signing and release gates remain separate. There was
no push, upload or deployment.

## Owner review corrections in progress

The owner explicitly requested preservation of the Web interaction details:
continuous adjacent explanation pages clipped inside the panel, a translucent
panel containing previous/next controls, draggable panel size, camera framing
that follows the panel, the Web procedure background, and its 1.1-second
alternating logo reveal. These requirements override earlier generic statements
that timing and layout differences were acceptable. The black-background report
concerned the scene backdrop, not the back surface of the model; the speculative
extra lighting was removed.

The working implementation uses three neighboring explanation pages and a
0.5-second snap before dispatching the next scene, and a reverse-depth camera
projection that shifts the subject to the center of the uncovered viewport.
Vertical and horizontal drags on the model orbit rather than advance steps.
The Web favicon is reused for AppIcon. Home card step counts, the bundled-status
caption, the top-right information action, settings progress reset, and orbit /
zoom menu entries were removed at the owner's request. The language menu remains.

Verification is still in progress. Earlier 50-test results describe the initial
redesign, not this candidate. `panel-fixes.xcresult` had failures in resize,
iPad navigation/locale and a stale caption assertion. A later carousel test
exposed duplicate offscreen accessibility identifiers, which have been corrected.
The Web browser runtime and native UI bridge both failed initialization, so
current Web comparison is source-based, not a successful live interaction audit.
Remaining work includes final phone/tablet visual and interaction regression,
pinch and two-finger pan, home information access, internal links, signed device
verification and the release gates. This checkpoint is not App Store readiness.

Focused evidence after those fixes: `carousel-check2.xcresult` passed the iPhone
swipe/resize/model separation test. `ipad-carousel.xcresult` passed the same test
on iPad plus all 44 app tests, including a projection test that verifies the
uncovered screen center in both orientations without moving the camera pose.
Screenshots confirm the Web blue-green backdrop and the single translucent
panel. The final regression adds actual pinch gestures and landscape resizing;
its results are not yet claimed. The loader now uses the Web minimum 500 ms
presentation and 1.1-second alternating reveal, while remaining visible until
native content is ready rather than hiding an unfinished load at a timeout.

Asset portability repair: `canonicalization-test.log`, `cross-checkout.log`,
and `portable-assets.log` in the same evidence directory prove path-independent
canonical USD layers, byte-identical full exports of all four procedures in a
separate checkout, and strict ARKit validation. The native bundled resources
were regenerated. The integrity negative tests also pass. Asset-owner approval
and signed candidate validation remain separate gates.
