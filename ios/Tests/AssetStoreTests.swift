import CommissureCore
import CryptoKit
import XCTest

@testable import TheCommissure

final class AssetStoreTests: XCTestCase {
  private var roots: [URL] = []

  override func tearDownWithError() throws {
    for root in roots { try? FileManager.default.removeItem(at: root) }
    roots = []
  }

  func testDuplicateRequestsShareOneTask() async throws {
    let data = Data("model".utf8)
    let pack = makePack(id: "acdf", version: "1.0.0", data: data)
    let source = CountingSource(
      payloads: [pack.key: .init(files: ["model.usdz": data])], delay: 100_000_000)
    let store = makeStore(source: source)

    async let first = store.acquire(pack)
    async let second = store.acquire(pack)
    let values = try await [first, second]
    let callCount = await source.callCount

    XCTAssertEqual(values[0].directory, values[1].directory)
    XCTAssertEqual(callCount, 1)
  }

  func testCorruptUpdateCannotReplaceReadyPriorVersion() async throws {
    let valid = Data("valid".utf8)
    let bad = Data("bad".utf8)
    let oldPack = makePack(id: "acdf", version: "1.0.0", data: valid)
    let newPack = makePack(id: "acdf", version: "1.1.0", data: valid)
    let source = CountingSource(payloads: [
      oldPack.key: .init(files: ["model.usdz": valid]),
      newPack.key: .init(files: ["model.usdz": bad]),
    ])
    let store = makeStore(source: source)

    let installed = try await store.acquire(oldPack)
    do {
      _ = try await store.acquire(newPack)
      XCTFail("Corrupt update must fail")
    } catch {
      XCTAssertEqual(error as? AssetFailure, .corrupt(path: "model.usdz"))
    }

    let cachedOld = await store.cachedPack(for: oldPack)
    let cachedNew = await store.cachedPack(for: newPack)
    XCTAssertEqual(cachedOld, installed)
    XCTAssertNil(cachedNew)
  }

  func testLowStorageFailsBeforeNetwork() async {
    let data = Data("model".utf8)
    let pack = makePack(id: "pcdf", version: "1.0.0", data: data)
    let source = CountingSource(payloads: [pack.key: .init(files: ["model.usdz": data])])
    let root = makeRoot()
    let store = AssetStore(rootURL: root, source: source, safetyReserve: 0) { _ in 0 }

    do {
      _ = try await store.acquire(pack)
      XCTFail("Low storage must fail")
    } catch {
      XCTAssertEqual(
        error as? AssetFailure,
        .insufficientStorage(required: Int64(data.count * 2), available: 0)
      )
    }
    let callCount = await source.callCount
    XCTAssertEqual(callCount, 0)
  }

  func testCapacityDropAfterTransferFailsBeforeActivation() async {
    let data = Data("model".utf8)
    let pack = makePack(id: "pcdf", version: "1.1.0", data: data)
    let source = CountingSource(payloads: [pack.key: .init(files: ["model.usdz": data])])
    let capacity = CapacitySequence([.max, 0])
    let root = makeRoot()
    let store = AssetStore(rootURL: root, source: source, safetyReserve: 0) { _ in
      capacity.next()
    }

    do {
      _ = try await store.acquire(pack)
      XCTFail("Activation must recheck capacity")
    } catch {
      XCTAssertEqual(
        error as? AssetFailure,
        .insufficientStorage(required: Int64(data.count * 2), available: 0)
      )
    }
    let cached = await store.cachedPack(for: pack)
    XCTAssertNil(cached)
  }

  func testUnsafeManifestPathFailsBeforeNetwork() async {
    let pack = ManifestPack(
      key: .init(id: "acdf", version: "unsafe"),
      generation: 1,
      minimumBuild: 1,
      files: [.init(path: "../outside", sha256: String(repeating: "0", count: 64), bytes: 1)]
    )
    let source = CountingSource(payloads: [:])
    let store = makeStore(source: source)

    do {
      _ = try await store.acquire(pack)
      XCTFail("Unsafe paths must fail before fetch")
    } catch {
      XCTAssertEqual(error as? AssetFailure, .corrupt(path: "../outside"))
    }
    let callCount = await source.callCount
    XCTAssertEqual(callCount, 0)
  }

  func testExplicitCancellationRemovesIncompleteInstall() async throws {
    let data = Data("model".utf8)
    let pack = makePack(id: "pcf", version: "1.0.0", data: data)
    let source = CountingSource(
      payloads: [pack.key: .init(files: ["model.usdz": data])], delay: 2_000_000_000)
    let root = makeRoot()
    let store = AssetStore(rootURL: root, source: source, safetyReserve: 0) { _ in .max }
    let request = Task { try await store.acquire(pack) }
    try await Task.sleep(nanoseconds: 50_000_000)

    await store.cancel(pack.key)
    do {
      _ = try await request.value
      XCTFail("Cancelled task must fail")
    } catch {
      XCTAssertEqual(error as? AssetFailure, .cancelled)
    }
    let cached = await store.cachedPack(for: pack)
    XCTAssertNil(cached)
  }

  func testCachedReopenNeverTouchesOfflineSource() async throws {
    let data = Data("model".utf8)
    let pack = makePack(id: "accf", version: "1.0.0", data: data)
    let root = makeRoot()
    let online = CountingSource(payloads: [pack.key: .init(files: ["model.usdz": data])])
    let firstStore = AssetStore(rootURL: root, source: online, safetyReserve: 0) { _ in .max }
    let first = try await firstStore.acquire(pack)

    let offline = CountingSource(payloads: [:], failure: .offline)
    let reopenedStore = AssetStore(rootURL: root, source: offline, safetyReserve: 0) { _ in .max }
    let reopened = try await reopenedStore.acquire(pack)

    XCTAssertEqual(reopened.directory, first.directory)
    let callCount = await offline.callCount
    XCTAssertEqual(callCount, 0)
  }

  func testCorruptCachedBytesAreNotReusedOffline() async throws {
    let data = Data("model".utf8)
    let pack = makePack(id: "accf", version: "1.1.0", data: data)
    let root = makeRoot()
    let online = CountingSource(payloads: [pack.key: .init(files: ["model.usdz": data])])
    let firstStore = AssetStore(rootURL: root, source: online, safetyReserve: 0) { _ in .max }
    let installed = try await firstStore.acquire(pack)
    try Data("MODEL".utf8).write(to: installed.directory.appendingPathComponent("model.usdz"))

    let offline = CountingSource(payloads: [:], failure: .offline)
    let reopenedStore = AssetStore(rootURL: root, source: offline, safetyReserve: 0) { _ in .max }
    do {
      _ = try await reopenedStore.acquire(pack)
      XCTFail("Corrupt cache must not be reused")
    } catch {
      XCTAssertEqual(error as? AssetFailure, .offline)
    }
    let cached = await reopenedStore.cachedPack(for: pack)
    XCTAssertNil(cached)
  }

  func testUnexpectedCachedFileIsNotReusedOffline() async throws {
    let data = Data("model".utf8)
    let pack = makePack(id: "accf", version: "1.2.0", data: data)
    let root = makeRoot()
    let online = CountingSource(payloads: [pack.key: .init(files: ["model.usdz": data])])
    let firstStore = AssetStore(rootURL: root, source: online, safetyReserve: 0) { _ in .max }
    let installed = try await firstStore.acquire(pack)
    try Data("unexpected".utf8).write(
      to: installed.directory.appendingPathComponent("unexpected.txt"))

    let offline = CountingSource(payloads: [:], failure: .offline)
    let reopenedStore = AssetStore(rootURL: root, source: offline, safetyReserve: 0) { _ in .max }
    do {
      _ = try await reopenedStore.acquire(pack)
      XCTFail("A cache with an unexpected file must not be reused")
    } catch {
      XCTAssertEqual(error as? AssetFailure, .offline)
    }
    let cached = await reopenedStore.cachedPack(for: pack)
    XCTAssertNil(cached)
  }

  func testUnsafePackIdentityFailsBeforeFilesystemOrNetwork() async {
    let data = Data("model".utf8)
    let pack = makePack(id: "../../../escape", version: "1.0.0", data: data)
    let source = CountingSource(payloads: [:])
    let root = makeRoot()
    let store = AssetStore(rootURL: root, source: source, safetyReserve: 0) { _ in .max }

    do {
      _ = try await store.acquire(pack)
      XCTFail("Unsafe pack IDs must fail before fetch")
    } catch {
      XCTAssertEqual(error as? AssetFailure, .corrupt(path: "pack-id"))
    }
    let callCount = await source.callCount
    XCTAssertEqual(callCount, 0)
    XCTAssertFalse(
      FileManager.default.fileExists(atPath: root.appendingPathComponent("escape").path))
  }

  func testRecoveryClearsOnlyStaging() async throws {
    let root = makeRoot()
    let staging = root.appendingPathComponent("staging/orphan", isDirectory: true)
    let ready = root.appendingPathComponent("packs/acdf/1.0.0", isDirectory: true)
    try FileManager.default.createDirectory(at: staging, withIntermediateDirectories: true)
    try FileManager.default.createDirectory(at: ready, withIntermediateDirectories: true)
    let source = CountingSource(payloads: [:])
    let store = AssetStore(rootURL: root, source: source, safetyReserve: 0) { _ in .max }

    try await store.recoverStaging()

    XCTAssertFalse(FileManager.default.fileExists(atPath: staging.path))
    XCTAssertTrue(FileManager.default.fileExists(atPath: ready.path))
  }

  func testDifferentPacksDownloadSerially() async throws {
    let data = Data("model".utf8)
    let acdf = makePack(id: "acdf", version: "2.0.0", data: data)
    let pcdf = makePack(id: "pcdf", version: "2.0.0", data: data)
    let source = CountingSource(
      payloads: [
        acdf.key: .init(files: ["model.usdz": data]),
        pcdf.key: .init(files: ["model.usdz": data]),
      ],
      delay: 100_000_000
    )
    let store = makeStore(source: source)

    async let first = store.acquire(acdf)
    async let second = store.acquire(pcdf)
    _ = try await [first, second]

    let maximum = await source.maximumConcurrentCalls
    XCTAssertEqual(maximum, 1)
  }

  func testProtectedPackCannotBeEvicted() async throws {
    let data = Data("model".utf8)
    let pack = makePack(id: "acdf", version: "3.0.0", data: data)
    let source = CountingSource(payloads: [pack.key: .init(files: ["model.usdz": data])])
    let store = makeStore(source: source)
    _ = try await store.acquire(pack)

    let protectedResult = try await store.evict(pack.key, protecting: Set([pack.key]))
    let protectedCache = await store.cachedPack(for: pack)
    let evictionResult = try await store.evict(pack.key, protecting: Set())
    let evictedCache = await store.cachedPack(for: pack)
    XCTAssertFalse(protectedResult)
    XCTAssertNotNil(protectedCache)
    XCTAssertTrue(evictionResult)
    XCTAssertNil(evictedCache)
  }

  private func makeStore(source: some AssetSource) -> AssetStore {
    AssetStore(rootURL: makeRoot(), source: source, safetyReserve: 0) { _ in .max }
  }

  private func makeRoot() -> URL {
    let root = FileManager.default.temporaryDirectory
      .appendingPathComponent("commissure-tests-\(UUID().uuidString)", isDirectory: true)
    roots.append(root)
    return root
  }
}

private actor CountingSource: AssetSource {
  private let payloads: [PackKey: PackPayload]
  private let delay: UInt64
  private let failure: AssetFailure?
  private(set) var callCount = 0
  private(set) var maximumConcurrentCalls = 0
  private var concurrentCalls = 0

  init(payloads: [PackKey: PackPayload], delay: UInt64 = 0, failure: AssetFailure? = nil) {
    self.payloads = payloads
    self.delay = delay
    self.failure = failure
  }

  func fetch(_ pack: ManifestPack) async throws -> PackPayload {
    callCount += 1
    concurrentCalls += 1
    maximumConcurrentCalls = max(maximumConcurrentCalls, concurrentCalls)
    defer { concurrentCalls -= 1 }
    if delay > 0 { try await Task.sleep(nanoseconds: delay) }
    if let failure { throw failure }
    guard let payload = payloads[pack.key] else { throw AssetFailure.offline }
    return payload
  }
}

private final class CapacitySequence: @unchecked Sendable {
  private let lock = NSLock()
  private var values: [Int64]

  init(_ values: [Int64]) {
    self.values = values
  }

  func next() -> Int64 {
    lock.lock()
    defer { lock.unlock() }
    return values.isEmpty ? 0 : values.removeFirst()
  }
}

private func makePack(id: String, version: String, data: Data) -> ManifestPack {
  ManifestPack(
    key: .init(id: id, version: version),
    generation: 1,
    minimumBuild: 1,
    files: [
      .init(
        path: "model.usdz",
        sha256: SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined(),
        bytes: data.count
      )
    ]
  )
}
