import Testing
@testable import NativeAssetSpikeCore

@Test func allCanonicalStepsAreComplete() {
    for step in ACDFSceneDefinition.stepRange {
        let snapshot = ACDFSceneDefinition.snapshot(step: step)
        #expect(snapshot.step == step)
        #expect(Set(snapshot.parts.keys) == ACDFSceneDefinition.dynamicEntityIDs)
    }
    #expect(ACDFSceneDefinition.expectedEntityIDs.count == 39)
}

@Test func directAndSequentialTargetsAreEqual() {
    var session = LoadAwareACDFSession()
    _ = session.markReady()

    for target in ACDFSceneDefinition.stepRange {
        var sequential: ACDFSceneSnapshot?
        for step in 1 ... target {
            sequential = session.select(step: step)
        }
        #expect(sequential == ACDFSceneDefinition.snapshot(step: target))
    }
}

@Test func adversarialJumpReturnsToCleanStepOne() {
    var session = LoadAwareACDFSession()
    _ = session.markReady()
    for step in [1, 6, 3, 7, 1] {
        _ = session.select(step: step)
    }
    #expect(session.selectedStep == 1)
    #expect(ACDFSceneDefinition.snapshot(step: session.selectedStep) == ACDFSceneDefinition.snapshot(step: 1))
}

@Test func fiftyForwardBackwardCyclesHaveZeroDrift() {
    var session = LoadAwareACDFSession()
    _ = session.markReady()
    let clean = ACDFSceneDefinition.snapshot(step: 1)
    for _ in 0 ..< 50 {
        for step in 2 ... 7 {
            _ = session.select(step: step)
        }
        for step in stride(from: 6, through: 1, by: -1) {
            _ = session.select(step: step)
        }
        #expect(ACDFSceneDefinition.snapshot(step: session.selectedStep) == clean)
    }
}

@Test func latestPreparingIntentWins() {
    var session = LoadAwareACDFSession()
    #expect(session.select(step: 6) == nil)
    #expect(session.select(step: 3) == nil)
    #expect(session.select(step: 7) == nil)
    let applied = session.markReady()
    #expect(applied == ACDFSceneDefinition.snapshot(step: 7))
    #expect(session.pendingStep == nil)
}

@Test func invalidStepDoesNotChangeSelection() {
    var session = LoadAwareACDFSession()
    #expect(session.select(step: 0) == nil)
    #expect(session.selectedStep == 1)
    #expect(session.select(step: 8) == nil)
    #expect(session.selectedStep == 1)
}
