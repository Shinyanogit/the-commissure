import CommissureCore
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
    try decode("catalog/catalog.json", as: ContentCatalog.self)
  }

  func library(locale: String) throws -> [LibraryItem] {
    let catalog = try loadCatalog()
    return try catalog.procedures.map { entry in
      let procedure = try decode(
        "procedures/\(entry.id)/procedure.json",
        as: ProcedureDefinition.self
      )
      let localization = try decode(
        "procedures/\(entry.id)/\(locale).json",
        as: LocalizationDocument.self
      )
      guard procedure.id == entry.id,
        localization.procedureId == entry.id,
        localization.locale == locale,
        localization.revision == procedure.revision,
        let title = localization.strings[procedure.titleKey],
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
    let procedure = try decode("procedures/\(id)/procedure.json", as: ProcedureDefinition.self)
    let scene = try decode("ios-scenes/\(id).json", as: SceneDefinition.self)
    let localization = try decode(
      "procedures/\(id)/\(locale).json",
      as: LocalizationDocument.self
    )
    _ = try SceneStateResolver(procedure: procedure, scene: scene)
    guard localization.procedureId == id, localization.revision == procedure.revision else {
      throw ContentStoreError.incompatible(id)
    }
    return ProcedureBundle(procedure: procedure, scene: scene, localization: localization)
  }

  private func decode<T: Decodable>(_ relativePath: String, as type: T.Type) throws -> T {
    let url = contentRoot.appendingPathComponent(relativePath)
    guard let data = try? Data(contentsOf: url) else {
      throw ContentStoreError.missing(relativePath)
    }
    return try decoder.decode(type, from: data)
  }
}
