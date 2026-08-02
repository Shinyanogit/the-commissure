import XCTest

@testable import CommissureCore

final class CoreTests: XCTestCase {
  func testResolverReturnsAbsoluteSnapshotForRandomJumpsWithoutDrift() throws {
    let fixture = makeFixture()
    let resolver = try SceneStateResolver(procedure: fixture.procedure, scene: fixture.scene)
    let expected = try resolver.resolve(stepID: "fixture_second")

    for stepID in [
      "fixture_second", "fixture_first", "fixture_second", "fixture_first", "fixture_second",
    ] {
      _ = try resolver.resolve(stepID: stepID)
    }

    XCTAssertEqual(try resolver.resolve(stepID: "fixture_second"), expected)
    XCTAssertEqual(expected.parts["disc"]?.translation.x, 1)
  }

  func testResolverRejectsIncompleteState() {
    let fixture = makeFixture(incompleteSecondState: true)
    XCTAssertThrowsError(try SceneStateResolver(procedure: fixture.procedure, scene: fixture.scene))
    { error in
      XCTAssertEqual(
        error as? SceneResolutionError,
        .incompleteState(stepID: "fixture_second", missing: ["disc"], extra: [])
      )
    }
  }

  func testResolverRejectsIncompleteBaseState() {
    let fixture = makeFixture(incompleteBaseState: true)
    XCTAssertThrowsError(try SceneStateResolver(procedure: fixture.procedure, scene: fixture.scene))
    { error in
      XCTAssertEqual(
        error as? SceneResolutionError,
        .incompleteState(stepID: "baseState", missing: ["disc"], extra: [])
      )
    }
  }

  func testResolverRejectsDivergentFinalEntrance() {
    let fixture = makeFixture(divergentEntrance: true)
    XCTAssertThrowsError(try SceneStateResolver(procedure: fixture.procedure, scene: fixture.scene))
    { error in
      XCTAssertEqual(error as? SceneResolutionError, .divergentFinalEntrance("fixture_second"))
    }
  }

  func testResolverRejectsDuplicateStepsWithoutTrapping() {
    let fixture = makeFixture(duplicateSceneStep: true)
    XCTAssertThrowsError(try SceneStateResolver(procedure: fixture.procedure, scene: fixture.scene))
    { error in
      XCTAssertEqual(error as? SceneResolutionError, .duplicateStepID("fixture_first"))
    }
  }

  func testResolverRejectsAssetVersionMismatch() {
    let fixture = makeFixture(assetVersionMismatch: true)
    XCTAssertThrowsError(try SceneStateResolver(procedure: fixture.procedure, scene: fixture.scene))
    { error in
      XCTAssertEqual(error as? SceneResolutionError, .procedureMismatch)
    }
  }

  func testResolverRejectsNestedNoncanonicalEntityPath() {
    let fixture = makeFixture(nestedEntityPath: true)
    XCTAssertThrowsError(try SceneStateResolver(procedure: fixture.procedure, scene: fixture.scene))
    { error in
      XCTAssertEqual(
        error as? SceneResolutionError,
        .noncanonicalEntityPath("/root/procedure_fixture/rogue/anatomy/disc")
      )
    }
  }

  func testResolverRejectsMalformedCanonicalPathVariants() {
    for path in [
      "root/procedure_fixture/anatomy/disc",
      "/root//procedure_fixture/anatomy/disc",
      "/root/procedure_fixture/anatomy/disc/",
    ] {
      let fixture = makeFixture(entityPathOverride: path)
      XCTAssertThrowsError(
        try SceneStateResolver(procedure: fixture.procedure, scene: fixture.scene),
        "Expected noncanonical path to be rejected: \(path)"
      ) { error in
        XCTAssertEqual(error as? SceneResolutionError, .noncanonicalEntityPath(path))
      }
    }
  }

  func testSessionBoundsAndPreloadLatestTarget() {
    var session = ProcedureSession(procedure: makeFixture().procedure)
    XCTAssertFalse(session.send(.previousStep))
    XCTAssertTrue(session.send(.nextStep))
    XCTAssertEqual(session.pendingStepID, "fixture_second")
    XCTAssertFalse(session.send(.nextStep))

    session.setContentReady(true)
    XCTAssertEqual(session.selectedStepID, "fixture_second")
    XCTAssertNil(session.pendingStepID)
  }

  func testReframeResetsCameraAndPreserveKeepsIt() {
    var session = ProcedureSession(procedure: makeFixture().procedure, contentReady: true)
    XCTAssertTrue(session.send(.orbit(yaw: 0.5, pitch: 0.2)))
    XCTAssertTrue(session.send(.nextStep))
    XCTAssertEqual(session.cameraAdjustment, .identity)
    XCTAssertTrue(session.send(.orbit(yaw: 0.25, pitch: 0.1)))
    XCTAssertTrue(session.send(.previousStep))
    XCTAssertEqual(session.cameraAdjustment.yaw, 0.25)
  }

  func testGestureResolverHonorsEdgeAxisAndTouchClaims() {
    var resolver = GestureIntentResolver()
    let capabilities = ProcedureCapabilities(
      canGoPrevious: true,
      canGoNext: true,
      canOrbit: true,
      canZoom: true
    )
    XCTAssertEqual(
      resolver.consume(
        .began(point: .init(x: 8, y: 100), touches: 1, viewport: .init(width: 500, height: 500)),
        capabilities: capabilities
      ),
      []
    )
    XCTAssertEqual(
      resolver.consume(
        .moved(point: .init(x: 100, y: 100), touches: 1), capabilities: capabilities),
      []
    )
    _ = resolver.consume(.cancelled, capabilities: capabilities)
    _ = resolver.consume(
      .began(point: .init(x: 250, y: 250), touches: 1, viewport: .init(width: 500, height: 500)),
      capabilities: capabilities
    )
    XCTAssertEqual(
      resolver.consume(
        .moved(point: .init(x: 190, y: 252), touches: 1), capabilities: capabilities),
      [.orbit(yaw: -0.48, pitch: 0.016)]
    )
    XCTAssertEqual(
      resolver.consume(
        .moved(point: .init(x: 120, y: 252), touches: 1), capabilities: capabilities),
      [.orbit(yaw: -0.56, pitch: 0)]
    )
  }

  func testVerticalFlickAndPinchMapToExistingIntents() {
    var resolver = GestureIntentResolver()
    let capabilities = ProcedureCapabilities(
      canGoPrevious: true,
      canGoNext: true,
      canOrbit: true,
      canZoom: true
    )
    _ = resolver.consume(
      .began(point: .init(x: 100, y: 100), touches: 1, viewport: .init(width: 400, height: 400)),
      capabilities: capabilities
    )
    XCTAssertEqual(
      resolver.consume(
        .moved(point: .init(x: 105, y: 108), touches: 1), capabilities: capabilities),
      []
    )
    XCTAssertEqual(
      resolver.consume(
        .moved(point: .init(x: 105, y: 150), touches: 1), capabilities: capabilities),
      [.nextStep]
    )
    XCTAssertEqual(
      resolver.consume(.pinch(scale: 1.2), capabilities: capabilities), [.zoom(scale: 1.2)])
  }

  func testSecondTouchCancelsUndecidedDrag() {
    var resolver = GestureIntentResolver()
    let capabilities = ProcedureCapabilities(
      canGoPrevious: true,
      canGoNext: true,
      canOrbit: true,
      canZoom: true
    )
    _ = resolver.consume(
      .began(point: .init(x: 100, y: 100), touches: 1, viewport: .init(width: 400, height: 400)),
      capabilities: capabilities
    )
    XCTAssertEqual(
      resolver.consume(
        .moved(point: .init(x: 102, y: 103), touches: 2), capabilities: capabilities),
      []
    )
    XCTAssertEqual(
      resolver.consume(
        .moved(point: .init(x: 102, y: 150), touches: 1), capabilities: capabilities),
      []
    )
    XCTAssertEqual(
      resolver.consume(.pinch(scale: 1.1), capabilities: capabilities), [.zoom(scale: 1.1)])
  }

  func testPackPresentationKeepsReadyVersionAlongsideFailedUpdate() {
    let installed = InstalledPack(
      key: .init(id: "acdf", version: "1.0.0"),
      directory: URL(fileURLWithPath: "/cache/acdf/1.0.0"),
      installedAt: .distantPast
    )
    let offered = ManifestPack(
      key: .init(id: "acdf", version: "1.1.0"),
      generation: 2,
      minimumBuild: 1,
      files: []
    )
    let record = PackRecord(
      installed: installed, offered: offered, lastFailure: .corrupt(path: "model.usdz"))
    XCTAssertEqual(record.presentationState, .stale(installed: "1.0.0", available: "1.1.0"))
  }

  func testCatalogPolicyKeepsOfflineAndRejectsReplay() {
    let policy = CatalogPolicy()
    XCTAssertEqual(
      policy.decide(highestAccepted: 4, remoteGeneration: nil, fetchFailed: true),
      .keepLastKnownGood)
    XCTAssertEqual(
      policy.decide(highestAccepted: 4, remoteGeneration: 3, fetchFailed: false), .rejectReplay)
    XCTAssertEqual(
      policy.decide(highestAccepted: 4, remoteGeneration: 5, fetchFailed: false), .acceptRemote)
  }
}

private func makeFixture(
  incompleteSecondState: Bool = false,
  incompleteBaseState: Bool = false,
  divergentEntrance: Bool = false,
  duplicateSceneStep: Bool = false,
  assetVersionMismatch: Bool = false,
  nestedEntityPath: Bool = false,
  entityPathOverride: String? = nil
) -> (
  procedure: ProcedureDefinition, scene: SceneDefinition
) {
  let steps = [
    ProcedureStepMetadata(
      id: "fixture_first",
      titleKey: "first.title",
      bodyKey: "first.body",
      accessibilitySummaryKey: "first.accessibility",
      viewPolicy: .preserveAdjustment
    ),
    ProcedureStepMetadata(
      id: "fixture_second",
      titleKey: "second.title",
      bodyKey: "second.body",
      accessibilitySummaryKey: "second.accessibility",
      viewPolicy: .reframe
    ),
  ]
  let procedure = ProcedureDefinition(
    schemaVersion: 1,
    id: "fixture",
    abbreviation: "FIX",
    version: "1.0.0",
    revision: 1,
    titleKey: "procedure.title",
    summaryKey: "procedure.summary",
    asset: .init(id: "fixture_model", version: "1.0.0"),
    sceneFile: "content/ios-scenes/fixture.json",
    locales: ["en", "ja"],
    steps: steps
  )
  let completeBase = makeState(x: 0)
  let base =
    incompleteBaseState
    ? SceneState(camera: completeBase.camera, parts: [:])
    : completeBase
  let second =
    incompleteSecondState
    ? SceneState(camera: completeBase.camera, parts: [:])
    : makeState(x: 1)
  let scene = SceneDefinition(
    schemaVersion: 1,
    procedureId: "fixture",
    assetId: "fixture_model",
    assetVersion: assetVersionMismatch ? "9.9.9" : "1.0.0",
    rootEntityPath: "/root/procedure_fixture",
    parts: [
      .init(
        id: "disc",
        sourceEntity: "disc",
        entityPath: entityPathOverride
          ?? (nestedEntityPath
            ? "/root/procedure_fixture/rogue/anatomy/disc"
            : "/root/procedure_fixture/anatomy/disc"),
        dynamic: true, implantId: nil)
    ],
    baseState: base,
    steps: [
      .init(
        id: "fixture_first", viewPolicy: .preserveAdjustment, state: completeBase, entrance: []),
      .init(
        id: duplicateSceneStep ? "fixture_first" : "fixture_second",
        viewPolicy: .reframe,
        state: second,
        entrance: divergentEntrance
          ? [.init(duration: 1, easing: .easeInOut, target: completeBase)]
          : []
      ),
    ]
  )
  return (procedure, scene)
}

private func makeState(x: Double) -> SceneState {
  SceneState(
    camera: .init(
      position: .init(x: 0, y: 0, z: 5),
      target: .init(x: 0, y: 0, z: 0),
      up: .init(x: 0, y: 1, z: 0),
      fieldOfView: 45
    ),
    parts: [
      "disc": .init(
        translation: .init(x: x, y: 0, z: 0),
        rotation: .init(axis: .init(x: 0, y: 1, z: 0), radians: 0),
        opacity: 1,
        isVisible: true
      )
    ]
  )
}
