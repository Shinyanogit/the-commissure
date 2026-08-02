# Phase 5R — Greenfield UI/UX Reset Decision

Status: accepted decision; 5R0/5R1A docs gate complete, design exploration not started
Date: 2026-08-02
Branch: `docs/ios-phase5r-design-reset`

## Decision

The Phase 5A/5B SwiftUI composition is not an acceptable visual baseline. The
next UI/UX pass starts from a blank composition in Claude Design/Figma, with a
design-specialist model choosing the screen structure before Opus 5 writes
SwiftUI. The existing visual branch remains useful as plumbing evidence, but it
must not be incrementally polished or merged as the product's visual direction.

GPT Pro independently confirmed this Composition Reset. It adds one required
intermediate gate: a small interactive prototype must validate Theater,
Bottom Step Tray, and step transitions after static candidates and before any
production SwiftUI. This is a composition reset, not an architecture reset.
For implementation ownership, the product owner's explicit split controls the
GPT Pro suggestion: Opus 5 is the production visual author after the direction
gate, while Codex integrates and owns the underlying logic. A missing Opus
route pauses visual work instead of authorizing another Codex-led composition.

This is a reset of composition and visual implementation, not a rewrite of the
native domain, cache, content, or RealityKit foundation.

## Why the previous direction is superseded

The current shell was implemented directly from the brief because Opus routing
was unavailable. No divergent static compositions were produced, compared, or
selected before code was written. As a result, the implementation is a tidy
wireframe rather than a deliberately chosen procedure theater.

The independent Fable review identified structural mismatches with the approved
concept, including:

- cyan being used as ambient branding instead of only active state;
- a warm anatomy color being reused for a navigation/transfer state;
- card affordances not distinguishing open, cancel, download, and retry;
- the theater reading as stacked chrome over a scene rather than an anatomy-first
  operative field;
- fixture state being copied into view-local state, so tray and explanation
  variants cannot be reproduced from the `ViewState` contract alone.

These findings are evidence that the composition needs a new starting point,
not a longer list of local spacing or color patches.

## Rejected as visual baseline

The following remain in Git history for traceability but are not design evidence
for the release candidate:

- `ios/App/Features/Library/Views/LibraryView.swift`;
- `ios/App/Features/Theater/Views/ProcedureTheaterView.swift`;
- `ios/App/Features/Theater/Views/BottomStepTray.swift`;
- `ios/App/Features/Colophon/Views/ColophonView.swift`;
- `ios/App/Features/Colophon/Views/SettingsView.swift`;
- the placeholder anatomy-field composition;
- spacing/radius choices that were introduced only by the first shell;
- branch `feat/ios-phase5b-visual-refinement` as a visual-acceptance candidate.

The branch's signed iPad install and 23 app-test/3 UI-test result remain valid
plumbing evidence. They do not imply visual acceptance.

## Preserved contracts

The reset preserves and may extend, but must not casually rewrite:

- `docs/DESIGN_CONCEPT.md` and its 7:2:1, anatomy-first, less-is-more,
  icon-first, Bottom Step Tray, and MECE rules;
- `ViewState`, `AppAction`, localization keys, accessibility semantics, and
  deterministic preview fixtures;
- `CommissureCore`, `ContentStore`, `AssetStore`, `FoundationAppModel`,
  `ProcedureSessionController`, `RealitySceneAdapter`, gesture resolution,
  cache/download invariants, and content schemas;
- the `web/` and `content/` production boundaries;
- SwiftUI visual ownership: Opus may edit only the design system, feature views,
  and preview fixtures; Codex owns integration, logic, accessibility plumbing,
  tests, CI, and release preparation.

The physical-test content resolver and restricted-Markdown capability are
non-visual salvage candidates. They will be re-landed independently before the
visual branch is parked.

## Gates

1. Fable/GPT Pro challenge the reset roadmap and its state inventory.
2. A locked brief produces at least three deliberately divergent Theater
   compositions and one or two Library compositions using real anatomy stills;
   polishing the rejected shell does not count as divergence.
3. A Figma/ProtoPie-sized interactive prototype covers Theater, the three tray
   densities, and forward/back/direct step transitions.
4. Shinya selects one composition from the static and interaction evidence before
   production SwiftUI implementation begins.
5. The chosen composition covers the complete fixture matrix, including failure,
   offline, Japanese long strings, Dynamic Type, VoiceOver, Reduce Motion, and
   all three tray densities.
6. Opus 5 may create a disposable visual interpretation before implementation,
   then hand-writes the approved production SwiftUI in the visual allowlist;
   generated Figma/Claude code is reference-only and never enters the
   repository. Codex integrates and audits without redesigning the composition.
7. Codex verifies intent round-tripping, dependency direction, accessibility,
   performance, and exact iPad screenshots before Phase 5R closes.

## Implementation freeze until the direction gate

Until Gate 5 (the complete matrix and owner approval) passes, do not add or
polish SwiftUI composition, navigation, layout, or design-derived components.
Codex may continue non-visual foundation work, fixture definitions, validators,
tests, accessibility plumbing, and CI. Any visual change that becomes necessary
for a contract is recorded as an integration task rather than smuggled into the
design branch.

## Non-goals

The reset does not add onboarding, a generic tab bar, light-mode theming,
unshipped features, new backend infrastructure, or remote UI code. It does not
change medical content, procedure schemas, the Web application, or the native
cache delivery strategy.
