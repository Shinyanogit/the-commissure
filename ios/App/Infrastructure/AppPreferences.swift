import Foundation
import Observation

enum AppLanguage: String, CaseIterable, Sendable {
  case followSystem
  case english
  case japanese
}

@MainActor
@Observable
final class AppPreferences {
  private static let languageKey = "appLanguage"
  private let defaults: UserDefaults
  var onLanguageChange: (@MainActor () -> Void)?

  var language: AppLanguage {
    didSet {
      defaults.set(language.rawValue, forKey: Self.languageKey)
      onLanguageChange?()
    }
  }

  init(defaults: UserDefaults = .standard) {
    self.defaults = defaults
    language = defaults.string(forKey: Self.languageKey).flatMap(AppLanguage.init) ?? .followSystem
  }

  var effectiveLocale: String {
    switch language {
    case .english: "en"
    case .japanese: "ja"
    case .followSystem: Locale.preferredLanguages.first?.hasPrefix("ja") == true ? "ja" : "en"
    }
  }
}
