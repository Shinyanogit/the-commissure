// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "CommissureCore",
    platforms: [.iOS(.v18), .macOS(.v15)],
    products: [
        .library(name: "CommissureCore", targets: ["CommissureCore"])
    ],
    targets: [
        .target(name: "CommissureCore"),
        .testTarget(name: "CommissureCoreTests", dependencies: ["CommissureCore"])
    ],
    swiftLanguageModes: [.v6]
)
