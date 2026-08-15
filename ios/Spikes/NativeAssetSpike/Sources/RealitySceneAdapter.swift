import Foundation
import NativeAssetSpikeCore
import RealityKit

enum SceneBindingError: LocalizedError {
    case missing(String)
    case duplicate(String)

    var errorDescription: String? {
        switch self {
        case .missing(let id): "Missing entity: \(id)"
        case .duplicate(let id): "Duplicate entity: \(id)"
        }
    }
}

@MainActor
final class RealitySceneAdapter {
    let camera = PerspectiveCamera()
    let boundEntityCount: Int

    private var entities: [String: Entity] = [:]
    private var baselines: [String: Transform] = [:]
    private var activeAnimations: [AnimationPlaybackController] = []

    init(root: Entity, procedure: SpikeProcedure, expectedPaths: [String]) throws {
        var bound: [String: Entity] = [:]
        for path in expectedPaths {
            let entity = try Self.entity(atArchivePath: path, from: root)
            let id = String(path.split(separator: "/").last ?? "")
            guard bound[id] == nil else { throw SceneBindingError.duplicate(id) }
            bound[id] = entity
        }
        boundEntityCount = bound.count

        if procedure == .acdf {
            guard Set(bound.keys) == ACDFSceneDefinition.expectedEntityIDs else {
                throw SceneBindingError.missing("ACDF exact binding set")
            }
            for id in ACDFSceneDefinition.dynamicEntityIDs {
                guard let entity = bound[id] else { throw SceneBindingError.missing(id) }
                entities[id] = entity
                baselines[id] = entity.transform
            }
        } else if bound.count != 68 {
            throw SceneBindingError.missing("PCDF expected 68 paths, found \(bound.count)")
        }
        camera.name = "spike_camera"
    }

    func retargetPCDF(orbitYaw: Float, orbitPitch: Float, zoom: Float) {
        let target = SIMD3<Float>(0, 0.2, 0)
        var offset = SIMD3<Float>(0.2, 0, 0)
        let yaw = simd_quatf(angle: orbitYaw, axis: SIMD3<Float>(0, 1, 0))
        let pitch = simd_quatf(angle: orbitPitch, axis: SIMD3<Float>(1, 0, 0))
        offset = yaw.act(pitch.act(offset)) * zoom
        camera.camera.fieldOfViewInDegrees = 75
        Self.orient(
            camera: camera,
            position: target + offset,
            target: target,
            up: yaw.act(pitch.act(SIMD3<Float>(0, 1, 0)))
        )
    }

    func retarget(
        _ snapshot: ACDFSceneSnapshot,
        orbitYaw: Float,
        orbitPitch: Float,
        zoom: Float,
        animated: Bool
    ) {
        activeAnimations.forEach { $0.stop() }
        activeAnimations.removeAll(keepingCapacity: true)

        for (id, part) in snapshot.parts {
            guard let entity = entities[id], let baseline = baselines[id] else { continue }
            let target = Self.targetTransform(part: part, baseline: baseline)
            entity.components.set(OpacityComponent(opacity: part.opacity))
            entity.isEnabled = part.isVisible
            if animated, part.isVisible {
                activeAnimations.append(
                    entity.move(
                        to: target,
                        relativeTo: entity.parent,
                        duration: 0.45,
                        timingFunction: .easeInOut
                    )
                )
            } else {
                entity.transform = target
            }
        }

        let pose = snapshot.camera
        let target = SIMD3<Float>(pose.target.x, pose.target.y, pose.target.z)
        var offset = SIMD3<Float>(
            pose.position.x - pose.target.x,
            pose.position.y - pose.target.y,
            pose.position.z - pose.target.z
        )
        var up = SIMD3<Float>(pose.up.x, pose.up.y, pose.up.z)
        let yaw = simd_quatf(angle: orbitYaw, axis: SIMD3<Float>(0, 1, 0))
        let pitch = simd_quatf(angle: orbitPitch, axis: SIMD3<Float>(1, 0, 0))
        offset = yaw.act(pitch.act(offset)) * zoom
        up = yaw.act(pitch.act(up))
        camera.camera.fieldOfViewInDegrees = pose.fieldOfView
        Self.orient(camera: camera, position: target + offset, target: target, up: up)
    }

    func verifies(_ snapshot: ACDFSceneSnapshot, tolerance: Float = 0.001) -> Bool {
        snapshot.parts.allSatisfy { id, part in
            guard let entity = entities[id], let baseline = baselines[id] else { return false }
            let target = Self.targetTransform(part: part, baseline: baseline)
            let translationMatches = simd_distance(
                entity.transform.translation,
                target.translation
            ) <= tolerance
            let rotationMatches = abs(simd_dot(
                entity.transform.rotation.vector,
                target.rotation.vector
            )) >= 1 - tolerance
            let opacity = entity.components[OpacityComponent.self]?.opacity ?? 1
            return translationMatches
                && rotationMatches
                && abs(opacity - part.opacity) <= tolerance
                && entity.isEnabled == part.isVisible
        }
    }

    private static func entity(atArchivePath path: String, from root: Entity) throws -> Entity {
        let components = path.split(separator: "/").map(String.init)
        guard components.first == "root" else { throw SceneBindingError.missing(path) }
        var current = root
        for component in components {
            let matches = current.children.filter { $0.name == component }
            guard !matches.isEmpty else { throw SceneBindingError.missing(path) }
            guard matches.count == 1 else { throw SceneBindingError.duplicate(path) }
            current = matches[0]
        }
        return current
    }

    private static func targetTransform(
        part: CanonicalPartState,
        baseline: Transform
    ) -> Transform {
        var target = baseline
        target.translation += SIMD3<Float>(
            part.translationFromBaseline.x,
            part.translationFromBaseline.y,
            part.translationFromBaseline.z
        )
        let axis = SIMD3<Float>(
            part.rotationFromBaseline.axis.x,
            part.rotationFromBaseline.axis.y,
            part.rotationFromBaseline.axis.z
        )
        target.rotation *= simd_quatf(
            angle: part.rotationFromBaseline.radians,
            axis: axis
        )
        return target
    }

    private static func orient(
        camera: PerspectiveCamera,
        position: SIMD3<Float>,
        target: SIMD3<Float>,
        up: SIMD3<Float>
    ) {
        let forward = simd_normalize(target - position)
        let right = simd_normalize(simd_cross(forward, up))
        let resolvedUp = simd_normalize(simd_cross(right, forward))
        camera.transform.translation = position
        camera.transform.rotation = simd_quatf(
            simd_float3x3(columns: (right, resolvedUp, -forward))
        )
    }
}
