import CommissureCore
import RealityKit

enum SceneAdapterError: Error, Equatable {
  case missingEntity(String)
  case duplicateEntity(String)
  case invalidState
}

@MainActor
final class RealitySceneAdapter {
  let camera = PerspectiveCamera()
  private var entitiesByPartID: [String: Entity] = [:]
  private var baselines: [String: Transform] = [:]
  private var dynamicIDs: Set<String> = []
  private var presentationRevision: UInt64 = 0
  private var transition: Transition?

  private struct Target {
    let transform: Transform
    let opacity: Float
    let visible: Bool
  }

  private struct Transition {
    let starts: [String: Target]
    let targets: [String: Target]
    let cameraStart: Transform
    let cameraTarget: Transform
    let fieldOfViewStart: Float
    let fieldOfViewTarget: Float
    var elapsed: Double = 0
  }

  var isTransitioning: Bool { transition != nil }
  var boundEntityCount: Int { entitiesByPartID.count }

  func bind(root: Entity, bindings: [PartBinding]) throws {
    var resolved: [String: Entity] = [:]
    for binding in bindings {
      let entity = try resolveEntity(at: binding.entityPath, from: root)
      guard resolved[binding.id] == nil,
        !resolved.values.contains(where: { $0 === entity })
      else { throw SceneAdapterError.duplicateEntity(binding.id) }
      resolved[binding.id] = entity
    }
    reset()
    entitiesByPartID = resolved
    baselines = resolved.mapValues(\.transform)
    dynamicIDs = Set(bindings.filter(\.dynamic).map(\.id))
  }

  func present(
    _ state: SceneState, revision: UInt64,
    adjustment: CameraAdjustment = .identity, animated: Bool = false
  ) throws {
    guard revision >= presentationRevision else { return }
    guard Set(state.parts.keys) == dynamicIDs,
      adjustment.yaw.isFinite, adjustment.pitch.isFinite,
      adjustment.zoomScale.isFinite, adjustment.zoomScale > 0
    else { throw SceneAdapterError.invalidState }
    var targets: [String: Target] = [:]
    var starts: [String: Target] = [:]
    for (partID, partState) in state.parts {
      guard let entity = entitiesByPartID[partID], let baseline = baselines[partID] else {
        throw SceneAdapterError.missingEntity(partID)
      }
      // Authored offsets are always composed with the immutable archive baseline.
      var target = baseline
      target.translation = baseline.translation + vector(partState.translation)
      target.rotation =
        baseline.rotation
        * simd_quatf(
          angle: Float(partState.rotation.radians),
          axis: simd_normalize(vector(partState.rotation.axis)))
      targets[partID] = Target(
        transform: target, opacity: Float(partState.opacity), visible: partState.isVisible)
      starts[partID] = Target(
        transform: entity.transform,
        opacity: entity.isEnabled ? (entity.components[OpacityComponent.self]?.opacity ?? 1) : 0,
        visible: entity.isEnabled)
    }
    let cameraTarget = cameraTransform(state.camera, adjustment: adjustment)
    guard cameraTarget.translation.x.isFinite, cameraTarget.rotation.real.isFinite else {
      throw SceneAdapterError.invalidState
    }
    presentationRevision = revision
    if animated {
      transition = Transition(
        starts: starts, targets: targets, cameraStart: camera.transform, cameraTarget: cameraTarget,
        fieldOfViewStart: camera.camera.fieldOfViewInDegrees,
        fieldOfViewTarget: Float(state.camera.fieldOfView))
    } else {
      transition = nil
      apply(targets)
      camera.transform = cameraTarget
      camera.camera.fieldOfViewInDegrees = Float(state.camera.fieldOfView)
    }
  }

  func advance(by delta: Double) {
    guard var value = transition, delta.isFinite, delta > 0 else { return }
    value.elapsed += delta
    let fraction = Float(min(value.elapsed / 0.3, 1))
    let eased = fraction * fraction * (3 - 2 * fraction)
    if fraction >= 1 {
      apply(value.targets)
      camera.transform = value.cameraTarget
      camera.camera.fieldOfViewInDegrees = value.fieldOfViewTarget
      transition = nil
      return
    }
    for (id, target) in value.targets {
      guard let start = value.starts[id], let entity = entitiesByPartID[id] else { continue }
      entity.transform = interpolate(start.transform, target.transform, eased)
      entity.components.set(
        OpacityComponent(opacity: start.opacity + (target.opacity - start.opacity) * eased))
      entity.isEnabled = start.visible || target.visible
    }
    camera.transform = interpolate(value.cameraStart, value.cameraTarget, eased)
    camera.camera.fieldOfViewInDegrees =
      value.fieldOfViewStart
      + (value.fieldOfViewTarget - value.fieldOfViewStart) * eased
    transition = value
  }

  func reset() {
    transition = nil
    entitiesByPartID = [:]
    baselines = [:]
    dynamicIDs = []
    presentationRevision = 0
    camera.removeFromParent()
  }

  private func apply(_ targets: [String: Target]) {
    for (id, target) in targets {
      guard let entity = entitiesByPartID[id] else { continue }
      entity.transform = target.transform
      entity.components.set(OpacityComponent(opacity: target.opacity))
      entity.isEnabled = target.visible
    }
  }

  private func vector(_ value: Vector3) -> SIMD3<Float> {
    SIMD3(Float(value.x), Float(value.y), Float(value.z))
  }

  private func interpolate(_ start: Transform, _ end: Transform, _ fraction: Float) -> Transform {
    Transform(
      scale: start.scale + (end.scale - start.scale) * fraction,
      rotation: simd_slerp(start.rotation, end.rotation, fraction),
      translation: start.translation + (end.translation - start.translation) * fraction)
  }

  private func cameraTransform(_ pose: CameraState, adjustment: CameraAdjustment) -> Transform {
    let target = vector(pose.target)
    let yaw = simd_quatf(angle: Float(adjustment.yaw), axis: SIMD3<Float>(0, 1, 0))
    let pitch = simd_quatf(angle: Float(adjustment.pitch), axis: SIMD3<Float>(1, 0, 0))
    let rotation = yaw * pitch
    let position =
      target + rotation.act(vector(pose.position) - target) * Float(adjustment.zoomScale)
    let forward = simd_normalize(target - position)
    let right = simd_normalize(simd_cross(forward, rotation.act(vector(pose.up))))
    let up = simd_normalize(simd_cross(right, forward))
    return Transform(
      scale: .one, rotation: simd_quatf(simd_float3x3(columns: (right, up, -forward))),
      translation: position)
  }

  private func resolveEntity(at path: String, from root: Entity) throws -> Entity {
    let components = path.split(separator: "/").map(String.init)
    guard path.hasPrefix("/root/"), !path.contains("//"), !path.hasSuffix("/"),
      !components.contains(".."), !components.contains(".")
    else { throw SceneAdapterError.missingEntity(path) }
    var current = root
    let remaining = root.name == "root" ? Array(components.dropFirst()) : components
    for name in remaining {
      let matches = current.children.filter { $0.name == name }
      guard !matches.isEmpty else { throw SceneAdapterError.missingEntity(path) }
      guard matches.count == 1, let child = matches.first else {
        throw SceneAdapterError.duplicateEntity(path)
      }
      current = child
    }
    return current
  }
}
