import CommissureCore
import CryptoKit
import Foundation
import XCTest

@testable import TheCommissure

final class SignedCatalogStoreTests: XCTestCase {
  private var roots: [URL] = []

  override func tearDownWithError() throws {
    for root in roots { try? FileManager.default.removeItem(at: root) }
    roots = []
  }

  func testValidExactByteSignatureIsAcceptedAndReopenedWithoutNetwork() async throws {
    let key = Curve25519.Signing.PrivateKey()
    let fixture = try makeCatalog(privateKey: key, generation: 1)
    let transport = CatalogStubTransport(responses: responses(for: fixture))
    let root = makeRoot()
    let store = SignedCatalogStore(
      configuration: configuration(publicKey: key.publicKey.rawRepresentation),
      rootURL: root,
      transport: transport
    )

    guard case .accepted(let accepted) = await store.refresh() else {
      return XCTFail("Valid signed catalog must be accepted")
    }
    XCTAssertEqual(accepted.catalog.generation, 1)
    XCTAssertEqual(
      Set(accepted.manifestPack(id: "acdf")?.files.map(\.path) ?? []),
      Set([
        "procedure.json", "scene.json", "en.json", "ja.json", "provenance.json",
        "model.usdz", "pack.json",
      ])
    )

    let offlineTransport = CatalogStubTransport(responses: [])
    let reopened = SignedCatalogStore(
      configuration: configuration(publicKey: key.publicKey.rawRepresentation),
      rootURL: root,
      transport: offlineTransport
    )
    let lastKnownGood = await reopened.lastKnownGood()
    let retained = await reopened.retainedCatalogs()
    let offlineCallCount = await offlineTransport.callCount
    XCTAssertEqual(lastKnownGood?.catalog.generation, 1)
    XCTAssertEqual(retained.map(\.catalog.generation), [1])
    XCTAssertEqual(offlineCallCount, 0)
  }

  func testInvalidSignatureKeepsPriorVerifiedCatalog() async throws {
    let key = Curve25519.Signing.PrivateKey()
    let first = try makeCatalog(privateKey: key, generation: 1)
    let second = try makeCatalog(privateKey: key, generation: 2)
    let invalidSecond = SignedCatalogFixture(
      manifest: second.manifest + Data(" ".utf8),
      signature: second.signature
    )
    let transport = CatalogStubTransport(
      responses: responses(for: first) + responses(for: invalidSecond)
    )
    let store = SignedCatalogStore(
      configuration: configuration(publicKey: key.publicKey.rawRepresentation),
      rootURL: makeRoot(),
      transport: transport
    )
    guard case .accepted = await store.refresh() else { return XCTFail("Fixture setup failed") }

    guard case .keptLastKnownGood(let retained, let reason) = await store.refresh() else {
      return XCTFail("Invalid signature must retain the prior catalog")
    }
    XCTAssertEqual(retained?.catalog.generation, 1)
    XCTAssertEqual(reason, .invalidSignature)
  }

  func testSignedUnknownFieldFailsClosed() async throws {
    let key = Curve25519.Signing.PrivateKey()
    let fixture = try makeCatalog(privateKey: key, generation: 1, extraRootField: true)
    let store = SignedCatalogStore(
      configuration: configuration(publicKey: key.publicKey.rawRepresentation),
      rootURL: makeRoot(),
      transport: CatalogStubTransport(responses: responses(for: fixture))
    )

    guard case .keptLastKnownGood(let retained, let reason) = await store.refresh() else {
      return XCTFail("Unknown fields must fail closed")
    }
    XCTAssertNil(retained)
    XCTAssertEqual(reason, .invalidManifest)
  }

  func testReplayAndEqualGenerationEquivocationAreRejected() async throws {
    let key = Curve25519.Signing.PrivateKey()
    let generation2 = try makeCatalog(privateKey: key, generation: 2)
    let replay = try makeCatalog(privateKey: key, generation: 1)
    let equivocation = try makeCatalog(
      privateKey: key,
      generation: 2,
      publishedAt: "2026-09-12T01:00:00Z"
    )
    let transport = CatalogStubTransport(
      responses: responses(for: generation2) + responses(for: replay) + responses(for: equivocation)
    )
    let store = SignedCatalogStore(
      configuration: configuration(publicKey: key.publicKey.rawRepresentation),
      rootURL: makeRoot(),
      transport: transport
    )
    guard case .accepted = await store.refresh() else { return XCTFail("Fixture setup failed") }

    guard case .keptLastKnownGood(_, let replayReason) = await store.refresh() else {
      return XCTFail("Older generation must be rejected")
    }
    XCTAssertEqual(replayReason, .replay(highestAccepted: 2, received: 1))

    guard case .keptLastKnownGood(_, let equivocationReason) = await store.refresh() else {
      return XCTFail("Changed bytes at the accepted generation must be rejected")
    }
    XCTAssertEqual(equivocationReason, .equivocation(generation: 2))
  }

  func testSameVersionContentMutationIsRejectedAtHigherGeneration() async throws {
    let key = Curve25519.Signing.PrivateKey()
    let first = try makeCatalog(privateKey: key, generation: 1)
    let mutation = try makeCatalog(privateKey: key, generation: 2, mutateACDFPack: true)
    let store = SignedCatalogStore(
      configuration: configuration(publicKey: key.publicKey.rawRepresentation),
      rootURL: makeRoot(),
      transport: CatalogStubTransport(
        responses: responses(for: first) + responses(for: mutation)
      )
    )
    guard case .accepted = await store.refresh() else { return XCTFail("Fixture setup failed") }

    guard case .keptLastKnownGood(let retained, let reason) = await store.refresh() else {
      return XCTFail("Immutable version mutation must be rejected")
    }
    XCTAssertEqual(retained?.catalog.generation, 1)
    XCTAssertEqual(reason, .versionMutation(PackKey(id: "acdf", version: "1.0.0")))
  }

  func testThreePriorSignedCatalogsRemainAvailableForOfflineFallback() async throws {
    let key = Curve25519.Signing.PrivateKey()
    var queuedResponses: [CatalogHTTPResponse] = []
    for generation in 1...4 {
      queuedResponses += responses(
        for: try makeCatalog(privateKey: key, generation: generation)
      )
    }
    let store = SignedCatalogStore(
      configuration: configuration(publicKey: key.publicKey.rawRepresentation),
      rootURL: makeRoot(),
      transport: CatalogStubTransport(responses: queuedResponses)
    )

    for _ in 1...4 {
      guard case .accepted = await store.refresh() else {
        return XCTFail("Increasing generations must be accepted")
      }
    }

    let retained = await store.retainedCatalogs()
    XCTAssertEqual(retained.map(\.catalog.generation), [4, 3, 2])
  }

  func testNilConfigurationReportsUnconfiguredWithoutTransport() async {
    let transport = CatalogStubTransport(responses: [])
    let store = SignedCatalogStore(
      configuration: nil,
      rootURL: makeRoot(),
      transport: transport
    )

    guard case .unconfigured = await store.refresh() else {
      return XCTFail("A missing production endpoint/key must be explicit")
    }
    let lastKnownGood = await store.lastKnownGood()
    let callCount = await transport.callCount
    XCTAssertNil(lastKnownGood)
    XCTAssertEqual(callCount, 0)
  }

  private func makeRoot() -> URL {
    let root = FileManager.default.temporaryDirectory
      .appendingPathComponent("commissure-catalog-tests-\(UUID().uuidString)", isDirectory: true)
    roots.append(root)
    return root
  }
}

private struct SignedCatalogFixture {
  let manifest: Data
  let signature: Data
}

private actor CatalogStubTransport: CatalogTransport {
  private var responses: [CatalogHTTPResponse]
  private(set) var callCount = 0

  init(responses: [CatalogHTTPResponse]) {
    self.responses = responses
  }

  func get(_ url: URL, etag: String?) async throws -> CatalogHTTPResponse {
    callCount += 1
    guard !responses.isEmpty else { throw CatalogFailure.transport }
    return responses.removeFirst()
  }
}

private func configuration(publicKey: Data) -> RemoteCatalogConfiguration {
  RemoteCatalogConfiguration(
    catalogBaseURL: URL(string: "https://catalog.example.test/v1/")!,
    allowedHosts: ["catalog.example.test", "assets.example.test"],
    publicKey: publicKey
  )
}

private func responses(for fixture: SignedCatalogFixture) -> [CatalogHTTPResponse] {
  [
    CatalogHTTPResponse(
      statusCode: 200,
      data: fixture.manifest,
      etag: "\"fixture\"",
      finalURL: URL(string: "https://catalog.example.test/v1/manifest.json")!
    ),
    CatalogHTTPResponse(
      statusCode: 200,
      data: fixture.signature,
      etag: nil,
      finalURL: URL(string: "https://catalog.example.test/v1/manifest.sig")!
    ),
  ]
}

private func makeCatalog(
  privateKey: Curve25519.Signing.PrivateKey,
  generation: Int,
  publishedAt: String = "2026-09-12T00:00:00Z",
  mutateACDFPack: Bool = false,
  extraRootField: Bool = false
) throws -> SignedCatalogFixture {
  let procedureIDs = ["acdf", "accf", "pcdf", "pcf"]
  let roleNames = [
    ("procedure", "procedure.json"),
    ("scene", "scene.json"),
    ("localization-en", "en.json"),
    ("localization-ja", "ja.json"),
    ("provenance", "provenance.json"),
    ("model", "model.usdz"),
    ("pack-metadata", "pack.json"),
  ]
  let procedures: [[String: Any]] = procedureIDs.map { id in
    let mutation = mutateACDFPack && id == "acdf" ? "-mutated" : ""
    let packHash = sha256(Data("pack-\(id)\(mutation)".utf8))
    let token = String(packHash.prefix(16))
    let files: [[String: Any]] = roleNames.map { role, name in
      let hash =
        role == "pack-metadata"
        ? packHash
        : sha256(Data("\(id)-\(role)\(mutation)".utf8))
      return [
        "role": role,
        "path": "packs/\(id)/1.0.0/\(token)/\(name)",
        "sha256": hash,
        "bytes": 1,
      ]
    }
    return [
      "id": id,
      "version": "1.0.0",
      "revision": 1,
      "sceneSchemaVersion": 1,
      "minimumAppBuild": 1,
      "locales": ["en", "ja"],
      "requiredCapabilities": [
        "absoluteSceneState", "restrictedMarkdown", "bilingualV1",
      ],
      "files": files,
      "provenanceId": "\(id)_provenance",
    ]
  }
  var object: [String: Any] = [
    "schemaVersion": 1,
    "generation": generation,
    "publishedAt": publishedAt,
    "assetBaseURL": "https://assets.example.test/releases/",
    "procedures": procedures,
  ]
  if extraRootField { object["unexpected"] = true }
  let manifest = try JSONSerialization.data(withJSONObject: object, options: [.sortedKeys])
  return SignedCatalogFixture(
    manifest: manifest,
    signature: try privateKey.signature(for: manifest)
  )
}

private func sha256(_ data: Data) -> String {
  SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
}
