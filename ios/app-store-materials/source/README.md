# The Commissure Store Artwork Source

This directory is a local copy of Vocabry's feature graphic source project. The original files remain untouched at `/Users/shinyyama/Documents/プログラミング/英単語帳アプリ/store_assets/feature_graphic_src`.

The active entry point is `src/AppPanorama.tsx`. It renders one fixed 5280 by 2868 master canvas, then `capture_4split.mjs` produces four independent 1320 by 2868 iPhone images. The master is a review aid only. Each exported image must stand on its own in App Store Connect.

## Inputs

`src/assets/commissure-*` contains only The Commissure app icon, wordmark, home spine artwork, and captured app screens. Do not add generated anatomy, features that are not in the app, or marketing claims that the shipped app cannot support.

## Generate App Store outputs

```sh
npm install
npm run build
npm run capture:iphone
npm run capture:ipad
```

Outputs are deliberately ignored by Git:

```text
../generated/iphone/combined.png
../generated/iphone/iphone_17_pro_max_01.png
../generated/iphone/iphone_17_pro_max_02.png
../generated/iphone/iphone_17_pro_max_03.png
../generated/iphone/iphone_17_pro_max_04.png
../generated/ipad/ipad_13_01.png
../generated/ipad/ipad_13_02.png
../generated/ipad/ipad_13_03.png
../generated/ipad/ipad_13_04.png
```

The capture script uses the locally installed Google Chrome by default. Override it only when required with `CHROME_PATH`.

`/ipad?screen=1` through `/ipad?screen=4` renders four independent iPad 13-inch canvases. It uses the captured iPad app screens as real product content and preserves the dark cyan visual system without pretending the files are segments of one image.

## Review status

The iPhone 6.5-inch outputs and iPad 13-inch candidates are generated deterministically from this source. Validate final dimensions before upload and retain the source whenever the composition changes.
