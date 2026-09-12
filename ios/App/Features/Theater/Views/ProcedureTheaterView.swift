import SwiftUI

struct ProcedureTheaterView: View {
  let state: TheaterViewState
  let scene: AnyView
  let onAction: (AppAction) -> Void

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
    ZStack {
      DesignTokens.Color.stageBlack.ignoresSafeArea()
      scene
        .ignoresSafeArea()
      sceneStatusOverlay
      if state.sceneReadiness == .failed {
        IconActionButton(.openProcedure(state.procedureID), onAction: onAction)
          .accessibilityLabel(Text("action.retry"))
      }

      VStack(spacing: 0) {
        topBar
        Spacer(minLength: 0)

        if state.isExplanationExpanded {
          ExplanationPanel(state: state) {
            withAnimation(.easeInOut(duration: 0.2)) {
              onAction(.collapseExplanation)
            }
          }
          .padding(.horizontal, DesignTokens.Spacing.edge)
          .padding(.bottom, DesignTokens.Spacing.compact)
        } else {
          explanationExpandButton
            .padding(.horizontal, DesignTokens.Spacing.edge)
            .padding(.bottom, DesignTokens.Spacing.compact)
        }

        BottomStepTray(
          state: state,
          density: state.trayDensity,
          onAction: onAction
        )
        .padding(.horizontal, DesignTokens.Spacing.edge)
        .padding(.bottom, DesignTokens.Spacing.compact)
      }
    }
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

  @ViewBuilder
  private var sceneStatusOverlay: some View {
    switch state.sceneReadiness {
    case .preparing:
      sceneStatusBanner(icon: "hourglass", textKey: "theater.scene.preparing")
    case .transitioning:
      EmptyView()
    case .failed:
      sceneStatusBanner(icon: "exclamationmark.triangle", textKey: "theater.scene.failed")
    case .ready:
      EmptyView()
    }
  }

  private func sceneStatusBanner(icon: String, textKey: LocalizedStringKey) -> some View {
    VStack(spacing: DesignTokens.Spacing.compact) {
      if state.sceneReadiness != .failed {
        ProgressView()
          .tint(DesignTokens.Color.cyan)
      } else {
        Image(systemName: icon)
          .foregroundStyle(DesignTokens.Color.textSecondary)
      }
      Text(textKey)
        .font(.caption)
        .foregroundStyle(DesignTokens.Color.textSecondary)
    }
    .padding(.horizontal, DesignTokens.Spacing.regular)
    .padding(.vertical, DesignTokens.Spacing.compact)
    .background(DesignTokens.Color.stageBlack.opacity(0.68), in: Capsule())
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
    .allowsHitTesting(false)
  }

  private var explanationExpandButton: some View {
    HStack {
      Spacer()
      Button {
        withAnimation(.easeInOut(duration: 0.2)) {
          onAction(.expandExplanation)
        }
      } label: {
        Image(systemName: "text.bubble")
          .font(.system(size: 16, weight: .semibold))
          .frame(width: 44, height: 44)
          .foregroundStyle(DesignTokens.Color.textPrimary)
          .background(DesignTokens.Color.stageSurface.opacity(0.88), in: Circle())
      }
      .buttonStyle(.plain)
      .accessibilityLabel(Text("action.explanation"))
      .accessibilityHint(Text("action.explanation.hint"))
    }
  }

  private var topBar: some View {
    HStack(spacing: DesignTokens.Spacing.compact) {
      IconActionButton(.back, onAction: onAction)
      VStack(alignment: .leading, spacing: 2) {
        Text(state.abbreviation)
          .font(.caption.weight(.semibold))
          .foregroundStyle(DesignTokens.Color.cyan)
        Text(state.procedureTitle)
          .font(.headline)
          .foregroundStyle(DesignTokens.Color.textPrimary)
          .lineLimit(1)
      }
      Spacer(minLength: DesignTokens.Spacing.compact)
      Menu {
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
        Image(systemName: "ellipsis.circle").frame(width: 44, height: 44)
      }
      .accessibilityLabel(Text("action.more"))
      IconActionButton(.resetView, isEnabled: state.canReset, onAction: onAction)
    }
    .padding(.horizontal, DesignTokens.Spacing.edge)
    .padding(.top, DesignTokens.Spacing.compact)
    .background(DesignTokens.Color.stageBlack.opacity(DesignTokens.Opacity.stageScrim))
  }

}

private struct ExplanationPanel: View {
  let state: TheaterViewState
  let onCollapse: () -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: DesignTokens.Spacing.compact) {
      HStack(alignment: .firstTextBaseline) {
        Text(state.stepTitle)
          .font(.headline)
          .foregroundStyle(DesignTokens.Color.textPrimary)
        Spacer()
        Button(action: onCollapse) {
          Image(systemName: "chevron.down")
            .font(.system(size: 14, weight: .semibold))
            .frame(width: 44, height: 44)
        }
        .buttonStyle(.plain)
        .foregroundStyle(DesignTokens.Color.textPrimary)
        .accessibilityLabel(Text("action.collapse"))
        .accessibilityHint(Text("action.collapse.hint"))
      }
      ScrollView {
        Text(.init(state.explanation))
          .font(.body)
          .foregroundStyle(DesignTokens.Color.textPrimary)
          .frame(maxWidth: .infinity, alignment: .leading)
          .fixedSize(horizontal: false, vertical: true)
      }
      .frame(maxHeight: 150)
    }
    .padding(DesignTokens.Spacing.regular)
    .background(
      DesignTokens.Color.stageSurface.opacity(0.88),
      in: RoundedRectangle(cornerRadius: DesignTokens.Radius.panel)
    )
    .overlay {
      RoundedRectangle(cornerRadius: DesignTokens.Radius.panel)
        .stroke(DesignTokens.Color.textPrimary.opacity(0.1), lineWidth: 1)
    }
    .accessibilityElement(children: .combine)
  }
}
