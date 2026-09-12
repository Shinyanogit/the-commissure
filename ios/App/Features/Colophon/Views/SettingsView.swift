import SwiftUI

struct SettingsView: View {
  @State private var confirmsClear = false
  @State private var confirmsReset = false
  var canClearDownloads = true
  let onAction: (AppAction) -> Void

  var body: some View {
    ZStack {
      DesignTokens.Color.stageBlack.ignoresSafeArea()
      VStack(alignment: .leading, spacing: DesignTokens.Spacing.spacious) {
        HStack {
          IconActionButton(.back, onAction: onAction)
          Text("action.settings")
            .font(.title2.weight(.semibold))
            .foregroundStyle(DesignTokens.Color.textPrimary)
          Spacer()
        }

        VStack(alignment: .leading, spacing: DesignTokens.Spacing.compact) {
          Text("action.language")
            .font(.headline)
            .foregroundStyle(DesignTokens.Color.textPrimary)
          Menu {
            Button {
              onAction(.changeLanguage(.followSystem))
            } label: {
              Text("language.followSystem")
            }
            Button {
              onAction(.changeLanguage(.english))
            } label: {
              Text("language.english")
            }
            Button {
              onAction(.changeLanguage(.japanese))
            } label: {
              Text("language.japanese")
            }
          } label: {
            Label("action.language", systemImage: "globe")
              .foregroundStyle(DesignTokens.Color.textPrimary)
              .padding(.horizontal, DesignTokens.Spacing.regular)
              .frame(minHeight: 44)
              .background(
                DesignTokens.Color.stageSurface,
                in: RoundedRectangle(cornerRadius: DesignTokens.Radius.control)
              )
          }
          .accessibilityHint(Text("action.language.hint"))
        }

        Button("action.resetProgress", role: .destructive) { confirmsReset = true }
          .confirmationDialog(
            "action.resetProgress.detail", isPresented: $confirmsReset, titleVisibility: .visible
          ) {
            Button("action.resetProgress", role: .destructive) { onAction(.resetProgress) }
          }
        Button("action.clearDownloads", role: .destructive) { confirmsClear = true }
          .disabled(!canClearDownloads)
          .confirmationDialog(
            "action.clearDownloads.detail", isPresented: $confirmsClear, titleVisibility: .visible
          ) {
            Button("action.clearDownloads", role: .destructive) { onAction(.clearDownloads) }
          }
        Spacer()
      }
      .padding(.horizontal, DesignTokens.Spacing.edge)
      .padding(.vertical, DesignTokens.Spacing.regular)
    }
    .preferredColorScheme(.dark)
  }
}
