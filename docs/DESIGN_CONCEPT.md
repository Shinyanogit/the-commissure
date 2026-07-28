# The Commissure — Design Concept

Status: approved design contract for Web, iOS, and App Store materials
Concept name: **The Sterile Field**
Last updated: 2026-07-28

This is the visual and interaction source of truth. Product specifications may
add detail, but they must not silently redefine this document.

## 1. One-sentence concept

The anatomy is the operative field, the bottom controls are the instrument
tray, and the prose is one instructor speaking one step at a time.

The interface should feel clinical, warm, calm, and editorial. It must never
compete with the anatomy for attention. The native app is not a website placed
inside a shell; it is a focused, tactile procedure theater built around the 3D
model.

## 2. Principles

1. **Anatomy first.** The model is the primary content. Navigation, labels, and
   transitions support it and recede when not needed.
2. **Less is more.** Show the current decision and the next useful action. Do
   not expose every feature at once.
3. **One step, one voice.** A procedure step has one title, one concise body,
   and one canonical scene state. Long reference material belongs in a sheet,
   not over the operative field.
4. **The bottom edge carries progress.** The thumb-reachable bottom tray is the
   persistent location for step position and step movement. It is contextual,
   not a generic tab bar.
5. **Motion explains anatomy.** Animation may reveal resection, correction, or
   instrumentation. Decorative motion is omitted.
6. **Direct manipulation is optional, never required.** Flick, drag, and pinch
   accelerate exploration, while visible controls and accessibility actions
   always provide an equivalent path.
7. **Performance is part of the aesthetic.** Immediate feedback, stable frame
   pacing, and predictable transitions are design requirements.
8. **The screen is MECE.** Navigation, subject, explanation, progress, and
   utilities each have one owner and one visual region. The same fact or action
   is not repeated in multiple bars, cards, or overlays.

## 3. Information architecture

The native app has three conceptual spaces, but does not render them as three
permanent tabs:

- **Library** — procedure selection and download state.
- **Procedure Theater** — the active 3D walkthrough.
- **Colophon** — purpose, authors, sources, educational disclaimer, licenses,
  and acknowledgements; opened as a quiet secondary destination.

The old literal `Others / Select / Explanation` tab concept is retired. It
duplicates hierarchy and consumes the most valuable mobile edge. The bottom
edge instead adapts to the current task.

### Library

- Brand mark, one-line purpose, and the available procedures.
- Cards show procedure name, one still image, availability, and download size
  only when a network download is required.
- No auto-playing 3D hero. The first meaningful choice must appear immediately.
- About and settings are secondary toolbar actions, not peers of the procedures.

### Procedure Theater

- Full-bleed 3D field.
- A compact top bar provides icon-first Library/back and reset actions around a
  single procedure identity.
- A single explanation panel shows only the active step. It may collapse to
  maximize the model but must remain discoverable.
- The **Bottom Step Tray** provides previous, progress/step selection, and next.
  It communicates position without becoming a row of tiny mystery dots.

### Bottom Step Tray

The tray is one component with three density modes. Its actions use familiar
icons and shape/position rather than persistent text labels:

- **Compact:** previous, `current / total`, next.
- **Expanded:** compact controls plus titled step scrubber.
- **Minimal:** progress and a clear expand affordance while the user manipulates
  the model.

It sits inside the safe area, uses a dark translucent material, and applies the
cyan accent only to the current state or immediate primary action. It never
contains unrelated destinations. Icon-only controls still carry localized
accessibility labels, hints, keyboard equivalents, and pointer help.

### MECE screen ownership

| Information class | Sole owner | Never duplicated in |
|---|---|---|
| Destination/back/reset | Top bar icons | Step tray or explanation |
| Anatomical subject/state | 3D field | Decorative thumbnails or repeated diagrams |
| Current teaching point | Explanation panel | Top bar or transient toast |
| Step position/movement | Bottom Step Tray | Top bar or body prose |
| Download/compatibility | Library card/status presentation | Procedure controls after readiness |
| Sources/authors/settings | Colophon or settings sheet | Primary procedure chrome |

Progressive disclosure is allowed; duplication is not. A collapsed panel and
its expanded form are two presentations of the same owner, not two simultaneous
copies.

## 4. Fixed perceptual color hierarchy — 7:2:1

Every principal screen and every App Store screenshot follows a fixed
perceptual hierarchy:

| Share | Role | Source palette | Rule |
|---:|---|---|---|
| 7 | Dark stage | black to near-black; restrained translucent surfaces | Holds negative space and visual quiet. |
| 2 | Warm anatomy | bone `#F0E6D4`, disc `#F2E9E4`, ligament `#F5F2EB`, cord `#BD9C46`, nerve `#FFDB58`, muted metals | Carries the educational subject. |
| 1 | Active accent | cyan `#00FFFF`, with teal `#009B9E` only where depth is needed | Marks current state, focus, progress, and primary action. |

This is a perceptual composition rule, not a requirement to count exact pixels.
White is a legibility layer for text and symbols and is not a fourth brand
color. Pure red is not a brand accent; use semantic system red only for a real
error or destructive warning. Medical emphasis in prose uses typography before
color.

### Contrast guardrails

- Cyan never decorates inactive chrome.
- Warm anatomical colors are not reused for navigation states.
- Text over 3D receives a local dark scrim or material-backed surface. The Web
  glow treatment must not be copied so strongly that native text blooms.
- Light and dark accessibility contrast is measured on the rendered composite,
  not on token values in isolation.

## 5. Typography and iconography

- **Interface and reading:** the iOS system font with Dynamic Type. Clinical
  readability and accessibility take priority over matching every Web glyph.
- **Display/brand:** version 1 defaults to the system font. Maven Pro may be used
  sparingly for the wordmark or large procedure titles only after its App Store
  redistribution rights and size/legibility cost are verified.
- Titles are sentence case. Acronyms retain their conventional uppercase form.
- Primary navigation and manipulation controls use recognizable SF Symbols with
  consistent weight. Custom icons are allowed only for anatomy- or brand-
  specific meaning that SF Symbols cannot express.
- UI meaning is conveyed visually through icon, position, enabled state, motion,
  and selection—not a row of written button labels. Text remains where language
  itself is the content: procedure names, teaching prose, size/error detail, and
  an unfamiliar or safety-critical choice.
- Every icon-only control has a localized accessibility label and hint. Pointer
  hover help and a first-use gesture coach may reveal text without permanently
  occupying the interface.

## 6. Motion

- Step changes animate from the current presentation state to an absolute,
  canonical target state. Relative cumulative transforms are prohibited.
- Camera and anatomical changes share a deliberate choreography, but the UI
  acknowledges input immediately.
- A new step request cancels/rebases the current transition instead of waiting
  behind a fixed lockout.
- Direct manipulation follows the finger with no ornamental easing.
- With Reduce Motion, apply the canonical scene state immediately and use only
  a short crossfade where needed for comprehension.
- Haptics are subtle and limited to a committed step change, reset, or error.

## 7. Gesture language

Gesture interpretation is capability-based and input-method independent:

- Vertical flick: previous/next step when step navigation owns the gesture.
- One-finger drag: orbit after direction locking identifies a spatial gesture.
- Pinch: zoom within authored limits.
- Leading-edge swipe: system back; the app does not steal it.
- Tap: controls and entity annotations before scene gestures.

Buttons, keyboard commands, pointer input, and VoiceOver actions dispatch the
same intents. Gesture thresholds belong to one resolver, not to individual
screens or 3D scenes.

## 8. Accessibility and localization

- All essential actions are available without gestures.
- The model exposes a concise accessibility summary and adjustable actions for
  step, orbit, and zoom; the explanation remains normal readable text.
- Dynamic Type may enlarge or scroll the explanation without covering the
  bottom tray.
- VoiceOver order follows title → explanation → step controls → secondary
  controls.
- English and Japanese UI and procedure content are switchable in-app and use
  identical stable localization keys. The current website prose is the initial
  English source; Japanese is a reviewed translation with key parity. Scene
  files never embed HTML or user-facing prose.
- Color is never the only state signal.

## 9. Store-material rule

App icon, screenshots, preview video, and feature graphics derive from this
document and may show only shipped UI, assets, and functionality. Their dominant
composition must preserve the same 7:2:1 hierarchy.

## 10. Review checklist

A design change is acceptable only if all answers are yes:

- Does the anatomy remain the visual hero?
- Is the bottom edge used for the current procedure task rather than generic
  navigation?
- Does the screen preserve the dark / warm anatomy / cyan hierarchy?
- Is every gesture mirrored by a visible or accessible action?
- Does motion explain a state change and remain interruptible?
- Does the result still work with large text, Reduce Motion, and cached/offline
  content?
- Does each visible fact/action have exactly one owner, with no information
  category omitted or duplicated?
- Are routine actions understandable from icon, position, and state without
  permanent written button labels?
