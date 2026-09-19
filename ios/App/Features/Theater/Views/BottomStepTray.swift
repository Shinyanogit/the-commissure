import SwiftUI

struct BottomStepTray: View {
  let state: TheaterViewState
  let density: TrayDensity
  let onAction: (AppAction) -> Void

  init(
    state: TheaterViewState,
    density: TrayDensity? = nil,
    onAction: @escaping (AppAction) -> Void
  ) {
    self.state = state
    self.density = density ?? state.trayDensity
    self.onAction = onAction
  }

  var body: some View {
    VStack(spacing: 0) {
      if density == .expanded { stepSelection }
      HStack(spacing: 16) {
        IconActionButton(.previousStep, isEnabled: state.canGoPrevious, onAction: onAction)
        Button {
          onAction(density == .expanded ? .collapseTray : .expandTray)
        } label: {
          VStack(spacing: 7) {
            HStack(spacing: 8) {
              Text("\(state.currentStep) / \(state.totalSteps)")
                .font(.subheadline.weight(.semibold).monospacedDigit())
              Image(systemName: density == .expanded ? "chevron.down" : "list.bullet")
                .font(.caption)
            }
            ProgressView(value: Double(state.currentStep), total: Double(state.totalSteps))
              .tint(DesignTokens.Color.cyan)
              .frame(maxWidth: 180)
              .accessibilityHidden(true)
          }
          .foregroundStyle(.white)
          .frame(maxWidth: .infinity, minHeight: 48)
          .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(Text("theater.steps"))
        .accessibilityHint(Text("action.tray.hint"))
        .accessibilityIdentifier("step-progress")
        .accessibilityValue("\(state.currentStep) / \(state.totalSteps)")
        IconActionButton(.nextStep, isEnabled: state.canGoNext, onAction: onAction)
          .background(state.canGoNext ? DesignTokens.Color.cyan : .clear, in: Circle())
      }
      .padding(10)
    }

  }

  private var stepSelection: some View {
    ScrollViewReader { proxy in
      ScrollView {
        LazyVStack(spacing: 2) {
          ForEach(Array(state.stepIDs.enumerated()), id: \.element) { index, id in
            Button {
              onAction(.selectStep(id))
              onAction(.collapseTray)
            } label: {
              HStack(alignment: .firstTextBaseline, spacing: 16) {
                Text(String(format: "%02d", index + 1))
                  .font(.caption.monospacedDigit())
                  .frame(minWidth: 24)
                Text(state.stepLabels.indices.contains(index) ? state.stepLabels[index] : "")
                  .font(.subheadline)
                  .multilineTextAlignment(.leading)
                  .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
                if index + 1 == state.currentStep {
                  Image(systemName: "checkmark").font(.caption)
                }
              }
              .foregroundStyle(index + 1 == state.currentStep ? DesignTokens.Color.cyan : .white)
              .padding(.horizontal, 16)
              .padding(.vertical, 12)
              .frame(maxWidth: .infinity, minHeight: 48, alignment: .leading)
              .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .id(id)
            .accessibilityIdentifier("step-\(id)")
            .accessibilityAddTraits(index + 1 == state.currentStep ? .isSelected : [])
          }
        }
      }
      .accessibilityIdentifier("step-list")
      .frame(maxHeight: 150)
      .padding(.top, 8)
      .onAppear {
        if state.stepIDs.indices.contains(state.currentStep - 1) {
          proxy.scrollTo(state.stepIDs[state.currentStep - 1], anchor: .center)
        }
      }
    }
  }
}
