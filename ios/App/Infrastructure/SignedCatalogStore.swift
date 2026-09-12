import CommissureCore
import CryptoKit
import Foundation

struct RemoteCatalogConfiguration: Sendable {
  let catalogBaseURL: URL
  let allowedHosts: Set<String>
  let publicKey: Data

  init(catalogBaseURL: URL, allowedHosts: Set<String>, publicKey: Data) {
    self.catalogBaseURL = catalogBaseURL
    self.allowedHosts = Set(allowedHosts.map { $0.lowercased() })
    self.publicKey = publicKey
  }
}

enum CatalogFailure: Error, Equatable, Sendable {
  case invalidConfiguration
  case transport
  case httpStatus(Int)
  case invalidSignature
  case invalidManifest
  case replay(highestAccepted: Int, received: Int)
  case equivocation(generation: Int)
  case versionMutation(PackKey)
  case io
}

enum CatalogRefreshOutcome: Sendable {
  case accepted(AcceptedRemoteCatalog)
  case notModified(AcceptedRemoteCatalog)
  case keptLastKnownGood(catalog: AcceptedRemoteCatalog?, reason: CatalogFailure)
  case unconfigured
}

struct AcceptedRemoteCatalog: Equatable, Sendable {
  let catalog: ContentCatalog
  let assetBaseURL: URL

  fileprivate let manifestBytes: Data
  fileprivate let packDirectories: [PackKey: String]
  fileprivate let allowedHosts: Set<String>

  func manifestPack(id: String) -> ManifestPack? {
    guard let procedure = catalog.procedures.first(where: { $0.id == id }) else { return nil }
    return ManifestPack(
      key: PackKey(id: procedure.id, version: procedure.version),
      generation: catalog.generation,
      minimumBuild: procedure.minimumAppBuild,
      files: procedure.files.map {
        PackFileExpectation(
          path: URL(fileURLWithPath: $0.path).lastPathComponent,
          sha256: $0.sha256,
          bytes: $0.bytes
        )
      }
    )
  }

  func makeAssetSource(session: URLSession) -> RemoteAssetSource {
    RemoteAssetSource(
      baseURL: assetBaseURL,
      allowedHosts: allowedHosts,
      packDirectories: packDirectories,
      session: session
    )
  }
}

struct CatalogHTTPResponse: Sendable {
  let statusCode: Int
  let data: Data
  let etag: String?
  let finalURL: URL
}

protocol CatalogTransport: Sendable {
  func get(_ url: URL, etag: String?) async throws -> CatalogHTTPResponse
}

struct URLSessionCatalogTransport: CatalogTransport {
  let session: URLSession

  func get(_ url: URL, etag: String?) async throws -> CatalogHTTPResponse {
    var request = URLRequest(url: url)
    request.cachePolicy = .reloadIgnoringLocalCacheData
    if let etag, etag.count <= 1_024, !etag.contains("\r"), !etag.contains("\n") {
      request.setValue(etag, forHTTPHeaderField: "If-None-Match")
    }
    let (data, response) = try await session.data(for: request)
    guard let response = response as? HTTPURLResponse, let finalURL = response.url else {
      throw CatalogFailure.transport
    }
    return CatalogHTTPResponse(
      statusCode: response.statusCode,
      data: data,
      etag: response.value(forHTTPHeaderField: "ETag"),
      finalURL: finalURL
    )
  }

  static func ephemeralSession() -> URLSession {
    let configuration = URLSessionConfiguration.ephemeral
    configuration.waitsForConnectivity = false
    configuration.timeoutIntervalForRequest = 15
    configuration.timeoutIntervalForResource = 30
    return URLSession(configuration: configuration)
  }
}

actor SignedCatalogStore {
  private static let schemaVersion = 1
  private static let maximumManifestBytes = 1_048_576
  private static let maximumPackBytes = 20 * 1_024 * 1_024
  private static let maximumRetainedCatalogs = 3
  private static let procedureIDs = ["acdf", "accf", "pcdf", "pcf"]
  private static let requiredCapabilities = [
    "absoluteSceneState", "restrictedMarkdown", "bilingualV1",
  ]
  private static let roleFileNames = [
    "procedure": "procedure.json",
    "scene": "scene.json",
    "localization-en": "en.json",
    "localization-ja": "ja.json",
    "provenance": "provenance.json",
    "model": "model.usdz",
    "pack-metadata": "pack.json",
  ]

  private let configuration: RemoteCatalogConfiguration?
  private let rootURL: URL
  private let transport: any CatalogTransport

  init(
    configuration: RemoteCatalogConfiguration?,
    rootURL: URL,
    transport: any CatalogTransport
  ) {
    self.configuration = configuration
    self.rootURL = rootURL
    self.transport = transport
  }

  init(configuration: RemoteCatalogConfiguration?, rootURL: URL) {
    self.init(
      configuration: configuration,
      rootURL: rootURL,
      transport: URLSessionCatalogTransport(session: URLSessionCatalogTransport.ephemeralSession())
    )
  }

  func lastKnownGood() -> AcceptedRemoteCatalog? {
    guard let configuration, let validated = try? validate(configuration) else { return nil }
    return try? loadArchive(using: validated)?.catalogs.first?.catalog
  }

  func retainedCatalogs() -> [AcceptedRemoteCatalog] {
    guard let configuration, let validated = try? validate(configuration) else { return [] }
    return (try? loadArchive(using: validated)?.catalogs.map(\.catalog)) ?? []
  }

  func refresh() async -> CatalogRefreshOutcome {
    guard let configuration else { return .unconfigured }

    let validated: ValidatedConfiguration
    do {
      validated = try validate(configuration)
    } catch {
      return .keptLastKnownGood(catalog: nil, reason: .invalidConfiguration)
    }

    let archive = try? loadArchive(using: validated)
    let stored = archive?.catalogs.first
    let manifestResponse: CatalogHTTPResponse
    do {
      manifestResponse = try await transport.get(validated.manifestURL, etag: stored?.etag)
    } catch {
      return .keptLastKnownGood(catalog: stored?.catalog, reason: .transport)
    }

    guard isAllowedRemoteURL(manifestResponse.finalURL, allowedHosts: validated.allowedHosts) else {
      return .keptLastKnownGood(catalog: stored?.catalog, reason: .invalidConfiguration)
    }
    if manifestResponse.statusCode == 304 {
      guard let stored else {
        return .keptLastKnownGood(catalog: nil, reason: .invalidManifest)
      }
      return .notModified(stored.catalog)
    }
    guard manifestResponse.statusCode == 200 else {
      return .keptLastKnownGood(
        catalog: stored?.catalog,
        reason: .httpStatus(manifestResponse.statusCode)
      )
    }
    guard manifestResponse.data.count <= Self.maximumManifestBytes else {
      return .keptLastKnownGood(catalog: stored?.catalog, reason: .invalidManifest)
    }

    let signatureResponse: CatalogHTTPResponse
    do {
      signatureResponse = try await transport.get(validated.signatureURL, etag: nil)
    } catch {
      return .keptLastKnownGood(catalog: stored?.catalog, reason: .transport)
    }
    guard signatureResponse.statusCode == 200 else {
      return .keptLastKnownGood(
        catalog: stored?.catalog,
        reason: .httpStatus(signatureResponse.statusCode)
      )
    }
    guard isAllowedRemoteURL(signatureResponse.finalURL, allowedHosts: validated.allowedHosts),
      signatureResponse.data.count == 64,
      validated.publicKey.isValidSignature(signatureResponse.data, for: manifestResponse.data)
    else {
      return .keptLastKnownGood(catalog: stored?.catalog, reason: .invalidSignature)
    }

    let candidate: AcceptedRemoteCatalog
    do {
      candidate = try decodeAndValidate(
        manifestResponse.data,
        configuration: validated
      )
    } catch {
      return .keptLastKnownGood(catalog: stored?.catalog, reason: .invalidManifest)
    }

    if let archive {
      if candidate.catalog.generation < archive.highestAccepted {
        return .keptLastKnownGood(
          catalog: stored?.catalog,
          reason: .replay(
            highestAccepted: archive.highestAccepted,
            received: candidate.catalog.generation
          )
        )
      }
      if candidate.catalog.generation == archive.highestAccepted {
        guard let stored, candidate.manifestBytes == stored.catalog.manifestBytes else {
          return .keptLastKnownGood(
            catalog: stored?.catalog,
            reason: .equivocation(generation: candidate.catalog.generation)
          )
        }
        return .notModified(stored.catalog)
      }
      if let mutatedKey = versionMutation(in: candidate, comparedWith: archive.packIdentities) {
        return .keptLastKnownGood(
          catalog: stored?.catalog,
          reason: .versionMutation(mutatedKey)
        )
      }
    }

    do {
      try persist(
        candidate,
        signature: signatureResponse.data,
        etag: manifestResponse.etag,
        configuration: validated,
        existingArchive: archive
      )
      return .accepted(candidate)
    } catch {
      return .keptLastKnownGood(catalog: stored?.catalog, reason: .io)
    }
  }

  private func validate(_ configuration: RemoteCatalogConfiguration) throws
    -> ValidatedConfiguration
  {
    guard configuration.publicKey.count == 32,
      let publicKey = try? Curve25519.Signing.PublicKey(rawRepresentation: configuration.publicKey),
      !configuration.allowedHosts.isEmpty,
      isAllowedRemoteURL(
        configuration.catalogBaseURL,
        allowedHosts: configuration.allowedHosts,
        allowDirectory: true
      )
    else { throw CatalogFailure.invalidConfiguration }

    let manifestURL = configuration.catalogBaseURL.appending(path: "manifest.json")
    let signatureURL = configuration.catalogBaseURL.appending(path: "manifest.sig")
    guard isAllowedRemoteURL(manifestURL, allowedHosts: configuration.allowedHosts),
      isAllowedRemoteURL(signatureURL, allowedHosts: configuration.allowedHosts)
    else { throw CatalogFailure.invalidConfiguration }
    return ValidatedConfiguration(
      manifestURL: manifestURL,
      signatureURL: signatureURL,
      allowedHosts: configuration.allowedHosts,
      publicKey: publicKey,
      publicKeyDigest: Self.sha256(configuration.publicKey)
    )
  }

  private func decodeAndValidate(
    _ bytes: Data,
    configuration: ValidatedConfiguration
  ) throws -> AcceptedRemoteCatalog {
    let json = try JSONSerialization.jsonObject(with: bytes)
    guard let root = json as? [String: Any] else { throw CatalogFailure.invalidManifest }
    try requireExactKeys(
      root,
      ["schemaVersion", "generation", "publishedAt", "assetBaseURL", "procedures"]
    )
    guard let procedures = root["procedures"] as? [[String: Any]] else {
      throw CatalogFailure.invalidManifest
    }
    for procedure in procedures {
      try requireExactKeys(
        procedure,
        [
          "id", "version", "revision", "sceneSchemaVersion", "minimumAppBuild", "locales",
          "requiredCapabilities", "files", "provenanceId",
        ]
      )
      guard let files = procedure["files"] as? [[String: Any]] else {
        throw CatalogFailure.invalidManifest
      }
      for file in files {
        try requireExactKeys(file, ["role", "path", "sha256", "bytes"])
      }
    }

    let document = try JSONDecoder().decode(RemoteCatalogDocument.self, from: bytes)
    guard document.schemaVersion == Self.schemaVersion,
      document.generation >= 1,
      Self.validTimestamp(document.publishedAt),
      document.procedures.map(\.id) == Self.procedureIDs,
      let assetBaseURL = URL(string: document.assetBaseURL),
      isAllowedRemoteURL(
        assetBaseURL,
        allowedHosts: configuration.allowedHosts,
        allowDirectory: true
      )
    else { throw CatalogFailure.invalidManifest }

    var packDirectories: [PackKey: String] = [:]
    for procedure in document.procedures {
      guard Self.isSemanticVersion(procedure.version),
        procedure.revision >= 1,
        procedure.sceneSchemaVersion == 1,
        procedure.minimumAppBuild >= 1,
        procedure.locales == ["en", "ja"],
        procedure.requiredCapabilities == Self.requiredCapabilities,
        procedure.provenanceId == "\(procedure.id)_provenance",
        procedure.files.count == Self.roleFileNames.count,
        Set(procedure.files.map(\.role)) == Set(Self.roleFileNames.keys),
        Set(procedure.files.map(\.path)).count == procedure.files.count
      else { throw CatalogFailure.invalidManifest }

      let key = PackKey(id: procedure.id, version: procedure.version)
      var directory: String?
      var totalBytes = 0
      var packMetadataHash: String?
      for file in procedure.files {
        guard let expectedName = Self.roleFileNames[file.role],
          file.bytes >= 1,
          file.sha256.count == 64,
          file.sha256.allSatisfy({ $0.isHexDigit && !$0.isUppercase }),
          isSafeRelativeCatalogPath(file.path),
          URL(fileURLWithPath: file.path).lastPathComponent == expectedName
        else { throw CatalogFailure.invalidManifest }
        let components = file.path.split(separator: "/").map(String.init)
        guard components.count == 5,
          components[0] == "packs",
          components[1] == procedure.id,
          components[2] == procedure.version,
          components[3].count == 16,
          components[3].allSatisfy({ $0.isHexDigit && !$0.isUppercase })
        else { throw CatalogFailure.invalidManifest }
        let candidateDirectory = components.dropLast().joined(separator: "/")
        if let directory, directory != candidateDirectory {
          throw CatalogFailure.invalidManifest
        }
        directory = candidateDirectory
        let (sum, overflow) = totalBytes.addingReportingOverflow(file.bytes)
        guard !overflow else { throw CatalogFailure.invalidManifest }
        totalBytes = sum
        if file.role == "pack-metadata" { packMetadataHash = file.sha256 }
      }
      guard totalBytes <= Self.maximumPackBytes,
        let directory,
        let packMetadataHash,
        directory.split(separator: "/").last.map(String.init) == String(packMetadataHash.prefix(16))
      else { throw CatalogFailure.invalidManifest }
      packDirectories[key] = directory
    }
    let contentCatalog = try JSONDecoder().decode(ContentCatalog.self, from: bytes)
    return AcceptedRemoteCatalog(
      catalog: contentCatalog,
      assetBaseURL: assetBaseURL,
      manifestBytes: bytes,
      packDirectories: packDirectories,
      allowedHosts: configuration.allowedHosts
    )
  }

  private func loadArchive(using configuration: ValidatedConfiguration) throws
    -> StoredCatalogArchive?
  {
    let url = storageURL
    guard FileManager.default.fileExists(atPath: url.path) else { return nil }
    let envelope = try JSONDecoder().decode(
      StoredCatalogArchiveEnvelope.self,
      from: Data(contentsOf: url)
    )
    guard envelope.manifestURL == configuration.manifestURL.absoluteString,
      envelope.publicKeyDigest == configuration.publicKeyDigest,
      envelope.records.count >= 1,
      envelope.records.count <= Self.maximumRetainedCatalogs
    else { throw CatalogFailure.io }
    var catalogs: [StoredCatalog] = []
    for record in envelope.records {
      guard record.signature.count == 64,
        configuration.publicKey.isValidSignature(record.signature, for: record.manifest)
      else { throw CatalogFailure.io }
      let catalog = try decodeAndValidate(record.manifest, configuration: configuration)
      guard catalog.catalog.generation == record.generation else { throw CatalogFailure.io }
      catalogs.append(
        StoredCatalog(catalog: catalog, signature: record.signature, etag: record.etag)
      )
    }
    let generations = catalogs.map { $0.catalog.catalog.generation }
    guard generations == generations.sorted(by: >),
      Set(generations).count == generations.count,
      generations.first == envelope.highestAccepted
    else { throw CatalogFailure.io }
    return StoredCatalogArchive(
      highestAccepted: envelope.highestAccepted,
      catalogs: catalogs,
      packIdentities: envelope.packIdentities
    )
  }

  private func persist(
    _ catalog: AcceptedRemoteCatalog,
    signature: Data,
    etag: String?,
    configuration: ValidatedConfiguration,
    existingArchive: StoredCatalogArchive?
  ) throws {
    let directory = storageURL.deletingLastPathComponent()
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    let newRecord = StoredCatalogRecordEnvelope(
      generation: catalog.catalog.generation,
      manifest: catalog.manifestBytes,
      signature: signature,
      etag: etag
    )
    let retainedRecords = (existingArchive?.catalogs ?? []).prefix(
      Self.maximumRetainedCatalogs - 1
    ).map {
      StoredCatalogRecordEnvelope(
        generation: $0.catalog.catalog.generation,
        manifest: $0.catalog.manifestBytes,
        signature: $0.signature,
        etag: $0.etag
      )
    }
    var identities = existingArchive?.packIdentities ?? [:]
    for procedure in catalog.catalog.procedures {
      identities[Self.identityKey(for: procedure)] = Self.packIdentity(for: procedure)
    }
    let envelope = StoredCatalogArchiveEnvelope(
      manifestURL: configuration.manifestURL.absoluteString,
      publicKeyDigest: configuration.publicKeyDigest,
      highestAccepted: catalog.catalog.generation,
      records: [newRecord] + retainedRecords,
      packIdentities: identities
    )
    try JSONEncoder().encode(envelope).write(to: storageURL, options: [.atomic])
  }

  private var storageURL: URL {
    rootURL.appendingPathComponent("accepted-catalog.json")
  }

  private static func validTimestamp(_ value: String) -> Bool {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime]
    if formatter.date(from: value) != nil { return true }
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter.date(from: value) != nil
  }

  private static func isSemanticVersion(_ value: String) -> Bool {
    let components = value.split(separator: ".", omittingEmptySubsequences: false)
    guard components.count == 3 else { return false }
    return components.allSatisfy { component in
      !component.isEmpty
        && component.allSatisfy(\.isNumber)
        && (component == "0" || !component.hasPrefix("0"))
    }
  }

  private static func sha256(_ data: Data) -> String {
    SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
  }

  private func versionMutation(
    in candidate: AcceptedRemoteCatalog,
    comparedWith identities: [String: String]
  ) -> PackKey? {
    for procedure in candidate.catalog.procedures {
      let key = PackKey(id: procedure.id, version: procedure.version)
      if let prior = identities[Self.identityKey(for: procedure)],
        prior != Self.packIdentity(for: procedure)
      {
        return key
      }
    }
    return nil
  }

  private static func identityKey(for procedure: CatalogProcedure) -> String {
    "\(procedure.id)|\(procedure.version)"
  }

  private static func packIdentity(for procedure: CatalogProcedure) -> String {
    let identity = procedure.files.sorted { $0.role < $1.role }.map {
      "\($0.role)\u{0}\($0.path)\u{0}\($0.sha256)\u{0}\($0.bytes)"
    }.joined(separator: "\u{1f}")
    return sha256(Data(identity.utf8))
  }
}

private struct ValidatedConfiguration: Sendable {
  let manifestURL: URL
  let signatureURL: URL
  let allowedHosts: Set<String>
  let publicKey: Curve25519.Signing.PublicKey
  let publicKeyDigest: String
}

private struct StoredCatalogArchive: Sendable {
  let highestAccepted: Int
  let catalogs: [StoredCatalog]
  let packIdentities: [String: String]
}

private struct StoredCatalog: Sendable {
  let catalog: AcceptedRemoteCatalog
  let signature: Data
  let etag: String?
}

private struct StoredCatalogArchiveEnvelope: Codable {
  let manifestURL: String
  let publicKeyDigest: String
  let highestAccepted: Int
  let records: [StoredCatalogRecordEnvelope]
  let packIdentities: [String: String]
}

private struct StoredCatalogRecordEnvelope: Codable {
  let generation: Int
  let manifest: Data
  let signature: Data
  let etag: String?
}

private struct RemoteCatalogDocument: Decodable {
  let schemaVersion: Int
  let generation: Int
  let publishedAt: String
  let assetBaseURL: String
  let procedures: [RemoteCatalogProcedure]
}

private struct RemoteCatalogProcedure: Decodable {
  let id: String
  let version: String
  let revision: Int
  let sceneSchemaVersion: Int
  let minimumAppBuild: Int
  let locales: [String]
  let requiredCapabilities: [String]
  let files: [RemoteCatalogFile]
  let provenanceId: String
}

private struct RemoteCatalogFile: Decodable {
  let role: String
  let path: String
  let sha256: String
  let bytes: Int
}

private func requireExactKeys(_ object: [String: Any], _ expected: Set<String>) throws {
  guard Set(object.keys) == expected else { throw CatalogFailure.invalidManifest }
}

private func isAllowedRemoteURL(
  _ url: URL,
  allowedHosts: Set<String>,
  allowDirectory: Bool = false
) -> Bool {
  guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
    components.scheme?.lowercased() == "https",
    let host = components.host?.lowercased(),
    allowedHosts.contains(host),
    components.user == nil,
    components.password == nil,
    components.query == nil,
    components.fragment == nil,
    !components.path.isEmpty,
    allowDirectory || components.path.last != "/",
    !components.path.contains("\\")
  else { return false }
  return components.path.split(separator: "/").allSatisfy { component in
    component != "." && component != ".."
  }
}

private func isSafeRelativeCatalogPath(_ path: String) -> Bool {
  let components = path.split(separator: "/", omittingEmptySubsequences: false)
  return !path.isEmpty
    && !path.hasPrefix("/")
    && components.allSatisfy { !$0.isEmpty && $0 != "." && $0 != ".." }
    && !path.contains("\\")
    && !path.contains(":")
    && !path.unicodeScalars.contains { $0.value < 0x20 }
}
