import Observation

@MainActor
@Observable
final class FoundationAppModel {
  enum State: Equatable {
    case idle
    case loading
    case ready([LibraryItem])
    case failed
  }

  private let contentStore: ContentStore
  private let preferences: AppPreferences
  private(set) var state: State = .idle
  private var loadGeneration: UInt64 = 0

  init(contentStore: ContentStore, preferences: AppPreferences) {
    self.contentStore = contentStore
    self.preferences = preferences
    preferences.onLanguageChange = { [weak self] in
      self?.preferencesDidChange()
    }
  }

  func loadBundledContent() async {
    guard state == .idle else { return }
    await loadCurrentLocale()
  }

  func setLanguage(_ language: AppLanguage) {
    preferences.language = language
  }

  private func reloadBundledContent() async {
    state = .loading
    await loadCurrentLocale()
  }

  private func loadCurrentLocale() async {
    loadGeneration &+= 1
    let generation = loadGeneration
    state = .loading
    do {
      let items = try await contentStore.library(locale: preferences.effectiveLocale)
      guard generation == loadGeneration else { return }
      state = .ready(items)
    } catch {
      guard generation == loadGeneration else { return }
      Diagnostics.content.error(
        "Bundled content load failed: \(String(describing: error), privacy: .public)")
      state = .failed
    }
  }

  private func preferencesDidChange() {
    Task { @MainActor [weak self] in
      await self?.reloadBundledContent()
    }
  }
}
