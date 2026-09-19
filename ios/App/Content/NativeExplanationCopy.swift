import CryptoKit
import Foundation

enum NativeExplanationCopy {
  struct Entry: Decodable, Sendable {
    let sourceSHA256: String
    let text: String
  }

  static let entries: [String: [String: [String: Entry]]] = {
    guard let url = Bundle.main.url(forResource: "ExplanationCopy", withExtension: "json"),
      let data = try? Data(contentsOf: url),
      let copy = try? JSONDecoder().decode([String: [String: [String: Entry]]].self, from: data)
    else { return [:] }
    return copy
  }()

  static func bodies(procedure: String, locale: String, strings: [String: String]) async -> [String:
    String]
  {
    await Task.detached(priority: .userInitiated) {
      Dictionary(
        uniqueKeysWithValues: strings.filter { $0.key.hasSuffix(".body") }.map {
          ($0.key, text(procedure: procedure, locale: locale, key: $0.key, source: $0.value))
        })
    }.value
  }

  static func text(procedure: String, locale: String, key: String, source: String) -> String {
    guard let entry = entries[procedure]?[locale]?[key] else { return source }
    let digest = SHA256.hash(data: Data(source.utf8)).map { String(format: "%02x", $0) }.joined()
    guard digest == entry.sourceSHA256 else { return source }
    return entry.text
  }
}
