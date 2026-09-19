# The Commissure Store Artwork Source

This directory is a local copy of Vocabry's feature graphic source project. The original files remain untouched at `/Users/shinyyama/Documents/プログラミング/英単語帳アプリ/store_assets/feature_graphic_src`.

The active entry point is `src/AppPanorama.tsx`. It renders one fixed 5280 by 2868 master canvas, then `capture_4split.mjs` produces four independent 1320 by 2868 iPhone images. The master is a review aid only. Each exported image must stand on its own in App Store Connect.

## Inputs

`src/assets/commissure-*` contains only The Commissure app icon, wordmark, home spine artwork, and captured app screens. Do not add generated anatomy, features that are not in the app, or marketing claims that the shipped app cannot support.

## Generate iPhone review outputs

```sh
npm install
npm run build
npm run capture:iphone
```

Outputs are deliberately ignored by Git:

```text
../generated/iphone/combined.png
../generated/iphone/iphone_17_pro_max_01.png
../generated/iphone/iphone_17_pro_max_02.png
../generated/iphone/iphone_17_pro_max_03.png
../generated/iphone/iphone_17_pro_max_04.png
```

The capture script uses the locally installed Google Chrome by default. Override it only when required with `CHROME_PATH`.

## Review status

This is a first composition draft. It has passed `npm run build` and `npm run capture:iphone`. It is not an approved App Store delivery asset. Rework the composition after visual review, then capture final iPhone and separate iPad candidates from this source controlled workflow.
