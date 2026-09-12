# Web UI parity: implementation entry points

Recorded 2026-09-12 from the local Web source at `origin/main` (`af7e263`).
This is the next-work map, not a completed UI or a new visual concept. The owner
requires faithful Web UI reproduction before native refinements. Existing Web
source and deployment remain untouched.

## Reference map

| Web source | Behavior to reproduce | Native boundary to preserve |
|---|---|---|
| `web/src/pages/ProcedurePage.jsx` | Full-screen scene, responsive explanation dock, active-step carousel, resize/collapse/reopen, synchronized prose and scene navigation | `ProcedureTheaterView`, presentation state and `AppAction`; the scene session stays authoritative |
| `web/src/components/ProcedureNav.jsx` | Brand/home identity, procedure menu, menu closes when explanation is stowed | Native navigation presentation; retain the four original native procedures |
| `web/src/styles/procedure.css` | Panel proportions, translucency, borders, typography, spacing, orientation/breakpoint behavior, stowed chrome | Design tokens and layout; do not use the rejected native preview as reference |
| `web/src/scenes/updateProcedureCameraView.js` | Camera framing responds to the visible explanation panel | Scene viewport contract; preserve canonical procedure camera state and user camera adjustment |
| `web/src/components/ProcedureLoadingScreen.jsx` | Actual branded scene preparation | Scene readiness signal; no implementation-status copy in product UI |

The current Web navigation also lists open-door PCL. Visual parity does not
silently add its content or an empty menu item to the four-procedure native 1.0.

## Camera framing is part of UI parity

The Web implementation reads the open explanation panel bounds. In portrait it
sets a vertical camera view offset of half the panel height; in landscape it
sets a horizontal offset of half the panel width. Closing the panel clears the
view offset. Panel visibility and resizing notify the scene of layout changes.

Consequently, matching panel colors and positions alone is insufficient. The
same selected anatomical region must remain visible in the remaining field when
opening, resizing, stowing or rotating the explanation panel. Define a native
viewport/inset input at the view-to-runtime boundary instead of placing
procedure-specific camera mutations in SwiftUI. Establish the exact native
projection behavior through render comparison before choosing the implementation.

## First implementation sequence

1. Run the current Web checkout locally, without modifying it. Capture and
   actively operate ACDF and PCDF at matching iPhone/iPad viewport sizes, in
   portrait and landscape: open, collapsed/stowed, reopened, resized and menu
   states, plus first, middle and last steps. Save viewport, locale and step IDs.
2. Compare actual rendered compositions with native at the same state. Record
   control ownership, panel bounds, text wrapping, anatomy framing and motion.
   Source inspection alone does not establish rendered parity.
3. Reproduce the explanation dock/carousel and navigation composition in native
   presentation code, including their collapsed states. Keep the canonical
   domain, model lifecycle, persistence, localization and signed delivery layers.
4. Connect panel bounds to native scene framing. Verify rotation, re-entry and
   language changes without scene reload, duplicate entities or step reset.
5. Only after the Web baseline matches, adjust safe areas, touch targets,
   accessibility and Dynamic Type. Record each justified platform adaptation.
   Retain the shared Sterile Field hierarchy and avoid duplicate controls.

## Acceptance evidence

- Paired screenshots of the actual Web and native runtime, with exact viewport,
  locale, procedure, step and panel state; no synthetic anatomy mockups.
- Active interaction checks for forward/reverse/direct selection, panel
  resize/stow/reopen, orbit/zoom/reset, menu and portrait/landscape changes.
- Anatomy remains correctly framed as the panel changes size; text and model
  represent the same selected step through interrupted transitions.
- Native behavioral regressions remain passing independently of layout.
- Independent functional and visual review after a new frozen checkpoint.
  The previous provisional UI and source-only inspection are not acceptance.

See `SESSION_HANDOFF_2026-09-12.md` for the other open engineering/release gates.
