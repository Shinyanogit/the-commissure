# Claude Design Brief — The Sterile Field (iOS)

Status: Phase 5R v2 reset brief, Codex-frozen for static/interactive reference generation
Date: 2026-08-02
Authority: [`DESIGN_CONCEPT.md`](../DESIGN_CONCEPT.md)
Implementation target: SwiftUI on iOS/iPadOS 18+

This brief turns the approved product concept into a bounded visual handoff.
It is the input for Claude Design/Figma reference generation, the interaction
prototype, and the later Opus 5/Codex visual translation. It does not replace
the approved design concept, the product specification, or the domain
contracts.

## 1. Product sentence and visual stance

The anatomy is the operative field, the bottom controls are the instrument
tray, and the prose is one instructor speaking one step at a time.

The native app is a focused, tactile procedure theater—not a Web page inside a
shell. The 3D anatomy is the visual hero. Chrome is calm, clinical, warm, and
editorial; it appears when useful and recedes when the learner is inspecting
the model. Less is more means showing the current decision and the next useful
action, not hiding essential actions behind an unexplained gesture.

## 2. Authority and handoff boundaries

The following order is binding:

1. `docs/DESIGN_CONCEPT.md` defines the visual and interaction source of truth.
2. This brief defines the Phase 5 visual inventory, tokens, fixtures, and
   acceptance checks derived from that source.
3. Claude Design creates static visual references and component variants from
   this brief. It is not a code generator or a runtime dependency.
4. After the direction and matrix gates, Opus 5 hand-writes the production
   SwiftUI views and visual components from the approved references in the
   allowlisted directories below. This is the product owner's explicit
   division: Opus owns the visual layer; Codex owns the underlying system.
5. Codex owns state projection, intent dispatch, RealityKit, file/network work,
   localization plumbing, performance, tests, CI, and integration. Codex may
   enforce dependency and accessibility boundaries or request a visual change,
   but must not redesign the approved composition. If Opus is unavailable, the
   visual phase pauses; Codex must not silently become the visual author again.

### 2.1 Phase 5R reset workflow

The previous Phase 5A/5B composition is plumbing evidence only. It is not a
candidate to polish, trace, or use as the default layout. The design work must
produce at least three materially different Theater compositions and one or two
Library compositions with real shipped anatomy stills. A candidate that merely
changes spacing, radii, typography, or color in the rejected shell is not
divergent.

Static candidates are followed by a disposable Figma/ProtoPie-scale interaction
prototype covering the Theater, compact/expanded/minimal Bottom Step Tray, and
forward/back/direct step transitions. Shinya selects the direction from both
static and interaction evidence before any production SwiftUI composition is
written. The selected direction then receives the complete fixture matrix.

Claude Design/Figma exports, Dev Mode code, and model-generated SwiftUI are
reference artifacts only. They are not copied into the production target or
made runtime dependencies. Opus 5 may use a disposable reference implementation
to expose translation ambiguities, but the final production visual layer is
hand-written by Opus in the allowlist. Codex integrates that visual layer from
the approved specification and existing presentation contracts; mechanical
boundary repairs are allowed, visual reinterpretation is not.

Until the matrix and direction gate pass, visual SwiftUI changes are frozen.
Codex may continue non-visual fixtures, validators, accessibility plumbing,
tests, CI, and domain/RealityKit/cache work, but a visual need that crosses a
boundary is recorded as an integration task rather than hidden in a view.

Claude Design exports must contain only shipped UI, real content, real SF
Symbols, and states represented by the fixture contract. No fictional feature,
screen, asset, or store claim may appear in a reference or App Store material.

## 3. Fixed visual tokens

### 3.1 Perceptual hierarchy

Every principal screen uses the 7:2:1 composition as a perceptual guardrail:

| Share | Role | Allowed visual material |
|---:|---|---|
| 7 | Dark stage | black/near-black field, restrained translucent surfaces, negative space |
| 2 | Warm anatomy | authored ivory, disc, ligament, gold cord, yellow nerve, muted metals |
| 1 | Active accent | cyan for current/focused/primary state; teal only for depth support |

This is not a pixel-count test. Text remains a legibility layer. Pure red is
reserved for a real error or destructive warning, never decoration.

### 3.2 Color tokens

The eventual SwiftUI token file must be the machine-readable implementation
source. These values are derived from the approved concept and must not be
reinterpreted per screen:

| Token | Value | Use |
|---|---|---|
| `stage.black` | `#050607` | full-bleed theater/library background |
| `stage.surface` | `#101416` | quiet material-backed panels |
| `stage.scrim` | black 0.80 | local text legibility over anatomy |
| `text.primary` | white | readable titles/body and symbols |
| `text.secondary` | white 0.68 | metadata and secondary explanation |
| `accent.cyan` | `#00FFFF` | active step, focus, progress, primary action |
| `accent.teal` | `#009B9E` | restrained depth/glass support |
| `anatomy.bone` | `#F0E6D4` | bone |
| `anatomy.disc` | `#F2E9E4` | disc |
| `anatomy.ligament` | `#F5F2EB` | ligament |
| `anatomy.cord` | `#BD9C46` | spinal cord/medulla |
| `anatomy.nerve` | `#FFDB58` | nerve root |
| `anatomy.metalMuted` | authored muted metal | plates, spacers, screws |

Cyan is never used for inactive chrome. Warm anatomy colors are not reused as
navigation state colors. Contrast is evaluated on the rendered composite with
the model behind it, not on isolated token swatches.

### 3.3 Type, spacing, and material

- Use the iOS system font and Dynamic Type for all interface and reading text.
  Maven Pro remains optional for a wordmark/title only after redistribution
  rights and size cost are verified; it is not a dependency of the brief.
- Use sentence case for titles; preserve medical acronyms in uppercase.
- Use an 8-point spacing grid and safe-area-aware layout. Prefer a small set of
  shared spacing/radius/material tokens over per-view constants.
- Panels use dark translucent material with a local scrim where needed. Avoid
  the Web's strong glow treatment; symbols and text must remain crisp rather
  than blooming over the 3D field.
- Corner radii, shadow, and blur are subordinate to the anatomy and must not
  create a second visual subject. Reduce Motion removes decorative movement.

## 4. Screen inventory and MECE ownership

There are three conceptual destinations, not three permanent tabs:

| Screen/region | Sole owner | Required content | Must not contain |
|---|---|---|---|
| Library | acquisition and compatibility | procedure cards, availability, size only when a transfer is required | step progress, duplicate teaching prose |
| Theater top bar | destination and reset | icon-first back/library, one procedure identity, reset | step navigation, repeated explanation |
| 3D field | anatomical subject/state | full-bleed RealityKit surface and manipulation affordance | download controls, duplicate titles |
| Explanation panel | current teaching point | one active step title/body and optional collapse affordance | global destination, step scrubber |
| Bottom Step Tray | step position and movement | previous/current/next, progress, direct selection when expanded | settings, sources, generic tab labels |
| Colophon/settings | sources and preferences | authors, licenses, disclaimer, language/settings | procedure navigation chrome |

If a fact or action appears in two regions, remove the duplicate rather than
adding another label. Progressive disclosure is allowed when the owner stays
the same.

## 5. Component and state brief

### 5.1 Library

The first meaningful choice appears without waiting for a catalog refresh. Each
card shows the procedure name, abbreviation, one-sentence purpose, one real
still/placeholder from shipped content, and one availability state. Network size
appears only for content that is not already installed. A card may show:

- bundled/ready: open immediately;
- ready from cache: open without transfer;
- available to download: explicit size and one download action;
- downloading/verifying: progress, cancel, and honest current phase;
- unavailable/offline: reason and one relevant recovery action;
- incompatible/failed: concise reason and retry/update action.

No auto-playing 3D hero, account prompt, or generic spinner is part of this
brief.

### 5.2 Procedure Theater

The theater is full-bleed and opens at the compatible persisted step or step 1.
The explanation remains one active voice. The model, prose, and progress are
projected from the same `ViewState`; a view never resolves content or searches
RealityKit entities.

The top bar is compact and visually quiet. The explanation may collapse to
maximize the field, but the collapsed state remains discoverable. Reset returns
to the current canonical camera and zero user adjustment.

### 5.3 Bottom Step Tray density modes

The tray is a single safe-area component with three density modes:

- **Compact:** previous, `current / total` progress, next.
- **Expanded:** compact controls plus titled direct step selection.
- **Minimal:** progress plus a clear expand affordance while the learner
  manipulates the model.

It uses dark translucent material. Cyan marks only the current state or the
immediate primary action. Previous/next remain visible or one explicit
expansion away. The tray never becomes `Others / Select / Explanation` tabs.

### 5.4 Visual fixture contract

Codex supplies deterministic preview fixtures before Opus 5 writes views. A
fixture is a presentation projection, not a domain model, and includes at least:

- locale (`en` or `ja`) and layout direction;
- procedure identity, title, current step index/total, and progress;
- one active explanation title/body/accessibility summary;
- tray density and previous/next enabled state;
- scene readiness (`preparing`, `ready`, `transitioning`, `failed`);
- library card availability/download state and measured size when relevant;
- reset/back/expand capabilities and accessibility action labels;
- Dynamic Type category, Reduce Motion, VoiceOver, pointer, and orientation
  preview traits.

Required reference fixtures are: Library with four cards, Theater compact,
Theater expanded, Theater minimal, preparing/failed download states, EN/JA
locale switch with unchanged step, Colophon/settings, maximum Dynamic Type,
VoiceOver focus order, Reduce Motion, iPad landscape, and iPhone portrait.

## 6. Icon-first language

Routine actions use familiar SF Symbols, position, enabled state, selection,
and motion. Text is retained for procedure/content prose, exact sizes, errors,
unfamiliar choices, and safety/consent decisions.

| Semantic action | Default symbol family | Accessibility key shape |
|---|---|---|
| library/back | `chevron.backward` / `books.vertical` | localized destination/back label and hint |
| reset | `arrow.counterclockwise` | localized reset label and hint |
| previous/next | `chevron.left` / `chevron.right` | localized step movement label |
| expand/collapse | `chevron.up` / `chevron.down` | localized tray disclosure label |
| download/retry/cancel | `arrow.down.circle` / `arrow.clockwise` / `xmark` | localized transfer phase label |
| language/settings/about | `globe` / `gearshape` / `info.circle` | localized destination label |

Symbols may be replaced only when a real anatomy-specific meaning cannot be
expressed by SF Symbols. Every icon-only control has localized English and
Japanese labels/hints, pointer help, keyboard equivalent where applicable, and
an accessible action path independent of the gesture resolver.

## 7. Motion and interaction constraints

- Scene changes are absolute, idempotent, and interruptible; the view does not
  own a relative timeline or a gesture threshold.
- Direct manipulation follows the finger. Decorative parallax, autoplay, and
  ornamental easing are omitted.
- Vertical down advances and up goes back. Horizontal one-finger drag orbits;
  pinch zooms. Visible buttons, keyboard/pointer, and VoiceOver actions dispatch
  the same intents.
- The system leading-edge back gesture remains available; the app does not
  steal it. Two-touch recognition gives pinch priority and cancels an undecided
  one-finger drag.
- With Reduce Motion, apply the canonical target immediately and use only a
  short comprehension crossfade where necessary. Haptics are subtle and limited
  to a committed step, reset, or genuine error.

## 8. Responsive and accessibility acceptance

- iPhone portrait and iPad portrait/landscape share one information hierarchy;
  wider screens add breathing room, not a second navigation system.
- The bottom tray stays inside the safe area and never covers explanation text
  at maximum Dynamic Type. Large text may scroll the explanation within its own
  owner region.
- VoiceOver order is title → explanation → step controls → secondary controls;
  the model exposes a concise summary and adjustable step/orbit/zoom actions.
- Color is never the only state signal. Focus, selection, disabled state,
  labels, and position remain distinguishable without cyan.
- Pointer hover and keyboard shortcuts reveal help without permanently adding
  written button chrome.

## 9. Claude Design deliverables

The first design pass should produce at least three deliberately divergent
static Theater compositions and one or two Library compositions for:

1. Library card and all acquisition states.
2. Theater shell with compact/expanded/minimal Bottom Step Tray.
3. Explanation collapse/expand and loading/failure presentation.
4. Colophon/settings and locale control.
5. EN/JA, Dynamic Type, VoiceOver, Reduce Motion, iPhone, and iPad variants.

After static review, produce a disposable interaction prototype for the
Theater, tray density changes, and forward/back/direct step transitions. The
prototype is not a production navigation model; it exists to test ownership,
discoverability, and state transition comprehension before implementation.

Each reference must list the token names used, component/state name, viewport,
and the fixture state it represents. Exported screenshots are review evidence;
the repository's SwiftUI token file and fixture definitions remain the source
for implementation. The active DesignSync project is `The Commissure — Sterile
Field iOS` (`dfa74f8d-774a-4b68-b35e-ee6ba5700e3d`), with this brief synced at
`brief/CLAUDE_DESIGN_BRIEF.md`. It is used incrementally for static references
and never as a wholesale code replacement.

## 10. Opus 5 ownership allowlist

Opus 5 may edit only:

- `ios/App/DesignSystem/**` — visual tokens and reusable SwiftUI components;
- `ios/App/Features/*/Views/**` — screen and component views;
- `ios/App/PreviewContent/**` — deterministic previews and fixtures.

Opus 5 is the production visual author only after the R2 direction/matrix gate.
Before that gate, any SwiftUI output is disposable reference material. Opus 5
must not edit view models, `FoundationAppModel`, `CommissureCore`,
`AssetStore`, `ContentStore`, `RealitySceneAdapter`, gesture classification,
localization loading, persistence, network/file access, project settings, CI,
or App Store metadata. Views must consume localized presentation values and
must not scatter `if locale == ...` branches, duplicate localization keys, or
embed user-facing English/Japanese literals. Any visual need that crosses this
boundary becomes a Codex integration task. Any Opus reference implementation
created before the direction gate is disposable and is never copied into the
production branch. Production acceptance is based on the approved Figma
specification, the fixture matrix, intent round-tripping, and physical-device
evidence—not on source-code similarity to a disposable reference.

## 11. Acceptance checklist

The visual pass is accepted only when all answers are yes:

- Does the anatomy remain the visual hero and the 7:2:1 hierarchy survive?
- Is the bottom edge a contextual step tray rather than generic tab chrome?
- Does every visible fact/action have exactly one MECE owner?
- Are routine actions understandable from icon, position, and state?
- Does every icon-only action have localized EN/JA accessibility metadata and a
  non-gesture equivalent?
- Do direct manipulation, Reduce Motion, Dynamic Type, VoiceOver, pointer,
  keyboard, portrait, landscape, and offline states remain usable?
- Does input acknowledge immediately, keep frame pacing stable, and use
  predictable interruptible transitions without decorative motion?
- Do all references show only shipped UI, real assets, and implemented states?
- Can Codex integrate the visual layer without importing domain or I/O logic into
  a view?

The brief is complete when Claude Design references can be generated without
inventing a screen, token, state, or feature. Visual acceptance still requires
Codex screenshot/device checks and remains distinct from the later App Store
review gate.
