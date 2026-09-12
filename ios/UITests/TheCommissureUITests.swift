import XCTest

final class TheCommissureUITests: XCTestCase {
  func testBundledLibraryAppearsWithoutNetworkSetup() {
    let app = XCUIApplication()
    app.launchArguments = ["-AppleLanguages", "(en)"]
    app.launch()

    XCTAssertTrue(app.navigationBars["The Commissure"].waitForExistence(timeout: 5))
    XCTAssertTrue(
      app.staticTexts["Anterior Cervical Discectomy and Fusion (ACDF)"].waitForExistence(timeout: 5)
    )
  }

  func testBundledLibraryAppearsInJapanese() {
    let app = XCUIApplication()
    app.launchArguments = ["-AppleLanguages", "(ja)"]
    app.launch()

    XCTAssertTrue(app.staticTexts["前方頸椎椎間板切除固定術（ACDF）"].waitForExistence(timeout: 5))
  }

  func testSelectedJapanesePreferenceLocalizesSystemChrome() {
    let app = XCUIApplication()
    app.launchArguments = [
      "-AppleLanguages", "(en)",
      "-AppleLocale", "en_US",
      "-appLanguage", "japanese",
    ]
    app.launch()

    XCTAssertTrue(app.staticTexts["このデバイスで利用可能"].waitForExistence(timeout: 5))
    XCTAssertTrue(app.staticTexts["7ステップ"].waitForExistence(timeout: 5))
  }
}

extension TheCommissureUITests {
  func testNativeWalkthroughForwardReverseLocaleAndPersistedReopen() {
    let app = XCUIApplication()
    app.launchArguments = ["-appLanguage", "english"]
    app.launch()
    let acdf = app.buttons["procedure-acdf"]
    XCTAssertTrue(acdf.waitForExistence(timeout: 10))
    acdf.tap()
    XCTAssertTrue(app.otherElements["reality-field-ready"].waitForExistence(timeout: 20))
    let progress = app.buttons["step-progress"]
    XCTAssertTrue(progress.waitForExistence(timeout: 5))
    let initial = progress.value as? String
    let next = app.buttons["action.next"]
    if next.isEnabled {
      next.tap()
      XCTAssertTrue(app.otherElements["reality-field-ready"].waitForExistence(timeout: 5))
      XCTAssertNotEqual(progress.value as? String, initial)
      app.buttons["action.previous"].tap()
      XCTAssertTrue(app.otherElements["reality-field-ready"].waitForExistence(timeout: 5))
      XCTAssertEqual(progress.value as? String, initial)
    }
    app.buttons["action.back"].tap()
    XCTAssertTrue(acdf.waitForExistence(timeout: 5))
    acdf.tap()
    XCTAssertTrue(app.otherElements["reality-field-ready"].waitForExistence(timeout: 20))
    XCTAssertEqual(progress.value as? String, initial)
  }
}
