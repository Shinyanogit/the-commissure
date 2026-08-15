import Foundation

enum PreviewFixtures {
  static let libraryEnglish = LibraryViewState(
    cards: [
      .init(
        id: "acdf", title: "Anterior Cervical Discectomy and Fusion",
        summary: "Remove a disc and restore cervical alignment.", stepCount: 7,
        stepCountLabel: "7 steps", availability: .bundled,
        availabilityLabel: "Ready on this device"),
      .init(
        id: "accf", title: "Anterior Cervical Corpectomy and Fusion",
        summary: "Decompress the cervical cord through a corpectomy.", stepCount: 7,
        stepCountLabel: "7 steps", availability: .bundled,
        availabilityLabel: "Ready on this device"),
      .init(
        id: "pcdf", title: "Posterior Cervical Decompression and Fusion",
        summary: "Decompress and stabilize the posterior cervical spine.", stepCount: 6,
        stepCountLabel: "6 steps", availability: .cached,
        availabilityLabel: "Ready from cache"),
      .init(
        id: "pcf", title: "Posterior Cervical Foraminotomy",
        summary: "Open the foramen while preserving motion.", stepCount: 6,
        stepCountLabel: "6 steps", availability: .availableToDownload(sizeBytes: 6_171_993),
        availabilityLabel: "Download 5.9 MB"),
    ],
    locale: "en",
    isLoading: false,
    showsLanguageControl: true
  )

  static let libraryJapanese = LibraryViewState(
    cards: [
      .init(
        id: "acdf", title: "前方頸椎椎間板切除固定術", summary: "椎間板を切除し、頸椎のアライメントを整えます。", stepCount: 7,
        stepCountLabel: "7ステップ", availability: .bundled,
        availabilityLabel: "このデバイスで利用可能"),
      .init(
        id: "accf", title: "前方頸椎椎体切除固定術", summary: "椎体切除により頸髄を除圧します。", stepCount: 7,
        stepCountLabel: "7ステップ", availability: .bundled,
        availabilityLabel: "このデバイスで利用可能"),
      .init(
        id: "pcdf", title: "後方頸椎除圧固定術", summary: "後方から頸椎を除圧し安定化します。", stepCount: 6,
        stepCountLabel: "6ステップ", availability: .cached,
        availabilityLabel: "キャッシュから利用可能"),
      .init(
        id: "pcf", title: "後方頸椎椎間孔拡大術", summary: "可動性を保ちながら椎間孔を開放します。", stepCount: 6,
        stepCountLabel: "6ステップ", availability: .availableToDownload(sizeBytes: 6_171_993),
        availabilityLabel: "5.9 MBをダウンロード"),
    ],
    locale: "ja",
    isLoading: false,
    showsLanguageControl: true
  )

  static let theaterCompact = TheaterViewState(
    procedureID: "acdf",
    procedureTitle: "Anterior Cervical Discectomy and Fusion",
    abbreviation: "ACDF",
    currentStep: 3,
    totalSteps: 7,
    stepIDs: (1...7).map { "acdf_step_\($0)" },
    stepLabels: (1...7).map { "Step \($0)" },
    stepTitle: "Prepare the disc space",
    explanation: "The disc space is prepared before the interbody device is placed.",
    accessibilitySummary: "ACDF step 3 of 7. Prepare the disc space.",
    trayDensity: .compact,
    sceneReadiness: .ready,
    isExplanationExpanded: true,
    canGoPrevious: true,
    canGoNext: true,
    canReset: true
  )

  static let theaterJapanese = TheaterViewState(
    procedureID: "acdf",
    procedureTitle: "前方頸椎椎間板切除固定術",
    abbreviation: "ACDF",
    currentStep: 3,
    totalSteps: 7,
    stepIDs: (1...7).map { "acdf_step_\($0)" },
    stepLabels: ["展開", "除圧", "椎間板腔", "ケージ", "プレート", "確認", "終了"],
    stepTitle: "椎間板腔を準備する",
    explanation: "椎体間デバイスを留置する前に、椎間板腔を準備します。",
    accessibilitySummary: "ACDF 7段階中3段階目。椎間板腔を準備します。",
    trayDensity: .expanded,
    sceneReadiness: .ready,
    isExplanationExpanded: true,
    canGoPrevious: true,
    canGoNext: true,
    canReset: true
  )
}
