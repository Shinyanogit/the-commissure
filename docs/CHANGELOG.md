# Changelog

User-visible changes are recorded when the implementation, verification, and
its source-of-truth documentation are ready in the same pull request.

## 2026-08-29

### Web

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
