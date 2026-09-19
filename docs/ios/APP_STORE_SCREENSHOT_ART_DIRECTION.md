# App Store Screenshot Art Direction

Status: ready for Figma Make composition after final screenshot approval
Last updated: 2026-09-20

## Goal

Create four connected portrait App Store screenshots for The Commissure. The four frames should read as one horizontal editorial sequence when viewed in the store carousel, in the same spirit as the Vocabry listing reference. Each frame must still stand on its own at App Store screenshot size.

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
| `home-spine.jpg` | Shipped blue spine image used by the native Library. |

The input captures are simulator evidence only. Recapture them from the exact release build after visual approval before App Store Connect upload.

## Required composition

- Create four separate portrait artboards, each using the native screenshot as its central, readable content. Keep the system status bar and visible app controls.
- Place the four artboards side by side on one Figma page so the common canvas reads as a single wide visual. Export the four artboards individually.
- Panel 1 leads with the blue spine Library scene. Panels 2 through 4 move into the same ACDF learning session: model overview, explanation, then next step.
- Use a continuous near-black background behind all four panels. Let the cyan and teal field continue subtly across panel boundaries. Do not place a large headline, feature claim, badge, or decorative copy over the screenshots.
- Preserve the 7:2:1 balance from `docs/DESIGN_CONCEPT.md`: dark stage first, warm anatomy second, cyan or teal only for active emphasis.
- The result should feel like a calm clinical editorial spread, not a game, advertisement, operating-room photograph, or AI render.

## Figma Make prompt

```text
Create a four-artboard App Store screenshot composition for an educational iOS app called The Commissure. Use the supplied app screenshots as immutable source content. Arrange four tall portrait artboards side by side so they form one continuous horizontal editorial scene while remaining exportable as four independent App Store screenshots.

Art direction: The Sterile Field. Use a near-black surgical theater background, a restrained cyan and teal field that flows subtly across the four artboards, and warm bone-colored anatomy as the visual focal point. Maintain a 7:2:1 ratio: seven parts dark quiet stage, two parts warm anatomy, one part cyan or teal active accent. The tone is calm, precise, clinical, and editorial.

Panel one uses 01-library.png and must visibly retain the native Library, the blue spine hero image, all four procedure cards, and the actual app wordmark. Panel two uses 02-acdf-overview.png and centers the ACDF model with its native translucent overview panel. Panel three uses 03-acdf-explanation.png and keeps the cyan keyword emphasis and readable explanation panel. Panel four uses 04-acdf-next-step.png and shows the following procedure step, conveying a reversible learning sequence.

Use only the supplied screenshots, app icon, wordmark, and blue spine asset. Do not generate anatomy, devices, surgical scenes, extra controls, or text. Do not alter visible UI copy, procedure names, model geometry, colors, or the relative layout inside the supplied screenshots. Do not add claims such as AI, medical advice, diagnosis, clinical accuracy, or outcomes. No people, patients, blood, instruments, hospital imagery, gradients that reduce readability, or phone mockups that cover the UI. The screenshots themselves must remain the dominant readable content.
```

## Export handoff

Use current App Store Connect screenshot dimensions for the selected device class. Export a separate PNG for each artboard, without rounded image corners or borders. Keep English and Japanese as separate localized sets. Confirm that every visible product claim and UI state exists in the approved release build.

## Review checklist

- The blue spine is the shipped Web-derived asset, never generated anatomy.
- All four procedure cards remain legible in the Library capture.
- The 3D model and explanation panels remain readable at native size.
- No copy or feature appears that is absent from the app.
- Each locale uses screenshots captured from that locale.
- The final export is based on the signed release candidate, not this simulator evidence set.
