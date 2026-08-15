import MetricKit
import OSLog

enum Diagnostics {
  static let content = Logger(subsystem: "app.thecommissure.ios", category: "content")
  static let assets = Logger(subsystem: "app.thecommissure.ios", category: "assets")
  static let scene = Logger(subsystem: "app.thecommissure.ios", category: "scene")
  static let signposter = OSSignposter(subsystem: "app.thecommissure.ios", category: "performance")

  @MainActor
  static func installMetricSubscriber() {
    _ = MetricSubscriber.shared
  }
}

final class MetricSubscriber: NSObject, MXMetricManagerSubscriber, @unchecked Sendable {
  static let shared = MetricSubscriber()

  private override init() {
    super.init()
    MXMetricManager.shared.add(self)
  }

  func didReceive(_ payloads: [MXMetricPayload]) {
    Diagnostics.scene.info("Received \(payloads.count, privacy: .public) metric payloads")
  }

  func didReceive(_ payloads: [MXDiagnosticPayload]) {
    Diagnostics.scene.error("Received \(payloads.count, privacy: .public) diagnostic payloads")
  }
}
