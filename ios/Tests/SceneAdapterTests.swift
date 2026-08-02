import CommissureCore
import RealityKit
import XCTest

@testable import TheCommissure

@MainActor
final class SceneAdapterTests: XCTestCase {
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
