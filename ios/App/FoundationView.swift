import SwiftUI

struct FoundationView: View {
  @State private var model: FoundationAppModel

  init(model: FoundationAppModel) {
    _model = State(initialValue: model)
  }

  var body: some View {
    NavigationStack {
      Group {
        switch model.state {
        case .idle, .loading:
          ProgressView()
        case .ready(let items):
          List(items) { item in
            VStack(alignment: .leading) {
              Text(item.title)
              Text(item.summary)
                .font(.caption)
                .foregroundStyle(.secondary)
            }
          }
        case .failed:
          ContentUnavailableView(
            String(localized: "content.unavailable"),
            systemImage: "exclamationmark.triangle"
          )
        }
      }
      .navigationTitle(String(localized: "app.title"))
    }
    .task { await model.loadBundledContent() }
  }
}
