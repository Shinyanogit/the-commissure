# Changelog

User-visible changes are recorded when the implementation, verification, and
its source-of-truth documentation are ready in the same pull request.

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
