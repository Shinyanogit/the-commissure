import CommissureCore
import RealityKit

enum SceneAdapterError: Error, Equatable {
  case missingEntity(String)
  case duplicateEntity(String)
}

@MainActor
final class RealitySceneAdapter {
  private var entitiesByPartID: [String: Entity] = [:]
  private var presentationRevision: UInt64 = 0

  func bind(root: Entity, bindings: [PartBinding]) throws {
    var resolved: [String: Entity] = [:]
    for binding in bindings {
      let entity = try resolveEntity(at: binding.entityPath, from: root)
      guard resolved[binding.id] == nil else {
        throw SceneAdapterError.duplicateEntity(binding.id)
      }
      resolved[binding.id] = entity
    }
    entitiesByPartID = resolved
  }

  func present(_ state: SceneState, revision: UInt64) throws {
    guard revision >= presentationRevision else { return }
    for (partID, partState) in state.parts {
      guard let entity = entitiesByPartID[partID] else {
        throw SceneAdapterError.missingEntity(partID)
      }
      entity.position = SIMD3(
        Float(partState.translation.x),
        Float(partState.translation.y),
        Float(partState.translation.z)
      )
      entity.orientation = simd_quatf(
        angle: Float(partState.rotation.radians),
        axis: SIMD3(
          Float(partState.rotation.axis.x),
          Float(partState.rotation.axis.y),
          Float(partState.rotation.axis.z)
        )
      )
      entity.isEnabled = partState.isVisible && partState.opacity > 0
    }
    presentationRevision = revision
  }

  func reset() {
    entitiesByPartID = [:]
    presentationRevision = 0
  }

  private func resolveEntity(at path: String, from root: Entity) throws -> Entity {
    let components = path.split(separator: "/").map(String.init)
    guard let rootIndex = components.firstIndex(of: root.name) else {
      throw SceneAdapterError.missingEntity(path)
    }

    var current = root
    for name in components.dropFirst(rootIndex + 1) {
      let matches = current.children.filter { $0.name == name }
      guard !matches.isEmpty else {
        throw SceneAdapterError.missingEntity(path)
      }
      guard matches.count == 1, let child = matches.first else {
        throw SceneAdapterError.duplicateEntity(path)
      }
      current = child
    }
    return current
  }
}
