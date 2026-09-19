import Foundation

enum AppAction: Hashable, Sendable {
  case zoomIn, zoomOut, orbitLeft, orbitRight, orbitUp, orbitDown
  case expandExplanation, collapseExplanation, resetProgress, clearDownloads
  case back
  case resetView
  case previousStep
  case nextStep
  case selectStep(String)
  case expandTray
  case collapseTray
  case openProcedure(String)
  case download(String)
  case cancelDownload(String)
  case retry(String)
  case changeLanguage(AppLanguage)
  case openColophon
  case openSettings
}

extension AppAction {
  static func procedureLink(_ url: URL) -> AppAction? {
    switch url.absoluteString {
    case "procedure:acdf": .openProcedure("acdf")
    case "procedure:accf": .openProcedure("accf")
    case "procedure:pcdf": .openProcedure("pcdf")
    case "procedure:pcf": .openProcedure("pcf")
    default: nil
    }
  }
}
