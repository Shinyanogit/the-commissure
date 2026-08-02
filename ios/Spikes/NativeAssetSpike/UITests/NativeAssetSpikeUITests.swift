import XCTest

final class NativeAssetSpikeUITests: XCTestCase {
    @MainActor
    private func launchApp(
        procedure: String = "acdf",
        disableAnimations: Bool = true,
        automationSequence: String? = nil
    ) -> XCUIApplication {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchEnvironment["SPIKE_STEP"] = "1"
        app.launchEnvironment["SPIKE_PROCEDURE"] = procedure
        app.launchEnvironment["SPIKE_DISABLE_ANIMATIONS"] = disableAnimations ? "1" : "0"
        if let automationSequence {
            app.launchEnvironment["SPIKE_AUTOMATION_SEQUENCE"] = automationSequence
        }
        app.launch()
        XCTAssertTrue(app.buttons["next-step"].waitForExistence(timeout: 15))
        XCTAssertTrue(app.otherElements["reality-field"].waitForExistence(timeout: 15))
        let expected: String
        if automationSequence != nil {
            expected = "ready; bindings 39/39; state 1 verified; automation complete"
        } else if procedure == "acdf" {
            expected = "ready; bindings 39/39; state 1 verified"
        } else {
            expected = "ready; bindings 68/68"
        }
        waitForSceneStatus(expected, in: app, timeout: 15)
        return app
    }

    @MainActor
    func testForwardAndReverseNavigation() {
        let app = launchApp()
        XCTAssertEqual(app.buttons["step-indicator"].value as? String, "1 / 7")
        for step in 2 ... 7 {
            app.buttons["next-step"].tap()
            XCTAssertEqual(app.buttons["step-indicator"].value as? String, "\(step) / 7")
            waitForSceneStatus(
                "ready; bindings 39/39; state \(step) verified",
                in: app
            )
        }
        for step in stride(from: 6, through: 1, by: -1) {
            app.buttons["previous-step"].tap()
            XCTAssertEqual(app.buttons["step-indicator"].value as? String, "\(step) / 7")
            waitForSceneStatus(
                "ready; bindings 39/39; state \(step) verified",
                in: app
            )
        }
        add(XCTAttachment(screenshot: XCUIScreen.main.screenshot()))
    }

    @MainActor
    func testPCDFLoadsEveryExactBinding() {
        let app = launchApp(procedure: "pcdf")
        waitForSceneStatus("ready; bindings 68/68", in: app)
    }

    @MainActor
    func testRapidAnimatedRetargetEndsInVerifiedState() {
        let app = launchApp(
            disableAnimations: false,
            automationSequence: "1,6,3,7,1"
        )
        waitForSceneStatus(
            "ready; bindings 39/39; state 1 verified; automation complete",
            in: app,
            timeout: 10
        )
    }

    @MainActor
    func testFlickOrbitAndPinchDispatchThroughTheField() {
        let app = launchApp()
        let field = app.otherElements["reality-field"]

        field.swipeUp()
        XCTAssertEqual(app.buttons["step-indicator"].value as? String, "2 / 7")
        field.swipeDown()
        XCTAssertEqual(app.buttons["step-indicator"].value as? String, "1 / 7")

        let beforeOrbit = field.value as? String
        field.swipeLeft()
        XCTAssertNotEqual(field.value as? String, beforeOrbit)

        let beforePinch = field.value as? String
        field.pinch(withScale: 0.7, velocity: -1)
        XCTAssertNotEqual(field.value as? String, beforePinch)
        add(XCTAttachment(screenshot: XCUIScreen.main.screenshot()))
    }

    @MainActor
    private func waitForSceneStatus(
        _ expected: String,
        in app: XCUIApplication,
        timeout: TimeInterval = 3
    ) {
        let status = app.descendants(matching: .any)["scene-status"]
        XCTAssertTrue(status.waitForExistence(timeout: timeout))
        let expectation = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "value == %@", expected),
            object: status
        )
        XCTAssertEqual(XCTWaiter.wait(for: [expectation], timeout: timeout), .completed)
    }
}
