import SwiftUI

struct SettingsView: View {
  @State private var confirmsClear = false
  @State private var confirmsReset = false
  var language: AppLanguage = .followSystem
  var canClearDownloads = true
  let onAction: (AppAction) -> Void

  var body: some View {
    NavigationStack {
      Form {
        Section {
          Picker(
            "action.language",
            selection: Binding(
              get: { language }, set: { onAction(.changeLanguage($0)) }
            )
          ) {
            Text("language.followSystem").tag(AppLanguage.followSystem)
            Text("language.english").tag(AppLanguage.english)
            Text("language.japanese").tag(AppLanguage.japanese)
          }
          .tint(.white)
          .accessibilityIdentifier("settings-language")
        }
        .listRowBackground(DesignTokens.Color.stageSurface)

        Section {
          Button("action.resetProgress", role: .destructive) { confirmsReset = true }
            .confirmationDialog(
              "action.resetProgress.detail", isPresented: $confirmsReset, titleVisibility: .visible
            ) {
              Button("action.resetProgress", role: .destructive) { onAction(.resetProgress) }
            }
        } footer: {
          Text("action.resetProgress.detail")
        }
        .listRowBackground(DesignTokens.Color.stageSurface)

        Section {
          Button("action.clearDownloads", role: .destructive) { confirmsClear = true }
            .disabled(!canClearDownloads)
            .confirmationDialog(
              "action.clearDownloads.detail", isPresented: $confirmsClear, titleVisibility: .visible
            ) {
              Button("action.clearDownloads", role: .destructive) { onAction(.clearDownloads) }
            }
        } footer: {
          Text("action.clearDownloads.detail")
        }
        .listRowBackground(DesignTokens.Color.stageSurface)
      }
      .scrollContentBackground(.hidden)
      .background(DesignTokens.Color.stageBlack)
      .navigationTitle("action.settings")
      .navigationBarTitleDisplayMode(.inline)
      .toolbar {
        ToolbarItem(placement: .confirmationAction) {
          Button {
            onAction(.back)
          } label: {
            Image(systemName: "xmark")
          }
          .accessibilityLabel(Text("action.close"))
          .accessibilityIdentifier("action.close")
        }
      }
    }
    .preferredColorScheme(.dark)
  }
}
