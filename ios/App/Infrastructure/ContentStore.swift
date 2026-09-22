import CommissureCore
import CryptoKit
import Foundation

struct LibraryItem: Equatable, Identifiable, Sendable {
  let id: String
  let title: String
  let summary: String
  let stepCount: Int
}

enum ContentStoreError: Error, Equatable {
  case missing(String)
  case incompatible(String)
}

actor ContentStore {
  private let contentRoot: URL
  private let decoder = JSONDecoder()

  init(contentRoot: URL) {
    self.contentRoot = contentRoot
  }

  func loadCatalog() throws -> ContentCatalog {
    let catalog = try decode("catalog/catalog.json", as: ContentCatalog.self)
    guard catalog.schemaVersion == 1, catalog.generation >= 1,
      Set(catalog.procedures.map(\.id)) == Set(["acdf", "accf", "pcdf", "pcf"]),
      catalog.procedures.count == 4
    else { throw ContentStoreError.incompatible("catalog") }
    return catalog
  }

  func library(locale: String) throws -> [LibraryItem] {
    let catalog = try loadCatalog()
    return try catalog.procedures.map { entry in
      let bundle = try procedure(id: entry.id, locale: locale)
      let procedure = bundle.procedure
      let localization = bundle.localization
      guard let title = localization.strings[procedure.titleKey],
        let summary = localization.strings[procedure.summaryKey]
      else { throw ContentStoreError.incompatible(entry.id) }
      return LibraryItem(
        id: entry.id,
        title: title,
        summary: summary,
        stepCount: procedure.steps.count
      )
    }
  }

  func procedure(id: String, locale: String) throws -> ProcedureBundle {
    guard ["en", "ja"].contains(locale),
      let entry = try loadCatalog().procedures.first(where: { $0.id == id }),
      entry.sceneSchemaVersion == 1, entry.minimumAppBuild <= 1
    else {
      throw ContentStoreError.incompatible(id)
    }
    for file in entry.files {
      guard file.path.hasPrefix("content/") else { throw ContentStoreError.incompatible(file.path) }
      let data = try Data(contentsOf: validatedURL(String(file.path.dropFirst("content/".count))))
      guard data.count == file.bytes,
        SHA256.hash(data: data).map({ String(format: "%02x", $0) }).joined() == file.sha256
      else {
        throw ContentStoreError.incompatible(file.path)
      }
    }
    let procedure = try decode("procedures/\(id)/procedure.json", as: ProcedureDefinition.self)
    let scene = try decode("ios-scenes/\(id).json", as: SceneDefinition.self)
    let localization = try decode(
      "procedures/\(id)/\(locale).json",
      as: LocalizationDocument.self
    )
    _ = try SceneStateResolver(procedure: procedure, scene: scene)
    guard procedure.schemaVersion == 1, scene.schemaVersion == 1,
      localization.schemaVersion == 1, procedure.id == id,
      procedure.version == entry.version, procedure.revision == entry.revision,
      procedure.locales == ["en", "ja"], localization.locale == locale,
      localization.procedureId == id, localization.revision == procedure.revision,
      [procedure.titleKey, procedure.summaryKey].allSatisfy({ localization.strings[$0] != nil }),
      procedure.steps.allSatisfy({
        localization.strings[$0.titleKey] != nil && localization.strings[$0.bodyKey] != nil
          && localization.strings[$0.accessibilitySummaryKey] != nil
      })
    else {
      throw ContentStoreError.incompatible(id)
    }
    return ProcedureBundle(procedure: procedure, scene: scene, localization: localization)
  }

  private func validatedURL(_ path: String) throws -> URL {
    guard !path.hasPrefix("/"), !path.contains("\\"),
      path.split(separator: "/", omittingEmptySubsequences: false).allSatisfy({
        !$0.isEmpty && $0 != "." && $0 != ".."
      })
    else { throw ContentStoreError.incompatible(path) }
    let url = contentRoot.appendingPathComponent(path).resolvingSymlinksInPath()
    guard url.path.hasPrefix(contentRoot.resolvingSymlinksInPath().path + "/") else {
      throw ContentStoreError.incompatible(path)
    }
    return url
  }

  private func decode<T: Decodable>(_ relativePath: String, as type: T.Type) throws -> T {
    let url = try validatedURL(relativePath)
    guard let data = try? Data(contentsOf: url) else {
      throw ContentStoreError.missing(relativePath)
    }
    return try decoder.decode(type, from: data)
  }
}
