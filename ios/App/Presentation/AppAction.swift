import Foundation

enum AppAction: Hashable, Sendable {
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
