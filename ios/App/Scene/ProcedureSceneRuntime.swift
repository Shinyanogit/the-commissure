import CommissureCore
import OSLog
import Observation
import RealityKit
import SwiftUI

@MainActor
@Observable
final class ProcedureSceneRuntime {
  let id = UUID()
  private(set) var readiness: SceneReadiness = .preparing
  private(set) var diagnostic = "preparing"
  private(set) var loadedModelURL: URL?
  private let bundle: ProcedureBundle
  private let assets: NativeAssetStore
  private let installedURL: URL?
  private let controller: ProcedureSessionController
  private let adapter = RealitySceneAdapter()
  private var transitionInterval: OSSignpostIntervalState?
  private var root: Entity?
  private var disposed = false
  private var frameSubscription: EventSubscription?
  private var gestureResolver = GestureIntentResolver()
  var onReady: ((URL) -> Void)?
  var onFailure: (() -> Void)?
  var onIntent: ((ProcedureIntent) -> Void)?
  var reduceMotion = false

  init(
    bundle: ProcedureBundle, assets: NativeAssetStore, controller: ProcedureSessionController,
    installedURL: URL? = nil
  ) {
    self.bundle = bundle
    self.assets = assets
    self.controller = controller
    self.installedURL = installedURL
  }

  func load(into content: inout RealityViewCameraContent) async {
    guard !disposed, root == nil else { return }
    let interval = Diagnostics.signposter.beginInterval("ProcedureLoad")
    defer { Diagnostics.signposter.endInterval("ProcedureLoad", interval) }
    do {
      let url: URL
      if let installedURL {
        url = installedURL
      } else {
        url = try await assets.verifiedModel(for: bundle)
      }
      let entity = try await Entity(contentsOf: url, withName: bundle.procedure.id)
      guard !disposed, !Task.isCancelled else { return }
      try adapter.bind(root: entity, bindings: bundle.scene.parts)
      let state = try controller.setContentReady()
      try adapter.present(
        state, revision: controller.session.targetRevision,
        adjustment: controller.session.cameraAdjustment)
      root = entity
      loadedModelURL = url
      content.add(entity)
      content.add(adapter.camera)
      content.camera = .virtual
      content.cameraTarget = adapter.camera
      frameSubscription = content.subscribe(to: SceneEvents.Update.self) { [weak self] event in
        Task { @MainActor in self?.advanceFrame(event.deltaTime) }
      }
      readiness = .ready
      onReady?(url)
      diagnostic =
        "ready; bindings \(adapter.boundEntityCount); \(controller.session.selectedStepID)"
    } catch {
      guard !disposed else { return }
      readiness = .failed
      diagnostic = "failed"
      Diagnostics.content.error(
        "Native scene load failed: \(String(describing: error), privacy: .public)")
      onFailure?()
    }
  }

  func present(_ state: SceneState, animated: Bool) {
    guard root != nil, !disposed else { return }
    finishTransitionInterval()
    do {
      try adapter.present(
        state, revision: controller.session.targetRevision,
        adjustment: controller.session.cameraAdjustment, animated: animated && !reduceMotion)
      if adapter.isTransitioning {
        transitionInterval = Diagnostics.signposter.beginInterval("StepTransition")
      }
      readiness = adapter.isTransitioning ? .transitioning : .ready
      diagnostic =
        "\(adapter.isTransitioning ? "transitioning" : "ready"); bindings \(adapter.boundEntityCount); \(controller.session.selectedStepID)"
    } catch {
      readiness = .failed
      diagnostic = "failed"
    }
  }

  func consume(_ sample: GestureSample) {
    for intent in gestureResolver.consume(sample, capabilities: controller.session.capabilities) {
      onIntent?(intent)
    }
  }

  func dispose() {
    finishTransitionInterval()
    disposed = true
    frameSubscription?.cancel()
    frameSubscription = nil
    root?.removeFromParent()
    root = nil
    adapter.reset()
    loadedModelURL = nil
    onIntent = nil
    onReady = nil
    onFailure = nil
  }

  private func finishTransitionInterval() {
    if let interval = transitionInterval {
      Diagnostics.signposter.endInterval("StepTransition", interval)
      transitionInterval = nil
    }
  }

  private func advanceFrame(_ delta: Double) {
    guard !disposed else { return }
    adapter.advance(by: delta)
    if readiness == .transitioning && !adapter.isTransitioning {
      finishTransitionInterval()
      readiness = .ready
      diagnostic =
        "ready; bindings \(adapter.boundEntityCount); \(controller.session.selectedStepID)"
    }
  }
}
