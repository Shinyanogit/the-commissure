import Foundation

@testable import TheCommissure

func testContentRoot() -> URL {
  let bundledRoots = [
    Bundle(identifier: "app.thecommissure.ios")?.resourceURL,
    Bundle.main.resourceURL,
  ].compactMap { $0?.appendingPathComponent("content", isDirectory: true) }

  if let bundledRoot = bundledRoots.first(where: { containsCatalog(at: $0) }) {
    return bundledRoot
  }

  return URL(fileURLWithPath: #filePath)
    .deletingLastPathComponent()
    .deletingLastPathComponent()
    .deletingLastPathComponent()
    .appendingPathComponent("content", isDirectory: true)
}

private func containsCatalog(at root: URL) -> Bool {
  FileManager.default.fileExists(atPath: root.appendingPathComponent("catalog/catalog.json").path)
}
