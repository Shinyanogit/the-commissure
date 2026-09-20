# App Store Screenshot Art Direction

Status: production composition pending final candidate captures
Last updated: 2026-09-20

## Governing principle

The App Store media is a series of four independent product images. A viewer
must understand each image on its own. Shared palette, lighting, margins, and
typography make the series coherent. No element may require the neighbouring
image to be visible in order to work.

Native screenshots are visual source material, not four equal cards and not a
single unmodified strip. Every screenshot crop must reveal a different product
moment.

## Reference implementation

The Vocabry App Store panorama was not generated from a Figma Make prompt. Its
source is a fixed React canvas in
`英単語帳アプリ/store_assets/feature_graphic_src/src/AppPanorama.tsx`, rendered
with Puppeteer and split with Sharp in `capture_4split.mjs`. Its wide master
contains a restrained unifying V motif, but each resulting screenshot has an
independent role: brand introduction, primary product surface, feature moment,
and second product surface.

The Commissure follows that production method without copying Vocabry's visual
language. A copy of the Vocabry source was made first, then adapted under
`ios/app-store-materials/source`. Its active canvas is
`src/AppPanorama.tsx`; `npm run capture:iphone` renders the review master and
deterministically exports four `1320 × 2868 px` images. Figma Make may be used
for exploration only. It is not a source of final App Store composition.

## The Commissure four-image story

| Image | Role | Primary visual | Screenshot material |
| --- | --- | --- | --- |
| 1 | Brand and scope | App icon, wordmark, and dark blue spine field | None or a small Library detail only |
| 2 | Direct anatomy | Warm cervical 3D anatomy on the dark stage | Complete ACDF overview screen |
| 3 | Teaching clarity | Cyan keyword emphasis with readable translucent panel | Complete explanation screen |
| 4 | Procedural depth | A clearly distinct anatomy angle or procedure state | Complete following-step screen |

The first image can be almost entirely branding. Images two through four must
keep a complete, truthful native screen as their dominant visual. A very small
rotation is allowed only when it does not crop or compromise legibility.

## Design contract

- Derive all colors and materials from `docs/DESIGN_CONCEPT.md`, The Sterile
  Field: near-black stage first, warm anatomy second, cyan or teal as the
  restrained active accent.
- Treat all four exports as one continuous dark stage when viewed side by side:
  background tone, ambient light, and a restrained cyan guide may cross export
  boundaries without introducing visible panel seams. Each export must still
  work alone.
- Use the shipped blue spine only as a quiet Library texture in image 1. Never
  stretch, mirror, or repeat it across the series.
- Use broad negative space. The anatomy or explanation crop must have one clear
  focal point per image.
- Do not add generated anatomy, devices, people, patients, blood, hospital
  imagery, fake controls, or non-existent product UI.
- Any additional headline must be an exact visible product phrase or confirmed
  metadata claim. Do not add AI, diagnosis, medical-advice, accuracy, or
  outcome claims.
- Avoid device frames unless they reveal a device-specific interaction that the
  native screenshot itself cannot show.

## Production workflow

1. Capture final approved English and Japanese native states for iPhone and
   iPad. Include a genuinely different step or view for image 4.
2. Build fixed composition source under `ios/app-store-materials/source`.
3. Render a review master for each device and locale.
4. Inspect each individual crop at its native App Store size before splitting.
5. Export individual PNGs in the current Apple-accepted dimensions and confirm
   no alpha channel is present.

For the current iPhone 17 Pro Max source captures, each output is
`1320 × 2868 px`. The final iPad set will use its own fixed source and layout,
not a resized phone composition.

## Captured iPad source states

Fastlane successfully captured English and Japanese iPad Pro 13-inch (M5)
source states on 2026-09-20. Each locale has four `2064 × 2752 px` RGB PNGs
under `ios/app-store-materials/figma-input/ipad/en-US/` and
`ios/app-store-materials/figma-input/ipad/ja/`. They cover Library, ACDF
overview, ACDF explanation, and the following ACDF step. Both capture tests
completed with zero failures after the Fastlane child process was given the
Homebrew Ruby and bundled Gem executable paths.

These are truthful native source captures, not final artwork. Create the iPad
composition independently from the phone artwork before uploading the final
screenshots.

## Rejected approaches

- Figma Make output that treats the result as a responsive Web page, a phone
  mockup, a row of cards, or an undifferentiated single image.
- Four equal unedited full-screen captures joined side by side.
- A visual gesture, line, or logo that dominates every crop and prevents an
  individual screenshot from standing alone.
- Reusing the same ACDF overview state for multiple feature images.
