import CommissureCore
import RealityKit
import XCTest

@testable import TheCommissure

@MainActor
final class SceneAdapterTests: XCTestCase {
  func testPanelFramingCentersTheUncoveredViewportWithoutMovingCamera() throws {
    let adapter = RealitySceneAdapter()
    adapter.updateViewport(width: 400, height: 800, coveredWidth: 0, coveredHeight: 300)
    let portrait = try XCTUnwrap(adapter.camera.components[ProjectiveTransformCameraComponent.self])
      .transform
    let projected = portrait * SIMD4<Float>(0, 0, -2, 1)
    let screenY = (1 - projected.y / projected.w) * 800 / 2
    XCTAssertEqual(screenY, 250, accuracy: 0.001)
    adapter.updateViewport(width: 1000, height: 700, coveredWidth: 360, coveredHeight: 0)
    let landscape = try XCTUnwrap(
      adapter.camera.components[ProjectiveTransformCameraComponent.self]
    ).transform
    let point = landscape * SIMD4<Float>(0, 0, -2, 1)
    XCTAssertEqual((1 + point.x / point.w) * 1000 / 2, 320, accuracy: 0.001)
    XCTAssertEqual(adapter.camera.position, .zero)
  }

  func testBindRequiresTheCompleteEntityHierarchy() throws {
    let root = Entity()
    root.name = "root"
    let procedure = Entity()
    procedure.name = "procedure_fixture"
    root.addChild(procedure)
    let rogue = Entity()
    rogue.name = "rogue"
    procedure.addChild(rogue)
    let rogueAnatomy = Entity()
    rogueAnatomy.name = "anatomy"
    rogue.addChild(rogueAnatomy)
    let rogueDisc = Entity()
    rogueDisc.name = "disc"
    rogueAnatomy.addChild(rogueDisc)

    let binding = PartBinding(
      id: "disc",
      sourceEntity: "disc",
      entityPath: "/root/procedure_fixture/anatomy/disc",
      dynamic: true,
      implantId: nil
    )
    let adapter = RealitySceneAdapter()

    XCTAssertThrowsError(try adapter.bind(root: root, bindings: [binding])) { error in
      XCTAssertEqual(error as? SceneAdapterError, .missingEntity(binding.entityPath))
    }
  }

  func testBindRejectsDuplicateEntityAtAnExactPath() throws {
    let root = Entity()
    root.name = "root"
    let procedure = Entity()
    procedure.name = "procedure_fixture"
    root.addChild(procedure)
    let anatomy = Entity()
    anatomy.name = "anatomy"
    procedure.addChild(anatomy)
    let firstDisc = Entity()
    firstDisc.name = "disc"
    anatomy.addChild(firstDisc)
    let secondDisc = Entity()
    secondDisc.name = "disc"
    anatomy.addChild(secondDisc)

    let binding = PartBinding(
      id: "disc",
      sourceEntity: "disc",
      entityPath: "/root/procedure_fixture/anatomy/disc",
      dynamic: true,
      implantId: nil
    )
    let adapter = RealitySceneAdapter()

    XCTAssertThrowsError(try adapter.bind(root: root, bindings: [binding])) { error in
      XCTAssertEqual(error as? SceneAdapterError, .duplicateEntity(binding.entityPath))
    }
  }
}
