import Observation
import XCTest

@testable import TheCommissure

final class PresentationProjectionTests: XCTestCase {
  @MainActor
  func testOpeningProcedureProjectsTheaterAndIntentUpdates() async throws {
    let defaults = isolatedDefaults()
    defer { defaults.removePersistentDomain(forName: defaultsSuiteName) }
    let preferences = AppPreferences(defaults: defaults)
    preferences.language = .english
    let model = FoundationAppModel(
      contentStore: ContentStore(contentRoot: repositoryContentRoot()),
      preferences: preferences
    )

    await model.openProcedure(id: "acdf")

    XCTAssertEqual(model.theaterViewState?.procedureID, "acdf")
    XCTAssertEqual(model.theaterViewState?.currentStep, 1)
    model.send(.nextStep)
    XCTAssertEqual(model.theaterViewState?.currentStep, 2)
    model.send(.selectStep("acdf_cage_implantation"))
    XCTAssertEqual(model.theaterViewState?.currentStep, 5)
  }

  @MainActor
  func testLocaleReprojectionPreservesSelectedStep() async throws {
    let defaults = isolatedDefaults()
    defer { defaults.removePersistentDomain(forName: defaultsSuiteName) }
    let preferences = AppPreferences(defaults: defaults)
    preferences.language = .english
    let model = FoundationAppModel(
      contentStore: ContentStore(contentRoot: repositoryContentRoot()),
      preferences: preferences
    )

    await model.openProcedure(id: "acdf")
    model.send(.selectStep("acdf_cage_implantation"))
    let englishTitle = model.theaterViewState?.stepTitle
    preferences.language = .japanese
    try await Task.sleep(nanoseconds: 200_000_000)

    for _ in 0..<30 {
      await Task.yield()
      if model.theaterViewState?.stepTitle != englishTitle {
        break
      }
    }

    XCTAssertEqual(model.theaterViewState?.currentStep, 5)
    XCTAssertNotEqual(model.theaterViewState?.stepTitle, englishTitle)
  }

  @MainActor
  func testLibraryTransferLabelsUseSelectedLocale() async throws {
    let defaults = isolatedDefaults()
    defer { defaults.removePersistentDomain(forName: defaultsSuiteName) }
    let preferences = AppPreferences(defaults: defaults)
    preferences.language = .japanese
    let model = FoundationAppModel(
      contentStore: ContentStore(contentRoot: repositoryContentRoot()),
      preferences: preferences
    )

    await model.loadBundledContent()

    XCTAssertEqual(model.libraryViewState.cards.first?.stepCountLabel, "7ステップ")
    XCTAssertEqual(
      model.libraryViewState.cards.first?.availabilityLabel,
      "このデバイスで利用可能"
    )
  }

  @MainActor
  func testDisclosureActionsInvalidatePresentationAndPersist() async throws {
    let defaults = isolatedDefaults()
    defer { defaults.removePersistentDomain(forName: defaultsSuiteName) }
    let preferences = AppPreferences(defaults: defaults)
    let model = FoundationAppModel(
      contentStore: ContentStore(contentRoot: repositoryContentRoot()), preferences: preferences)
    await model.openProcedure(id: "acdf")

    let trayChanged = expectation(description: "Tray action invalidates the observed projection")
    withObservationTracking {
      _ = model.theaterViewState
    } onChange: {
      trayChanged.fulfill()
    }
    model.send(.expandTray)
    await fulfillment(of: [trayChanged], timeout: 1)
    XCTAssertEqual(model.theaterViewState?.trayDensity, .expanded)

    let explanationChanged = expectation(
      description: "Explanation action invalidates the projection")
    withObservationTracking {
      _ = model.theaterViewState
    } onChange: {
      explanationChanged.fulfill()
    }
    model.send(.collapseExplanation)
    await fulfillment(of: [explanationChanged], timeout: 1)
    XCTAssertEqual(model.theaterViewState?.isExplanationExpanded, false)
    let restored = AppPreferences(defaults: defaults)
    XCTAssertTrue(restored.trayExpanded)
    XCTAssertFalse(restored.explanationExpanded)
  }

  private var defaultsSuiteName: String { "PresentationProjectionTests-\(name)" }

  private func isolatedDefaults() -> UserDefaults {
    let defaults = UserDefaults(suiteName: defaultsSuiteName)!
    defaults.removePersistentDomain(forName: defaultsSuiteName)
    return defaults
  }
}

private func repositoryContentRoot() -> URL {
  if let root = Bundle.main.resourceURL?.appendingPathComponent("content"),
    FileManager.default.fileExists(atPath: root.appendingPathComponent("catalog/catalog.json").path)
  {
    return root
  }
  return URL(fileURLWithPath: #filePath)
    .deletingLastPathComponent()
    .deletingLastPathComponent()
    .deletingLastPathComponent()
    .appendingPathComponent("content", isDirectory: true)
}
