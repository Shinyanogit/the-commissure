import Foundation

public struct GesturePoint: Equatable, Sendable {
  public let x: Double
  public let y: Double

  public init(x: Double, y: Double) {
    self.x = x
    self.y = y
  }
}

public struct GestureViewport: Equatable, Sendable {
  public let width: Double
  public let height: Double

  public init(width: Double, height: Double) {
    self.width = width
    self.height = height
  }
}

public enum GestureSample: Equatable, Sendable {
  case began(point: GesturePoint, touches: Int, viewport: GestureViewport)
  case moved(point: GesturePoint, touches: Int)
  case pinch(scale: Double)
  case ended
  case cancelled
}

public struct GestureIntentResolver: Sendable {
  public struct Configuration: Equatable, Sendable {
    public var edgeExclusion: Double = 24
    public var deadband: Double = 8
    public var orbitScale: Double = 0.008

    public init() {}
  }

  private enum Tracking: Equatable, Sendable {
    case idle
    case rejected
    case active(
      origin: GesturePoint,
      previous: GesturePoint,
      touches: Int,
      claim: Claim,
      emittedStep: Bool
    )
  }

  private enum Claim: Equatable, Sendable {
    case undecided
    case orbit
  }

  private let configuration: Configuration
  private var tracking: Tracking = .idle

  public init(configuration: Configuration = .init()) {
    self.configuration = configuration
  }

  public mutating func consume(
    _ sample: GestureSample,
    capabilities: ProcedureCapabilities
  ) -> [ProcedureIntent] {
    switch sample {
    case .began(let point, let touches, let viewport):
      guard touches == 1 || touches == 2,
        point.x >= configuration.edgeExclusion,
        point.x <= viewport.width - configuration.edgeExclusion
      else {
        tracking = .rejected
        return []
      }
      tracking = .active(
        origin: point,
        previous: point,
        touches: touches,
        claim: .undecided,
        emittedStep: false
      )
      return []
    case .moved(let point, let touches):
      guard
        case .active(
          let origin,
          let previous,
          let claimedTouches,
          let claim,
          let emittedStep
        ) = tracking
      else { return [] }
      guard touches == claimedTouches else {
        tracking = .rejected
        return []
      }
      guard claimedTouches == 1 else { return [] }

      let dx = point.x - origin.x
      let dy = point.y - origin.y
      let distance = max(abs(dx), abs(dy))
      var resolvedClaim = claim
      if claim == .undecided, distance >= configuration.deadband {
        resolvedClaim = .orbit
      }

      switch resolvedClaim {
      case .undecided:
        tracking = .active(
          origin: origin,
          previous: point,
          touches: touches,
          claim: .undecided,
          emittedStep: emittedStep
        )
        return []
      case .orbit:
        guard capabilities.canOrbit else {
          tracking = .rejected
          return []
        }
        tracking = .active(
          origin: origin,
          previous: point,
          touches: touches,
          claim: .orbit,
          emittedStep: emittedStep
        )
        return [
          .orbit(
            yaw: -(point.x - previous.x) * configuration.orbitScale,
            pitch: -(point.y - previous.y) * configuration.orbitScale
          )
        ]

      }
    case .pinch(let scale):
      guard capabilities.canZoom, scale.isFinite, scale > 0 else { return [] }
      tracking = .rejected
      return [.zoom(scale: scale)]
    case .ended, .cancelled:
      tracking = .idle
      return []
    }
  }
}
