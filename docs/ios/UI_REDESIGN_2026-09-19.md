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
