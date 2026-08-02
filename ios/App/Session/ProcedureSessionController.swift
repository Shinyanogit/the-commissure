import CommissureCore
import Observation

@MainActor
@Observable
final class ProcedureSessionController {
  private(set) var session: ProcedureSession
  private let resolver: SceneStateResolver

  init(bundle: ProcedureBundle) throws {
    session = ProcedureSession(procedure: bundle.procedure)
    resolver = try SceneStateResolver(procedure: bundle.procedure, scene: bundle.scene)
  }

  func setContentReady() throws -> SceneState {
    session.setContentReady(true)
    return try resolver.resolve(stepID: session.selectedStepID)
  }

  func send(_ intent: ProcedureIntent) throws -> SceneState? {
    guard session.send(intent) else { return nil }
    return try resolver.resolve(stepID: session.selectedStepID)
  }
}
