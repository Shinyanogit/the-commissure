import XCTest

final class TheCommissureUITests: XCTestCase {
  func testBundledLibraryAppearsWithoutNetworkSetup() {
    let app = XCUIApplication()
    app.launchArguments = ["-AppleLanguages", "(en)"]
    app.launch()

    XCTAssertTrue(app.staticTexts["The Commissure"].waitForExistence(timeout: 5))
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

    XCTAssertTrue(app.staticTexts["この端末で利用できます"].waitForExistence(timeout: 5))
    XCTAssertTrue(app.staticTexts["7ステップ"].waitForExistence(timeout: 5))
  }
}
