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
