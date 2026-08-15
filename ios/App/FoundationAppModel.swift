import CommissureCore
import Foundation
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
  private(set) var theaterViewState: TheaterViewState?
  private var loadGeneration: UInt64 = 0
  private var activeBundle: ProcedureBundle?
  private var activeSessionController: ProcedureSessionController?

  var effectiveLocale: String { preferences.effectiveLocale }

  private func localized(_ key: String) -> String {
    let appBundle = Bundle(for: FoundationAppModel.self)
    let localeBundle =
      appBundle.path(forResource: effectiveLocale, ofType: "lproj")
      .flatMap(Bundle.init(path:))
      ?? appBundle
    return localeBundle.localizedString(forKey: key, value: nil, table: "Localizable")
  }

  var libraryViewState: LibraryViewState {
    switch state {
    case .idle, .loading:
      LibraryViewState(
        cards: [], locale: effectiveLocale, isLoading: true, showsLanguageControl: true)
    case .ready(let items):
      LibraryViewState(
        cards: items.map {
          LibraryCardViewState(
            id: $0.id,
            title: $0.title,
            summary: $0.summary,
            stepCount: $0.stepCount,
            stepCountLabel: String(format: localized("library.steps"), $0.stepCount),
            availability: .bundled,
            availabilityLabel: localized("library.status.bundled")
          )
        },
        locale: effectiveLocale,
        isLoading: false,
        showsLanguageControl: true
      )
    case .failed:
      LibraryViewState(
        cards: [], locale: effectiveLocale, isLoading: false, showsLanguageControl: true)
    }
  }

  init(contentStore: ContentStore, preferences: AppPreferences) {
    self.contentStore = contentStore
    self.preferences = preferences
    preferences.onLanguageChange = { [weak self] in
      self?.preferencesDidChange()
    }
  }

  func openProcedure(id: String) async {
    do {
      let bundle = try await contentStore.procedure(id: id, locale: effectiveLocale)
      let controller = try ProcedureSessionController(bundle: bundle)
      _ = try controller.setContentReady()
      activeBundle = bundle
      activeSessionController = controller
      theaterViewState = makeTheaterViewState()
    } catch {
      Diagnostics.content.error(
        "Procedure open failed: \(String(describing: error), privacy: .public)")
    }
  }

  func closeProcedure() {
    activeBundle = nil
    activeSessionController = nil
    theaterViewState = nil
  }

  func send(_ action: AppAction) {
    switch action {
    case .nextStep:
      sendIntent(.nextStep)
    case .previousStep:
      sendIntent(.previousStep)
    case .selectStep(let id):
      sendIntent(.selectStep(id))
    case .resetView:
      sendIntent(.resetView)
    case .download(let id), .cancelDownload(let id), .retry(let id):
      Diagnostics.content.info(
        "Transfer action deferred until the AssetStore route: \(id, privacy: .public)")
    case .back, .expandTray, .collapseTray, .changeLanguage(_), .openColophon, .openSettings,
      .openProcedure(_):
      return
    }
  }

  private func sendIntent(_ intent: ProcedureIntent) {
    guard let controller = activeSessionController else { return }
    do {
      _ = try controller.send(intent)
      theaterViewState = makeTheaterViewState()
    } catch {
      Diagnostics.content.error(
        "Procedure state update failed: \(String(describing: error), privacy: .public)")
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
    await reprojectActiveProcedure()
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

  private func reprojectActiveProcedure() async {
    guard let activeBundle, activeSessionController != nil else { return }
    do {
      self.activeBundle = try await contentStore.procedure(
        id: activeBundle.procedure.id, locale: effectiveLocale)
      theaterViewState = makeTheaterViewState()
    } catch {
      Diagnostics.content.error(
        "Procedure locale reprojection failed: \(String(describing: error), privacy: .public)")
    }
  }

  private func makeTheaterViewState() -> TheaterViewState? {
    guard let bundle = activeBundle, let controller = activeSessionController else { return nil }
    let procedure = bundle.procedure
    let strings = bundle.localization.strings
    let selectedIndex = controller.session.selectedIndex
    guard procedure.steps.indices.contains(selectedIndex) else { return nil }
    let selectedStep = procedure.steps[selectedIndex]
    let title = strings[procedure.titleKey] ?? procedure.id
    let stepTitle = strings[selectedStep.titleKey] ?? selectedStep.id
    let explanation = strings[selectedStep.bodyKey] ?? ""
    let accessibilitySummary = strings[selectedStep.accessibilitySummaryKey] ?? stepTitle

    return TheaterViewState(
      procedureID: procedure.id,
      procedureTitle: title,
      abbreviation: procedure.abbreviation,
      currentStep: selectedIndex + 1,
      totalSteps: procedure.steps.count,
      stepIDs: procedure.steps.map(\.id),
      stepLabels: procedure.steps.map { strings[$0.titleKey] ?? $0.id },
      stepTitle: stepTitle,
      explanation: explanation,
      accessibilitySummary: accessibilitySummary,
      trayDensity: .compact,
      sceneReadiness: .preparing,
      isExplanationExpanded: true,
      canGoPrevious: controller.session.capabilities.canGoPrevious,
      canGoNext: controller.session.capabilities.canGoNext,
      canReset: controller.session.isContentReady
    )
  }
}
