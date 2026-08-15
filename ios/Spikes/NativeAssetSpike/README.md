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

Physical measurement is isolated from the normal test scheme so a routine test
run never starts a 15-minute gate. Supply an already configured local Apple
development team at invocation; it is not stored in the project:

```sh
COMMISSURE_DEVELOPMENT_TEAM=YOUR_TEAM_ID
xcodebuild -project ios/Spikes/NativeAssetSpike/NativeAssetSpike.xcodeproj \
  -scheme NativeAssetSpikePhysical \
  -destination 'id=YOUR_DEVICE_UDID' \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="$COMMISSURE_DEVELOPMENT_TEAM" \
  CODE_SIGN_STYLE=Automatic \
  -only-testing:NativeAssetSpikePhysicalTests/NativeAssetSpikePhysicalTests/testACDFColdLoadSamples \
  test
```

The physical scheme contains separate 20-launch ACDF/PCDF samples, a 60-second
endurance smoke test, and a 900-second PCDF gate. The long run disables the idle
timer only while it is active. Its XCTest parses the emitted metrics and fails
when first frame exceeds 4.5 seconds, input p95 exceeds 150 ms, FPS p05 falls
below 45, steady memory exceeds 350 MB, peak memory exceeds 450 MB, or the worst
thermal state reaches serious/critical.

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

## 2026-08-02 physical result

The spike passed over persistent Xcode Wi-Fi pairing on an iPad Pro 12.9-inch
(5th generation, M1), iPadOS 26.5.2:

- ACDF, 20 launches: decode p50/p95 185/198 ms; first frame 211/220 ms;
  steady memory 314/317 MB; peak parse 327/328 MB.
- PCDF, 20 launches: decode p50/p95 216/218 ms; first frame 240/249 ms;
  steady memory 318/321 MB; peak parse 331/331 MB.
- PCDF, 900 seconds: FPS p05/p50 54/60; input p95 18 ms; steady memory
  316 MB; peak 329 MB; worst thermal nominal.

This closes the Phase 2 representative-device expansion gate. It does not prove
oldest-supported hardware/iOS 18 performance, real touch-to-photon latency, or
OS-trace peak memory. The 250 MB memory target is missed although the 350 MB
hard stop passes; those remain explicit later release gates.
