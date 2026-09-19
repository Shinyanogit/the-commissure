import SwiftUI

struct FoundationView: View {
  @State private var model: FoundationAppModel
  @State private var isColophonPresented = false
  @State private var isSettingsPresented = false
  @State private var isLoaderVisible = false
  @State private var loadingStarted = Date.distantPast

  private var loadingRequested: Bool {
    model.isOpeningProcedure || model.sceneRuntime?.readiness == .preparing
  }

  init(model: FoundationAppModel) {
    _model = State(initialValue: model)
  }

  var body: some View {
    NavigationStack {
      Group {
        if let theater = model.theaterViewState {
          ProcedureTheaterView(
            state: theater,
            scene: AnyView(
              Group {
                if let runtime = model.sceneRuntime {
                  ProcedureSceneView(
                    runtime: runtime, summary: theater.accessibilitySummary, onAction: dispatch
                  )
                  .id(runtime.id)
                }
              }), onAction: dispatch
          )
          .toolbar(.hidden, for: .navigationBar)
        } else {
          LibraryView(state: model.libraryViewState, onAction: dispatch)
            .toolbar(.hidden, for: .navigationBar)
        }
      }
    }
    .overlay {
      if loadingRequested || isLoaderVisible {
        ProcedureLoadingView()
          .accessibilityIdentifier("procedure-loading")
          .transition(.opacity)
      }
    }
    .task(id: loadingRequested) {
      if loadingRequested {
        loadingStarted = Date()
        isLoaderVisible = true
      } else {
        let remaining = max(0, 0.5 - Date().timeIntervalSince(loadingStarted))
        try? await Task.sleep(for: .seconds(remaining))
        guard !Task.isCancelled else { return }
        withAnimation(.easeOut(duration: 0.15)) { isLoaderVisible = false }
      }
    }
    .sheet(isPresented: $isColophonPresented) {
      ColophonView { action in
        if case .back = action {
          isColophonPresented = false
        }
      }
    }
    .sheet(isPresented: $isSettingsPresented) {
      SettingsView(
        language: model.language,
        canClearDownloads: model.sceneRuntime == nil
          && model.delivery?.updating.isEmpty != false
          && model.delivery?.isClearingDownloads != true,
        onAction: settingsDispatch)
    }
    .environment(\.locale, Locale(identifier: model.effectiveLocale))
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
    default:
      model.send(action)
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

private struct ProcedureLoadingView: View {
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @State private var reveal = false

  var body: some View {
    GeometryReader { geometry in
      ZStack {
        Color(red: 5 / 255, green: 6 / 255, blue: 7 / 255)
        RadialGradient(
          colors: [Color(red: 0, green: 155 / 255, blue: 158 / 255).opacity(0.16), .clear],
          center: UnitPoint(x: 0.34, y: 0.36), startRadius: 0,
          endRadius: max(geometry.size.width, geometry.size.height) * 0.32)
        RadialGradient(
          colors: [.cyan.opacity(0.07), .clear], center: UnitPoint(x: 0.7, y: 0.68),
          startRadius: 0, endRadius: max(geometry.size.width, geometry.size.height) * 0.28)
        let width = min(
          geometry.size.width * (geometry.size.width <= 768 ? 0.82 : 0.76),
          geometry.size.width <= 768 ? 384 : 544)
        Image("wordmark")
          .resizable()
          .scaledToFit()
          .opacity(0.18)
          .overlay {
            Image("wordmark")
              .resizable()
              .scaledToFit()
              .opacity(0.96)
              .shadow(color: .cyan.opacity(0.2), radius: 18)
              .mask(alignment: .leading) {
                Rectangle().frame(width: reduceMotion || reveal ? width : 0)
              }
          }
          .frame(width: width)
      }
    }
    .ignoresSafeArea()
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(Text("theater.scene.preparing"))
    .onAppear {
      if !reduceMotion {
        withAnimation(.easeInOut(duration: 1.1).repeatForever(autoreverses: true)) { reveal = true }
      }
    }
  }
}
