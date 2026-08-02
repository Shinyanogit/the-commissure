import SwiftUI

struct IconActionButton: View {
  let action: AppAction
  let isEnabled: Bool
  let onAction: (AppAction) -> Void

  init(
    _ action: AppAction,
    isEnabled: Bool = true,
    onAction: @escaping (AppAction) -> Void
  ) {
    self.action = action
    self.isEnabled = isEnabled
    self.onAction = onAction
  }

  var body: some View {
    Button {
      onAction(action)
    } label: {
      Image(systemName: descriptor.systemImage)
        .font(.system(size: 16, weight: .semibold))
        .frame(width: 44, height: 44)
        .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    .foregroundStyle(isEnabled ? DesignTokens.Color.textPrimary : DesignTokens.Color.textSecondary)
    .background(DesignTokens.Color.stageSurface.opacity(0.72), in: Circle())
    .accessibilityLabel(Text(LocalizedStringKey(descriptor.labelKey)))
    .accessibilityHint(Text(LocalizedStringKey(descriptor.hintKey)))
    .disabled(!isEnabled)
  }

  private var descriptor: ActionDescriptor {
    ActionDescriptors.descriptor(for: action)
      ?? ActionDescriptor(
        systemImage: "circle", labelKey: "action.unknown", hintKey: "action.unknown.hint")
  }
}
