import NativeAssetSpikeCore
import RealityKit
import SwiftUI
import UIKit

struct SpikeView: View {
    @State private var session = SpikeSession()
    @State private var dragStartYaw: Float?
    @State private var dragStartPitch: Float?
    @State private var magnifyStartZoom: Float?
    @State private var frameSubscription: EventSubscription?

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            RealityView { content in
                await session.load(into: &content)
                frameSubscription = content.subscribe(to: SceneEvents.Update.self) { event in
                    Task { @MainActor in
                        session.recordFrame(deltaTime: event.deltaTime)
                    }
                }
            } update: { _ in } placeholder: {
                ProgressView("Loading \(session.procedure.title)")
                    .tint(.cyan)
                    .foregroundStyle(.white)
            }
            .gesture(dragGesture)
            .simultaneousGesture(magnifyGesture)
            .accessibilityElement(children: .ignore)
            .accessibilityIdentifier("reality-field")
            .accessibilityLabel("\(session.procedure.title) model")
            .accessibilityValue(
                "step \(session.step); yaw \(session.orbitYaw); pitch \(session.orbitPitch); zoom \(session.zoom)"
            )

            VStack(spacing: 0) {
                diagnosticHeader
                Spacer()
                stepTray
            }
        }
        .preferredColorScheme(.dark)
        .onAppear {
            UIApplication.shared.isIdleTimerDisabled = session.shouldPreventIdleSleep
        }
        .onDisappear {
            UIApplication.shared.isIdleTimerDisabled = false
        }
    }

    private var diagnosticHeader: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 3) {
                Text("\(session.procedure.title) Native Asset Spike")
                    .font(.headline)
                Text(
                    String(
                        format: "%.1f MB  decode %.0f ms  bind %.0f ms\n%.0f MB  %.0f fps  thermal %@/%@",
                        session.metrics.archiveMB,
                        session.metrics.decodeMS,
                        session.metrics.bindingMS,
                        session.metrics.memoryMB,
                        session.metrics.fps,
                        session.metrics.thermal,
                        session.metrics.worstThermal
                    )
                )
                .font(.caption.monospacedDigit())
                .foregroundStyle(.secondary)
                Text(
                    String(
                        format: "first %.0f ms  peak %.0f MB  input p95 %.0f ms",
                        session.metrics.firstFrameMS,
                        session.metrics.peakParseMemoryMB,
                        session.metrics.inputP95MS
                    )
                )
                .font(.caption2.monospacedDigit())
                .foregroundStyle(.secondary)
                .accessibilityIdentifier("metrics-status")
                .accessibilityValue(session.metricsSummary)
                Text(session.sceneStatus)
                    .font(.caption2.monospaced())
                    .foregroundStyle(session.sceneStatus.hasPrefix("failed") ? .red : .secondary)
                    .accessibilityIdentifier("scene-status")
                    .accessibilityValue(session.sceneStatus)
                if let error = session.errorMessage {
                    Text(error).font(.caption).foregroundStyle(.red)
                }
            }
            Spacer()
            Button {
                session.resetView()
            } label: {
                Image(systemName: "scope")
            }
            .accessibilityLabel("Reset view")
        }
        .padding(12)
        .background(.black.opacity(0.72))
    }

    private var stepTray: some View {
        HStack(spacing: 24) {
            Button { session.previous() } label: {
                Image(systemName: "chevron.backward")
                    .frame(width: 44, height: 44)
            }
            .disabled(session.step == ACDFSceneDefinition.stepRange.lowerBound)
            .accessibilityLabel("Previous step")
            .accessibilityIdentifier("previous-step")

            Menu {
                ForEach(Array(ACDFSceneDefinition.stepRange), id: \.self) { step in
                    Button("Step \(step)") { session.select(step: step) }
                }
            } label: {
                Text("\(session.step) / \(ACDFSceneDefinition.stepRange.upperBound)")
                    .font(.headline.monospacedDigit())
                    .foregroundStyle(.cyan)
                    .frame(minWidth: 72, minHeight: 44)
            }
            .accessibilityLabel("Select step")
            .accessibilityValue("\(session.step) / \(ACDFSceneDefinition.stepRange.upperBound)")
            .accessibilityIdentifier("step-indicator")

            Button { session.next() } label: {
                Image(systemName: "chevron.forward")
                    .frame(width: 44, height: 44)
            }
            .disabled(session.step == ACDFSceneDefinition.stepRange.upperBound)
            .accessibilityLabel("Next step")
            .accessibilityIdentifier("next-step")
        }
        .font(.title3)
        .padding(.horizontal, 18)
        .padding(.vertical, 8)
        .background(.ultraThinMaterial, in: Capsule())
        .padding(.bottom, 12)
    }

    private var dragGesture: some Gesture {
        DragGesture(minimumDistance: 8)
            .onChanged { value in
                if dragStartYaw == nil {
                    dragStartYaw = session.orbitYaw
                    dragStartPitch = session.orbitPitch
                }
                guard abs(value.translation.width) >= abs(value.translation.height) else { return }
                session.setOrbit(
                    yaw: (dragStartYaw ?? 0) - Float(value.translation.width) / 280,
                    pitch: (dragStartPitch ?? 0) + Float(value.translation.height) / 280
                )
            }
            .onEnded { value in
                defer {
                    dragStartYaw = nil
                    dragStartPitch = nil
                }
                guard abs(value.translation.height) > abs(value.translation.width),
                      abs(value.translation.height) >= 44
                else { return }
                value.translation.height < 0 ? session.next() : session.previous()
            }
    }

    private var magnifyGesture: some Gesture {
        MagnifyGesture()
            .onChanged { value in
                if magnifyStartZoom == nil { magnifyStartZoom = session.zoom }
                session.setZoom((magnifyStartZoom ?? 1) / Float(value.magnification))
            }
            .onEnded { _ in
                magnifyStartZoom = nil
            }
    }
}
