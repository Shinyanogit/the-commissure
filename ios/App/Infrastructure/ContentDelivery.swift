import CommissureCore
import Foundation
import Observation

@MainActor
@Observable
final class ContentDelivery {
  private let catalogs: SignedCatalogStore
  private let storageRoot: URL
  private let session: URLSession
  private var accepted: AcceptedRemoteCatalog?
  private var assets: AssetStore?
  private var transfers: [String: Task<Void, Never>] = [:]
  private(set) var offers: [String: ManifestPack] = [:]
  private(set) var installed: [String: InstalledPack] = [:]
  private var candidates: [String: InstalledPack] = [:]
  private var candidateManifests: [String: ManifestPack] = [:]
  private var installedManifests: [String: ManifestPack] = [:]
  private(set) var updating: Set<String> = []
  private(set) var failed: Set<String> = []
  private(set) var isClearingDownloads = false
  private(set) var refreshFailed = false

  init(configuration: RemoteCatalogConfiguration?, storageRoot: URL) {
    self.storageRoot = storageRoot
    catalogs = SignedCatalogStore(
      configuration: configuration,
      rootURL: storageRoot.appendingPathComponent("catalog"))
    let config = URLSessionConfiguration.ephemeral
    config.allowsConstrainedNetworkAccess = false
    config.timeoutIntervalForRequest = 30
    config.timeoutIntervalForResource = 300
    session = URLSession(configuration: config)
  }

  func restoreAndRefresh() async {
    if let cached = await catalogs.lastKnownGood() { await accept(cached) }
    await refresh()
  }

  func refresh() async {
    guard updating.isEmpty else { return }
    switch await catalogs.refresh() {
    case .accepted(let catalog), .notModified(let catalog):
      refreshFailed = false
      await accept(catalog)
    case .keptLastKnownGood(let catalog, _):
      refreshFailed = true
      if let catalog { await accept(catalog) }
    case .unconfigured:
      break
    }
  }

  func update(_ id: String) {
    guard !isClearingDownloads, transfers[id] == nil, let pack = offers[id], let assets,
      pack.minimumBuild <= appBuild
    else { return }
    updating.insert(id)
    failed.remove(id)
    transfers[id] = Task { [weak self] in
      do {
        let installed = try await assets.acquire(pack)
        try Task.checkCancellation()
        _ = try await RemoteContentReader.shared.read(installed: installed, locale: "en")
        _ = try await RemoteContentReader.shared.read(installed: installed, locale: "ja")
        try Task.checkCancellation()
        self?.candidates[id] = installed
        self?.candidateManifests[id] = pack
      } catch {
        if !Task.isCancelled { self?.failed.insert(id) }
      }
      self?.updating.remove(id)
      self?.transfers[id] = nil
    }
  }

  func cancel(_ id: String) {
    transfers[id]?.cancel()
    if let pack = offers[id], let assets { Task { await assets.cancel(pack.key) } }
  }

  func content(id: String, locale: String, modelURL: URL? = nil) async -> (ProcedureBundle, URL)? {
    let choices = [
      (candidates[id], candidateManifests[id]), (installed[id], installedManifests[id]),
    ]
    guard !isClearingDownloads, let assets else { return nil }
    for (local, manifest) in choices {
      guard let local, let manifest else { continue }
      let url = local.directory.appendingPathComponent("model.usdz")
      guard modelURL == nil || modelURL == url else { continue }
      guard await assets.cachedPack(for: manifest) != nil else {
        reject(id: id, modelURL: url)
        continue
      }
      do {
        return (try await RemoteContentReader.shared.read(installed: local, locale: locale), url)
      } catch {
        reject(id: id, modelURL: url)
      }
    }
    return nil
  }

  func activate(id: String, modelURL: URL) {
    guard let candidate = candidates[id],
      candidate.directory.appendingPathComponent("model.usdz") == modelURL
    else { return }
    installed[id] = candidate
    installedManifests[id] = candidateManifests[id]
    candidates[id] = nil
    candidateManifests[id] = nil
    failed.remove(id)
    persistActive()
  }

  func reject(id: String, modelURL: URL) {
    if candidates[id]?.directory.appendingPathComponent("model.usdz") == modelURL {
      candidates[id] = nil
      candidateManifests[id] = nil
    }
    if installed[id]?.directory.appendingPathComponent("model.usdz") == modelURL {
      installed[id] = nil
      installedManifests[id] = nil
      persistActive()
    }
    failed.insert(id)
  }

  func hasUpdate(_ id: String) -> Bool {
    guard let offer = offers[id], !updating.contains(id) else { return false }
    if let local = candidates[id] ?? installed[id] { return local.key != offer.key }
    return offer.key.version != "1.0.0"
  }

  private func persistActive() {
    if let data = try? JSONEncoder().encode(installed.mapValues(\.key)) {
      try? data.write(to: storageRoot.appendingPathComponent("active.json"), options: .atomic)
    }
  }

  func clearDownloads(activeProcedureID: String?) async {
    guard !isClearingDownloads, updating.isEmpty, activeProcedureID == nil else { return }
    isClearingDownloads = true
    defer { isClearingDownloads = false }
    guard let assets else { return }
    for pack in Array(installed.values) + Array(candidates.values) {
      try? await assets.evict(pack.key, protecting: [])
    }
    installed = [:]
    candidates = [:]
    candidateManifests = [:]
    installedManifests = [:]
    persistActive()
  }

  private var appBuild: Int {
    Int(Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "1") ?? 1
  }

  private func accept(_ catalog: AcceptedRemoteCatalog) async {
    guard updating.isEmpty else { return }
    accepted = catalog
    let assetStore = AssetStore(
      rootURL: storageRoot.appendingPathComponent("assets"),
      source: catalog.makeAssetSource(session: session))
    assets = assetStore
    try? await assetStore.recoverStaging()
    offers = Dictionary(
      uniqueKeysWithValues: catalog.catalog.procedures.compactMap { entry in
        guard let pack = catalog.manifestPack(id: entry.id), pack.minimumBuild <= appBuild else {
          return nil
        }
        return (entry.id, pack)
      })
    let activeKeys =
      (try? Data(contentsOf: storageRoot.appendingPathComponent("active.json")))
      .flatMap { try? JSONDecoder().decode([String: PackKey].self, from: $0) } ?? [:]
    for retained in await catalogs.retainedCatalogs() {
      for entry in retained.catalog.procedures {
        guard let manifest = retained.manifestPack(id: entry.id),
          activeKeys[entry.id] == manifest.key,
          let cached = await assetStore.cachedPack(for: manifest)
        else { continue }
        installed[entry.id] = cached
        installedManifests[entry.id] = manifest
      }
    }
    for (id, offer) in offers {
      if let cached = await assetStore.cachedPack(for: offer) {
        let activeKeys =
          (try? Data(contentsOf: storageRoot.appendingPathComponent("active.json")))
          .flatMap { try? JSONDecoder().decode([String: PackKey].self, from: $0) } ?? [:]
        if activeKeys[id] == cached.key {
          installed[id] = cached
          installedManifests[id] = offer
        } else {
          candidates[id] = cached
          candidateManifests[id] = offer
        }
      }
    }
  }
}

actor RemoteContentReader {
  static let shared = RemoteContentReader()
  func read(installed: InstalledPack, locale: String) throws -> ProcedureBundle {
    guard ["en", "ja"].contains(locale) else { throw ContentStoreError.incompatible(locale) }
    let decoder = JSONDecoder()
    func decode<T: Decodable>(_ filename: String, as type: T.Type) throws -> T {
      try decoder.decode(
        type, from: Data(contentsOf: installed.directory.appendingPathComponent(filename)))
    }
    let procedure = try decode("procedure.json", as: ProcedureDefinition.self)
    let scene = try decode("scene.json", as: SceneDefinition.self)
    let localization = try decode("\(locale).json", as: LocalizationDocument.self)
    _ = try SceneStateResolver(procedure: procedure, scene: scene)
    guard procedure.schemaVersion == 1, localization.schemaVersion == 1,
      procedure.locales == ["en", "ja"],
      [procedure.titleKey, procedure.summaryKey].allSatisfy({ localization.strings[$0] != nil }),
      procedure.id == installed.key.id, procedure.version == installed.key.version,
      localization.procedureId == procedure.id, localization.locale == locale,
      localization.revision == procedure.revision,
      procedure.steps.allSatisfy({
        localization.strings[$0.titleKey] != nil
          && localization.strings[$0.bodyKey] != nil
          && localization.strings[$0.accessibilitySummaryKey] != nil
      })
    else { throw ContentStoreError.incompatible(installed.key.id) }
    return ProcedureBundle(procedure: procedure, scene: scene, localization: localization)
  }
}
