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
      preferences: preferences
    )
  }

  var body: some Scene {
    WindowGroup {
      FoundationView(model: model)
    }
  }
}
