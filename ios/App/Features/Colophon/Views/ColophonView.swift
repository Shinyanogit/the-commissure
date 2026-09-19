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
          Text("colophon.authors")
            .font(.title3.weight(.semibold))
            .foregroundStyle(.white)
          author("Rintaro Imada", detail: "colophon.imada")
          author("Shinya Yamaguchi", detail: "colophon.yamaguchi")
          author("Koki Tokida", detail: "colophon.tokida")
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
  private func author(_ name: String, detail: LocalizedStringKey) -> some View {
    VStack(alignment: .leading, spacing: 6) {
      Text(name).font(.headline).foregroundStyle(.white)
      Text(detail).font(.body).foregroundStyle(DesignTokens.Color.textSecondary)
    }
    .fixedSize(horizontal: false, vertical: true)
  }

}
