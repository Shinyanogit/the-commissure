import CommissureCore
import CryptoKit
import Foundation

struct PackPayload: Sendable {
  let files: [String: Data]
}

protocol AssetSource: Sendable {
  func fetch(_ pack: ManifestPack) async throws -> PackPayload
}

actor AssetStore {
  typealias CapacityProvider = @Sendable (URL) throws -> Int64

  private let rootURL: URL
  private let source: any AssetSource
  private let capacityProvider: CapacityProvider
  private let safetyReserve: Int64
  private var inFlight: [PackKey: Task<InstalledPack, Error>] = [:]
  private var activePackKey: PackKey?
  private var slotWaiters: [(key: PackKey, continuation: CheckedContinuation<Void, Never>)] = []

  init(
    rootURL: URL,
    source: any AssetSource,
    safetyReserve: Int64 = 50 * 1_024 * 1_024,
    capacityProvider: @escaping CapacityProvider = AssetStore.defaultCapacity
  ) {
    self.rootURL = rootURL
    self.source = source
    self.safetyReserve = safetyReserve
    self.capacityProvider = capacityProvider
  }

  func acquire(_ pack: ManifestPack) async throws -> InstalledPack {
    try validatePackKey(pack.key)
    if let cached = cachedPack(for: pack) { return cached }
    if let existing = inFlight[pack.key] { return try await value(of: existing) }

    let task = Task { try await self.fetchAndInstallSerially(pack) }
    inFlight[pack.key] = task
    do {
      let installed = try await task.value
      inFlight[pack.key] = nil
      return installed
    } catch is CancellationError {
      inFlight[pack.key] = nil
      throw AssetFailure.cancelled
    } catch {
      inFlight[pack.key] = nil
      throw error
    }
  }

  func cancel(_ key: PackKey) {
    inFlight[key]?.cancel()
  }

  func cachedPack(for pack: ManifestPack) -> InstalledPack? {
    guard Self.isSafePackComponent(pack.key.id), Self.isSafePackComponent(pack.key.version) else {
      return nil
    }
    let directory = packDirectory(for: pack.key)
    let marker = directory.appendingPathComponent("complete.json")
    guard FileManager.default.fileExists(atPath: marker.path),
      let data = try? Data(contentsOf: marker),
      let metadata = try? JSONDecoder().decode(InstallMarker.self, from: data),
      metadata.key == pack.key,
      metadata.files == pack.files
    else { return nil }
    guard let actualFiles = try? Self.fileSet(in: directory),
      actualFiles == Set(pack.files.map(\.path))
    else { return nil }
    for expected in pack.files {
      let url = directory.appendingPathComponent(expected.path)
      guard let bytes = try? Data(contentsOf: url),
        bytes.count == expected.bytes,
        Self.sha256(bytes) == expected.sha256
      else { return nil }
    }
    return InstalledPack(key: pack.key, directory: directory, installedAt: metadata.installedAt)
  }

  func recoverStaging() throws {
    let staging = rootURL.appendingPathComponent("staging", isDirectory: true)
    guard FileManager.default.fileExists(atPath: staging.path) else { return }
    for entry in try FileManager.default.contentsOfDirectory(
      at: staging,
      includingPropertiesForKeys: nil
    ) {
      try FileManager.default.removeItem(at: entry)
    }
  }

  func evict(_ key: PackKey, protecting protected: Set<PackKey>) throws -> Bool {
    try validatePackKey(key)
    guard key != activePackKey, inFlight[key] == nil, !protected.contains(key) else { return false }
    let directory = packDirectory(for: key)
    guard FileManager.default.fileExists(atPath: directory.path) else { return false }
    try FileManager.default.removeItem(at: directory)
    return true
  }

  private func fetchAndInstallSerially(_ pack: ManifestPack) async throws -> InstalledPack {
    await acquirePackSlot(for: pack.key)
    defer { releasePackSlot() }
    try Task.checkCancellation()
    if let cached = cachedPack(for: pack) { return cached }
    return try await fetchAndInstall(pack)
  }

  private func fetchAndInstall(_ pack: ManifestPack) async throws -> InstalledPack {
    try validatePackKey(pack.key)
    try validateExpectations(pack.files)
    try verifyCapacity(for: pack)

    let payload: PackPayload
    do {
      payload = try await source.fetch(pack)
      try Task.checkCancellation()
    } catch is CancellationError {
      throw AssetFailure.cancelled
    } catch let failure as AssetFailure {
      throw failure
    } catch {
      throw AssetFailure.offline
    }

    for expected in pack.files {
      guard Self.isSafeRelativePath(expected.path),
        let data = payload.files[expected.path],
        data.count == expected.bytes,
        Self.sha256(data) == expected.sha256
      else {
        throw AssetFailure.corrupt(path: expected.path)
      }
    }
    guard Set(payload.files.keys) == Set(pack.files.map(\.path)) else {
      throw AssetFailure.corrupt(path: "unexpected-file-set")
    }
    try verifyCapacity(for: pack)

    let fileManager = FileManager.default
    let stagingRoot = rootURL.appendingPathComponent("staging", isDirectory: true)
    try fileManager.createDirectory(at: stagingRoot, withIntermediateDirectories: true)
    let staging = stagingRoot.appendingPathComponent(UUID().uuidString, isDirectory: true)
    try fileManager.createDirectory(at: staging, withIntermediateDirectories: true)
    do {
      for expected in pack.files {
        try Task.checkCancellation()
        let destination = staging.appendingPathComponent(expected.path)
        try fileManager.createDirectory(
          at: destination.deletingLastPathComponent(),
          withIntermediateDirectories: true
        )
        try payload.files[expected.path]?.write(to: destination, options: .atomic)
      }
      let marker = InstallMarker(key: pack.key, files: pack.files, installedAt: Date())
      try JSONEncoder().encode(marker).write(
        to: staging.appendingPathComponent("complete.json"),
        options: .atomic
      )
      let final = packDirectory(for: pack.key)
      try fileManager.createDirectory(
        at: final.deletingLastPathComponent(),
        withIntermediateDirectories: true
      )
      if fileManager.fileExists(atPath: final.path) {
        try fileManager.removeItem(at: staging)
      } else {
        try fileManager.moveItem(at: staging, to: final)
      }
      guard let installed = cachedPack(for: pack) else { throw AssetFailure.io }
      return installed
    } catch is CancellationError {
      try? fileManager.removeItem(at: staging)
      throw AssetFailure.cancelled
    } catch let failure as AssetFailure {
      try? fileManager.removeItem(at: staging)
      throw failure
    } catch {
      try? fileManager.removeItem(at: staging)
      throw AssetFailure.io
    }
  }

  private func acquirePackSlot(for key: PackKey) async {
    guard activePackKey != nil else {
      activePackKey = key
      return
    }
    await withCheckedContinuation { continuation in
      slotWaiters.append((key, continuation))
    }
  }

  private func releasePackSlot() {
    guard !slotWaiters.isEmpty else {
      activePackKey = nil
      return
    }
    let next = slotWaiters.removeFirst()
    activePackKey = next.key
    next.continuation.resume()
  }

  private func value(of task: Task<InstalledPack, Error>) async throws -> InstalledPack {
    do {
      return try await task.value
    } catch is CancellationError {
      throw AssetFailure.cancelled
    }
  }

  private func packDirectory(for key: PackKey) -> URL {
    rootURL
      .appendingPathComponent("packs", isDirectory: true)
      .appendingPathComponent(key.id, isDirectory: true)
      .appendingPathComponent(key.version, isDirectory: true)
  }

  private func verifyCapacity(for pack: ManifestPack) throws {
    var payloadBytes: Int64 = 0
    for file in pack.files {
      let (sum, overflow) = payloadBytes.addingReportingOverflow(Int64(file.bytes))
      guard !overflow else { throw AssetFailure.corrupt(path: file.path) }
      payloadBytes = sum
    }
    let (stagedBytes, multiplicationOverflow) = payloadBytes.multipliedReportingOverflow(by: 2)
    let (required, additionOverflow) = stagedBytes.addingReportingOverflow(safetyReserve)
    guard !multiplicationOverflow, !additionOverflow else {
      throw AssetFailure.corrupt(path: "payload-size")
    }
    let available = try capacityProvider(rootURL)
    guard available >= required else {
      throw AssetFailure.insufficientStorage(required: required, available: available)
    }
  }

  private static func sha256(_ data: Data) -> String {
    SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
  }

  private func validateExpectations(_ files: [PackFileExpectation]) throws {
    let paths = files.map(\.path)
    guard Set(paths).count == paths.count else {
      throw AssetFailure.corrupt(path: "duplicate-path")
    }
    for file in files {
      guard file.bytes >= 0,
        Self.isSafeRelativePath(file.path),
        file.path != "complete.json",
        file.sha256.count == 64,
        file.sha256.allSatisfy({ $0.isHexDigit && !$0.isUppercase })
      else {
        throw AssetFailure.corrupt(path: file.path)
      }
    }
  }

  private func validatePackKey(_ key: PackKey) throws {
    guard Self.isSafePackComponent(key.id) else {
      throw AssetFailure.corrupt(path: "pack-id")
    }
    guard Self.isSafePackComponent(key.version) else {
      throw AssetFailure.corrupt(path: "pack-version")
    }
  }

  private static func fileSet(in directory: URL) throws -> Set<String> {
    guard
      let enumerator = FileManager.default.enumerator(
        at: directory,
        includingPropertiesForKeys: [.isDirectoryKey, .isRegularFileKey, .isSymbolicLinkKey],
        options: []
      )
    else {
      throw AssetFailure.io
    }
    var files: Set<String> = []
    for case let url as URL in enumerator {
      let values = try url.resourceValues(
        forKeys: [.isDirectoryKey, .isRegularFileKey, .isSymbolicLinkKey]
      )
      if values.isSymbolicLink == true {
        throw AssetFailure.corrupt(path: url.path)
      }
      if values.isDirectory == true { continue }
      guard values.isRegularFile == true else { throw AssetFailure.io }
      let relativePath = String(url.path.dropFirst(directory.path.count + 1))
      if relativePath != "complete.json" { files.insert(relativePath) }
    }
    return files
  }

  private static func isSafeRelativePath(_ path: String) -> Bool {
    let components = path.split(separator: "/", omittingEmptySubsequences: false)
    return !path.isEmpty
      && !path.hasPrefix("/")
      && components.allSatisfy({ !$0.isEmpty && $0 != "." && $0 != ".." })
      && !path.contains("\\")
      && !path.contains(":")
  }

  private static func isSafePackComponent(_ value: String) -> Bool {
    !value.isEmpty
      && value != "."
      && value != ".."
      && !value.contains("/")
      && !value.contains("\\")
      && !value.contains(":")
      && !value.unicodeScalars.contains(where: { $0.value < 0x20 })
  }

  private static func defaultCapacity(at url: URL) throws -> Int64 {
    try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
    let values = try url.resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey])
    return values.volumeAvailableCapacityForImportantUsage ?? 0
  }
}

private struct InstallMarker: Codable {
  let key: PackKey
  let files: [PackFileExpectation]
  let installedAt: Date
}

struct RemoteStaticAssetSource: AssetSource {
  let baseURL: URL
  let session: URLSession

  func fetch(_ pack: ManifestPack) async throws -> PackPayload {
    var files: [String: Data] = [:]
    for expected in pack.files {
      try Task.checkCancellation()
      let url = baseURL.appending(path: expected.path)
      let (data, response) = try await session.data(from: url)
      guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
        throw AssetFailure.offline
      }
      files[expected.path] = data
    }
    return PackPayload(files: files)
  }

  static func backgroundSession(identifier: String) -> URLSession {
    let configuration = URLSessionConfiguration.background(withIdentifier: identifier)
    configuration.allowsConstrainedNetworkAccess = false
    configuration.waitsForConnectivity = true
    return URLSession(configuration: configuration)
  }
}
