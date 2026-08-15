# Native iOS Product Specification

Status: implementation contract
Target: The Commissure 1.0 for iOS and iPadOS 18 or later
Last updated: 2026-07-28

## 1. Product outcome

The native app lets a medical learner understand the sequence and spatial
effect of four cervical-spine procedures through a responsive 3D walkthrough.
It must work meaningfully on first launch, remain useful offline, and provide
native value beyond the existing Web experience.

The shipped implementation follows [The Sterile Field](../DESIGN_CONCEPT.md).
SwiftUI and RealityKit replace the Web runtime; a `WKWebView` is not part of the
release architecture.

## 2. Supported content

Version 1.0 contains:

- ACDF — Anterior Cervical Discectomy and Fusion, 7 canonical steps.
- ACCF — Anterior Cervical Corpectomy and Fusion, 7 canonical steps.
- PCDF — Posterior Cervical Decompression and Fusion, 6 canonical steps.
- PCF — Posterior Cervical Foraminotomy, 6 canonical steps.
- Library, procedure theater, Colophon, licenses, and educational disclaimer.
- English procedure content from the current website, migrated out of HTML as
  the initial editorial source of truth.
- Complete English/Japanese switching for system UI and procedure prose.
  Japanese uses a reviewed translation with one-to-one key parity; both locales
  are required for the first native release.

The app is universal for iPhone and iPad. It supports portrait and landscape,
with one shared interaction model and responsive layout rather than separate
feature sets.

## 3. Primary user flow

1. Launch opens an interactive Library without requiring a network request.
2. The Library shows the four procedures and whether each is bundled, ready,
   downloadable, updating, or unavailable.
3. Selecting ready content opens the Procedure Theater immediately.
4. Selecting uncached content shows exact network and installed sizes before
   the user confirms the download.
5. The theater opens at the last compatible step or step 1. The model and text
   always represent the same resolved step state.
6. The learner moves with the Bottom Step Tray, vertical flick, keyboard, or
   accessibility actions; they inspect with orbit and pinch.
7. Leaving a procedure records only local progress. Returning never requires a
   repeat download when the verified cached version is still valid.

## 4. Library requirements

- First meaningful content appears before any catalog refresh completes.
- Each procedure card exposes name, abbreviation, one-sentence purpose, still
  image, and availability.
- Routine actions are icon-first. Written controls are reserved for unfamiliar,
  destructive, safety-relevant, or size/consent decisions; every icon has
  localized accessibility metadata.
- Network size appears only when bytes are not already installed.
- A download is user-initiated, cancellable, resumable where supported, and
  never represented as complete before hash verification and atomic install.
- Offline state is calm and actionable: bundled and cached procedures continue
  to open; uncached procedures explain that a connection is needed.
- Content updates are optional by default. An incompatible pack is not opened
  and clearly requests an app update.

## 5. Procedure Theater requirements

- Full-bleed RealityKit view with a compact top bar, a single step explanation,
  and the Bottom Step Tray.
- Previous and next are always visible or one explicit expansion away.
- Direct step selection is available from the expanded tray.
- Reset restores the authored camera plus zero user adjustment.
- A step transition may be interrupted. Latest valid navigation intent wins and
  retargets from the current presentation state.
- Direct jumps and repeated sequences such as `1 → 6 → 3 → 7 → 1` produce no
  transform, visibility, opacity, or camera drift.
- Content remains synchronized if an intent arrives before the model finishes
  loading; the pending target is applied after readiness.
- Only one procedure model is live in memory. Leaving the theater releases its
  RealityKit resources after the transition finishes.
- Visible information is MECE: top bar owns destination/reset, 3D field owns
  anatomical state, explanation owns the teaching point, and bottom tray owns
  step position/navigation. No title, progress value, or action is needlessly
  repeated across regions.

## 6. Interaction requirements

All input paths dispatch the same domain intents:

| Input | Result |
|---|---|
| Previous/next buttons | Previous or next step |
| Step scrubber selection | Select canonical step |
| Decisive vertical flick | Previous or next step |
| One-finger spatial drag | Orbit within authored limits |
| Pinch | Zoom within authored limits |
| Reset button | Remove user camera adjustment |
| Keyboard/trackpad | Equivalent step, orbit, zoom, back actions |
| VoiceOver adjustable/action | Equivalent step, orbit, zoom, reset actions |

Gesture arbitration defaults:

- Preserve approximately 24 points plus the relevant safe-area inset at the
  semantic leading edge for system back, respecting layout direction.
- Pinch claims the interaction once two touches are recognized.
- A one-finger gesture waits for an 8-point deadband. Claim horizontal/vertical
  when one axis is at least 1.35 times the other; if still ambiguous at 16
  points, choose the dominant axis and do not switch during that sequence.
- Commit exactly one step at 44 points vertical displacement or the tuned
  projected-velocity threshold. Horizontal claims orbit. A second finger
  cancels an undecided drag and gives pinch priority.
- Constants live in one resolver and are tuned with device tests; scene code
  does not contain gesture thresholds.

## 7. Loading, empty, and failure states

The UI has explicit, testable states rather than a generic spinner:

- Catalog: bundled snapshot, refreshing, current, refresh failed.
- Pack: bundled, not downloaded, queued, downloading, verifying, ready, stale,
  failed, evicted, incompatible.
- Scene: preparing, ready, transitioning, failed.

Every failure offers one relevant recovery action. The app never exposes a
blank 3D canvas while silently loading.

## 8. Persistence and privacy

- Persist locally: selected locale, completed/current step per procedure,
  explanation/tray presentation preference, installed pack metadata, and cache
  index.
- Do not require an account or collect names, learning histories, health data,
  advertising identifiers, or analytics in 1.0.
- Performance signposts and MetricKit diagnostics remain on device unless a
  later, separately reviewed opt-in diagnostics feature is added.
- Cached content is stored under Application Support/Caches as appropriate and
  excluded from backup.
- Reset Learning Progress does not delete downloaded assets; Clear Downloads
  does not delete bundled content or preferences. The actions remain distinct.

## 9. Educational and medical boundaries

- The Colophon states that the app is an educational visualization and not a
  substitute for clinical judgment, formal surgical training, or patient-
  specific advice.
- Sources, authorship, asset licenses, and content version are inspectable.
- The user can select English, Japanese, or Follow System. Changing language
  updates UI and active procedure prose without reloading the model or resetting
  the current step.
- Remote content cannot create new native features or execute code. It may only
  supply validated models, still images, restricted Markdown, localization
  strings, and values from the app's fixed scene schema.
- Medical changes require repository review and provenance metadata even when
  technical publication is automated.

## 10. Explicitly outside 1.0

- Accounts, cloud progress sync, comments, social features, and a database.
- Quizzes, audio narration, push notifications, and user-generated content.
- AR placement, spatial-computing-specific UI, and multi-user sessions.
- A general-purpose remote animation language or remotely delivered Swift,
  JavaScript, shaders, plug-ins, or executable rules.
- Automatic native-feature updates outside App Store review.

## 11. Acceptance summary

Version 1.0 is functionally complete when all four procedures are navigable in
both directions, every step resolves deterministically, English and Japanese
switch without scene reset, at least one procedure works without a network on
first launch, cached procedures reopen offline, every screen passes the MECE
inventory, all essential actions have accessible equivalents, and the quality
gates in [RELEASE_SPEC.md](RELEASE_SPEC.md) pass on physical devices.
