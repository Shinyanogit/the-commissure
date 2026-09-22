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
  let delivery: ContentDelivery?
  private(set) var state: State = .idle
  var theaterViewState: TheaterViewState? { makeTheaterViewState() }
  private(set) var sceneRuntime: ProcedureSceneRuntime?
  private let nativeAssets: NativeAssetStore
  private var openGeneration: UInt64 = 0
  private(set) var failedProcedureID: String?
  private(set) var isOpeningProcedure = false

  private var loadGeneration: UInt64 = 0
  private var activeRemoteModelURL: URL?
  private var activeBundle: ProcedureBundle?
  private var activeExplanationBodies: [String: String] = [:]
  private var activeSessionController: ProcedureSessionController?

  var effectiveLocale: String { preferences.effectiveLocale }
  var language: AppLanguage { preferences.language }

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
            availability: delivery?.installed[$0.id] != nil ? .cached : .bundled,
            availabilityLabel: localized("library.status.bundled"),
            updateBytes: delivery?.hasUpdate($0.id) == true
              ? delivery?.offers[$0.id]?.totalBytes : nil,
            isUpdating: delivery?.updating.contains($0.id) == true,
            updateFailed: delivery?.failed.contains($0.id) == true
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

  init(
    contentStore: ContentStore, preferences: AppPreferences, nativeAssets: NativeAssetStore? = nil,
    delivery: ContentDelivery? = nil
  ) {
    self.contentStore = contentStore
    self.delivery = delivery
    self.preferences = preferences
    self.nativeAssets =
      nativeAssets
      ?? NativeAssetStore(
        root: (Bundle.main.resourceURL ?? URL(fileURLWithPath: "/invalid-resources"))
          .appendingPathComponent("NativeAssets", isDirectory: true))
    preferences.onLanguageChange = { [weak self] in
      self?.preferencesDidChange()
    }
  }

  func openProcedure(id: String, useBundled: Bool = false) async {
    openGeneration &+= 1
    let generation = openGeneration
    isOpeningProcedure = true
    defer { if generation == openGeneration { isOpeningProcedure = false } }
    let locale = effectiveLocale
    failedProcedureID = nil
    do {
      let remote = useBundled ? nil : await delivery?.content(id: id, locale: locale)
      let bundle: ProcedureBundle
      if let remote {
        bundle = remote.0
      } else {
        bundle = try await contentStore.procedure(id: id, locale: locale)
      }
      let explanationBodies = await NativeExplanationCopy.bodies(
        procedure: id, locale: locale, strings: bundle.localization.strings)
      guard generation == openGeneration else { return }
      let controller = try ProcedureSessionController(bundle: bundle)
      if let step = preferences.savedStep(for: id, version: bundle.procedure.version) {
        _ = try controller.send(.selectStep(step))
      }
      sceneRuntime?.dispose()
      activeRemoteModelURL = remote?.1
      activeBundle = bundle
      activeExplanationBodies = explanationBodies
      activeSessionController = controller
      let runtime = ProcedureSceneRuntime(
        bundle: bundle, assets: nativeAssets, controller: controller, installedURL: remote?.1)
      runtime.onIntent = { [weak self] intent in self?.sendIntent(intent) }
      runtime.onReady = { [weak self] url in self?.delivery?.activate(id: id, modelURL: url) }
      if remote != nil {
        runtime.onFailure = { [weak self] in
          guard let self, self.openGeneration == generation else { return }
          if let url = remote?.1 { self.delivery?.reject(id: id, modelURL: url) }
          Task { await self.openProcedure(id: id) }
        }
      }
      sceneRuntime = runtime
      if locale != effectiveLocale { await reprojectActiveProcedure() }
    } catch {
      guard generation == openGeneration else { return }
      failedProcedureID = id
      Diagnostics.content.error(
        "Procedure open failed: \(String(describing: error), privacy: .public)")
    }
  }

  func closeProcedure() {
    openGeneration &+= 1
    isOpeningProcedure = false
    sceneRuntime?.dispose()
    sceneRuntime = nil
    activeRemoteModelURL = nil
    activeBundle = nil
    activeExplanationBodies = [:]
    activeSessionController = nil
    failedProcedureID = nil
  }

  func send(_ action: AppAction) {
    switch action {
    case .zoomIn: sendIntent(.zoom(scale: 0.85))
    case .zoomOut: sendIntent(.zoom(scale: 1 / 0.85))
    case .orbitLeft: sendIntent(.orbit(yaw: -0.2, pitch: 0))
    case .orbitRight: sendIntent(.orbit(yaw: 0.2, pitch: 0))
    case .orbitUp: sendIntent(.orbit(yaw: 0, pitch: -0.15))
    case .orbitDown: sendIntent(.orbit(yaw: 0, pitch: 0.15))
    case .expandTray: preferences.trayExpanded = true
    case .collapseTray: preferences.trayExpanded = false
    case .expandExplanation: preferences.explanationExpanded = true
    case .collapseExplanation: preferences.explanationExpanded = false
    case .clearDownloads:
      let activeID = activeBundle?.procedure.id
      Task { await delivery?.clearDownloads(activeProcedureID: activeID) }
    case .resetProgress:
      preferences.resetProgress()
      if let first = activeBundle?.procedure.steps.first?.id { sendIntent(.selectStep(first)) }
    case .nextStep:
      sendIntent(.nextStep)
    case .previousStep:
      sendIntent(.previousStep)
    case .selectStep(let id):
      sendIntent(.selectStep(id))
    case .resetView:
      sendIntent(.resetView)
    case .download(let id), .retry(let id): delivery?.update(id)
    case .cancelDownload(let id): delivery?.cancel(id)
    case .back, .changeLanguage(_), .openColophon, .openSettings,
      .openProcedure(_):
      return
    }
  }

  private func sendIntent(_ intent: ProcedureIntent) {
    guard let controller = activeSessionController else { return }
    do {
      guard let state = try controller.send(intent) else { return }
      let animated: Bool
      switch intent {
      case .orbit, .zoom, .pan: animated = false
      default: animated = true
      }
      sceneRuntime?.present(state, animated: animated)
      preferences.saveStep(
        controller.session.selectedStepID,
        procedureID: controller.session.procedure.id, version: controller.session.procedure.version)
    } catch {
      Diagnostics.content.error(
        "Procedure state update failed: \(String(describing: error), privacy: .public)")
    }
  }

  func loadBundledContent() async {
    guard state == .idle else { return }
    await loadCurrentLocale()
    if let delivery { Task { await delivery.restoreAndRefresh() } }
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
    guard let activeBundle, let controller = activeSessionController else { return }
    let generation = openGeneration
    let locale = effectiveLocale
    do {
      let remote =
        activeRemoteModelURL != nil
        ? await delivery?.content(
          id: activeBundle.procedure.id, locale: locale, modelURL: activeRemoteModelURL) : nil
      let localizedBundle: ProcedureBundle
      if let remote {
        localizedBundle = remote.0
      } else {
        guard activeRemoteModelURL == nil else { return }
        localizedBundle = try await contentStore.procedure(
          id: activeBundle.procedure.id, locale: locale)
      }
      let explanationBodies = await NativeExplanationCopy.bodies(
        procedure: localizedBundle.procedure.id, locale: locale,
        strings: localizedBundle.localization.strings)
      guard generation == openGeneration, activeSessionController === controller,
        locale == effectiveLocale
      else { return }
      self.activeBundle = localizedBundle
      self.activeExplanationBodies = explanationBodies
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
    let explanations = procedure.steps.map {
      activeExplanationBodies[$0.bodyKey] ?? strings[$0.bodyKey] ?? ""
    }
    let explanation = explanations[selectedIndex]
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
      trayDensity: preferences.trayExpanded ? .expanded : .compact,
      sceneReadiness: sceneRuntime?.readiness ?? .preparing,
      isExplanationExpanded: preferences.explanationExpanded,
      canGoPrevious: controller.session.capabilities.canGoPrevious,
      canGoNext: controller.session.capabilities.canGoNext,
      canReset: controller.session.isContentReady,
      stepExplanations: explanations
    )
  }
}
