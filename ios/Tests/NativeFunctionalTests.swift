import CommissureCore
import RealityKit
import XCTest

@testable import TheCommissure

@MainActor
final class NativeFunctionalTests: XCTestCase {
  func testAllCanonicalScenesRestoreArchiveBaselinesAndOpacityAfterInterruptions() async throws {
    let store = ContentStore(contentRoot: fixtureRoot())
    for id in ["acdf", "accf", "pcdf", "pcf"] {
      let bundle = try await store.procedure(id: id, locale: "en")
      let resolver = try SceneStateResolver(procedure: bundle.procedure, scene: bundle.scene)
      let root = Entity()
      root.name = "root"
      var entities: [String: Entity] = [:]
      for binding in bundle.scene.parts {
        var current = root
        for name in binding.entityPath.split(separator: "/").dropFirst() {
          if let found = current.children.first(where: { $0.name == String(name) }) {
            current = found
          } else {
            let child = Entity()
            child.name = String(name)
            current.addChild(child)
            current = child
          }
        }
        current.position = SIMD3(0.031, 0.072, -0.018)
        current.orientation = simd_quatf(angle: 0.17, axis: SIMD3(0, 1, 0))
        entities[binding.id] = current
      }
      let baselines = entities.mapValues(\.transform)
      let adapter = RealitySceneAdapter()
      try adapter.bind(root: root, bindings: bundle.scene.parts)
      var revision: UInt64 = 0
      for _ in 0..<50 {
        for step in bundle.procedure.steps.reversed() {
          revision += 1
          let target = try resolver.resolve(stepID: step.id)
          try adapter.present(target, revision: revision, animated: true)
          adapter.advance(by: 0.04)
        }
        revision += 1
        let target = try resolver.resolve(stepID: bundle.procedure.steps[0].id)
        try adapter.present(target, revision: revision, animated: true)
        adapter.advance(by: 0.31)
        XCTAssertTrue(adapter.isTransitioning)
        adapter.advance(by: 0.70)
        XCTAssertFalse(adapter.isTransitioning)
        for (partID, part) in target.parts {
          let entity = try XCTUnwrap(entities[partID])
          let base = try XCTUnwrap(baselines[partID])
          let expected =
            base.translation
            + SIMD3(Float(part.translation.x), Float(part.translation.y), Float(part.translation.z))
          XCTAssertLessThan(simd_distance(entity.position, expected), 0.00001, "\(id)/\(partID)")
          XCTAssertEqual(entity.components[OpacityComponent.self]?.opacity, Float(part.opacity))
          XCTAssertEqual(entity.isEnabled, part.isVisible)
        }
      }
      let before = entities.mapValues(\.transform)
      try adapter.present(bundle.scene.steps.last!.state, revision: 0)
      for (partID, entity) in entities { XCTAssertEqual(entity.transform, before[partID]) }
      adapter.reset()
      XCTAssertEqual(adapter.boundEntityCount, 0)
    }
  }

  func testBundledModelIntegrityAndEveryRealUSDZBinding() async throws {
    let store = ContentStore(contentRoot: fixtureRoot())
    let assets = NativeAssetStore(
      root: Bundle.main.resourceURL!.appendingPathComponent("NativeAssets"))
    for id in ["acdf", "accf", "pcdf", "pcf"] {
      let bundle = try await store.procedure(id: id, locale: "en")
      let url = try await assets.verifiedModel(for: bundle)
      let root = try await Entity(contentsOf: url, withName: id)
      let adapter = RealitySceneAdapter()
      try adapter.bind(root: root, bindings: bundle.scene.parts)
      XCTAssertEqual(adapter.boundEntityCount, bundle.scene.parts.count)
      for (index, step) in bundle.scene.steps.enumerated() {
        try adapter.present(step.state, revision: UInt64(index))
      }
      adapter.reset()
    }
  }

  func testProgressSurvivesReopenAndVersionMismatchIsIgnored() async throws {
    let suite = "NativeFunctionalTests-\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suite)!
    defer { defaults.removePersistentDomain(forName: suite) }
    let preferences = AppPreferences(defaults: defaults)
    let model = FoundationAppModel(
      contentStore: ContentStore(contentRoot: fixtureRoot()), preferences: preferences)
    await model.openProcedure(id: "acdf")
    model.send(.selectStep("acdf_cage_implantation"))
    model.send(.expandTray)
    model.send(.collapseExplanation)
    model.closeProcedure()
    await model.openProcedure(id: "acdf")
    XCTAssertEqual(model.theaterViewState?.currentStep, 5)
    XCTAssertEqual(model.theaterViewState?.trayDensity, .expanded)
    XCTAssertEqual(model.theaterViewState?.isExplanationExpanded, false)
    XCTAssertNil(preferences.savedStep(for: "acdf", version: "9.0.0"))
    model.send(.resetProgress)
    XCTAssertEqual(model.theaterViewState?.currentStep, 1)
  }

  func testRejectedIdentifierAndLocaleNeverEscapeContentRoot() async throws {
    let store = ContentStore(contentRoot: fixtureRoot())
    for (id, locale) in [("../acdf", "en"), ("acdf", "../../en"), ("pcl_open", "en")] {
      do {
        _ = try await store.procedure(id: id, locale: locale)
        XCTFail("Expected incompatible content")
      } catch { XCTAssertTrue(error is ContentStoreError) }
    }
  }

  private func fixtureRoot() -> URL { Bundle.main.resourceURL!.appendingPathComponent("content") }
}
