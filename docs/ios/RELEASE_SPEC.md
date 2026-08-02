# iOS 1.0 Release and App Store Specification

Status: release contract
Product: The Commissure 1.0
Platforms: iPhone and iPad, iOS/iPadOS 18 or later

Phase 5A status (2026-08-02): the visual shell builds and projects bundled
procedure state, with runtime EN/JA system-label selection covered by simulator
UI tests. The scene placeholder and fixture-backed transfer states are not
release evidence.

The Phase 5A composition is not a release baseline. The owner rejected the
incremental Phase 5B direction, so Phase 5R requires materially divergent static
designs, a disposable interaction prototype for Theater/tray/step transitions,
complete state-matrix coverage, Opus 5's hand-written production visual layer
from the approved Figma specification, Codex integration/audit, and exact-build
iPad/iPhone screenshot/accessibility acceptance before the visual shell can be
called release-ready. Runtime plumbing evidence does not close this gate;
generated design code is never a production source, and Codex must not become a
fallback visual author if Opus is unavailable.

Phase 4 archive status (2026-08-02): the unsigned generic-device archive smoke
passes for the iOS 18 Swift 6 foundation (`0.1.0` / build `1`, 3.4 MB archive
before native models and signing). The repair covers the first independent-QC
findings around gesture arbitration, exact scene/cache identity, pack-key safety,
and runtime locale projection; a fresh `gpt-5.6-sol` / xhigh QC passed with zero
open findings. This is build evidence only; it is not a signed distribution
archive and does not satisfy metadata, rights, medical, floor-device, privacy,
screenshot, or App Store review gates below.

## 1. Release scope

Included:

- Native SwiftUI/RealityKit Library and Procedure Theater.
- ACDF, ACCF, PCDF, and PCF; 26 canonical reversible steps.
- Icon-first, MECE interface and Bottom Step Tray.
- Orbit, pinch, step flick, visible controls, keyboard/pointer, and accessible
  equivalents.
- English/Japanese UI and procedure prose with in-app switching.
- Progress resume, bundled fallback, optional first-use acquisition, verified
  cache, atomic content update, offline operation, and cache management.
- Colophon, authors, sources, licenses, privacy/support, and educational notice.

Excluded: accounts, sync, analytics/advertising SDKs, quizzes, audio, push,
payment, user-generated content, AR/visionOS, arbitrary remote UI, and downloaded
executable logic.

## 2. Functional release gates

| ID | Gate |
|---|---|
| F-01 | Library becomes useful without waiting for network and shows correct availability for all four procedures. |
| F-02 | At least one complete procedure is usable offline from a fresh App Store install. |
| F-03 | All procedures move backward, forward, and by direct selection with identical canonical results. |
| F-04 | Rapid/interrupted input uses latest-wins retargeting and never desynchronizes model, title, body, or progress. |
| F-05 | First-use transfer discloses exact size, asks consent, supports cancel/retry, verifies, and atomically installs. |
| F-06 | Verified cache opens offline without retransfer; failed refresh/update retains the last good version. |
| F-07 | English/Japanese switch updates active UI/prose in place with no model reload or step reset; key parity is complete. |
| F-08 | Every screen passes the documented MECE ownership inventory and has no duplicate control/state presentation. |
| F-09 | Routine actions are icon-first and understandable by position/state; localized labels/hints exist for assistive technology. |
| F-10 | Reset Progress and Clear Downloads are separate, accurate, and cannot remove bundled fallback. |

## 3. Scene correctness gates

- All 26 step IDs are unique, bounded, and resolvable from immutable baseline.
- Every mutable semantic part has one exact USDZ entity binding.
- Sequential and direct paths to each step compare equal in domain snapshots.
- Fifty forward/back cycles and randomized paths show zero drift.
- Every choreography ends exactly at its canonical state.
- Pending input before model readiness resolves to the latest target.
- Missing/duplicate entity, relative transform, invalid opacity, incomplete final
  beat, and unknown schema/easing are CI failures.
- ACDF is the broad correctness fixture; PCDF is the worst-case rendering fixture.

## 4. Accessibility and usability gates

- Dynamic Type through the largest accessibility category preserves content and
  essential actions without overlap with safe areas or the step tray.
- VoiceOver order follows procedure identity → current explanation → progress
  and step actions → secondary utilities.
- Previous/next, direct step selection, orbit, zoom, reset, locale, download,
  and back are operable without a gesture shortcut.
- Icon-only controls have English/Japanese labels and hints; color is never the
  sole status cue.
- Reduce Motion eliminates large camera choreography and applies canonical state
  without losing comprehension.
- Leading-edge system back is not captured by scene gestures.
- Portrait/landscape and iPhone/iPad layouts keep the active anatomy visible.
- Error messages state cause and one relevant recovery action.

## 5. Performance and resilience gates

The detailed thresholds are in [ASSET_DELIVERY.md](ASSET_DELIVERY.md). Release
also requires:

- Measurements on the oldest supported physical device and a current iPhone
  and iPad; simulator results do not close performance gates.
- No hashing, archive work, JSON bulk decode, or file installation on MainActor.
- No unbounded memory growth during a 30-minute randomized walkthrough.
- Procedure exit releases the live model; background/resume does not duplicate
  downloads or install tasks.
- Airplane mode, constrained network, interrupted download, corrupt bytes,
  stale catalog, insufficient storage, OS cache purge, and process termination
  during staging all recover without data loss or blank primary UI.
- Serious/critical thermal state suspends optional prewarm/effects while keeping
  education/navigation functional.

## 6. Privacy and medical-safety gates

- No account, advertising, tracker, analytics SDK, health data, or uploaded
  learning history in 1.0.
- Privacy manifest and App Store privacy answers match observed binaries and
  network behavior. Required-reason APIs are audited.
- A public privacy policy exists even if the final label is Data Not Collected.
- Educational-use disclaimer states the app is not patient-specific advice or a
  substitute for supervised surgical training.
- Every procedure revision records source, author/editor, reviewer, version, and
  date. No patient-identifiable media is present.
- Phase 3 `editorialReviewed` records prove key-matched migration review only.
  A provenance value of `medicalReview.status = inheritedWebsiteSource` or a
  `rightsReview.status = ownerConfirmationRequired` record remains
  release-blocking; schema/CI success must not be presented as medical or
  licensing approval.
- Rights are documented for USDZ/Blender-derived models, text, fonts, icons,
  author media, and screenshots.
- Production content URLs and public verification key are present; private
  signing/hosting/App Store credentials are absent from source and binary.

## 7. App Review positioning

### Minimum functionality

The release demonstrates native value through interactive RealityKit anatomy,
reversible direct manipulation, haptics, offline content, adaptive iPhone/iPad
layout, accessibility actions, and local progress. It is not a `WKWebView`
wrapper. A complete bundled reviewer path prevents a network/CDN failure from
making the app appear incomplete, addressing Apple's minimum-functionality and
initial-download expectations
([Guideline 4.2](https://developer.apple.com/app-store/review/guidelines/#minimum-functionality)).

### Downloaded content

Remote packs contain fixed-schema educational data/media only. They cannot
execute code or introduce a renderer capability. Native changes remain App
Store releases, consistent with
[Guideline 2.5.2](https://developer.apple.com/app-store/review/guidelines/#software-requirements).

### Reviewer notes must state

- the educational purpose and non-clinical boundary;
- that no login is needed;
- exact steps to open the bundled procedure and exercise orbit, zoom, reverse
  step navigation, language change, and accessibility controls;
- what optional remote packs contain and how size/consent/verification work;
- that a remote-content outage leaves bundled/cached content functional.

## 8. Metadata and store assets

Required and verified before submission:

- app name, subtitle, description, keywords, category, age rating, copyright;
- support URL, privacy URL, marketing URL if used;
- privacy labels, encryption declaration, content-rights answers;
- localized English and Japanese metadata;
- final icon, device screenshots, and optional preview video made from the exact
  release build;
- screenshots derived from [The Sterile Field](../DESIGN_CONCEPT.md), preserving
  7:2:1 and showing only shipped features/content;
- App Review contact and notes.

No placeholder, “coming soon” primary card, fabricated model state, unsupported
device frame, or unreviewed medical claim appears in metadata or screenshots.

## 9. Test matrix

### Automated

- Core: decoding, compatibility, absolute state equality, intent reduction,
  gesture arbitration, locale parity/fallback, progress migration.
- Assets: signature/hash, deduplication, cache LRU, atomic activation/rollback,
  corrupt/partial pack, background completion, version incompatibility.
- UI: launch, select, download consent/progress/retry, previous/next/direct jump,
  locale change, resume, clear/reset, offline reopen, accessibility identifiers.
- Scene fixtures: entity existence and expected transforms/material visibility
  for every canonical step.

### Manual/physical device

- All supported device classes and orientations.
- VoiceOver, largest Dynamic Type, Reduce Motion, Increased Contrast, Switch
  Control sanity, keyboard/trackpad.
- Wi-Fi, cellular/constrained, airplane mode, low storage, background/kill/reopen.
- 30-minute random navigation, thermal observation, visual anatomy/content QA.
- Internal then external TestFlight regression on the exact release candidate.

## 10. App Store review scans

Run the `app-store-review` skill twice:

1. Before external TestFlight, while fixes can still change architecture or UI.
2. On the signed/tagged release candidate with final entitlements, privacy
   manifest, binary, metadata, screenshots, URLs, and remote manifest.

Submission is blocked by any blocker/high finding. Medium findings need an
explicit fix or written evidence-based disposition in the release log.

At Phase 0 there is no `.xcodeproj`/`.xcworkspace`, Info.plist, entitlements, or
binary to scan; only this review contract can be checked. A reported “pass”
before the native project exists would be invalid.

The real scan must cover at least:

- bundle/display name, identifier, marketing/build version, iOS 18 deployment,
  universal device family, orientations, launch presentation, and 1024×1024 app
  icon;
- release signing, entitlements, embedded frameworks, simulator-only artifacts,
  private API/selectors, hard-coded IPv4 addresses, and crash-prone force unwraps;
- placeholder/coming-soon/empty states, broken or undocumented URLs, and parity
  between actual behavior, metadata, screenshots, and reviewer notes;
- every interactive icon's accessibility metadata and every declared screen
  size/orientation;
- `PrivacyInfo.xcprivacy`, required-reason API declarations, permission usage
  strings, linked SDK behavior, and App Privacy answers;
- content/model/font/icon/portrait rights, privacy/support URLs, age rating,
  export-compliance answer, and medical-education claims;
- absence of accounts, external payments, hidden paywalls, tracking, and
  unreviewed remote executable features in the 1.0 scope.

## 11. Fastlane contract

Location: `ios/fastlane/`.

| Lane | Responsibility |
|---|---|
| `test` | Unit/UI test plan and result bundle |
| `archive` | Clean Release archive and export validation |
| `screenshots` | Deterministic localized screenshots from release fixtures |
| `beta` | Upload the validated build to TestFlight |
| `metadata` | Validate/sync localized metadata and screenshots without binary submission |
| `release_candidate` | Test, archive, validate, upload, and record build/version/artifact hashes |
| `submit` | Submit an already validated uploaded build for review; no source rebuild |

Use an App Store Connect API key with the minimum role practical for CI
([fastlane API-key guide](https://docs.fastlane.tools/app-store-connect-api/)).
Signing and production submission run through protected GitHub Environments.
Secrets—API `.p8`, certificates/profiles or `match` secret, manifest signing
key, and hosting token—never enter Git. Fastlane supports archive/upload and
submission with `upload_to_app_store`
([action documentation](https://docs.fastlane.tools/actions/appstore/)).

The `submit` lane uses the exact previously tested build, attaches reviewer
notes, requests review, and defaults to manual/phased release after approval.
Apple owner-only enrollment, agreements, and credential creation may require
Shinya once; routine later submissions remain automated.

## 12. Definition of done

The release is done only when:

- All functional, scene, bilingual, MECE/icon, accessibility, performance,
  resilience, privacy, medical, and rights gates pass.
- Both App Store scans have no unresolved blocker/high finding.
- The signed TestFlight candidate is the uploaded App Store build.
- Archive, metadata, screenshots, URLs, and remote/bundled manifests validate.
- Fastlane completes submission and App Store Connect shows **Submitted for
  Review**.
