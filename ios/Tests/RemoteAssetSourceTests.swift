import CommissureCore
import Foundation
import XCTest

@testable import TheCommissure

final class RemoteAssetSourceTests: XCTestCase {
  override func tearDown() {
    RemoteURLProtocol.state.reset()
    super.tearDown()
  }

  func testTransferUsesSignedPackDirectoryAndAtMostTwoConcurrentRequests() async throws {
    let files = ["procedure.json", "scene.json", "en.json", "ja.json", "model.usdz"]
    let payloads = Dictionary(
      uniqueKeysWithValues: files.map { name in
        (
          URL(
            string: "https://assets.example.test/releases/packs/acdf/1.0.0/0123456789abcdef/\(name)"
          )!,
          Data(name.utf8)
        )
      })
    RemoteURLProtocol.state.configure(payloads: payloads, delay: 50_000_000)
    let pack = ManifestPack(
      key: PackKey(id: "acdf", version: "1.0.0"),
      generation: 1,
      minimumBuild: 1,
      files: files.map {
        PackFileExpectation(
          path: $0, sha256: String(repeating: "0", count: 64), bytes: $0.utf8.count)
      }
    )
    let source = makeSource(pack: pack)

    let payload = try await source.fetch(pack)

    XCTAssertEqual(Set(payload.files.keys), Set(files))
    XCTAssertEqual(RemoteURLProtocol.state.requestCount, files.count)
    XCTAssertEqual(RemoteURLProtocol.state.maximumConcurrentRequests, 2)
  }

  func testTaskCancellationCancelsURLSessionTransfer() async throws {
    let data = Data("model".utf8)
    let pack = ManifestPack(
      key: PackKey(id: "acdf", version: "1.0.0"),
      generation: 1,
      minimumBuild: 1,
      files: [
        PackFileExpectation(
          path: "model.usdz",
          sha256: String(repeating: "0", count: 64),
          bytes: data.count
        )
      ]
    )
    let url = URL(
      string: "https://assets.example.test/releases/packs/acdf/1.0.0/0123456789abcdef/model.usdz"
    )!
    RemoteURLProtocol.state.configure(payloads: [url: data], delay: 5_000_000_000)
    let source = makeSource(pack: pack)
    let request = Task { try await source.fetch(pack) }
    try await Task.sleep(nanoseconds: 50_000_000)

    request.cancel()
    do {
      _ = try await request.value
      XCTFail("Cancellation must stop the URLSession transfer")
    } catch is CancellationError {
    } catch {
      XCTFail("Expected CancellationError, received \(error)")
    }
    XCTAssertGreaterThan(RemoteURLProtocol.state.stopCount, 0)
  }

  func testRedirectToUnapprovedHostFailsClosed() async throws {
    let data = Data("model".utf8)
    let pack = ManifestPack(
      key: PackKey(id: "acdf", version: "1.0.0"),
      generation: 1,
      minimumBuild: 1,
      files: [
        PackFileExpectation(
          path: "model.usdz",
          sha256: String(repeating: "0", count: 64),
          bytes: data.count
        )
      ]
    )
    let url = URL(
      string: "https://assets.example.test/releases/packs/acdf/1.0.0/0123456789abcdef/model.usdz"
    )!
    RemoteURLProtocol.state.configure(
      payloads: [url: data],
      finalURL: URL(string: "https://evil.example.test/model.usdz")!
    )

    do {
      _ = try await makeSource(pack: pack).fetch(pack)
      XCTFail("A redirect response from an unapproved host must fail")
    } catch {
      XCTAssertEqual(error as? AssetFailure, .offline)
    }
  }

  private func makeSource(pack: ManifestPack) -> RemoteAssetSource {
    let configuration = URLSessionConfiguration.ephemeral
    configuration.protocolClasses = [RemoteURLProtocol.self]
    return RemoteAssetSource(
      baseURL: URL(string: "https://assets.example.test/releases/")!,
      allowedHosts: ["assets.example.test"],
      packDirectories: [pack.key: "packs/acdf/1.0.0/0123456789abcdef"],
      session: URLSession(configuration: configuration)
    )
  }
}

private final class RemoteURLProtocol: URLProtocol, @unchecked Sendable {
  static let state = RemoteURLProtocolState()
  private var callback: RemoteURLProtocolCallback?

  override class func canInit(with request: URLRequest) -> Bool { true }

  override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

  override func startLoading() {
    guard let requestURL = request.url, let response = Self.state.begin(url: requestURL) else {
      client?.urlProtocol(self, didFailWithError: URLError(.resourceUnavailable))
      return
    }
    let callback = RemoteURLProtocolCallback(owner: self, state: Self.state)
    self.callback = callback
    let deadline = DispatchTime.now() + .nanoseconds(Int(response.delay))
    DispatchQueue.global().asyncAfter(deadline: deadline) {
      callback.complete(response)
    }
  }

  override func stopLoading() {
    Self.state.didStop()
    callback?.cancel()
  }
}

private final class RemoteURLProtocolCallback: @unchecked Sendable {
  private let lock = NSLock()
  private let state: RemoteURLProtocolState
  private weak var owner: RemoteURLProtocol?
  private var finished = false

  init(owner: RemoteURLProtocol, state: RemoteURLProtocolState) {
    self.owner = owner
    self.state = state
  }

  func complete(_ response: RemoteURLProtocolState.Response) {
    guard markFinished() else { return }
    guard let owner,
      let http = HTTPURLResponse(
        url: response.finalURL,
        statusCode: 200,
        httpVersion: "HTTP/1.1",
        headerFields: nil
      )
    else { return }
    owner.client?.urlProtocol(owner, didReceive: http, cacheStoragePolicy: .notAllowed)
    owner.client?.urlProtocol(owner, didLoad: response.data)
    owner.client?.urlProtocolDidFinishLoading(owner)
  }

  func cancel() {
    _ = markFinished()
  }

  private func markFinished() -> Bool {
    lock.withLock {
      guard !finished else { return false }
      finished = true
      state.finish()
      return true
    }
  }
}

private final class RemoteURLProtocolState: @unchecked Sendable {
  struct Response: Sendable {
    let data: Data
    let finalURL: URL
    let delay: UInt64
  }

  private let lock = NSLock()
  private var payloads: [URL: Data] = [:]
  private var configuredFinalURL: URL?
  private var delay: UInt64 = 0
  private var activeRequests = 0
  private(set) var requestCount = 0
  private(set) var maximumConcurrentRequests = 0
  private(set) var stopCount = 0

  func configure(payloads: [URL: Data], finalURL: URL? = nil, delay: UInt64 = 0) {
    lock.withLock {
      self.payloads = payloads
      configuredFinalURL = finalURL
      self.delay = delay
      activeRequests = 0
      requestCount = 0
      maximumConcurrentRequests = 0
      stopCount = 0
    }
  }

  func reset() {
    configure(payloads: [:])
  }

  func begin(url: URL) -> Response? {
    lock.withLock {
      guard let data = payloads[url] else { return nil }
      requestCount += 1
      activeRequests += 1
      maximumConcurrentRequests = max(maximumConcurrentRequests, activeRequests)
      return Response(data: data, finalURL: configuredFinalURL ?? url, delay: delay)
    }
  }

  func finish() {
    lock.withLock { activeRequests -= 1 }
  }

  func didStop() {
    lock.withLock { stopCount += 1 }
  }
}
