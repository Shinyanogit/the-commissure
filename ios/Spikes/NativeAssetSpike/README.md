# Native Asset Spike

This is a disposable Phase 2 diagnostic app, not the Phase 4 production
foundation. It proves ACDF asset bindings, absolute scene states, RealityKit
loading, direct/reverse navigation, transition interruption, orbit, pinch, and
device instrumentation before the main application architecture expands. It
also loads optimized PCDF as the worst-case geometry fixture.

```sh
ios/Spikes/NativeAssetSpike/prepare.sh
swift test --package-path ios/Spikes/NativeAssetSpike/Packages/NativeAssetSpikeCore
xcodebuild -project ios/Spikes/NativeAssetSpike/NativeAssetSpike.xcodeproj \
  -scheme NativeAssetSpike \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  CODE_SIGNING_ALLOWED=NO test
```

`prepare.sh` regenerates the ignored USDZ from the tracked GLB and creates the
ignored Xcode project with XcodeGen. The diagnostic overlay reports decode,
first frame, binding, steady/parse-peak memory, input p95, FPS, and thermal
observations. Simulator observations are
useful for correctness only; Phase 2 performance gates require physical iOS
hardware.

Set `SPIKE_PROCEDURE=pcdf` in the launch environment to load PCDF. ACDF is the
default and accepts `SPIKE_STEP=1...7`. Generated USDZ files and the generated
Xcode project are ignored; tracked manifests and Swift sources are the review
surface. `prepare.sh` also copies each export report into the app. Runtime
binding walks every reported archive path through the exact hierarchy; ACDF
then verifies the resolved RealityKit transform, opacity, and visibility for
each canonical state.

For an unattended thermal run, set `SPIKE_ENDURANCE_SECONDS=900`. The spike
continuously cycles canonical steps, orbit, and zoom, retains the worst observed
thermal state, and emits one `ENDURANCE complete` performance log at the end.
