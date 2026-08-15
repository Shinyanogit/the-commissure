import SwiftUI

enum DesignTokens {
  enum Color {
    static let stageBlack = SwiftUI.Color(red: 5 / 255, green: 6 / 255, blue: 7 / 255)
    static let stageSurface = SwiftUI.Color(red: 16 / 255, green: 20 / 255, blue: 22 / 255)
    static let textPrimary = SwiftUI.Color.white
    static let textSecondary = SwiftUI.Color.white.opacity(0.68)
    static let cyan = SwiftUI.Color(red: 0, green: 1, blue: 1)
    static let teal = SwiftUI.Color(red: 0, green: 155 / 255, blue: 158 / 255)
    static let bone = SwiftUI.Color(red: 240 / 255, green: 230 / 255, blue: 212 / 255)
    static let disc = SwiftUI.Color(red: 242 / 255, green: 233 / 255, blue: 228 / 255)
    static let ligament = SwiftUI.Color(red: 245 / 255, green: 242 / 255, blue: 235 / 255)
    static let cord = SwiftUI.Color(red: 189 / 255, green: 156 / 255, blue: 70 / 255)
    static let nerve = SwiftUI.Color(red: 1, green: 219 / 255, blue: 88 / 255)
  }

  enum Spacing {
    static let grid: CGFloat = 8
    static let compact: CGFloat = 8
    static let regular: CGFloat = 16
    static let spacious: CGFloat = 24
    static let edge: CGFloat = 20
  }

  enum Radius {
    static let card: CGFloat = 20
    static let panel: CGFloat = 16
    static let control: CGFloat = 12
  }

  enum Opacity {
    static let stageScrim = 0.8
    static let inactive = 0.48
  }
}

struct ActionDescriptor: Sendable {
  let systemImage: String
  let labelKey: String
  let hintKey: String
}

enum ActionDescriptors {
  static func descriptor(for action: AppAction) -> ActionDescriptor? {
    switch action {
    case .back:
      ActionDescriptor(
        systemImage: "chevron.backward", labelKey: "action.back", hintKey: "action.back.hint")
    case .resetView:
      ActionDescriptor(
        systemImage: "arrow.counterclockwise", labelKey: "action.reset",
        hintKey: "action.reset.hint")
    case .previousStep:
      ActionDescriptor(
        systemImage: "chevron.left", labelKey: "action.previous", hintKey: "action.previous.hint")
    case .nextStep:
      ActionDescriptor(
        systemImage: "chevron.right", labelKey: "action.next", hintKey: "action.next.hint")
    case .expandTray:
      ActionDescriptor(
        systemImage: "chevron.up", labelKey: "action.expand", hintKey: "action.expand.hint")
    case .collapseTray:
      ActionDescriptor(
        systemImage: "chevron.down", labelKey: "action.collapse", hintKey: "action.collapse.hint")
    case .openProcedure: nil
    case .download:
      ActionDescriptor(
        systemImage: "arrow.down.circle", labelKey: "action.download",
        hintKey: "action.download.hint")
    case .cancelDownload:
      ActionDescriptor(
        systemImage: "xmark", labelKey: "action.cancel", hintKey: "action.cancel.hint")
    case .retry:
      ActionDescriptor(
        systemImage: "arrow.clockwise", labelKey: "action.retry", hintKey: "action.retry.hint")
    case .openColophon:
      ActionDescriptor(
        systemImage: "info.circle", labelKey: "action.about", hintKey: "action.about.hint")
    case .openSettings:
      ActionDescriptor(
        systemImage: "gearshape", labelKey: "action.settings", hintKey: "action.settings.hint")
    case .changeLanguage:
      ActionDescriptor(
        systemImage: "globe", labelKey: "action.language", hintKey: "action.language.hint")
    case .selectStep: nil
    }
  }
}
