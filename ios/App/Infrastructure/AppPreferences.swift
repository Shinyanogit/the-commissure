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

  private struct Progress: Codable {
    let version: String
    let stepID: String
  }

  var trayExpanded: Bool {
    get { defaults.bool(forKey: "trayExpanded") }
    set { defaults.set(newValue, forKey: "trayExpanded") }
  }

  var explanationExpanded: Bool {
    get { defaults.object(forKey: "explanationExpanded") as? Bool ?? true }
    set { defaults.set(newValue, forKey: "explanationExpanded") }
  }

  func savedStep(for id: String, version: String) -> String? {
    guard let data = defaults.data(forKey: "progress.\(id)"),
      let progress = try? JSONDecoder().decode(Progress.self, from: data),
      progress.version == version
    else { return nil }
    return progress.stepID
  }

  func saveStep(_ stepID: String, procedureID: String, version: String) {
    if let data = try? JSONEncoder().encode(Progress(version: version, stepID: stepID)) {
      defaults.set(data, forKey: "progress.\(procedureID)")
    }
  }

  func resetProgress() {
    for key in defaults.dictionaryRepresentation().keys where key.hasPrefix("progress.") {
      defaults.removeObject(forKey: key)
    }
  }

  var effectiveLocale: String {
    switch language {
    case .english: "en"
    case .japanese: "ja"
    case .followSystem: Locale.preferredLanguages.first?.hasPrefix("ja") == true ? "ja" : "en"
    }
  }
}
