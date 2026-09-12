import SwiftUI

@main
struct TheCommissureApp: App {
  private let model: FoundationAppModel

  init() {
    Diagnostics.installMetricSubscriber()
    let preferences = AppPreferences()
    let contentRoot =
      Bundle.main.resourceURL?.appendingPathComponent("content", isDirectory: true)
      ?? URL(fileURLWithPath: "/invalid-content-root")
    model = FoundationAppModel(
      contentStore: ContentStore(contentRoot: contentRoot),
      preferences: preferences,
      delivery: ContentDelivery(
        configuration: Self.remoteConfiguration(),
        storageRoot:
          FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
          .appendingPathComponent("ContentDelivery", isDirectory: true))
    )
  }

  private static func remoteConfiguration() -> RemoteCatalogConfiguration? {
    guard let base = Bundle.main.object(forInfoDictionaryKey: "ContentCatalogBaseURL") as? String,
      let url = URL(string: base),
      let encodedKey = Bundle.main.object(forInfoDictionaryKey: "ContentCatalogPublicKey")
        as? String,
      let key = Data(base64Encoded: encodedKey), key.count == 32,
      let hosts = Bundle.main.object(forInfoDictionaryKey: "ContentCatalogAllowedHosts")
        as? [String],
      !hosts.isEmpty
    else { return nil }
    return RemoteCatalogConfiguration(catalogBaseURL: url, allowedHosts: Set(hosts), publicKey: key)
  }

  var body: some Scene {
    WindowGroup {
      FoundationView(model: model)
    }
  }
}
