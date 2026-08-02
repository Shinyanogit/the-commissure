# Phase 5R visual fixture matrix

Status: design coverage contract; frame mapping not started
Date: 2026-08-02

This matrix is the contract between the design canvas and SwiftUI previews. A
row is not complete until it has a deterministic `ViewState` fixture, an
annotated static frame, and an exact viewport/locale/accessibility note. The
design phase must show the difficult states beside the hero states; a polished
happy path alone cannot close the gate.

The fixture identifiers below are proposed names for the 5R implementation
checkpoint. They are not claims that those fixtures already exist; the matrix
is complete only after `PreviewFixtures.swift` defines each required state.

| ID | Surface | State/variant | Viewport or trait | Fixture | Static frame |
|---|---|---|---|---|---|
| LIB-01 | Library | Four procedures, bundled/ready | iPad landscape | `libraryBundled` | pending |
| LIB-02 | Library | Cached/ready | iPad landscape | `libraryCached` | pending |
| LIB-03 | Library | Available to download with size | iPad landscape | `libraryDownloadOffer` | pending |
| LIB-04 | Library | Downloading with progress and cancel | iPad landscape | `libraryDownloading` | pending |
| LIB-05 | Library | Verifying | iPad landscape | `libraryVerifying` | pending |
| LIB-06 | Library | Offline unavailable with recovery | iPad landscape | `libraryUnavailableOffline` | pending |
| LIB-07 | Library | Failed transfer with retry | iPad landscape | `libraryFailed` | pending |
| LIB-08 | Library | Long Japanese procedure title | iPad portrait / Japanese | `libraryJapanese` | pending |
| LIB-09 | Library | Compact single-column composition | iPhone portrait | `libraryBundled` | pending |
| THE-01 | Theater | Preparing scene, compact tray | iPad landscape | `theaterPreparingCompact` | pending |
| THE-02 | Theater | Ready scene, compact tray | iPad landscape | `theaterReadyCompact` | pending |
| THE-03 | Theater | Ready scene, expanded titled selector | iPad landscape | `theaterExpanded` | pending |
| THE-04 | Theater | Manipulation/minimal tray | iPad landscape | `theaterMinimal` | pending |
| THE-05 | Theater | Transitioning/interrupted request | iPad landscape | `theaterTransitioning` | pending |
| THE-06 | Theater | Scene failure with recovery | iPad landscape | `theaterFailed` | pending |
| THE-07 | Theater | Explanation collapsed and discoverable | iPad landscape | `theaterCollapsed` | pending |
| THE-08 | Theater | Maximum Dynamic Type, explanation scroll | iPad portrait | `theaterLargeType` | pending |
| THE-09 | Theater | Japanese long title/body | iPad landscape / Japanese | `theaterJapanese` | pending |
| THE-10 | Theater | iPhone portrait hierarchy | iPhone portrait | `theaterReadyCompact` | pending |
| THE-11 | Theater | Reduce Motion | iPad landscape | `theaterReadyCompact` | pending |
| THE-12 | Theater | VoiceOver order annotation | iPad landscape | `theaterReadyCompact` | pending |
| COL-01 | Colophon | Purpose, authors, sources, disclaimer | iPad portrait | `colophon` | pending |
| SET-01 | Settings | Follow system / English / Japanese | iPad portrait | `settings` | pending |
| SYS-01 | Cross-cutting | EN/JA switch preserves step/session | iPad landscape | `localeReprojection` | pending |
| SYS-02 | Cross-cutting | Keyboard/pointer action equivalents | iPad landscape | `theaterReadyCompact` | pending |

## Required annotation per frame

- frame ID, fixture ID, viewport, orientation, and locale;
- design tokens used, including the 7:2:1 perceptual roles;
- sole MECE owner for every visible fact/action;
- icon name and localized accessibility label/hint for icon-only controls;
- tray density, explanation state, scene readiness, and enabled actions;
- Dynamic Type, VoiceOver, Reduce Motion, pointer/keyboard treatment where
  relevant;
- real content/asset provenance and any deliberate truncation or scroll rule.

No frame may introduce a screen, feature, procedure, content string, or asset
that is not present in the shipped contract.

## Interaction prototype coverage before implementation

Static frames do not close the direction gate by themselves. The disposable
prototype must demonstrate these transitions with the same semantic ownership
that production will use:

| Surface | User intent | Required visible result | Production contract to preserve |
|---|---|---|---|
| Theater | advance / go back | current step, anatomy state, explanation, and tray progress change together | one `AppAction` and one `ViewState` projection |
| Theater | direct step selection | selected step is reachable without replaying an accidental relative animation | idempotent absolute step intent |
| Bottom Step Tray | compact → expanded → minimal | disclosure is discoverable and does not create a second navigation owner | tray density is presentation state, not a hidden view-local source |
| Anatomy field | drag / flick / pinch | visible manipulation follows the gesture without stealing step ownership | gesture resolver dispatches the same semantic action path as accessible controls |
| Accessibility | VoiceOver / pointer / keyboard equivalent | every routine action reaches the same state as its visible gesture/button path | no gesture-only capability; localized label/hint is present |

The prototype is rejected if a tray transition changes the step independently,
if a gesture changes prose without the model, or if an accessible alternative
uses a parallel state machine. The selected composition must be returned to the
static matrix for EN/JA, Dynamic Type, Reduce Motion, failure, and offline
frames before the 5R2 implementation-ready gate.
