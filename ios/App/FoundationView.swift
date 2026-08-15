import SwiftUI

struct FoundationView: View {
  @State private var model: FoundationAppModel
  @State private var isColophonPresented = false
  @State private var isSettingsPresented = false

  init(model: FoundationAppModel) {
    _model = State(initialValue: model)
  }

  var body: some View {
    NavigationStack {
      Group {
        if let theater = model.theaterViewState {
          ProcedureTheaterView(state: theater, onAction: dispatch)
            .toolbar(.hidden, for: .navigationBar)
        } else {
          LibraryView(state: model.libraryViewState, onAction: dispatch)
            .navigationTitle("app.title")
            .navigationBarTitleDisplayMode(.inline)
        }
      }
    }
    .environment(\.locale, Locale(identifier: model.effectiveLocale))
    .sheet(isPresented: $isColophonPresented) {
      ColophonView { action in
        if case .back = action {
          isColophonPresented = false
        }
      }
    }
    .sheet(isPresented: $isSettingsPresented) {
      SettingsView(onAction: settingsDispatch)
    }
    .task { await model.loadBundledContent() }
  }

  private func dispatch(_ action: AppAction) {
    switch action {
    case .openProcedure(let id):
      Task { await model.openProcedure(id: id) }
    case .back:
      model.closeProcedure()
    case .openColophon:
      isColophonPresented = true
    case .openSettings:
      isSettingsPresented = true
    case .changeLanguage(let language):
      model.setLanguage(language)
    case .resetView, .previousStep, .nextStep, .selectStep(_),
      .download(_), .cancelDownload(_), .retry(_):
      model.send(action)
    case .expandTray, .collapseTray:
      break
    }
  }

  private func settingsDispatch(_ action: AppAction) {
    if case .back = action {
      isSettingsPresented = false
    } else {
      dispatch(action)
    }
  }
}
