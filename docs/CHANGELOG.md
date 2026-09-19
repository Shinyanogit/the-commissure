# Changelog

User-visible changes are recorded when the implementation, verification, and
its source-of-truth documentation are ready in the same pull request.

## 2026-09-20: release verification stability

- Corrected the remote pack-transfer test to validate its documented maximum
  of two concurrent requests instead of requiring URLSession to schedule
  exactly two. The focused test now passes.
- Verified the 1.0.0 Release app compiles for the iPhone 17 Pro Max Simulator
  through XcodeBuildMCP. The preceding Debug suite ran 56 of 57 tests; the
  corrected focused test supplies the missing verification.
- Recorded that the paired physical iPad cannot currently mount its developer
  disk image, so it remains outside the accepted device-validation evidence.

## 2026-09-20: source controlled App Store artwork draft

- Copied Vocabry's local feature-graphic source before adapting the copy for
  The Commissure. The original Vocabry project was not modified.
- Added a fixed 5280 by 2868 composition source and deterministic iPhone
  capture script. It produces four standalone 1320 by 2868 PNG candidates from
  a review master using only existing app captures, the shipped icon, wordmark,
  and blue spine artwork.
- Revised the first draft after visual review so the three product screens are
  complete native screens and the dark stage uses continuous ambient light and
  a restrained cyan guide across the candidate series.
- `npm run build` and `npm run capture:iphone` pass. The generated images are
  local review artifacts, not approved App Store uploads.

## 2026-09-20: App Store support and gesture correction

- Added native-app support and privacy routes to the existing The Commissure
  Web site, with static SEO documents, Vercel direct-route handling, sitemap
  entries, footer links, and a temporary support mailbox approved by the owner.
- Split one-finger orbit from two-finger pan and pinch recognition in the native
  3D field so a pinch cannot take the one-finger orbit path.
- Added a factual approval dossier that traces the current medical content and
  BlenderKit source evidence before release-gate status can be approved.
- Added a Fastlane Snapshot-backed, localized four-screen capture path for
  App Store screenshots and corrected its project-path resolution.
- Added a Figma Make art-direction handoff for four connected App Store
  screenshots that uses only shipped native screens and visual assets.

## 2026-09-20: App Store submission audit

- Restored the locked Fastlane environment with Homebrew Ruby and verified that
  all local lanes load. The submit lane stops before network access when no IPA
  path is supplied.
- Recorded an unsigned arm64 Release archive and the current App Store review
  findings. Distribution signing, factual approvals, public URLs, candidate
  materials, physical-device evidence, TestFlight, and the final candidate scan
  remain release blockers.

## 2026-09-20: native reading and interaction checkpoint

- Added an iOS-only explanation copy experiment, preserving shared source text,
  source-digest fallback, semantic paragraph breaks and existing procedure links.
- Increased explanation contrast and restored Web-colored emphasis; rendered
  list items with hanging bullets. Added the branded animation on app launch.
- Added a lower home information route and Web-derived project/author text.
- Replaced ambiguous simultaneous SwiftUI drag/pinch handling with touch-count
  aware UIKit gestures, including screen-space two-finger pan. Visual and
  interaction regression remains in progress. Pinch screenshots still show
  rotation, so zoom is not yet accepted despite the automated assertion passing.
- Matched the Web basic scene tween at one second with cubic in/out easing.
  Sequential scene choreography still needs a separate parity pass.
- Passed 47 app tests and 16 Core tests. Eight UI tests passed; the remaining
  landscape language test passed after a header hit-testing correction.
- Fetched GitHub; main was already included, with no incoming merge needed.

## 2026-09-19: native owner review corrections

- Restored Web-derived procedure background and animated loading wordmark;
  reused the existing favicon as the native AppIcon.
- Added adjacent explanation paging with clipping, integrated previous/next
  controls into a translucent resizable panel, and adjusted camera projection
  to center the model in the uncovered area.
- Corrected drag direction and removed model-surface vertical step navigation.
- Removed unsolicited home captions, information shortcut, progress-reset
  setting and rotation/zoom menu actions as requested.
- Focused phone/tablet interaction tests and 44 app tests pass. Broader visual,
  pinch, regression and release verification continue; see the UI review record.

## 2026-09-19: native UI redesign

- Rebuilt native Library and Theater from the shared concept, then aligned with
  Web branding. Reused the actual blue spine home render and existing wordmark.
- Added adaptive portrait/landscape teaching layout and readable step selection
  while preserving the active RealityKit scene and existing content boundaries.
- Made settings scrollable with a visible language selection. Fixed locale
  propagation into sheets and immediate Observation updates for disclosure.
- Passed 43 app tests and seven UI tests on both iPhone and iPad simulators,
  plus 15 Core tests. Visual evidence and limitations are recorded in
  `ios/UI_REDESIGN_2026-09-19.md`. No Web change or external publication.

## 2026-09-12 — local iOS WIP checkpoint

- Added native conversion and integrity checks for all four native
  USDZ models, totaling 25.13 MiB, with semantic entity paths.
- Connected SwiftUI to RealityKit for all 26 canonical steps with reversible,
  interruptible state changes, orbit/zoom/reset, bilingual projection and
  persistent progress. Presentation remains replaceable without rewriting the
  scene or delivery layers; the current UI is provisional.
- Added exact-byte signed catalog verification, immutable-version enforcement,
  verified cache installation, cancellation, retained versions and fallback.
- Added local publication/release validators, protected workflow definitions,
  Fastlane preparation and privacy manifest. No workflow was published or run
  remotely, and no TestFlight or App Store upload occurred.
- Passed 42 native app tests and four UI tests on iPhone 17 Pro Simulator.
  Physical-device, rights, medical, final visual and signed release gates remain
  open. Asset QC found a checkout-path determinism issue; app QC is incomplete.
  The owner rejected the provisional UI and requires faithful Web UI reproduction
  next. This checkpoint does not modify the Web runtime.

## 2026-08-29

### Web

- Removed repeated name, training stage, and affiliation introductions from all
  three author biographies because those details already appear in each card
  header.
- Limited the initial editorial update list to the five newest entries and
  added an accessible control to reveal all entries or return to the latest
  five.
- Added route-specific search metadata, canonical URLs, social previews, and
  Schema.org data for the home page, article index, and all five procedure
  guides.
- Added crawlable HTML entry documents, `robots.txt`, and `sitemap.xml` while
  keeping client-side metadata synchronized after in-app navigation.
- Added the search-discovery release to "Updates from the editorial team" in
  the same isolated SEO pull request.
- Linked Shinya Yamaguchi's author card to his public portfolio.
- Added a full-screen procedure transition using the existing logo and dark
  concept palette. Procedure content and the Three.js scene mount behind it;
  the overlay remains for at least 500 ms, closes after initial scene readiness,
  and has a 1,500 ms fallback.
- Added the portfolio link, branded scene preparation, responsive procedure
  control redesign, and interactive model behavior to "Updates from the
  editorial team".
- Made the About us and Authors links move to their home-page sections from
  both the home page and internal routes, accounting for the fixed navigation
  bar and reduced-motion preferences.

### Documentation

- Added the Web search-discovery contract and post-deployment Search Console
  checklist.
- Added the author-profile and editorial-update contracts to `web/README.md`.
- Established this changelog as the completion record for Web features.

## 2026-08-28

### Web

- Made orbit, zoom, and two-finger pan continuously available on procedure
  models without a separate interactive mode.
- Synchronized explanation snapping with forward and reverse scene transitions,
  including queued input during motion.
- Redesigned responsive procedure controls as a docked desktop panel and a
  resizable mobile carousel with an integrated collapse handle, compact progress
  controls, and a recoverable stowed state.
- Kept procedure navigation transparent and non-interactive after closing or
  stowing it, while preserving an explicit reopen path.

### Documentation

- Consolidated the shipped Web interaction behavior in `web/README.md`.
