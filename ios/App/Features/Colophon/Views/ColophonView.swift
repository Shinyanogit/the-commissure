import SwiftUI

struct ColophonView: View {
  let onAction: (AppAction) -> Void

  var body: some View {
    ZStack {
      DesignTokens.Color.stageBlack.ignoresSafeArea()
      ScrollView {
        VStack(alignment: .leading, spacing: DesignTokens.Spacing.spacious) {
          HStack {
            IconActionButton(.back, onAction: onAction)
            Text("colophon.title")
              .font(.title2.weight(.semibold))
              .foregroundStyle(DesignTokens.Color.textPrimary)
            Spacer()
          }
          Text("colophon.body")
            .font(.body)
            .foregroundStyle(DesignTokens.Color.textPrimary)
            .fixedSize(horizontal: false, vertical: true)
          Text("colophon.disclaimer")
            .font(.footnote)
            .foregroundStyle(DesignTokens.Color.textSecondary)
            .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, DesignTokens.Spacing.edge)
        .padding(.vertical, DesignTokens.Spacing.regular)
      }
    }
    .preferredColorScheme(.dark)
  }
}
