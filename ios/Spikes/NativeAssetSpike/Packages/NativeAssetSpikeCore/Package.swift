// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "NativeAssetSpikeCore",
    platforms: [.iOS(.v18), .macOS(.v15)],
    products: [
        .library(name: "NativeAssetSpikeCore", targets: ["NativeAssetSpikeCore"])
    ],
    targets: [
        .target(name: "NativeAssetSpikeCore"),
        .testTarget(
            name: "NativeAssetSpikeCoreTests",
            dependencies: ["NativeAssetSpikeCore"]
        ),
    ]
)
