import XCTest

@testable import TheCommissure

@MainActor
final class LocaleSessionTests: XCTestCase {
  func testLanguageReprojectionPreservesACDFStepAndSceneRuntimeIdentity() async throws {
    let defaults = isolatedDefaults()
    defer { defaults.removePersistentDomain(forName: defaultsSuiteName) }
    let preferences = AppPreferences(defaults: defaults)
    preferences.language = .english
    let store = ContentStore(contentRoot: fixtureRoot())
    let model = FoundationAppModel(contentStore: store, preferences: preferences)
    let japanese = try await store.procedure(id: "acdf", locale: "ja")
    let selectedStepID = "acdf_cage_implantation"
    let selectedStep = try XCTUnwrap(
      japanese.procedure.steps.first(where: { $0.id == selectedStepID }))
    let expectedJapaneseTitle = try XCTUnwrap(
      japanese.localization.strings[selectedStep.titleKey])

    await model.openProcedure(id: "acdf", useBundled: true)
    model.send(.selectStep(selectedStepID))
    let originalRuntimeID = try XCTUnwrap(model.sceneRuntime?.id)
    let originalStepIDs = try XCTUnwrap(model.theaterViewState?.stepIDs)
    let englishTitle = try XCTUnwrap(model.theaterViewState?.stepTitle)

    model.setLanguage(.japanese)
    let didReproject = await waitUntil {
      model.theaterViewState?.stepTitle == expectedJapaneseTitle
    }

    XCTAssertTrue(didReproject)
    XCTAssertEqual(model.effectiveLocale, "ja")
    XCTAssertEqual(model.theaterViewState?.procedureID, "acdf")
    XCTAssertEqual(model.theaterViewState?.currentStep, 5)
    XCTAssertEqual(model.theaterViewState?.stepIDs, originalStepIDs)
    XCTAssertNotEqual(model.theaterViewState?.stepTitle, englishTitle)
    XCTAssertEqual(model.sceneRuntime?.id, originalRuntimeID)

    model.send(.nextStep)
    model.send(.previousStep)
    XCTAssertEqual(model.theaterViewState?.currentStep, 5)
    XCTAssertEqual(model.sceneRuntime?.id, originalRuntimeID)
  }

  func testCloseWinsOverInFlightLocaleReprojection() async throws {
    let defaults = isolatedDefaults()
    defer { defaults.removePersistentDomain(forName: defaultsSuiteName) }
    let preferences = AppPreferences(defaults: defaults)
    preferences.language = .english
    let store = ContentStore(contentRoot: fixtureRoot())
    let model = FoundationAppModel(contentStore: store, preferences: preferences)
    let japaneseLibrary = try await store.library(locale: "ja")

    await model.loadBundledContent()
    await model.openProcedure(id: "acdf", useBundled: true)
    XCTAssertNotNil(model.sceneRuntime)

    model.setLanguage(.japanese)
    await Task.yield()
    model.closeProcedure()

    let localeReloadFinished = await waitUntil {
      guard case .ready(let items) = model.state else { return false }
      return items.map(\.title) == japaneseLibrary.map(\.title)
    }
    XCTAssertTrue(localeReloadFinished)
    for _ in 0..<10 { await Task.yield() }

    XCTAssertNil(model.sceneRuntime)
    XCTAssertNil(model.theaterViewState)
    XCTAssertNil(model.failedProcedureID)
  }

  func testEveryProcedureHasMatchingEnglishAndJapaneseProjectionKeys() async throws {
    let store = ContentStore(contentRoot: fixtureRoot())

    for id in ["acdf", "accf", "pcdf", "pcf"] {
      let english = try await store.procedure(id: id, locale: "en")
      let japanese = try await store.procedure(id: id, locale: "ja")
      let requiredKeys =
        [english.procedure.titleKey, english.procedure.summaryKey]
        + english.procedure.steps.flatMap {
          [$0.titleKey, $0.bodyKey, $0.accessibilitySummaryKey]
        }

      XCTAssertEqual(english.procedure, japanese.procedure, id)
      XCTAssertEqual(english.scene, japanese.scene, id)
      XCTAssertEqual(
        Set(english.localization.strings.keys),
        Set(japanese.localization.strings.keys),
        id
      )
      for key in requiredKeys {
        let englishValue = try XCTUnwrap(english.localization.strings[key], "\(id)/en/\(key)")
        let japaneseValue = try XCTUnwrap(japanese.localization.strings[key], "\(id)/ja/\(key)")
        XCTAssertFalse(englishValue.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        XCTAssertFalse(japaneseValue.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
      }
    }
  }

  private var defaultsSuiteName: String { "LocaleSessionTests-\(name)" }

  private func isolatedDefaults() -> UserDefaults {
    let defaults = UserDefaults(suiteName: defaultsSuiteName)!
    defaults.removePersistentDomain(forName: defaultsSuiteName)
    return defaults
  }

  private func fixtureRoot() -> URL {
    Bundle.main.resourceURL!.appendingPathComponent("content", isDirectory: true)
  }

  private func waitUntil(
    attempts: Int = 100,
    predicate: @MainActor () -> Bool
  ) async -> Bool {
    for _ in 0..<attempts {
      if predicate() { return true }
      try? await Task.sleep(nanoseconds: 10_000_000)
    }
    return predicate()
  }
}
