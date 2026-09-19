# Library still sources

The four preview images are PNG conversions of the corresponding tracked
`web/public/{acdf,accf,pcdf,pcf}snap.webp` files at upstream `af7e263`.
No anatomy or labels were generated. Content/provenance owner rights review
remains required for public native distribution.

## Home background and wordmark (2026-09-19)

`home-spine.imageset/spine.jpg` is a 1200 × 1600 static capture of the actual
Web home scene, initialized in an otherwise empty local browser viewport.
Source: `web/public/Spine Disection.glb`, rendered by
`web/src/scenes/index.js` with its original blue glass material, lighting,
and initial camera. The canvas was captured with Chromium and encoded as JPEG
at quality 85. It contains no UI, generated anatomy, or substitute illustration.
The image is bundled so the Library works offline without a second 3D runtime.

`wordmark.imageset/wordmark.png` is a byte-identical copy of
`web/public/logo.png`. No new logo was generated.

Source GLB SHA-256: `a45671a1604c5922d3bdaa182fd917ceea67acca348756533c7106a6b3e3e84b`
Home scene SHA-256: `12806400e36b8a881fd27792fb80e1335558b2988ec8ae01e1d75fcfc5f5107f`
Wordmark SHA-256: `126d377e8a57b551f3118e728bd945d2c1d8d8ecf67a82b78da291d524e4da71`
