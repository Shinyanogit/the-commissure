import Foundation

public enum SceneResolutionError: Error, Equatable, Sendable {
  case procedureMismatch
  case stepMismatch
  case duplicateStepID(String)
  case duplicatePartID(String)
  case duplicateSourceEntity(String)
  case noncanonicalEntityPath(String)
  case unknownStep(String)
  case incompleteState(stepID: String, missing: [String], extra: [String])
  case invalidState(String)
  case divergentFinalEntrance(String)
}

public struct SceneStateResolver: Sendable {
  private let scene: SceneDefinition
  private let statesByStepID: [String: SceneState]

  public init(procedure: ProcedureDefinition, scene: SceneDefinition) throws {
    guard procedure.id == scene.procedureId,
      procedure.asset.id == scene.assetId,
      procedure.asset.version == scene.assetVersion
    else {
      throw SceneResolutionError.procedureMismatch
    }
    guard scene.rootEntityPath == "/root/procedure_\(procedure.id)" else {
      throw SceneResolutionError.noncanonicalEntityPath(scene.rootEntityPath)
    }
    if let duplicate = Self.firstDuplicate(procedure.steps.map(\.id)) {
      throw SceneResolutionError.duplicateStepID(duplicate)
    }
    if let duplicate = Self.firstDuplicate(scene.steps.map(\.id)) {
      throw SceneResolutionError.duplicateStepID(duplicate)
    }
    guard procedure.steps.map(\.id) == scene.steps.map(\.id),
      zip(procedure.steps, scene.steps).allSatisfy({ $0.viewPolicy == $1.viewPolicy })
    else {
      throw SceneResolutionError.stepMismatch
    }

    if let duplicate = Self.firstDuplicate(scene.parts.map(\.id)) {
      throw SceneResolutionError.duplicatePartID(duplicate)
    }
    if let duplicate = Self.firstDuplicate(scene.parts.map(\.sourceEntity)) {
      throw SceneResolutionError.duplicateSourceEntity(duplicate)
    }
    let rootComponents = scene.rootEntityPath.split(separator: "/").map(String.init)
    for binding in scene.parts {
      let components = binding.entityPath.split(separator: "/")
      let category =
        components.count > rootComponents.count
        ? String(components[rootComponents.count])
        : ""
      guard components.count == rootComponents.count + 2,
        binding.entityPath.hasPrefix("/"),
        !binding.entityPath.hasSuffix("/"),
        !binding.entityPath.contains("//"),
        components.prefix(rootComponents.count).map(String.init) == rootComponents,
        ["anatomy", "implants"].contains(category),
        components.last.map(String.init) == binding.id,
        binding.entityPath == "\(scene.rootEntityPath)/\(category)/\(binding.id)"
      else {
        throw SceneResolutionError.noncanonicalEntityPath(binding.entityPath)
      }
    }

    let dynamicIDs = Set(scene.parts.filter(\.dynamic).map(\.id))
    let labeledStates =
      [("baseState", scene.baseState)]
      + scene.steps.flatMap { step in
        [(step.id, step.state)]
          + step.entrance.enumerated().map { ("\(step.id)/beat_\($0.offset)", $0.element.target) }
      }
    for (label, state) in labeledStates {
      let stateIDs = Set(state.parts.keys)
      guard stateIDs == dynamicIDs else {
        throw SceneResolutionError.incompleteState(
          stepID: label,
          missing: dynamicIDs.subtracting(stateIDs).sorted(),
          extra: stateIDs.subtracting(dynamicIDs).sorted()
        )
      }
      guard Self.isValid(state) else { throw SceneResolutionError.invalidState(label) }
    }
    for step in scene.steps {
      if let final = step.entrance.last?.target, final != step.state {
        throw SceneResolutionError.divergentFinalEntrance(step.id)
      }
    }
    self.scene = scene
    statesByStepID = Dictionary(uniqueKeysWithValues: scene.steps.map { ($0.id, $0.state) })
  }

  public func resolve(stepID: String) throws -> SceneState {
    guard let state = statesByStepID[stepID] else {
      throw SceneResolutionError.unknownStep(stepID)
    }
    return state
  }

  public var baseState: SceneState { scene.baseState }

  private static func firstDuplicate(_ values: [String]) -> String? {
    var seen: Set<String> = []
    return values.first { !seen.insert($0).inserted }
  }

  private static func isValid(_ state: SceneState) -> Bool {
    let camera = state.camera
    let view = vector(
      camera.target.x - camera.position.x,
      camera.target.y - camera.position.y,
      camera.target.z - camera.position.z
    )
    let up = vector(camera.up.x, camera.up.y, camera.up.z)
    let cross = vector(
      view.y * up.z - view.z * up.y,
      view.z * up.x - view.x * up.z,
      view.x * up.y - view.y * up.x
    )
    guard magnitude(view) > 1e-6,
      magnitude(up) > 1e-6,
      magnitude(cross) > 1e-6,
      camera.fieldOfView > 1,
      camera.fieldOfView < 120,
      allFinite(camera.position),
      allFinite(camera.target),
      allFinite(camera.up)
    else { return false }

    return state.parts.values.allSatisfy { part in
      allFinite(part.translation)
        && allFinite(part.rotation.axis)
        && magnitude(vector(part.rotation.axis.x, part.rotation.axis.y, part.rotation.axis.z))
          > 1e-6
        && part.rotation.radians.isFinite
        && abs(part.rotation.radians) <= 2 * .pi
        && part.opacity.isFinite
        && (0...1).contains(part.opacity)
    }
  }

  private static func allFinite(_ value: Vector3) -> Bool {
    value.x.isFinite && value.y.isFinite && value.z.isFinite
  }

  private static func vector(_ x: Double, _ y: Double, _ z: Double) -> (
    x: Double, y: Double, z: Double
  ) {
    (x, y, z)
  }

  private static func magnitude(_ value: (x: Double, y: Double, z: Double)) -> Double {
    sqrt(value.x * value.x + value.y * value.y + value.z * value.z)
  }
}
