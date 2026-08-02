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
}
