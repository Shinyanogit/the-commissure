import CommissureCore
import CryptoKit
import Foundation

struct NativeAssetManifest: Decodable, Sendable {
  struct Entry: Decodable, Sendable {
    let id: String
    let filename: String
    let sha256: String
    let bytes: Int
    let entityCount: Int
    let entityPaths: [String]
  }
  let schemaVersion: Int
  let procedures: [Entry]
}

actor NativeAssetStore {
  private let root: URL

  init(root: URL) { self.root = root }

  func verifiedModel(for bundle: ProcedureBundle) throws -> URL {
    let manifest = try JSONDecoder().decode(
      NativeAssetManifest.self, from: Data(contentsOf: root.appendingPathComponent("manifest.json"))
    )
    let ids = manifest.procedures.map(\.id)
    guard manifest.schemaVersion == 1, Set(ids).count == ids.count,
      Set(ids) == Set(["acdf", "accf", "pcdf", "pcf"]),
      let entry = manifest.procedures.first(where: { $0.id == bundle.procedure.id }),
      entry.filename == "\(entry.id)/model.usdz", entry.bytes > 0,
      entry.sha256.count == 64, entry.sha256.allSatisfy({ "0123456789abcdef".contains($0) }),
      Set(entry.entityPaths).count == entry.entityPaths.count,
      entry.entityPaths.count == entry.entityCount,
      Set(bundle.scene.parts.map(\.entityPath)).isSubset(of: Set(entry.entityPaths))
    else { throw ContentStoreError.incompatible("native asset manifest") }
    let url = root.appendingPathComponent(entry.filename)
    guard url.resolvingSymlinksInPath().path.hasPrefix(root.resolvingSymlinksInPath().path + "/")
    else {
      throw ContentStoreError.incompatible("native asset path")
    }
    let data = try Data(contentsOf: url, options: .mappedIfSafe)
    guard data.count == entry.bytes,
      SHA256.hash(data: data).map({ String(format: "%02x", $0) }).joined() == entry.sha256
    else { throw ContentStoreError.incompatible("native asset integrity") }
    return url
  }

  func validatesBundledAvailability() -> Bool {
    FileManager.default.fileExists(atPath: root.appendingPathComponent("manifest.json").path)
  }
}
