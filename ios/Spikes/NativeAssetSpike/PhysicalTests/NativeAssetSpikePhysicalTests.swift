import XCTest

final class NativeAssetSpikePhysicalTests: XCTestCase {
    private let sampleCount = 20

    @MainActor
    func testACDFColdLoadSamples() {
        collectSamples(procedure: "acdf")
    }

    @MainActor
    func testPCDFColdLoadSamples() {
        collectSamples(procedure: "pcdf")
    }

    @MainActor
    func testPCDFShortEnduranceSmoke() {
        runEndurance(seconds: 60)
    }

    @MainActor
    func testPCDFEnduranceGate() {
        runEndurance(seconds: 900)
    }

    @MainActor
    private func runEndurance(seconds: Int) {
        let app = launchApp(procedure: "pcdf", enduranceSeconds: seconds)
        waitUntilReady(procedure: "pcdf", in: app)

        let status = app.descendants(matching: .any)["scene-status"]
        let expectation = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "value BEGINSWITH 'ENDURANCE complete;'"),
            object: status
        )
        XCTAssertEqual(
            XCTWaiter.wait(for: [expectation], timeout: TimeInterval(seconds + 45)),
            .completed
        )
        let value = status.value as? String ?? "missing"
        print("PHYSICAL_ENDURANCE \(value)")
        XCTAssertLessThanOrEqual(metric("first", in: value), 4_500)
        XCTAssertLessThanOrEqual(metric("memory", in: value), 350)
        XCTAssertLessThanOrEqual(metric("peak", in: value), 450)
        XCTAssertLessThanOrEqual(metric("input p95", in: value), 150)
        XCTAssertGreaterThanOrEqual(metric("fps p05", in: value), 45)
        XCTAssertFalse(value.contains("worst thermal serious"))
        XCTAssertFalse(value.contains("worst thermal critical"))
    }

    @MainActor
    private func collectSamples(procedure: String) {
        for sample in 1 ... sampleCount {
            let app = launchApp(procedure: procedure)
            waitUntilReady(procedure: procedure, in: app)
            let metrics = app.descendants(matching: .any)["metrics-status"]
            XCTAssertTrue(metrics.waitForExistence(timeout: 5))
            let populated = XCTNSPredicateExpectation(
                predicate: NSPredicate(format: "NOT value CONTAINS 'first 0 ms'"),
                object: metrics
            )
            XCTAssertEqual(XCTWaiter.wait(for: [populated], timeout: 5), .completed)
            let value = metrics.value as? String ?? "missing"
            print("PHYSICAL_METRIC sample=\(sample) \(value)")
            app.terminate()
        }
    }

    @MainActor
    private func launchApp(
        procedure: String,
        enduranceSeconds: Int? = nil
    ) -> XCUIApplication {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchEnvironment["SPIKE_STEP"] = "1"
        app.launchEnvironment["SPIKE_PROCEDURE"] = procedure
        app.launchEnvironment["SPIKE_DISABLE_ANIMATIONS"] = enduranceSeconds == nil ? "1" : "0"
        if let enduranceSeconds {
            app.launchEnvironment["SPIKE_ENDURANCE_SECONDS"] = String(enduranceSeconds)
        }
        app.launch()
        return app
    }

    @MainActor
    private func waitUntilReady(procedure: String, in app: XCUIApplication) {
        XCTAssertTrue(app.otherElements["reality-field"].waitForExistence(timeout: 15))
        let expected = procedure == "acdf"
            ? "ready; bindings 39/39; state 1 verified"
            : "ready; bindings 68/68"
        let status = app.descendants(matching: .any)["scene-status"]
        XCTAssertTrue(status.waitForExistence(timeout: 15))
        let expectation = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "value == %@", expected),
            object: status
        )
        XCTAssertEqual(XCTWaiter.wait(for: [expectation], timeout: 15), .completed)
    }

    private func metric(_ label: String, in summary: String) -> Double {
        let escaped = NSRegularExpression.escapedPattern(for: label)
        guard let expression = try? NSRegularExpression(
            pattern: "(?:^|; )\(escaped) ([0-9]+(?:\\.[0-9]+)?)"
        ) else {
            XCTFail("Invalid metric expression for \(label)")
            return .nan
        }
        let range = NSRange(summary.startIndex ..< summary.endIndex, in: summary)
        guard let match = expression.firstMatch(in: summary, range: range),
              let valueRange = Range(match.range(at: 1), in: summary),
              let value = Double(summary[valueRange])
        else {
            XCTFail("Missing metric \(label) in: \(summary)")
            return .nan
        }
        return value
    }
}
