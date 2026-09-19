# Native iOS Source

This directory owns the SwiftUI/RealityKit application, its local
`CommissureCore` package, tests, resources, and fastlane configuration.

The implementation contract is [`../docs/ios/`](../docs/ios/README.md) and the
shared visual contract is
[`../docs/DESIGN_CONCEPT.md`](../docs/DESIGN_CONCEPT.md).

Do not place Web source, GSAP timelines, arbitrary remote scripts, credentials,
or editable Blender files in this directory.

Phase 4 uses a tracked XcodeGen specification and generated Xcode project:

```sh
./ios/generate-project.sh
swift test --package-path ios/Packages/CommissureCore
xcodebuild test -project ios/TheCommissure.xcodeproj -scheme TheCommissure \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=latest' \
  CODE_SIGNING_ALLOWED=NO
```

The app target embeds `content/` as the immutable offline baseline. Launch does
not await a catalog request. Remote static packs use the same validated logical
contract through `AssetStore`; verified cached versions reopen without network
access, while downloads stage and hash-check before an atomic install.

## Functional native build

The temporary native UI now uses real 3D assets. Generate all four packs before
building from a clean checkout:

```sh
tooling/native-assets/build-all.sh
./ios/generate-project.sh
```

The generated `Resources/NativeAssets` folder is ignored and bundles the exact
verified assets. `tooling/native-assets/README.md` documents the pinned toolchain.
Library preview images are derived from the existing Web stills. Final AppIcon
and visual acceptance remain release requirements.

Remote updates are optional. To enable them in a signed build, supply explicit
Info.plist `ContentCatalogBaseURL`, base64 Ed25519 `ContentCatalogPublicKey` and
`ContentCatalogAllowedHosts` values. With no configuration, no catalog request
is made and all four bundled procedures remain available offline.

Run Fastlane from this directory. `IOS_PROJECT_ROOT` can override the current
directory when a CI runner invokes a lane from elsewhere.

`SCREENSHOT_LANGUAGES` and `SCREENSHOT_DEVICES` accept comma-separated locales
and pipe-separated Simulator names. Use one device at a time if the local
CoreSimulator service cannot launch multiple UI-test runners.
