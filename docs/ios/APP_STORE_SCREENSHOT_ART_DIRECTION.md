# App Store Screenshot Art Direction

Status: ready for Figma Make composition after final screenshot approval
Last updated: 2026-09-20

## Goal

Create one connected App Store key visual for The Commissure. It must divide cleanly into four equal portrait screenshots, in the same spirit as the Vocabry listing reference.

The source images are real native-app captures. Keep the shipped user interface, model, procedure names, icons, and text unchanged. Figma Make may add only the quiet framing, crop, and shared visual rhythm needed to compose the sequence.

## Source package

The Figma input files are staged locally at `ios/app-store-materials/figma-input`:

| File | Use |
| --- | --- |
| `01-library.png` | First panel. Actual Library with the Web blue spine image. |
| `02-acdf-overview.png` | Second panel. ACDF model and overview panel. |
| `03-acdf-explanation.png` | Third panel. ACDF explanation with cyan keywords. |
| `04-acdf-next-step.png` | Fourth panel. Next reversible procedure step. |
| `app-icon.png` | Existing native AppIcon based on the Web favicon. |
| `wordmark.png` | Shipped The Commissure wordmark. |
| `home-spine.jpg` | Reference for the shipped blue spine used inside the native Library only. |

The input captures are simulator evidence only. Recapture them from the exact release build after visual approval before App Store Connect upload.

## Required composition

- Create one flat `5280 × 2868 px` composition. It comprises four adjacent `1320 × 2868 px` zones, matching the supplied iPhone captures exactly. Add nonexporting vertical guides at 1320, 2640, and 3960 px.
- Do not create device frames or phone mockups. Place each supplied native screenshot at full size within its corresponding zone. Keep the system status bar and visible app controls.
- Panel 1 leads with the blue spine Library scene. Panels 2 through 4 move into the same ACDF learning session: model overview, explanation, then next step.
- Use a continuous near-black background behind all four panels. Let a restrained cyan and teal field continue subtly across panel boundaries. Keep `home-spine.jpg` inside panel 1 only. Do not stretch, mirror, tile, or use it as the wide composition background. Do not place a large headline, feature claim, badge, or decorative copy over the screenshots.
- Preserve the 7:2:1 balance from `docs/DESIGN_CONCEPT.md`: dark stage first, warm anatomy second, cyan or teal only for active emphasis.
- The result should feel like a calm clinical editorial spread, not a game, advertisement, operating-room photograph, or AI render.

## Figma Make prompt

```text
Create one flat 5280 by 2868 pixel App Store key visual for an educational iOS app called The Commissure. Use the supplied app screenshots as immutable source content. Divide the wide composition into four adjacent 1320 by 2868 pixel zones. Add nonexporting vertical crop guides at x=1320, x=2640, and x=3960. The result must be ready to split into four independent App Store screenshots without resizing or reflowing any native UI.

Art direction: The Sterile Field. Use a near-black surgical theater background, a restrained cyan and teal field that flows subtly across the four artboards, and warm bone-colored anatomy as the visual focal point. Maintain a 7:2:1 ratio: seven parts dark quiet stage, two parts warm anatomy, one part cyan or teal active accent. The tone is calm, precise, clinical, and editorial.

Panel one uses 01-library.png and must visibly retain the native Library, the blue spine hero image, all four procedure cards, and the actual app wordmark. The supplied home-spine.jpg is reference for this first panel only. Do not stretch, mirror, tile, or continue it across the wide composition. Panel two uses 02-acdf-overview.png and centers the ACDF model with its native translucent overview panel. Panel three uses 03-acdf-explanation.png and keeps the cyan keyword emphasis and readable explanation panel. Panel four uses 04-acdf-next-step.png and shows the following procedure step, conveying a reversible learning sequence.

Use only the supplied screenshots, app icon, wordmark, and blue spine asset. Do not generate anatomy, devices, surgical scenes, extra controls, or text. Do not alter visible UI copy, procedure names, model geometry, colors, or the relative layout inside the supplied screenshots. Do not add claims such as AI, medical advice, diagnosis, clinical accuracy, or outcomes. No people, patients, blood, instruments, hospital imagery, gradients that reduce readability, device frames, or phone mockups. The screenshots themselves must remain the dominant readable content.
```

## Export handoff

Export the flat key visual as a PNG, then split it at the three crop guides into four 1320 by 2868 pixel PNGs without rounded corners or borders. Keep English and Japanese as separate localized sets. Confirm that every visible product claim and UI state exists in the approved release build.

## Review checklist

- The blue spine is the shipped Web-derived asset, never generated anatomy.
- All four procedure cards remain legible in the Library capture.
- The 3D model and explanation panels remain readable at native size.
- No copy or feature appears that is absent from the app.
- Each locale uses screenshots captured from that locale.
- The final export is based on the signed release candidate, not this simulator evidence set.
