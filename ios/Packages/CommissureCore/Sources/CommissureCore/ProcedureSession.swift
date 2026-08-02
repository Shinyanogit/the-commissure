import Foundation

public struct CameraAdjustment: Equatable, Sendable {
  public var yaw: Double
  public var pitch: Double
  public var zoomScale: Double

  public static let identity = CameraAdjustment(yaw: 0, pitch: 0, zoomScale: 1)
}

public enum ProcedureIntent: Equatable, Sendable {
  case nextStep
  case previousStep
  case selectStep(String)
  case orbit(yaw: Double, pitch: Double)
  case zoom(scale: Double)
  case resetView
}

public struct ProcedureCapabilities: Equatable, Sendable {
  public let canGoPrevious: Bool
  public let canGoNext: Bool
  public let canOrbit: Bool
  public let canZoom: Bool
}

public struct ProcedureSession: Equatable, Sendable {
  public let procedure: ProcedureDefinition
  public private(set) var selectedStepID: String
  public private(set) var cameraAdjustment: CameraAdjustment
  public private(set) var isContentReady: Bool
  public private(set) var pendingStepID: String?
  public private(set) var targetRevision: UInt64

  public init(procedure: ProcedureDefinition, contentReady: Bool = false) {
    precondition(!procedure.steps.isEmpty)
    self.procedure = procedure
    selectedStepID = procedure.steps[0].id
    cameraAdjustment = .identity
    isContentReady = contentReady
    pendingStepID = nil
    targetRevision = 0
  }

  public var selectedIndex: Int {
    procedure.steps.firstIndex { $0.id == selectedStepID } ?? 0
  }

  public var capabilities: ProcedureCapabilities {
    ProcedureCapabilities(
      canGoPrevious: selectedIndex > 0,
      canGoNext: selectedIndex + 1 < procedure.steps.count,
      canOrbit: isContentReady,
      canZoom: isContentReady
    )
  }

  @discardableResult
  public mutating func send(_ intent: ProcedureIntent) -> Bool {
    switch intent {
    case .nextStep:
      return select(index: selectedIndex + 1)
    case .previousStep:
      return select(index: selectedIndex - 1)
    case .selectStep(let stepID):
      guard let index = procedure.steps.firstIndex(where: { $0.id == stepID }) else { return false }
      return select(index: index)
    case .orbit(let yaw, let pitch):
      guard capabilities.canOrbit else { return false }
      cameraAdjustment.yaw += yaw
      cameraAdjustment.pitch = min(max(cameraAdjustment.pitch + pitch, -.pi / 2), .pi / 2)
    case .zoom(let scale):
      guard capabilities.canZoom, scale.isFinite, scale > 0 else { return false }
      cameraAdjustment.zoomScale = min(max(cameraAdjustment.zoomScale * scale, 0.5), 3)
    case .resetView:
      guard isContentReady else { return false }
      cameraAdjustment = .identity
    }
    targetRevision &+= 1
    return true
  }

  public mutating func setContentReady(_ ready: Bool) {
    isContentReady = ready
    guard ready, let pendingStepID else { return }
    self.pendingStepID = nil
    _ = send(.selectStep(pendingStepID))
  }

  private mutating func select(index: Int) -> Bool {
    guard procedure.steps.indices.contains(index) else { return false }
    let step = procedure.steps[index]
    selectedStepID = step.id
    if step.viewPolicy == .reframe { cameraAdjustment = .identity }
    if !isContentReady { pendingStepID = step.id }
    targetRevision &+= 1
    return true
  }
}
