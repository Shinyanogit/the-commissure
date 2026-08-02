import Foundation

public struct PackKey: Hashable, Codable, Sendable {
  public let id: String
  public let version: String

  public init(id: String, version: String) {
    self.id = id
    self.version = version
  }
}

public struct PackFileExpectation: Equatable, Codable, Sendable {
  public let path: String
  public let sha256: String
  public let bytes: Int

  public init(path: String, sha256: String, bytes: Int) {
    self.path = path
    self.sha256 = sha256
    self.bytes = bytes
  }
}

public struct ManifestPack: Equatable, Codable, Sendable {
  public let key: PackKey
  public let generation: Int
  public let minimumBuild: Int
  public let files: [PackFileExpectation]

  public init(key: PackKey, generation: Int, minimumBuild: Int, files: [PackFileExpectation]) {
    self.key = key
    self.generation = generation
    self.minimumBuild = minimumBuild
    self.files = files
  }

  public var totalBytes: Int { files.reduce(0) { $0 + $1.bytes } }
}

public struct InstalledPack: Equatable, Codable, Sendable {
  public let key: PackKey
  public let directory: URL
  public let installedAt: Date

  public init(key: PackKey, directory: URL, installedAt: Date) {
    self.key = key
    self.directory = directory
    self.installedAt = installedAt
  }
}

public enum TransferState: Equatable, Sendable {
  case idle
  case queued
  case downloading(progress: Double)
  case verifying
}

public enum Compatibility: Equatable, Sendable {
  case compatible
  case incompatible(minimumBuild: Int)
}

public enum AssetFailure: Error, Equatable, Sendable {
  case offline
  case cancelled
  case corrupt(path: String)
  case insufficientStorage(required: Int64, available: Int64)
  case incompatible(minimumBuild: Int)
  case io
}

public struct PackRecord: Equatable, Sendable {
  public var bundledVersion: String?
  public var installed: InstalledPack?
  public var offered: ManifestPack?
  public var transfer: TransferState
  public var compatibility: Compatibility
  public var lastFailure: AssetFailure?
  public var isInUse: Bool

  public init(
    bundledVersion: String? = nil,
    installed: InstalledPack? = nil,
    offered: ManifestPack? = nil,
    transfer: TransferState = .idle,
    compatibility: Compatibility = .compatible,
    lastFailure: AssetFailure? = nil,
    isInUse: Bool = false
  ) {
    self.bundledVersion = bundledVersion
    self.installed = installed
    self.offered = offered
    self.transfer = transfer
    self.compatibility = compatibility
    self.lastFailure = lastFailure
    self.isInUse = isInUse
  }
}

public enum PackPresentationState: Equatable, Sendable {
  case bundled
  case notDownloaded
  case queued
  case downloading(progress: Double)
  case verifying
  case ready(version: String)
  case stale(installed: String, available: String)
  case failed(AssetFailure)
  case evicted
  case incompatible(minimumBuild: Int)
}

extension PackRecord {
  public var presentationState: PackPresentationState {
    if case .incompatible(let minimumBuild) = compatibility {
      return .incompatible(minimumBuild: minimumBuild)
    }
    switch transfer {
    case .queued: return .queued
    case .downloading(let progress): return .downloading(progress: progress)
    case .verifying: return .verifying
    case .idle: break
    }
    if let installed {
      if let offered, offered.key.version != installed.key.version {
        return .stale(installed: installed.key.version, available: offered.key.version)
      }
      return .ready(version: installed.key.version)
    }
    if let lastFailure { return .failed(lastFailure) }
    if bundledVersion != nil { return .bundled }
    if offered != nil { return .notDownloaded }
    return .evicted
  }
}

public enum CatalogDecision: Equatable, Sendable {
  case acceptRemote
  case keepLastKnownGood
  case rejectReplay
}

public struct CatalogPolicy: Sendable {
  public init() {}

  public func decide(highestAccepted: Int, remoteGeneration: Int?, fetchFailed: Bool)
    -> CatalogDecision
  {
    if fetchFailed || remoteGeneration == nil { return .keepLastKnownGood }
    guard let remoteGeneration else { return .keepLastKnownGood }
    if remoteGeneration < highestAccepted { return .rejectReplay }
    return .acceptRemote
  }
}
