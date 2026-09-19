import XCTest

@MainActor
final class TheCommissureUITests: XCTestCase {
  func testBundledLibraryAppearsWithoutNetworkSetup() {
    let app = XCUIApplication()
    app.launchArguments = ["-AppleLanguages", "(en)", "-appLanguage", "english"]
    app.launch()

    XCTAssertTrue(app.images["The Commissure"].waitForExistence(timeout: 5))
    XCTAssertTrue(
      app.staticTexts["Anterior Cervical Discectomy and Fusion (ACDF)"].waitForExistence(timeout: 5)
    )
  }

  func testBundledLibraryAppearsInJapanese() {
    let app = XCUIApplication()
    app.launchArguments = ["-AppleLanguages", "(ja)", "-appLanguage", "japanese"]
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

    XCTAssertTrue(app.staticTexts["前方頸椎椎間板切除固定術（ACDF）"].waitForExistence(timeout: 5))
    XCTAssertFalse(app.staticTexts["このデバイスで利用可能"].exists)
    XCTAssertFalse(app.staticTexts["7ステップ"].exists)
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

extension TheCommissureUITests {
  func testRedesignedTheaterRotationDisclosureStepsAndLanguage() {
    let app = XCUIApplication()
    app.launchArguments = ["-appLanguage", "english"]
    XCUIDevice.shared.orientation = .portrait
    app.launch()
    XCTAssertTrue(app.buttons["procedure-acdf"].waitForExistence(timeout: 10))
    capture("library-portrait")
    app.buttons["procedure-acdf"].tap()
    XCTAssertTrue(app.otherElements["reality-field-ready"].waitForExistence(timeout: 20))
    if !app.scrollViews["step-explanation"].exists { app.buttons["explanation-toggle"].tap() }
    if app.scrollViews["step-list"].exists { app.buttons["step-progress"].tap() }
    capture("theater-portrait")
    let progress = app.buttons["step-progress"]
    let initial = progress.value as? String
    app.buttons["explanation-toggle"].tap()
    XCTAssertTrue(app.buttons["action.next"].isHittable)
    XCTAssertFalse(app.scrollViews["step-explanation"].exists)
    capture("theater-collapsed")
    app.buttons["explanation-toggle"].tap()
    XCTAssertTrue(app.scrollViews["step-explanation"].waitForExistence(timeout: 3))
    progress.tap()
    let steps = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "step-acdf"))
    XCTAssertTrue(app.scrollViews["step-list"].waitForExistence(timeout: 3))
    XCTAssertGreaterThan(steps.count, 0)
    capture("theater-step-picker")
    progress.tap()
    XCUIDevice.shared.orientation = .landscapeLeft
    XCTAssertTrue(app.buttons["action.next"].waitForExistence(timeout: 5))
    XCTAssertTrue(app.buttons["action.next"].isHittable)
    XCTAssertTrue(app.buttons["explanation-toggle"].isHittable)
    XCTAssertEqual(progress.value as? String, initial)
    XCTAssertTrue(app.otherElements["reality-field-ready"].exists)
    capture("theater-landscape")
    app.buttons["theater-more"].tap()
    app.buttons["Japanese"].tap()
    XCTAssertEqual(progress.value as? String, initial)
    XCTAssertTrue(app.otherElements["reality-field-ready"].exists)
    capture("theater-japanese")
    XCUIDevice.shared.orientation = .portrait
    app.buttons["action.back"].tap()
    XCTAssertTrue(app.buttons["procedure-pcf"].waitForExistence(timeout: 5))
    capture("library-japanese")
  }

  func testLargeTextSettingsAndProcedureControlsRemainReachable() {
    let app = XCUIApplication()
    app.launchArguments = [
      "-appLanguage", "english",
      "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL",
    ]
    XCUIDevice.shared.orientation = .portrait
    app.launch()
    XCTAssertTrue(app.buttons["action.settings"].waitForExistence(timeout: 10))
    capture("library-large-text")
    app.buttons["action.settings"].tap()
    XCTAssertTrue(app.buttons["action.close"].waitForExistence(timeout: 5))
    capture("settings-large-text")
    app.buttons["action.close"].tap()
    let acdf = app.buttons["procedure-acdf"]
    if !acdf.isHittable { app.swipeUp() }
    acdf.tap()
    XCTAssertTrue(app.otherElements["reality-field-ready"].waitForExistence(timeout: 20))
    XCTAssertTrue(app.buttons["action.next"].isHittable)
    XCTAssertTrue(app.buttons["explanation-toggle"].isHittable)
    if !app.scrollViews["step-explanation"].exists { app.buttons["explanation-toggle"].tap() }
    XCTAssertTrue(app.scrollViews["step-explanation"].waitForExistence(timeout: 3))
    XCTAssertTrue(app.buttons["action.next"].isHittable)
    capture("theater-large-text")
  }

  func testAllProceduresHaveWorkingStepSelection() {
    let app = XCUIApplication()
    app.launchArguments = ["-appLanguage", "english"]
    XCUIDevice.shared.orientation = .portrait
    app.launch()
    for id in ["acdf", "accf", "pcdf", "pcf"] {
      let card = app.buttons["procedure-\(id)"]
      XCTAssertTrue(card.waitForExistence(timeout: 10))
      if !card.isHittable { app.swipeUp() }
      card.tap()
      XCTAssertTrue(app.otherElements["reality-field-ready"].waitForExistence(timeout: 20))
      if !app.scrollViews["step-list"].exists { app.buttons["step-progress"].tap() }
      let first = app.buttons["step-\(id)_overview"]
      for _ in 0..<5 {
        if first.isHittable { break }
        app.scrollViews["step-list"].swipeDown()
      }
      XCTAssertTrue(first.waitForExistence(timeout: 5))
      first.tap()
      XCTAssertTrue(app.otherElements["reality-field-ready"].waitForExistence(timeout: 10))
      XCTAssertFalse(app.buttons["action.previous"].isEnabled)
      XCTAssertTrue(app.buttons["action.next"].isEnabled)
      capture("\(id)-overview")
      app.buttons["action.back"].tap()
    }
  }

  private func capture(_ name: String) {
    let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
    attachment.name = name
    attachment.lifetime = .keepAlways
    add(attachment)
  }
}

extension TheCommissureUITests {
  func testExplanationSwipesAndModelDragRemainSeparate() {
    let app = XCUIApplication()
    app.launchArguments = ["-appLanguage", "english"]
    XCUIDevice.shared.orientation = .portrait
    app.launch()
    XCTAssertTrue(app.buttons["procedure-acdf"].waitForExistence(timeout: 10))
    app.buttons["procedure-acdf"].tap()
    let scene = app.otherElements["reality-field-ready"]
    XCTAssertTrue(scene.waitForExistence(timeout: 20))
    if !app.scrollViews["step-explanation"].exists { app.buttons["explanation-toggle"].tap() }
    if app.scrollViews["step-list"].exists { app.buttons["step-progress"].tap() }
    while app.buttons["action.previous"].isEnabled {
      app.buttons["action.previous"].tap()
      XCTAssertTrue(scene.waitForExistence(timeout: 5))
    }
    let progress = app.buttons["step-progress"]
    let first = progress.value as? String
    let explanation = app.scrollViews["step-explanation"]
    explanation.swipeLeft()
    XCTAssertTrue(scene.waitForExistence(timeout: 5))
    XCTAssertNotEqual(progress.value as? String, first)
    explanation.swipeRight()
    XCTAssertTrue(scene.waitForExistence(timeout: 5))
    XCTAssertEqual(progress.value as? String, first)
    scene.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.3))
      .press(
        forDuration: 0.05,
        thenDragTo: scene.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.15)))
    XCTAssertEqual(progress.value as? String, first)
    app.buttons["action.reset"].tap()
    XCTAssertTrue(scene.waitForExistence(timeout: 5))
    let resize = app.otherElements["explanation-resize"]
    let originalHeight = explanation.frame.height
    let handle = resize.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
    handle.press(forDuration: 0.1, thenDragTo: handle.withOffset(CGVector(dx: 0, dy: -70)))
    XCTAssertGreaterThan(explanation.frame.height, originalHeight + 20)
    capture("model-front-lighting")
    let start = scene.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: 0.25))
    let end = scene.coordinate(withNormalizedOffset: CGVector(dx: 0.15, dy: 0.25))
    start.press(forDuration: 0.05, thenDragTo: end)
    start.press(forDuration: 0.05, thenDragTo: end)
    XCTAssertEqual(progress.value as? String, first)
    capture("model-rear-lighting")
  }
}

extension TheCommissureUITests {
  func testPinchZoomAndLandscapePanelResize() {
    let app = XCUIApplication()
    app.launchArguments = ["-appLanguage", "english"]
    XCUIDevice.shared.orientation = .portrait
    app.launch()
    XCTAssertTrue(app.buttons["procedure-acdf"].waitForExistence(timeout: 10))
    app.buttons["procedure-acdf"].tap()
    let scene = app.otherElements["reality-field-ready"]
    XCTAssertTrue(scene.waitForExistence(timeout: 20))
    if app.scrollViews["step-explanation"].exists { app.buttons["explanation-toggle"].tap() }
    app.buttons["action.reset"].tap()
    XCTAssertTrue(scene.waitForExistence(timeout: 5))
    let progress = app.buttons["step-progress"].value as? String
    capture("pinch-before")
    scene.pinch(withScale: 0.6, velocity: -1)
    capture("pinch-out")
    scene.pinch(withScale: 1.6, velocity: 1)
    capture("pinch-in")
    XCTAssertEqual(app.buttons["step-progress"].value as? String, progress)
    app.buttons["explanation-toggle"].tap()
    XCUIDevice.shared.orientation = .landscapeLeft
    let explanation = app.scrollViews["step-explanation"]
    XCTAssertTrue(explanation.waitForExistence(timeout: 5))
    let initialWidth = explanation.frame.width
    let handle = app.otherElements["explanation-resize"].coordinate(
      withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
    handle.press(forDuration: 0.1, thenDragTo: handle.withOffset(CGVector(dx: -60, dy: 0)))
    XCTAssertGreaterThan(explanation.frame.width, initialWidth + 15)
    capture("landscape-resized")
    XCUIDevice.shared.orientation = .portrait
  }
}
