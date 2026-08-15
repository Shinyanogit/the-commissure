import Foundation

enum SceneReadiness: Equatable, Sendable {
  case preparing
  case ready
  case transitioning
  case failed
}

enum TrayDensity: Equatable, Sendable {
  case compact
  case expanded
  case minimal
}

enum LibraryAvailability: Equatable, Sendable {
  case bundled
  case cached
  case availableToDownload(sizeBytes: Int)
  case downloading(progress: Double)
  case verifying
  case unavailableOffline
  case failed(reasonKey: String)
}

struct LibraryCardViewState: Equatable, Identifiable, Sendable {
  let id: String
  let title: String
  let summary: String
  let stepCount: Int
  let stepCountLabel: String
  let availability: LibraryAvailability
  let availabilityLabel: String
}

struct LibraryViewState: Equatable, Sendable {
  let cards: [LibraryCardViewState]
  let locale: String
  let isLoading: Bool
  let showsLanguageControl: Bool

  static let empty = LibraryViewState(
    cards: [], locale: "en", isLoading: true, showsLanguageControl: true)
}

struct TheaterViewState: Equatable, Sendable {
  let procedureID: String
  let procedureTitle: String
  let abbreviation: String
  let currentStep: Int
  let totalSteps: Int
  let stepIDs: [String]
  let stepLabels: [String]
  let stepTitle: String
  let explanation: String
  let accessibilitySummary: String
  let trayDensity: TrayDensity
  let sceneReadiness: SceneReadiness
  let isExplanationExpanded: Bool
  let canGoPrevious: Bool
  let canGoNext: Bool
  let canReset: Bool
}

struct DownloadViewState: Equatable, Sendable {
  let procedureID: String
  let title: String
  let sizeBytes: Int?
  let progress: Double?
  let isVerifying: Bool
  let isFailure: Bool
  let messageKey: String?
}
