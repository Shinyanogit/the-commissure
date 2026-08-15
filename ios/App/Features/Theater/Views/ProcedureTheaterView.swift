import SwiftUI

struct ProcedureTheaterView: View {
  let state: TheaterViewState
  let scene: AnyView
  let onAction: (AppAction) -> Void

  @State private var isExplanationExpanded: Bool
  @State private var isTrayExpanded: Bool

  init(
    state: TheaterViewState,
    scene: AnyView = AnyView(AnatomyFieldPlaceholder()),
    onAction: @escaping (AppAction) -> Void
  ) {
    self.state = state
    self.scene = scene
    self.onAction = onAction
    _isExplanationExpanded = State(initialValue: state.isExplanationExpanded)
    _isTrayExpanded = State(initialValue: state.trayDensity == .expanded)
  }

  var body: some View {
    ZStack {
      DesignTokens.Color.stageBlack.ignoresSafeArea()
      scene
        .ignoresSafeArea()
      sceneStatusOverlay

      VStack(spacing: 0) {
        topBar
        Spacer(minLength: 0)

        if isExplanationExpanded {
          ExplanationPanel(state: state) {
            withAnimation(.easeInOut(duration: 0.2)) {
              isExplanationExpanded = false
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
          density: isTrayExpanded ? .expanded : state.trayDensity,
          onAction: handleAction
        )
        .padding(.horizontal, DesignTokens.Spacing.edge)
        .padding(.bottom, DesignTokens.Spacing.compact)
      }
    }
    .preferredColorScheme(.dark)
    .accessibilityElement(children: .contain)
  }

  @ViewBuilder
  private var sceneStatusOverlay: some View {
    switch state.sceneReadiness {
    case .preparing:
      sceneStatusBanner(icon: "hourglass", textKey: "theater.scene.preparing")
    case .transitioning:
      sceneStatusBanner(icon: "arrow.triangle.2.circlepath", textKey: "theater.scene.transitioning")
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
          isExplanationExpanded = true
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
      IconActionButton(.resetView, isEnabled: state.canReset, onAction: onAction)
    }
    .padding(.horizontal, DesignTokens.Spacing.edge)
    .padding(.top, DesignTokens.Spacing.compact)
    .background(DesignTokens.Color.stageBlack.opacity(DesignTokens.Opacity.stageScrim))
  }

  private func handleAction(_ action: AppAction) {
    switch action {
    case .expandTray:
      withAnimation(.easeInOut(duration: 0.2)) { isTrayExpanded = true }
    case .collapseTray:
      withAnimation(.easeInOut(duration: 0.2)) { isTrayExpanded = false }
    case .back, .resetView, .previousStep, .nextStep, .selectStep(_), .openProcedure(_),
      .download(_), .cancelDownload(_), .retry(_), .changeLanguage(_), .openColophon,
      .openSettings:
      onAction(action)
    }
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
      Text(state.explanation)
        .font(.body)
        .foregroundStyle(DesignTokens.Color.textPrimary)
        .fixedSize(horizontal: false, vertical: true)
      Text(state.accessibilitySummary)
        .font(.caption)
        .foregroundStyle(DesignTokens.Color.textSecondary)
        .accessibilityHidden(true)
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

struct AnatomyFieldPlaceholder: View {
  var body: some View {
    GeometryReader { proxy in
      ZStack {
        RadialGradient(
          colors: [DesignTokens.Color.stageSurface.opacity(0.94), DesignTokens.Color.stageBlack],
          center: .center,
          startRadius: 20,
          endRadius: max(proxy.size.width, proxy.size.height) * 0.72
        )
        Capsule()
          .fill(DesignTokens.Color.bone.opacity(0.74))
          .frame(width: min(proxy.size.width * 0.24, 132), height: proxy.size.height * 0.68)
          .rotationEffect(.degrees(-7))
          .overlay {
            Capsule()
              .stroke(DesignTokens.Color.cyan.opacity(0.3), lineWidth: 1)
          }
        VStack(spacing: DesignTokens.Spacing.compact) {
          Image(systemName: "view.3d")
            .font(.system(size: 28, weight: .light))
            .foregroundStyle(DesignTokens.Color.cyan.opacity(0.72))
          Text("theater.scene.placeholder")
            .font(.caption)
            .foregroundStyle(DesignTokens.Color.textSecondary)
        }
        .accessibilityLabel(Text("theater.scene.accessibility"))
      }
    }
  }
}
