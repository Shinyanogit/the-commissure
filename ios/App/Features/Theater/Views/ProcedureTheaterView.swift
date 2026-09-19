import SwiftUI

struct ProcedureTheaterView: View {
  let state: TheaterViewState
  let scene: AnyView
  let onAction: (AppAction) -> Void
  @Environment(\.dynamicTypeSize) private var typeSize

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
      let layout = wide ? AnyLayout(HStackLayout(spacing: 0)) : AnyLayout(VStackLayout(spacing: 0))
      VStack(spacing: 0) {
        topBar
        layout {
          ZStack {
            scene
            sceneStatus
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity)
          .clipped()
          ExplanationPanel(state: state, onAction: onAction)
            .frame(width: wide ? min(360, geometry.size.width * 0.4) : nil)
            .frame(height: wide ? nil : explanationHeight(in: geometry.size))
            .padding(wide ? .trailing : .horizontal, 20)
        }
        BottomStepTray(state: state, onAction: onAction)
          .frame(maxWidth: 720)
          .padding(.horizontal, 20)
          .padding(.vertical, 10)
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

  private func explanationHeight(in size: CGSize) -> CGFloat {
    guard state.isExplanationExpanded else { return typeSize.isAccessibilitySize ? 100 : 60 }
    return min(typeSize.isAccessibilitySize ? 300 : 210, size.height * 0.36)
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
      Menu {
        Button("language.followSystem") { onAction(.changeLanguage(.followSystem)) }
        Button("language.english") { onAction(.changeLanguage(.english)) }
        Button("language.japanese") { onAction(.changeLanguage(.japanese)) }
        Divider()
        ForEach(
          [AppAction.zoomIn, .zoomOut, .orbitLeft, .orbitRight, .orbitUp, .orbitDown], id: \.self
        ) { action in
          if let descriptor = ActionDescriptors.descriptor(for: action) {
            Button {
              onAction(action)
            } label: {
              Label(LocalizedStringKey(descriptor.labelKey), systemImage: descriptor.systemImage)
            }
          }
        }
      } label: {
        Image(systemName: "ellipsis")
          .font(.system(size: 18, weight: .medium))
          .frame(width: 44, height: 44)
          .contentShape(Rectangle())
      }
      .foregroundStyle(.white)
      .accessibilityLabel(Text("action.more"))
      .accessibilityIdentifier("theater-more")
    }
    .padding(.horizontal, 20)
    .padding(.vertical, 6)
  }
}

private struct ExplanationPanel: View {
  let state: TheaterViewState
  let onAction: (AppAction) -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      Button {
        onAction(state.isExplanationExpanded ? .collapseExplanation : .expandExplanation)
      } label: {
        HStack(alignment: .center, spacing: 12) {
          Text(state.stepTitle)
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
      .accessibilityLabel(Text(state.stepTitle))
      .accessibilityValue(
        Text(state.isExplanationExpanded ? "action.collapse" : "action.explanation")
      )
      .accessibilityHint(Text("action.explanation.hint"))
      .accessibilityIdentifier("explanation-toggle")
      if state.isExplanationExpanded {
        ScrollView {
          Text(.init(state.explanation))
            .font(.body)
            .lineSpacing(5)
            .foregroundStyle(DesignTokens.Color.textSecondary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .fixedSize(horizontal: false, vertical: true)
            .padding(.horizontal, 18)
            .padding(.bottom, 18)
        }
        .id(state.currentStep)
        .accessibilityIdentifier("step-explanation")
      }
    }
    .foregroundStyle(.white)
    .frame(
      maxWidth: .infinity, maxHeight: state.isExplanationExpanded ? .infinity : nil, alignment: .top
    )
    .background(DesignTokens.Color.stageSurface, in: RoundedRectangle(cornerRadius: 18))
    .overlay {
      RoundedRectangle(cornerRadius: 18).stroke(.white.opacity(0.08), lineWidth: 0.5)
    }
  }
}
