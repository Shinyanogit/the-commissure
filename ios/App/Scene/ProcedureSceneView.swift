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
    let orbit = UIPanGestureRecognizer(
      target: context.coordinator, action: #selector(Coordinator.orbit(_:)))
    orbit.maximumNumberOfTouches = 1
    orbit.delegate = context.coordinator
    let pan = UIPanGestureRecognizer(
      target: context.coordinator, action: #selector(Coordinator.pan(_:)))
    pan.minimumNumberOfTouches = 2
    pan.maximumNumberOfTouches = 2
    pan.delegate = context.coordinator
    let pinch = UIPinchGestureRecognizer(
      target: context.coordinator, action: #selector(Coordinator.pinch(_:)))
    pinch.delegate = context.coordinator
    view.addGestureRecognizer(orbit)
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
    private var rejectedPanGestures = Set<ObjectIdentifier>()
    init(onIntent: @escaping (ProcedureIntent) -> Void, onPan: @escaping (CGFloat, CGFloat) -> Void)
    {
      self.onIntent = onIntent
      self.onPan = onPan
    }

    func gestureRecognizer(
      _ gestureRecognizer: UIGestureRecognizer,
      shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
    ) -> Bool {
      guard gestureRecognizer.view === otherGestureRecognizer.view else { return false }
      if let pan = gestureRecognizer as? UIPanGestureRecognizer,
        pan.maximumNumberOfTouches == 1
      {
        return false
      }
      if let pan = otherGestureRecognizer as? UIPanGestureRecognizer,
        pan.maximumNumberOfTouches == 1
      {
        return false
      }
      return true
    }

    @objc func pan(_ gesture: UIPanGestureRecognizer) {
      guard accepts(gesture), let view = gesture.view else { return }
      let delta = gesture.translation(in: view)
      defer { gesture.setTranslation(.zero, in: view) }
      onPan(delta.x, delta.y)
    }

    @objc func orbit(_ gesture: UIPanGestureRecognizer) {
      guard accepts(gesture), let view = gesture.view else { return }
      let delta = gesture.translation(in: view)
      defer { gesture.setTranslation(.zero, in: view) }
      onIntent(.orbit(yaw: -Double(delta.x) * 0.008, pitch: -Double(delta.y) * 0.008))
    }

    @objc func pinch(_ gesture: UIPinchGestureRecognizer) {
      switch gesture.state {
      case .began, .changed:
        onIntent(.zoom(scale: 1 / Double(gesture.scale)))
        gesture.scale = 1
      default:
        break
      }
    }

    private func accepts(_ gesture: UIPanGestureRecognizer) -> Bool {
      guard let view = gesture.view else { return false }
      let identifier = ObjectIdentifier(gesture)
      guard gesture.state == .began || gesture.state == .changed else {
        rejectedPanGestures.remove(identifier)
        return false
      }
      if gesture.state == .began {
        let start = gesture.location(in: view).x - gesture.translation(in: view).x
        if start < 24 || start > view.bounds.width - 24 {
          rejectedPanGestures.insert(identifier)
        }
      }
      return !rejectedPanGestures.contains(identifier)
    }
  }
}
