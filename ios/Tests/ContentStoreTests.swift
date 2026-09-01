import CommissureCore
import XCTest

@testable import TheCommissure

final class ContentStoreTests: XCTestCase {
  func testBundledLibraryLoadsWithoutNetworkInBothLocales() async throws {
    let store = ContentStore(contentRoot: testContentRoot())
    let english = try await store.library(locale: "en")
    let japanese = try await store.library(locale: "ja")

    XCTAssertEqual(english.map(\.id), ["acdf", "accf", "pcdf", "pcf"])
    XCTAssertEqual(japanese.map(\.id), english.map(\.id))
    XCTAssertNotEqual(english[0].title, japanese[0].title)
    XCTAssertEqual(english.map(\.stepCount).reduce(0, +), 26)
  }

  func testAllBundledProceduresDecodeAndResolve() async throws {
    let store = ContentStore(contentRoot: testContentRoot())
    for id in ["acdf", "accf", "pcdf", "pcf"] {
      let bundle = try await store.procedure(id: id, locale: "en")
      XCTAssertEqual(bundle.procedure.id, id)
      XCTAssertEqual(bundle.scene.procedureId, id)
    }
  }

  func testLocaleProjectionDoesNotChangeSessionIdentityOrStep() async throws {
    let store = ContentStore(contentRoot: testContentRoot())
    let english = try await store.procedure(id: "acdf", locale: "en")
    var session = ProcedureSession(procedure: english.procedure, contentReady: true)
    XCTAssertTrue(session.send(.selectStep("acdf_cage_implantation")))
    let revision = session.targetRevision

    let japanese = try await store.procedure(id: "acdf", locale: "ja")

    XCTAssertEqual(japanese.procedure.id, english.procedure.id)
    XCTAssertEqual(session.selectedStepID, "acdf_cage_implantation")
    XCTAssertEqual(session.targetRevision, revision)
  }

  @MainActor
  func testLanguagePreferencePersistsWithoutScatteredLocaleLogic() {
    let suite = "AppPreferencesTests-\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suite)!
    defer { defaults.removePersistentDomain(forName: suite) }
    let preferences = AppPreferences(defaults: defaults)

    preferences.language = .japanese

    XCTAssertEqual(AppPreferences(defaults: defaults).effectiveLocale, "ja")
  }

  @MainActor
  func testFoundationModelReprojectsWhenLanguageChanges() async throws {
    let suite = "FoundationAppModelTests-\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suite)!
    defer { defaults.removePersistentDomain(forName: suite) }
    let preferences = AppPreferences(defaults: defaults)
    preferences.language = .english
    let model = FoundationAppModel(
      contentStore: ContentStore(contentRoot: testContentRoot()),
      preferences: preferences
    )

    await model.loadBundledContent()
    guard case .ready(let english) = model.state else {
      XCTFail("English bundled content should load")
      return
    }
    preferences.language = .japanese
    try await Task.sleep(nanoseconds: 200_000_000)
    for _ in 0..<20 {
      await Task.yield()
      if case .ready(let japanese) = model.state, japanese.first?.title != english.first?.title {
        return
      }
    }
    XCTFail("Changing language should reproject the active library")
  }
}
