import CommissureCore
import RealityKit
import SwiftUI

struct ProcedureSceneView: View {
  let runtime: ProcedureSceneRuntime
  let summary: String
  let onAction: (AppAction) -> Void
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @State private var dragStarted = false
  @State private var lastMagnification = 1.0

  var body: some View {
    GeometryReader { proxy in
      RealityView { content in
        runtime.reduceMotion = reduceMotion
        await runtime.load(into: &content)
      } update: { _ in
        runtime.reduceMotion = reduceMotion
      }
      .gesture(
        DragGesture(minimumDistance: 8)
          .onChanged { value in
            if !dragStarted {
              dragStarted = true
              runtime.consume(
                .began(
                  point: GesturePoint(x: value.startLocation.x, y: value.startLocation.y),
                  touches: 1,
                  viewport: GestureViewport(width: proxy.size.width, height: proxy.size.height)))
            }
            runtime.consume(
              .moved(point: GesturePoint(x: value.location.x, y: value.location.y), touches: 1))
          }
          .onEnded { _ in
            runtime.consume(.ended)
            dragStarted = false
          }
      )
      .simultaneousGesture(
        MagnifyGesture()
          .onChanged { value in
            runtime.consume(.pinch(scale: lastMagnification / value.magnification))
            lastMagnification = value.magnification
          }
          .onEnded { _ in
            lastMagnification = 1
            dragStarted = false
            runtime.consume(.ended)
          }
      )
      .accessibilityElement(children: .ignore)
      .accessibilityIdentifier(
        runtime.readiness == .ready ? "reality-field-ready" : "reality-field-pending"
      )
      .accessibilityLabel(Text("theater.scene.accessibility"))
      .accessibilityValue(Text(.init(summary)))
      .accessibilityAdjustableAction { direction in
        if direction == .increment { onAction(.nextStep) }
        if direction == .decrement { onAction(.previousStep) }
      }
      .accessibilityAction(named: Text("action.reset")) { onAction(.resetView) }
      .accessibilityAction(named: Text("action.zoomIn")) { onAction(.zoomIn) }
      .accessibilityAction(named: Text("action.zoomOut")) { onAction(.zoomOut) }
      .accessibilityAction(named: Text("action.orbitLeft")) { onAction(.orbitLeft) }
      .accessibilityAction(named: Text("action.orbitRight")) { onAction(.orbitRight) }
    }
  }
}
