import SwiftUI

struct ProcedureTheaterView: View {
  let state: TheaterViewState
  let scene: AnyView
  let onAction: (AppAction) -> Void
  @Environment(\.dynamicTypeSize) private var typeSize
  @State private var languageMenuPresented = false
  @State private var panelHeight: CGFloat?
  @State private var panelWidth: CGFloat?
  @State private var panelBounds = CGSize.zero
  @State private var resizeStart: CGFloat?

  init(
    state: TheaterViewState,
    scene: AnyView = AnyView(Color.black),
    onAction: @escaping (AppAction) -> Void
  ) {
    self.state = state
    self.scene = scene
    self.onAction = onAction
  }

  var body: some View {
    GeometryReader { geometry in
      let wide = geometry.size.width > geometry.size.height && geometry.size.width > 600
      VStack(spacing: 0) {
        topBar
          .zIndex(1)
        ZStack(alignment: wide ? .trailing : .bottom) {
          scene
            .environment(
              \.sceneOcclusion,
              wide
                ? CGSize(width: panelBounds.width + 24, height: 0)
                : CGSize(width: 0, height: panelBounds.height + 24))
          sceneStatus
          teachingPanel(wide: wide, size: geometry.size)
            .onGeometryChange(for: CGSize.self) {
              $0.size
            } action: {
              panelBounds = $0
            }
            .padding(12)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background {
          GeometryReader { background in
            Image("procedure-background")
              .resizable().scaledToFill()
              .frame(width: background.size.width, height: background.size.height)
              .clipped()
          }
          .accessibilityHidden(true)
        }
        .clipped()
        .contentShape(Rectangle())
      }
    }
    .background(DesignTokens.Color.stageBlack.ignoresSafeArea())
    .preferredColorScheme(.dark)
    .accessibilityElement(children: .contain)
    .background {
      Group {
        Button("") { onAction(.nextStep) }.keyboardShortcut(.downArrow, modifiers: [])
        Button("") { onAction(.previousStep) }.keyboardShortcut(.upArrow, modifiers: [])
        Button("") { onAction(.back) }.keyboardShortcut(.escape, modifiers: [])
      }.hidden().accessibilityHidden(true)
    }
  }

  private func panelSize(wide: Bool, size: CGSize) -> CGFloat {
    let maximum = wide ? min(640, size.width * 0.55) : size.height * 0.65
    let minimum = min(wide ? 280 : 220, maximum)
    let preferred =
      wide ? (panelWidth ?? 360) : (panelHeight ?? (typeSize.isAccessibilitySize ? 390 : 300))
    return min(maximum, max(minimum, preferred))
  }

  private func teachingPanel(wide: Bool, size: CGSize) -> some View {
    VStack(spacing: 0) {
      ExplanationPanel(state: state, onAction: onAction)
      Divider().overlay(.white.opacity(0.08))
      BottomStepTray(state: state, onAction: onAction)
    }
    .frame(width: wide ? panelSize(wide: true, size: size) : nil)
    .frame(
      height: state.isExplanationExpanded ? (wide ? nil : panelSize(wide: false, size: size)) : nil
    )
    .frame(maxHeight: wide && state.isExplanationExpanded ? .infinity : nil)
    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 22))
    .overlay {
      RoundedRectangle(cornerRadius: 22).stroke(.white.opacity(0.14), lineWidth: 0.5)
    }
    .overlay(alignment: wide ? .leading : .top) {
      if state.isExplanationExpanded {
        Capsule()
          .fill(.white.opacity(0.5))
          .frame(width: wide ? 4 : 32, height: wide ? 32 : 4)
          .frame(width: wide ? 28 : 64, height: wide ? 64 : 24)
          .contentShape(Rectangle())
          .offset(x: wide ? -8 : 0, y: wide ? 0 : -8)
          .gesture(
            DragGesture(minimumDistance: 4)
              .onChanged { value in
                if resizeStart == nil { resizeStart = panelSize(wide: wide, size: size) }
                let delta = wide ? value.translation.width : value.translation.height
                let maximum = wide ? min(640, size.width * 0.55) : size.height * 0.65
                let minimum = min(wide ? 280 : 220, maximum)
                let next = min(maximum, max(minimum, (resizeStart ?? 0) - delta))
                if wide { panelWidth = next } else { panelHeight = next }
              }
              .onEnded { _ in resizeStart = nil }
          )
          .accessibilityIdentifier("explanation-resize")
          .accessibilityLabel(Text("theater.resize"))
          .accessibilityAdjustableAction { direction in
            let delta: CGFloat = direction == .increment ? 40 : -40
            let next = panelSize(wide: wide, size: size) + delta
            if wide { panelWidth = next } else { panelHeight = next }
          }
      }
    }
  }

  @ViewBuilder
  private var sceneStatus: some View {
    if state.sceneReadiness == .preparing || state.sceneReadiness == .failed {
      VStack(spacing: 12) {
        if state.sceneReadiness == .preparing {
          ProgressView().tint(DesignTokens.Color.cyan)
          Text("theater.scene.preparing")
        } else {
          Text("theater.scene.failed")
          IconActionButton(.openProcedure(state.procedureID), onAction: onAction)
            .accessibilityLabel(Text("action.retry"))
        }
      }
      .font(.callout)
      .foregroundStyle(DesignTokens.Color.textSecondary)
      .padding(24)
      .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 18))
    }
  }

  private var topBar: some View {
    HStack(spacing: 12) {
      IconActionButton(.back, onAction: onAction)
      Text(state.abbreviation)
        .font(.title3.weight(.semibold))
        .tracking(1)
        .foregroundStyle(.white)
        .accessibilityLabel(state.procedureTitle)
        .accessibilityAddTraits(.isHeader)
      Spacer(minLength: 0)
      IconActionButton(.resetView, isEnabled: state.canReset, onAction: onAction)
      Button {
        languageMenuPresented = true
      } label: {
        Image(systemName: "ellipsis")
          .font(.system(size: 18, weight: .medium))
          .frame(width: 44, height: 44)
          .contentShape(Rectangle())
      }
      .foregroundStyle(.white)
      .accessibilityLabel(Text("action.language"))
      .accessibilityIdentifier("theater-more")
      .confirmationDialog("action.language", isPresented: $languageMenuPresented) {
        Button("language.followSystem") { onAction(.changeLanguage(.followSystem)) }
        Button("language.english") { onAction(.changeLanguage(.english)) }
        Button("language.japanese") { onAction(.changeLanguage(.japanese)) }
      }
    }
    .padding(.horizontal, 20)
    .padding(.vertical, 6)
  }
}

private struct ExplanationPanel: View {
  let state: TheaterViewState
  let onAction: (AppAction) -> Void
  @State private var swipeOffset: CGFloat = 0
  @State private var isPaging = false
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  var body: some View {
    GeometryReader { geometry in
      HStack(spacing: 0) {
        ForEach(-1...1, id: \.self) { relative in
          page(relative: relative)
            .frame(width: geometry.size.width, height: geometry.size.height, alignment: .top)
            .accessibilityHidden(relative != 0)
            .allowsHitTesting(relative == 0)
        }
      }
      .offset(x: -geometry.size.width + swipeOffset)
      .simultaneousGesture(
        DragGesture(minimumDistance: 10)
          .onChanged { value in
            guard !isPaging else { return }
            let delta = value.translation
            guard abs(delta.width) > abs(delta.height) * 1.15 else { return }
            let allowed = delta.width < 0 ? state.canGoNext : state.canGoPrevious
            swipeOffset =
              max(-geometry.size.width, min(geometry.size.width, delta.width))
              * (allowed ? 1 : 0.15)
          }
          .onEnded { value in
            guard !isPaging else { return }
            let delta = value.translation
            let accepted = abs(delta.width) >= 18 && abs(delta.width) > abs(delta.height) * 1.15
            let next = delta.width < 0
            guard accepted && (next ? state.canGoNext : state.canGoPrevious) else {
              withAnimation(.easeOut(duration: 0.2)) { swipeOffset = 0 }
              return
            }
            isPaging = true
            let step = state.currentStep
            withAnimation(.easeInOut(duration: reduceMotion ? 0 : 0.5)) {
              swipeOffset = next ? -geometry.size.width : geometry.size.width
            } completion: {
              var transaction = Transaction()
              transaction.disablesAnimations = true
              withTransaction(transaction) {
                if state.currentStep == step { onAction(next ? .nextStep : .previousStep) }
                swipeOffset = 0
                isPaging = false
              }
            }
          }
      )
    }
    .frame(height: state.isExplanationExpanded ? nil : 72)
    .clipped()
    .contentShape(Rectangle())
    .foregroundStyle(.white)
  }

  private func page(relative: Int) -> some View {
    let index = state.currentStep - 1 + relative
    let valid = state.stepLabels.indices.contains(index)
    let title = valid ? state.stepLabels[index] : ""
    let explanation =
      state.stepExplanations.indices.contains(index)
      ? state.stepExplanations[index] : (relative == 0 ? state.explanation : "")
    return VStack(alignment: .leading, spacing: 0) {
      Button {
        onAction(state.isExplanationExpanded ? .collapseExplanation : .expandExplanation)
      } label: {
        HStack(alignment: .center, spacing: 12) {
          Text(title)
            .font(.headline)
            .lineLimit(2)
            .multilineTextAlignment(.leading)
            .frame(maxWidth: .infinity, alignment: .leading)
          Image(systemName: state.isExplanationExpanded ? "chevron.down" : "chevron.up")
            .font(.system(size: 13, weight: .semibold))
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 14)
        .frame(minHeight: 52)
        .contentShape(Rectangle())
      }
      .buttonStyle(.plain)
      .accessibilityLabel(Text(title))
      .accessibilityValue(
        Text(state.isExplanationExpanded ? "action.collapse" : "action.explanation")
      )
      .accessibilityHint(Text("action.explanation.hint"))
      .accessibilityIdentifier(relative == 0 ? "explanation-toggle" : "explanation-toggle-\(index)")
      if state.isExplanationExpanded {
        ScrollView {
          ExplanationBody(source: explanation)
            .font(.body)
            .lineSpacing(5)
            .foregroundStyle(Color(red: 244 / 255, green: 247 / 255, blue: 1))
            .frame(maxWidth: .infinity, alignment: .leading)
            .fixedSize(horizontal: false, vertical: true)
            .padding(.horizontal, 18)
            .padding(.bottom, 18)
        }
        .id(index)
        .accessibilityIdentifier(relative == 0 ? "step-explanation" : "step-explanation-\(index)")
      }
    }
    .opacity(valid ? 1 : 0)
  }
}

enum ExplanationText {
  static func styled(_ source: String) -> AttributedString {
    var text =
      (try? AttributedString(
        markdown: source,
        options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace)))
      ?? AttributedString(source)
    let accent = Color(red: 142 / 255, green: 221 / 255, blue: 244 / 255)
    for run in text.runs {
      if run.inlinePresentationIntent?.contains(.stronglyEmphasized) == true {
        text[run.range].foregroundColor = accent
        text[run.range].font = .body.weight(.semibold)
      }
      if run.link != nil { text[run.range].foregroundColor = accent }
    }
    return text
  }
}

private struct ExplanationBody: View {
  let source: String

  var body: some View {
    VStack(alignment: .leading, spacing: 7) {
      ForEach(Array(source.components(separatedBy: "\n").enumerated()), id: \.offset) { _, line in
        if line.isEmpty {
          Color.clear.frame(height: 5).accessibilityHidden(true)
        } else if line.hasPrefix("- ") || line.hasPrefix("• ") {
          HStack(alignment: .firstTextBaseline, spacing: 9) {
            Text("•").accessibilityHidden(true)
            Text(ExplanationText.styled(String(line.dropFirst(2))))
              .frame(maxWidth: .infinity, alignment: .leading)
          }
          .accessibilityElement(children: .combine)
        } else {
          Text(ExplanationText.styled(line))
            .frame(maxWidth: .infinity, alignment: .leading)
        }
      }
    }
  }
}
