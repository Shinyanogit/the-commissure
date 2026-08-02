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
      contentStore: ContentStore(contentRoot: testContentRoot()),
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
      contentStore: ContentStore(contentRoot: testContentRoot()),
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
      contentStore: ContentStore(contentRoot: testContentRoot()),
      preferences: preferences
    )

    await model.loadBundledContent()

    XCTAssertEqual(model.libraryViewState.cards.first?.stepCountLabel, "7ステップ")
    XCTAssertEqual(
      model.libraryViewState.cards.first?.availabilityLabel,
      "この端末で利用できます"
    )
  }

  private var defaultsSuiteName: String { "PresentationProjectionTests-\(name)" }

  private func isolatedDefaults() -> UserDefaults {
    let defaults = UserDefaults(suiteName: defaultsSuiteName)!
    defaults.removePersistentDomain(forName: defaultsSuiteName)
    return defaults
  }
}
