import SwiftUI

struct LibraryView: View {
  let state: LibraryViewState
  let onAction: (AppAction) -> Void
  @State private var pendingUpdate: String?

  @Environment(\.dynamicTypeSize) private var typeSize

  var body: some View {
    GeometryReader { geometry in
      ZStack {
        DesignTokens.Color.stageBlack.ignoresSafeArea()
        GeometryReader { background in
          Image("home-spine")
            .resizable()
            .scaledToFill()
            .frame(width: background.size.width, height: background.size.height)
            .clipped()
            .overlay(Color.black.opacity(0.42))
        }
        .ignoresSafeArea()
        .accessibilityHidden(true)

        ScrollView {
          VStack(alignment: .leading, spacing: 28) {
            header
            if state.isLoading {
              loadingState
            } else if state.cards.isEmpty {
              unavailableState
            } else {
              cards(width: geometry.size.width)
              if state.cards.allSatisfy({
                $0.availability == .bundled || $0.availability == .cached
              }) {
                Label("library.status.bundled", systemImage: "checkmark.circle")
                  .font(.footnote)
                  .foregroundStyle(DesignTokens.Color.textSecondary)
              }
            }
          }
          .frame(maxWidth: 1000)
          .padding(.horizontal, geometry.size.width > 700 ? 40 : 24)
          .padding(.top, 12)
          .padding(.bottom, 28)
          .frame(maxWidth: .infinity)
        }
        .scrollIndicators(.hidden)
      }
    }
    .preferredColorScheme(.dark)
  }

  private var header: some View {
    VStack(alignment: .leading, spacing: 18) {
      HStack {
        if !typeSize.isAccessibilitySize {
          Text("library.eyebrow")
            .font(.caption.weight(.medium))
            .tracking(2)
            .foregroundStyle(DesignTokens.Color.textSecondary)
        }
        Spacer()
        Menu {
          Button("language.followSystem") { onAction(.changeLanguage(.followSystem)) }
          Button("language.english") { onAction(.changeLanguage(.english)) }
          Button("language.japanese") { onAction(.changeLanguage(.japanese)) }
        } label: {
          Image(systemName: "globe").font(.system(size: 20)).frame(width: 44, height: 44)
        }
        .accessibilityLabel(Text("action.language"))
        .accessibilityIdentifier("library-language")
        IconActionButton(.openSettings, onAction: onAction)
        IconActionButton(.openColophon, onAction: onAction)
      }
      .foregroundStyle(.white)

      Image("wordmark")
        .resizable()
        .scaledToFit()
        .frame(maxWidth: 270, alignment: .leading)
        .accessibilityLabel("The Commissure")
        .accessibilityAddTraits(.isHeader)
      Text(typeSize.isAccessibilitySize ? "library.eyebrow" : "library.introduction")
        .font(.subheadline)
        .foregroundStyle(DesignTokens.Color.textSecondary)
        .fixedSize(horizontal: false, vertical: true)
    }
  }

  private func cards(width: CGFloat) -> some View {
    LazyVGrid(
      columns: Array(
        repeating: GridItem(.flexible(), spacing: 16),
        count: width >= 760 && !typeSize.isAccessibilitySize ? 2 : 1),
      spacing: 16
    ) {
      ForEach(state.cards) { card in
        VStack(spacing: 0) {
          Button {
            onAction(primaryAction(for: card))
          } label: {
            LibraryCardView(state: card)
          }
          .buttonStyle(.plain)
          .accessibilityIdentifier("procedure-\(card.id)")
          if card.isUpdating {
            HStack {
              ProgressView().tint(DesignTokens.Color.cyan)
              Spacer()
              IconActionButton(.cancelDownload(card.id), onAction: onAction)
            }.padding(.horizontal)
          } else if let bytes = card.updateBytes {
            Button {
              pendingUpdate = card.id
            } label: {
              Label(
                "\(String(localized: "content.update")) · \(ByteCountFormatter.string(fromByteCount: Int64(bytes), countStyle: .file))",
                systemImage: card.updateFailed ? "arrow.clockwise" : "arrow.down.circle"
              )
              .font(.caption)
              .foregroundStyle(DesignTokens.Color.cyan)
              .frame(maxWidth: .infinity, minHeight: 44, alignment: .trailing)
            }
          }
        }
        .confirmationDialog(
          "content.update",
          isPresented: Binding(
            get: { pendingUpdate == card.id },
            set: { if !$0 { pendingUpdate = nil } }), titleVisibility: .visible
        ) {
          Button("action.download") {
            onAction(.download(card.id))
            pendingUpdate = nil
          }
        }

      }
    }
  }

  private var loadingState: some View {
    VStack(alignment: .leading, spacing: DesignTokens.Spacing.regular) {
      ProgressView()
        .tint(DesignTokens.Color.cyan)
      Text("library.loading")
        .font(.headline)
        .foregroundStyle(DesignTokens.Color.textPrimary)

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
  @Environment(\.dynamicTypeSize) private var typeSize

  var body: some View {
    HStack(alignment: .center, spacing: 16) {
      if !typeSize.isAccessibilitySize {
        Image(state.id)
          .resizable()
          .scaledToFill()
          .frame(width: 64, height: 88)
          .clipped()
          .clipShape(RoundedRectangle(cornerRadius: 10))
          .accessibilityHidden(true)
      }
      VStack(alignment: .leading, spacing: 7) {
        let titleLayout =
          typeSize.isAccessibilitySize
          ? AnyLayout(VStackLayout(alignment: .leading, spacing: 6))
          : AnyLayout(HStackLayout(alignment: .firstTextBaseline))
        titleLayout {
          Text(state.id.uppercased())
            .font(.title2.weight(.semibold))
            .tracking(0.5)
          if !typeSize.isAccessibilitySize { Spacer(minLength: 4) }
          Text(state.stepCountLabel)
            .font(.caption)
            .foregroundStyle(DesignTokens.Color.textSecondary)
        }
        Text(state.title)
          .font(.subheadline)
          .foregroundStyle(DesignTokens.Color.textSecondary)
          .fixedSize(horizontal: false, vertical: true)
        if state.availability != .bundled && state.availability != .cached {
          Text(state.availabilityLabel)
            .font(.caption)
        }
      }
      Image(systemName: "arrow.up.right")
        .font(.system(size: 13, weight: .medium))
        .foregroundStyle(DesignTokens.Color.textSecondary)
        .accessibilityHidden(true)
    }
    .foregroundStyle(.white)
    .multilineTextAlignment(.leading)
    .padding(18)
    .frame(maxWidth: .infinity, minHeight: 126, alignment: .leading)
    .background(
      DesignTokens.Color.stageSurface.opacity(0.91), in: RoundedRectangle(cornerRadius: 18)
    )
    .overlay {
      RoundedRectangle(cornerRadius: 18)
        .stroke(.white.opacity(0.12), lineWidth: 0.5)
    }
    .accessibilityElement(children: .combine)
    .accessibilityHint(Text("library.card.hint"))
  }
}
