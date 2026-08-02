import SwiftUI

struct LibraryView: View {
  let state: LibraryViewState
  let onAction: (AppAction) -> Void

  @Environment(\.horizontalSizeClass) private var horizontalSizeClass

  var body: some View {
    ZStack {
      DesignTokens.Color.stageBlack.ignoresSafeArea()

      ScrollView {
        VStack(alignment: .leading, spacing: DesignTokens.Spacing.spacious) {
          header

          if state.isLoading {
            loadingState
          } else if state.cards.isEmpty {
            unavailableState
          } else {
            VStack(alignment: .leading, spacing: DesignTokens.Spacing.regular) {
              Text("library.section.title")
                .font(.title3.weight(.semibold))
                .foregroundStyle(DesignTokens.Color.textPrimary)

              cards
            }
          }
        }
        .frame(maxWidth: 1_160, alignment: .leading)
        .padding(.horizontal, DesignTokens.Spacing.edge)
        .padding(.vertical, DesignTokens.Spacing.regular)
      }
      .scrollIndicators(.hidden)
    }
    .toolbar(.hidden, for: .navigationBar)
    .preferredColorScheme(.dark)
  }

  private var header: some View {
    HStack(alignment: .top, spacing: DesignTokens.Spacing.regular) {
      VStack(alignment: .leading, spacing: DesignTokens.Spacing.compact) {
        HStack(spacing: DesignTokens.Spacing.compact) {
          Image(systemName: "waveform.path.ecg")
            .font(.system(size: 14, weight: .bold))
            .foregroundStyle(DesignTokens.Color.stageBlack)
            .frame(width: 32, height: 32)
            .background(DesignTokens.Color.cyan, in: RoundedRectangle(cornerRadius: 10))
            .accessibilityHidden(true)

          Text("app.kicker")
            .font(.caption.weight(.semibold))
            .tracking(1.4)
            .foregroundStyle(DesignTokens.Color.cyan)
        }

        Text("app.title")
          .font(.largeTitle.weight(.bold))
          .foregroundStyle(DesignTokens.Color.textPrimary)

        Text("library.subtitle")
          .font(.subheadline)
          .foregroundStyle(DesignTokens.Color.textSecondary)
          .fixedSize(horizontal: false, vertical: true)
      }

      Spacer(minLength: DesignTokens.Spacing.compact)

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
        Divider()
        Button {
          onAction(.openColophon)
        } label: {
          Text("action.about")
        }
        Button {
          onAction(.openSettings)
        } label: {
          Text("action.settings")
        }
      } label: {
        Image(systemName: "ellipsis.circle")
          .font(.system(size: 20, weight: .semibold))
          .frame(width: 44, height: 44)
          .foregroundStyle(DesignTokens.Color.textPrimary)
          .background(DesignTokens.Color.stageSurface.opacity(0.72), in: Circle())
      }
      .accessibilityLabel(Text("action.more"))
      .accessibilityHint(Text("action.more.hint"))
    }
  }

  private var cards: some View {
    LazyVGrid(
      columns: cardColumns,
      spacing: DesignTokens.Spacing.regular
    ) {
      ForEach(state.cards) { card in
        Button {
          onAction(primaryAction(for: card))
        } label: {
          LibraryCardView(state: card)
        }
        .buttonStyle(.plain)
      }
    }
  }

  private var cardColumns: [GridItem] {
    let columnCount = horizontalSizeClass == .regular ? 2 : 1
    return Array(
      repeating: GridItem(.flexible(), spacing: DesignTokens.Spacing.regular),
      count: columnCount
    )
  }

  private var loadingState: some View {
    VStack(alignment: .leading, spacing: DesignTokens.Spacing.regular) {
      ProgressView()
        .tint(DesignTokens.Color.cyan)
      Text("library.loading")
        .font(.headline)
        .foregroundStyle(DesignTokens.Color.textPrimary)
      Text("library.loading.detail")
        .font(.subheadline)
        .foregroundStyle(DesignTokens.Color.textSecondary)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(DesignTokens.Spacing.spacious)
    .background(
      DesignTokens.Color.stageSurface.opacity(0.72),
      in: RoundedRectangle(cornerRadius: DesignTokens.Radius.card)
    )
    .accessibilityElement(children: .combine)
  }

  private var unavailableState: some View {
    VStack(alignment: .leading, spacing: DesignTokens.Spacing.regular) {
      Image(systemName: "exclamationmark.triangle")
        .font(.system(size: 22, weight: .semibold))
        .foregroundStyle(DesignTokens.Color.textSecondary)
        .accessibilityHidden(true)
      Text("content.unavailable")
        .font(.headline)
        .foregroundStyle(DesignTokens.Color.textPrimary)
      Text("library.loading.detail")
        .font(.subheadline)
        .foregroundStyle(DesignTokens.Color.textSecondary)
        .fixedSize(horizontal: false, vertical: true)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(DesignTokens.Spacing.spacious)
    .background(
      DesignTokens.Color.stageSurface.opacity(0.72),
      in: RoundedRectangle(cornerRadius: DesignTokens.Radius.card)
    )
    .accessibilityElement(children: .combine)
  }

  private func primaryAction(for card: LibraryCardViewState) -> AppAction {
    switch card.availability {
    case .availableToDownload:
      .download(card.id)
    case .downloading:
      .cancelDownload(card.id)
    case .failed:
      .retry(card.id)
    case .bundled, .cached:
      .openProcedure(card.id)
    case .verifying:
      .cancelDownload(card.id)
    case .unavailableOffline:
      .retry(card.id)
    }
  }
}

private struct LibraryCardView: View {
  let state: LibraryCardViewState

  var body: some View {
    VStack(alignment: .leading, spacing: DesignTokens.Spacing.regular) {
      HStack(alignment: .center, spacing: DesignTokens.Spacing.compact) {
        Text(state.id.uppercased())
          .font(.caption.weight(.bold).monospaced())
          .foregroundStyle(DesignTokens.Color.cyan)
          .padding(.horizontal, 9)
          .padding(.vertical, 5)
          .background(DesignTokens.Color.teal.opacity(0.32), in: Capsule())

        Spacer(minLength: DesignTokens.Spacing.compact)

        Image(systemName: "arrow.up.right")
          .font(.system(size: 13, weight: .bold))
          .foregroundStyle(DesignTokens.Color.textSecondary)
          .accessibilityHidden(true)
      }

      VStack(alignment: .leading, spacing: DesignTokens.Spacing.compact) {
        Text(state.title)
          .font(.title3.weight(.semibold))
          .foregroundStyle(DesignTokens.Color.textPrimary)
          .multilineTextAlignment(.leading)
          .lineLimit(2)

        Text(state.summary)
          .font(.callout)
          .foregroundStyle(DesignTokens.Color.textSecondary)
          .multilineTextAlignment(.leading)
          .lineLimit(3)
          .fixedSize(horizontal: false, vertical: true)
      }

      Spacer(minLength: DesignTokens.Spacing.compact)

      HStack(spacing: DesignTokens.Spacing.compact) {
        Image(systemName: availabilityIcon)
          .font(.system(size: 12, weight: .semibold))
          .foregroundStyle(availabilityTint)
          .accessibilityHidden(true)
        Text(state.availabilityLabel)
          .font(.caption.weight(.medium))
          .foregroundStyle(DesignTokens.Color.textPrimary)
          .lineLimit(1)
        Spacer(minLength: DesignTokens.Spacing.compact)
        Text(state.stepCountLabel)
          .font(.caption.monospacedDigit())
          .foregroundStyle(DesignTokens.Color.textSecondary)
          .lineLimit(1)
      }
    }
    .frame(maxWidth: .infinity, minHeight: 176, alignment: .topLeading)
    .padding(DesignTokens.Spacing.spacious)
    .background(
      DesignTokens.Color.stageSurface.opacity(0.86),
      in: RoundedRectangle(cornerRadius: DesignTokens.Radius.card)
    )
    .overlay {
      RoundedRectangle(cornerRadius: DesignTokens.Radius.card)
        .stroke(DesignTokens.Color.textPrimary.opacity(0.08), lineWidth: 1)
    }
    .contentShape(RoundedRectangle(cornerRadius: DesignTokens.Radius.card))
    .accessibilityElement(children: .combine)
    .accessibilityHint(Text("library.card.hint"))
  }

  private var availabilityIcon: String {
    switch state.availability {
    case .bundled: "checkmark.circle.fill"
    case .cached: "arrow.clockwise.circle.fill"
    case .availableToDownload: "arrow.down.circle"
    case .downloading: "arrow.down.circle"
    case .verifying: "checkmark.seal"
    case .unavailableOffline: "wifi.slash"
    case .failed: "exclamationmark.triangle"
    }
  }

  private var availabilityTint: SwiftUI.Color {
    switch state.availability {
    case .bundled, .cached: DesignTokens.Color.cyan
    case .availableToDownload, .downloading, .verifying: DesignTokens.Color.bone
    case .unavailableOffline, .failed: DesignTokens.Color.textSecondary
    }
  }
}
