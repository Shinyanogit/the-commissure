import CommissureCore
import RealityKit
import SwiftUI
import UIKit

struct ProcedureSceneView: View {
  let runtime: ProcedureSceneRuntime
  let summary: String
  let onAction: (AppAction) -> Void
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Environment(\.sceneOcclusion) private var sceneOcclusion

  var body: some View {
    GeometryReader { proxy in
      RealityView { content in
        runtime.updateViewport(size: proxy.size, occlusion: sceneOcclusion)
        runtime.reduceMotion = reduceMotion
        await runtime.load(into: &content)
      } update: { _ in
        runtime.updateViewport(size: proxy.size, occlusion: sceneOcclusion)
        runtime.reduceMotion = reduceMotion
      }
      .overlay {
        ModelGestureSurface(
          onIntent: { runtime.onIntent?($0) }, onPan: { runtime.pan(x: $0, y: $1) }
        )
        .accessibilityHidden(true)
      }
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

extension EnvironmentValues {
  @Entry var sceneOcclusion = CGSize.zero
}

private struct ModelGestureSurface: UIViewRepresentable {
  let onIntent: (ProcedureIntent) -> Void
  let onPan: (CGFloat, CGFloat) -> Void

  func makeUIView(context: Context) -> UIView {
    let view = UIView()
    view.isMultipleTouchEnabled = true
    let pan = UIPanGestureRecognizer(
      target: context.coordinator, action: #selector(Coordinator.pan(_:)))
    pan.maximumNumberOfTouches = 2
    pan.delegate = context.coordinator
    let pinch = UIPinchGestureRecognizer(
      target: context.coordinator, action: #selector(Coordinator.pinch(_:)))
    pinch.delegate = context.coordinator
    view.addGestureRecognizer(pan)
    view.addGestureRecognizer(pinch)
    return view
  }

  func updateUIView(_ view: UIView, context: Context) {
    context.coordinator.onIntent = onIntent
    context.coordinator.onPan = onPan
  }

  func makeCoordinator() -> Coordinator { Coordinator(onIntent: onIntent, onPan: onPan) }

  final class Coordinator: NSObject, UIGestureRecognizerDelegate {
    var onIntent: (ProcedureIntent) -> Void
    var onPan: (CGFloat, CGFloat) -> Void
    private var touchCount = 0
    private var pinching = false
    private var rejected = false
    private var hadMultipleTouches = false

    init(onIntent: @escaping (ProcedureIntent) -> Void, onPan: @escaping (CGFloat, CGFloat) -> Void)
    {
      self.onIntent = onIntent
      self.onPan = onPan
    }

    func gestureRecognizer(
      _ gestureRecognizer: UIGestureRecognizer,
      shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
    ) -> Bool {
      gestureRecognizer.view === otherGestureRecognizer.view
    }

    @objc func pan(_ gesture: UIPanGestureRecognizer) {
      guard let view = gesture.view else { return }
      let delta = gesture.translation(in: view)
      defer { gesture.setTranslation(.zero, in: view) }
      if gesture.state == .began {
        let start = gesture.location(in: view).x - delta.x
        rejected = start < 24 || start > view.bounds.width - 24
        touchCount = gesture.numberOfTouches
        hadMultipleTouches = touchCount > 1
      }
      guard gesture.state == .began || gesture.state == .changed else {
        touchCount = 0
        rejected = false
        return
      }
      guard !rejected else { return }
      if gesture.numberOfTouches > 1 { hadMultipleTouches = true }
      guard touchCount == gesture.numberOfTouches else {
        touchCount = gesture.numberOfTouches
        return
      }
      if touchCount == 2 { onPan(delta.x, delta.y) }
      if touchCount == 1 && !pinching && !hadMultipleTouches {
        onIntent(.orbit(yaw: -Double(delta.x) * 0.008, pitch: -Double(delta.y) * 0.008))
      }
    }

    @objc func pinch(_ gesture: UIPinchGestureRecognizer) {
      switch gesture.state {
      case .began, .changed:
        pinching = true
        onIntent(.zoom(scale: 1 / Double(gesture.scale)))
        gesture.scale = 1
      default:
        pinching = false
        touchCount = 0
      }
    }
  }
}
