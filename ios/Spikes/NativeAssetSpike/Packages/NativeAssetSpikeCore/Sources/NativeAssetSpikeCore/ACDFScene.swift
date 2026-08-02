import Foundation

public struct Vector3: Equatable, Sendable {
    public let x: Float
    public let y: Float
    public let z: Float

    public init(_ x: Float, _ y: Float, _ z: Float) {
        self.x = x
        self.y = y
        self.z = z
    }

    public static let zero = Vector3(0, 0, 0)
}

public struct AxisAngle: Equatable, Sendable {
    public let axis: Vector3
    public let radians: Float

    public init(axis: Vector3, radians: Float) {
        self.axis = axis
        self.radians = radians
    }

    public static let identity = AxisAngle(axis: Vector3(1, 0, 0), radians: 0)
}

public struct CameraPose: Equatable, Sendable {
    public let position: Vector3
    public let target: Vector3
    public let up: Vector3
    public let fieldOfView: Float

    public init(position: Vector3, target: Vector3, up: Vector3, fieldOfView: Float) {
        self.position = position
        self.target = target
        self.up = up
        self.fieldOfView = fieldOfView
    }
}

public struct CanonicalPartState: Equatable, Sendable {
    public let translationFromBaseline: Vector3
    public let rotationFromBaseline: AxisAngle
    public let opacity: Float
    public let isVisible: Bool

    public init(
        translationFromBaseline: Vector3 = .zero,
        rotationFromBaseline: AxisAngle = .identity,
        opacity: Float = 1,
        isVisible: Bool = true
    ) {
        self.translationFromBaseline = translationFromBaseline
        self.rotationFromBaseline = rotationFromBaseline
        self.opacity = opacity
        self.isVisible = isVisible
    }
}

public struct ACDFSceneSnapshot: Equatable, Sendable {
    public let step: Int
    public let camera: CameraPose
    public let parts: [String: CanonicalPartState]

    public init(step: Int, camera: CameraPose, parts: [String: CanonicalPartState]) {
        self.step = step
        self.camera = camera
        self.parts = parts
    }
}

public enum ACDFSceneDefinition {
    public static let stepRange = 1 ... 7

    public static let expectedEntityIDs: Set<String> = [
        "central_nerve", "cranium", "disc_c2_c3", "disc_c3_c4",
        "disc_c4_c5", "disc_c5_c6", "disc_c6_c7", "disc_c7_t1",
        "disc_t1_t2", "disc_t2_t3", "disc_t3_t4", "disc_t4_t5",
        "disc_t5_t6", "disc_t6_t7", "interbody_spacer",
        "ligamentum_flavum", "medulla_c5", "nerve_root_c5",
        "nucleus_c4_c5", "plate_1", "plate_2",
        "posterior_longitudinal_ligament", "screw_1", "screw_2",
        "screw_3", "screw_4", "vertebra_c1", "vertebra_c2",
        "vertebra_c3", "vertebra_c4", "vertebra_c5", "vertebra_c6",
        "vertebra_c7", "vertebra_t1", "vertebra_t2", "vertebra_t3",
        "vertebra_t4", "vertebra_t5", "vertebra_t6",
    ]

    public static let dynamicEntityIDs: Set<String> = [
        "disc_c4_c5", "nucleus_c4_c5", "vertebra_c5", "medulla_c5",
        "nerve_root_c5", "interbody_spacer", "plate_1", "plate_2",
        "screw_1", "screw_2", "screw_3", "screw_4",
    ]

    private static let operativeLevelIDs: Set<String> = [
        "disc_c4_c5", "nucleus_c4_c5", "vertebra_c5", "medulla_c5",
        "nerve_root_c5",
    ]

    private static let discIDs: Set<String> = ["disc_c4_c5", "nucleus_c4_c5"]
    private static let plateIDs: Set<String> = ["plate_1", "plate_2"]
    private static let screwIDs: Set<String> = ["screw_1", "screw_2", "screw_3", "screw_4"]

    public static func snapshot(step: Int) -> ACDFSceneSnapshot {
        precondition(stepRange.contains(step), "ACDF step must be 1...7")
        var parts = initialParts()

        if step == 2 {
            for id in operativeLevelIDs {
                parts[id] = CanonicalPartState(
                    translationFromBaseline: Vector3(0, 1, 0)
                )
            }
        }

        if step >= 3 {
            for id in discIDs {
                parts[id] = CanonicalPartState(opacity: 0, isVisible: false)
            }
        }

        if step == 4 {
            parts["interbody_spacer"] = CanonicalPartState(
                translationFromBaseline: Vector3(0, -0.4, 0),
                rotationFromBaseline: AxisAngle(
                    axis: Vector3(1, 0, 0),
                    radians: -2 * .pi / 9
                )
            )
        } else if step >= 5 {
            parts["interbody_spacer"] = CanonicalPartState()
        }

        if step >= 6 {
            for id in plateIDs.union(screwIDs) {
                parts[id] = CanonicalPartState()
            }
        }

        return ACDFSceneSnapshot(step: step, camera: camera(step: step), parts: parts)
    }

    private static func initialParts() -> [String: CanonicalPartState] {
        var parts = Dictionary(
            uniqueKeysWithValues: dynamicEntityIDs.map { ($0, CanonicalPartState()) }
        )
        parts["interbody_spacer"] = CanonicalPartState(
            translationFromBaseline: Vector3(0, -0.4, 0),
            rotationFromBaseline: AxisAngle(
                axis: Vector3(1, 0, 0),
                radians: -2 * .pi / 9
            ),
            opacity: 0,
            isVisible: false
        )
        for id in plateIDs.union(screwIDs) {
            parts[id] = CanonicalPartState(
                translationFromBaseline: Vector3(0, -0.2, 0),
                opacity: 0,
                isVisible: false
            )
        }
        return parts
    }

    private static func camera(step: Int) -> CameraPose {
        switch step {
        case 1:
            CameraPose(
                position: Vector3(0.2, 0.2, 0),
                target: Vector3(0, 0.2, 0),
                up: Vector3(0, 1, 0),
                fieldOfView: 75
            )
        case 2:
            CameraPose(
                position: Vector3(0, 0.4, -0.9),
                target: Vector3(0, 0.2, -1),
                up: Vector3(0, 0, -1),
                fieldOfView: 25
            )
        case 3:
            CameraPose(
                position: Vector3(0, 0.2, 0.2),
                target: Vector3(0, 0.2, 0),
                up: Vector3(0, 1, 0),
                fieldOfView: 15
            )
        case 4:
            CameraPose(
                position: Vector3(0.2, 0.3, 0.3),
                target: Vector3(0, 0.2, 0.42),
                up: Vector3(0, 1, 0),
                fieldOfView: 15
            )
        case 5:
            CameraPose(
                position: Vector3(0.12, 0.2, 0.02),
                target: Vector3(0, 0.2, 0.02),
                up: Vector3(0, 1, 0),
                fieldOfView: 75
            )
        case 6:
            CameraPose(
                position: Vector3(0.2, 0.2, 0.4),
                target: Vector3(0, 0.2, 0),
                up: Vector3(0, 1, 0),
                fieldOfView: 15
            )
        default:
            CameraPose(
                position: Vector3(-0.2, 0.2, 0.4),
                target: Vector3(0, 0.2, 0),
                up: Vector3(0, 1, 0),
                fieldOfView: 15
            )
        }
    }
}

public struct LoadAwareACDFSession: Equatable, Sendable {
    public enum Readiness: Equatable, Sendable {
        case preparing
        case ready
    }

    public private(set) var readiness: Readiness = .preparing
    public private(set) var selectedStep = 1
    public private(set) var pendingStep: Int?

    public init() {}

    @discardableResult
    public mutating func select(step: Int) -> ACDFSceneSnapshot? {
        guard ACDFSceneDefinition.stepRange.contains(step) else { return nil }
        selectedStep = step
        guard readiness == .ready else {
            pendingStep = step
            return nil
        }
        return ACDFSceneDefinition.snapshot(step: step)
    }

    @discardableResult
    public mutating func markReady() -> ACDFSceneSnapshot {
        readiness = .ready
        let target = pendingStep ?? selectedStep
        pendingStep = nil
        selectedStep = target
        return ACDFSceneDefinition.snapshot(step: target)
    }
}
