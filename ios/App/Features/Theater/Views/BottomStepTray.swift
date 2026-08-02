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
    VStack(spacing: DesignTokens.Spacing.compact) {
      if density == .expanded {
        stepSelection
      }

      if density == .minimal {
        progressControl
      } else {
        HStack(spacing: DesignTokens.Spacing.compact) {
          IconActionButton(.previousStep, isEnabled: state.canGoPrevious, onAction: onAction)
          progressControl
          IconActionButton(.nextStep, isEnabled: state.canGoNext, onAction: onAction)
        }
      }
    }
    .padding(.horizontal, DesignTokens.Spacing.compact)
    .padding(.vertical, DesignTokens.Spacing.compact)
    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: DesignTokens.Radius.panel))
    .overlay {
      RoundedRectangle(cornerRadius: DesignTokens.Radius.panel)
        .stroke(DesignTokens.Color.textPrimary.opacity(0.12), lineWidth: 1)
    }
    .accessibilityElement(children: .contain)
  }

  private var progressControl: some View {
    Button {
      onAction(density == .expanded ? .collapseTray : .expandTray)
    } label: {
      HStack(spacing: DesignTokens.Spacing.compact) {
        VStack(spacing: 3) {
          Text("\(state.currentStep) / \(state.totalSteps)")
            .font(.subheadline.weight(.semibold).monospacedDigit())
            .foregroundStyle(DesignTokens.Color.textPrimary)
          ProgressView(value: Double(state.currentStep), total: Double(state.totalSteps))
            .tint(DesignTokens.Color.cyan)
            .frame(maxWidth: 104)
        }

        Image(systemName: density == .expanded ? "chevron.down" : "chevron.up")
          .font(.system(size: 12, weight: .bold))
          .foregroundStyle(DesignTokens.Color.cyan)
      }
      .frame(maxWidth: .infinity, minHeight: 48)
      .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    .accessibilityLabel(
      Text(LocalizedStringKey(density == .expanded ? "action.collapse" : "action.expand"))
    )
    .accessibilityHint(Text("action.tray.hint"))
  }

  private var stepSelection: some View {
    ScrollView(.horizontal, showsIndicators: false) {
      HStack(spacing: DesignTokens.Spacing.compact) {
        ForEach(Array(state.stepIDs.enumerated()), id: \.element) { index, id in
          Button {
            onAction(.selectStep(id))
          } label: {
            VStack(spacing: 4) {
              HStack(spacing: 4) {
                if index + 1 == state.currentStep {
                  Image(systemName: "circle.fill")
                    .font(.system(size: 6, weight: .bold))
                }
                Text("\(index + 1)")
                  .font(.caption.weight(.semibold).monospacedDigit())
              }
              Text(state.stepLabels[safe: index] ?? "")
                .font(.caption2)
                .lineLimit(1)
            }
            .foregroundStyle(
              index + 1 == state.currentStep
                ? DesignTokens.Color.stageBlack : DesignTokens.Color.textPrimary
            )
            .frame(width: 72, height: 48)
            .background(
              index + 1 == state.currentStep
                ? DesignTokens.Color.cyan : DesignTokens.Color.stageSurface.opacity(0.82),
              in: RoundedRectangle(cornerRadius: DesignTokens.Radius.control))
          }
          .buttonStyle(.plain)
          .accessibilityLabel(Text(state.stepLabels[safe: index] ?? ""))
          .accessibilityAddTraits(index + 1 == state.currentStep ? .isSelected : [])
        }
      }
    }
  }
}

extension Collection {
  fileprivate subscript(safe index: Index) -> Element? {
    indices.contains(index) ? self[index] : nil
  }
}
