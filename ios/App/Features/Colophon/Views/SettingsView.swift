import SwiftUI

struct SettingsView: View {
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

        Spacer()
      }
      .padding(.horizontal, DesignTokens.Spacing.edge)
      .padding(.vertical, DesignTokens.Spacing.regular)
    }
    .preferredColorScheme(.dark)
  }
}
