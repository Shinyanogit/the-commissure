import CommissureCore
import Foundation

struct RemoteAssetSource: AssetSource {
  private let baseURL: URL
  private let allowedHosts: Set<String>
  private let packDirectories: [PackKey: String]
  private let session: URLSession

  init(
    baseURL: URL,
    allowedHosts: Set<String>,
    packDirectories: [PackKey: String],
    session: URLSession
  ) {
    self.baseURL = baseURL
    self.allowedHosts = Set(allowedHosts.map { $0.lowercased() })
    self.packDirectories = packDirectories
    self.session = session
  }

  func fetch(_ pack: ManifestPack) async throws -> PackPayload {
    try Task.checkCancellation()
    guard let directory = packDirectories[pack.key] else {
      throw AssetFailure.corrupt(path: "pack-location")
    }
    let files = try pack.files.map { expected in
      try Self.requestedFile(
        expected,
        directory: directory,
        baseURL: baseURL,
        allowedHosts: allowedHosts
      )
    }

    return try await withThrowingTaskGroup(of: (String, Data).self) { group in
      var nextIndex = 0
      var payload: [String: Data] = [:]

      func enqueueNext() {
        guard nextIndex < files.count else { return }
        let request = files[nextIndex]
        nextIndex += 1
        group.addTask {
          try await downloadRemoteFile(request, using: session, allowedHosts: allowedHosts)
        }
      }

      enqueueNext()
      enqueueNext()
      while let (path, data) = try await group.next() {
        try Task.checkCancellation()
        payload[path] = data
        enqueueNext()
      }
      return PackPayload(files: payload)
    }
  }

  static func backgroundSession(identifier: String) -> URLSession {
    let configuration = URLSessionConfiguration.background(withIdentifier: identifier)
    configuration.allowsConstrainedNetworkAccess = false
    configuration.waitsForConnectivity = true
    return URLSession(configuration: configuration)
  }

  private static func requestedFile(
    _ expected: PackFileExpectation,
    directory: String,
    baseURL: URL,
    allowedHosts: Set<String>
  ) throws -> RemoteFileRequest {
    guard isSafeRelativePath(expected.path), isSafeRelativePath(directory) else {
      throw AssetFailure.corrupt(path: expected.path)
    }
    let relativePath = "\(directory)/\(expected.path)"
    let url = baseURL.appending(path: relativePath)
    guard isAllowedHTTPSURL(url, allowedHosts: allowedHosts) else {
      throw AssetFailure.corrupt(path: expected.path)
    }
    return RemoteFileRequest(localPath: expected.path, url: url, expectedBytes: expected.bytes)
  }
}

private struct RemoteFileRequest: Sendable {
  let localPath: String
  let url: URL
  let expectedBytes: Int
}

private func downloadRemoteFile(
  _ request: RemoteFileRequest,
  using session: URLSession,
  allowedHosts: Set<String>
) async throws -> (String, Data) {
  try Task.checkCancellation()
  do {
    let (data, response) = try await session.data(from: request.url)
    try Task.checkCancellation()
    guard let http = response as? HTTPURLResponse,
      http.statusCode == 200,
      let finalURL = http.url,
      isAllowedHTTPSURL(finalURL, allowedHosts: allowedHosts),
      data.count == request.expectedBytes
    else {
      throw AssetFailure.offline
    }
    return (request.localPath, data)
  } catch is CancellationError {
    throw CancellationError()
  } catch let error as URLError where error.code == .cancelled {
    throw CancellationError()
  } catch let failure as AssetFailure {
    throw failure
  } catch {
    if Task.isCancelled { throw CancellationError() }
    throw AssetFailure.offline
  }
}

private func isAllowedHTTPSURL(_ url: URL, allowedHosts: Set<String>) -> Bool {
  guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
    components.scheme?.lowercased() == "https",
    let host = components.host?.lowercased(),
    allowedHosts.contains(host),
    components.user == nil,
    components.password == nil,
    components.query == nil,
    components.fragment == nil,
    !components.path.isEmpty,
    !components.path.contains("\\")
  else { return false }
  return components.path.split(separator: "/").allSatisfy { $0 != "." && $0 != ".." }
}

private func isSafeRelativePath(_ path: String) -> Bool {
  let components = path.split(separator: "/", omittingEmptySubsequences: false)
  return !path.isEmpty
    && !path.hasPrefix("/")
    && components.allSatisfy { !$0.isEmpty && $0 != "." && $0 != ".." }
    && !path.contains("\\")
    && !path.contains(":")
    && !path.unicodeScalars.contains { $0.value < 0x20 }
}
