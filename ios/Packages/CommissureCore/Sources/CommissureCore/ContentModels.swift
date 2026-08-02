import Foundation

public enum ViewPolicy: String, Codable, Sendable {
  case preserveAdjustment
  case reframe
}

public struct AssetReference: Codable, Equatable, Sendable {
  public let id: String
  public let version: String
}

public struct ProcedureStepMetadata: Codable, Equatable, Identifiable, Sendable {
  public let id: String
  public let titleKey: String
  public let bodyKey: String
  public let accessibilitySummaryKey: String
  public let viewPolicy: ViewPolicy
}

public struct ProcedureDefinition: Codable, Equatable, Identifiable, Sendable {
  public let schemaVersion: Int
  public let id: String
  public let abbreviation: String
  public let version: String
  public let revision: Int
  public let titleKey: String
  public let summaryKey: String
  public let asset: AssetReference
  public let sceneFile: String
  public let locales: [String]
  public let steps: [ProcedureStepMetadata]
}

public struct PartBinding: Codable, Equatable, Identifiable, Sendable {
  public let id: String
  public let sourceEntity: String
  public let entityPath: String
  public let dynamic: Bool
  public let implantId: String?

  public init(
    id: String,
    sourceEntity: String,
    entityPath: String,
    dynamic: Bool,
    implantId: String?
  ) {
    self.id = id
    self.sourceEntity = sourceEntity
    self.entityPath = entityPath
    self.dynamic = dynamic
    self.implantId = implantId
  }
}

public struct Vector3: Codable, Equatable, Sendable {
  public let x: Double
  public let y: Double
  public let z: Double

  public init(x: Double, y: Double, z: Double) {
    self.x = x
    self.y = y
    self.z = z
  }

  public init(from decoder: Decoder) throws {
    var values = try decoder.unkeyedContainer()
    x = try values.decode(Double.self)
    y = try values.decode(Double.self)
    z = try values.decode(Double.self)
    guard values.isAtEnd else {
      throw DecodingError.dataCorruptedError(
        in: values, debugDescription: "Vector3 requires three values")
    }
  }

  public func encode(to encoder: Encoder) throws {
    var values = encoder.unkeyedContainer()
    try values.encode(x)
    try values.encode(y)
    try values.encode(z)
  }
}

public struct RotationState: Codable, Equatable, Sendable {
  public let axis: Vector3
  public let radians: Double
}

public struct PartState: Codable, Equatable, Sendable {
  public let translation: Vector3
  public let rotation: RotationState
  public let opacity: Double
  public let isVisible: Bool
}

public struct CameraState: Codable, Equatable, Sendable {
  public let position: Vector3
  public let target: Vector3
  public let up: Vector3
  public let fieldOfView: Double
}

public struct SceneState: Codable, Equatable, Sendable {
  public let camera: CameraState
  public let parts: [String: PartState]
}

public struct TransitionBeat: Codable, Equatable, Sendable {
  public enum Easing: String, Codable, Sendable {
    case linear
    case easeInOut
  }

  public let duration: Double
  public let easing: Easing
  public let target: SceneState
}

public struct SceneStep: Codable, Equatable, Identifiable, Sendable {
  public let id: String
  public let viewPolicy: ViewPolicy
  public let state: SceneState
  public let entrance: [TransitionBeat]
}

public struct SceneDefinition: Codable, Equatable, Sendable {
  public let schemaVersion: Int
  public let procedureId: String
  public let assetId: String
  public let assetVersion: String
  public let rootEntityPath: String
  public let parts: [PartBinding]
  public let baseState: SceneState
  public let steps: [SceneStep]
}

public struct LocalizationReview: Codable, Equatable, Sendable {
  public let status: String
  public let reviewer: String
  public let reviewedAt: String
  public let sourceDigest: String
}

public struct LocalizationDocument: Codable, Equatable, Sendable {
  public let schemaVersion: Int
  public let procedureId: String
  public let locale: String
  public let revision: Int
  public let review: LocalizationReview
  public let strings: [String: String]
}

public struct CatalogFile: Codable, Equatable, Sendable {
  public let role: String
  public let path: String
  public let sha256: String
  public let bytes: Int
}

public struct CatalogProcedure: Codable, Equatable, Identifiable, Sendable {
  public let id: String
  public let version: String
  public let revision: Int
  public let sceneSchemaVersion: Int
  public let minimumAppBuild: Int
  public let locales: [String]
  public let requiredCapabilities: [String]
  public let files: [CatalogFile]
  public let provenanceId: String
}

public struct ContentCatalog: Codable, Equatable, Sendable {
  public let schemaVersion: Int
  public let generation: Int
  public let publishedAt: String
  public let procedures: [CatalogProcedure]
}

public struct ProcedureBundle: Equatable, Sendable {
  public let procedure: ProcedureDefinition
  public let scene: SceneDefinition
  public let localization: LocalizationDocument

  public init(
    procedure: ProcedureDefinition,
    scene: SceneDefinition,
    localization: LocalizationDocument
  ) {
    self.procedure = procedure
    self.scene = scene
    self.localization = localization
  }
}
