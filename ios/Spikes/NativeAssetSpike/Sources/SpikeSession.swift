import Darwin.Mach
import Foundation
import NativeAssetSpikeCore
import Observation
import os
import RealityKit
import SwiftUI

struct SpikeMetrics: Equatable {
    var archiveMB: Double = 0
    var decodeMS: Double = 0
    var firstFrameMS: Double = 0
    var bindingMS: Double = 0
    var memoryMB: Double = 0
    var peakParseMemoryMB: Double = 0
    var inputP95MS: Double = 0
    var fps: Double = 0
    var thermal = "nominal"
    var worstThermal = "nominal"
}

enum SpikeProcedure: String {
    case acdf
    case pcdf

    var title: String { rawValue.uppercased() }
}

private struct BindingReport: Decodable {
    struct Entry: Decodable {
        let entityPath: String
    }

    let entityCount: Int
    let entities: [Entry]
}

@MainActor @Observable
final class SpikeSession {
    private let logger = Logger(subsystem: "app.thecommissure.asset-spike", category: "performance")
    private var domain = LoadAwareACDFSession()
    private var adapter: RealitySceneAdapter?
    private var lastFrameSample = ContinuousClock.now
    private var sampledFrames = 0
    private var loadStart: ContinuousClock.Instant?
    private var pendingInputStart: ContinuousClock.Instant?
    private var inputSamplesMS: [Double] = []
    private var enduranceTask: Task<Void, Never>?

    let procedure: SpikeProcedure

    var step = 1
    var orbitYaw: Float = 0
    var orbitPitch: Float = 0
    var zoom: Float = 1
    var metrics = SpikeMetrics()
    var errorMessage: String?
    var isReady = false
    var sceneStatus = "loading"

    init() {
        procedure = SpikeProcedure(
            rawValue: ProcessInfo.processInfo.environment["SPIKE_PROCEDURE"] ?? "acdf"
        ) ?? .acdf
        if let rawStep = ProcessInfo.processInfo.environment["SPIKE_STEP"],
           let launchStep = Int(rawStep),
           ACDFSceneDefinition.stepRange.contains(launchStep)
        {
            step = launchStep
            _ = domain.select(step: launchStep)
        }
    }

    func select(step target: Int) {
        guard procedure == .acdf else { return }
        guard ACDFSceneDefinition.stepRange.contains(target) else { return }
        markInput()
        step = target
        _ = domain.select(step: target)
        apply(animated: isReady)
    }

    func next() { select(step: min(step + 1, ACDFSceneDefinition.stepRange.upperBound)) }
    func previous() { select(step: max(step - 1, ACDFSceneDefinition.stepRange.lowerBound)) }

    func resetView() {
        markInput()
        orbitYaw = 0
        orbitPitch = 0
        zoom = 1
        apply(animated: true)
    }

    func setOrbit(yaw: Float, pitch: Float) {
        markInput()
        orbitYaw = min(max(yaw, -.pi), .pi)
        orbitPitch = min(max(pitch, -.pi / 3), .pi / 3)
        apply(animated: false)
    }

    func setZoom(_ value: Float) {
        markInput()
        zoom = min(max(value, 0.55), 2.2)
        apply(animated: false)
    }

    func load(into content: inout RealityViewCameraContent) async {
        do {
            guard let url = Bundle.main.url(
                forResource: procedure.rawValue,
                withExtension: "usdz"
            ) else {
                throw CocoaError(.fileNoSuchFile)
            }
            let bindingReport = try loadBindingReport()
            metrics.archiveMB = Double(
                try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
            ) / 1_048_576

            let clock = ContinuousClock()
            let decodeStart = clock.now
            loadStart = decodeStart
            metrics.peakParseMemoryMB = Self.currentMemoryMB()
            let memorySampler = Task { @MainActor [weak self] in
                while !Task.isCancelled {
                    guard let self else { return }
                    self.metrics.peakParseMemoryMB = max(
                        self.metrics.peakParseMemoryMB,
                        Self.currentMemoryMB()
                    )
                    try? await Task.sleep(for: .milliseconds(20))
                }
            }
            defer { memorySampler.cancel() }
            let root = try await Entity(contentsOf: url, withName: procedure.rawValue)
            metrics.decodeMS = milliseconds(decodeStart.duration(to: clock.now))

            let bindingStart = clock.now
            let sceneAdapter = try RealitySceneAdapter(
                root: root,
                procedure: procedure,
                expectedPaths: bindingReport.entities.map(\.entityPath)
            )
            guard sceneAdapter.boundEntityCount == bindingReport.entityCount else {
                throw SceneBindingError.missing(
                    "expected \(bindingReport.entityCount) bindings, found \(sceneAdapter.boundEntityCount)"
                )
            }
            metrics.bindingMS = milliseconds(bindingStart.duration(to: clock.now))
            adapter = sceneAdapter
            if procedure == .acdf {
                _ = domain.markReady()
                step = domain.selectedStep
            }
            isReady = true

            content.add(root)
            content.add(sceneAdapter.camera)
            content.camera = .virtual
            content.cameraTarget = sceneAdapter.camera
            apply(animated: false)
            refreshProcessMetrics()
            runAutomationSequenceIfRequested()
            startEnduranceIfRequested()
            logger.notice("\(self.procedure.title) ready decode_ms=\(self.metrics.decodeMS) memory_mb=\(self.metrics.memoryMB)")
        } catch {
            errorMessage = error.localizedDescription
            sceneStatus = "failed: \(error.localizedDescription)"
            logger.error("\(self.procedure.title) load failed: \(error.localizedDescription)")
        }
    }

    func apply(animated: Bool) {
        guard let adapter else { return }
        if procedure == .acdf {
            let snapshot = ACDFSceneDefinition.snapshot(step: step)
            let shouldAnimate = animated && !animationsDisabled
            adapter.retarget(
                snapshot,
                orbitYaw: orbitYaw,
                orbitPitch: orbitPitch,
                zoom: zoom,
                animated: shouldAnimate
            )
            sceneStatus = shouldAnimate
                ? "transitioning; bindings \(adapter.boundEntityCount)"
                : verificationStatus(adapter: adapter, snapshot: snapshot)
        } else {
            adapter.retargetPCDF(orbitYaw: orbitYaw, orbitPitch: orbitPitch, zoom: zoom)
            sceneStatus = "ready; bindings \(adapter.boundEntityCount)/68"
        }
    }

    func recordFrame(deltaTime: TimeInterval) {
        guard deltaTime > 0 else { return }
        let now = ContinuousClock.now
        if metrics.firstFrameMS == 0, let loadStart {
            metrics.firstFrameMS = milliseconds(loadStart.duration(to: now))
        }
        if let pendingInputStart {
            inputSamplesMS.append(milliseconds(pendingInputStart.duration(to: now)))
            self.pendingInputStart = nil
            metrics.inputP95MS = percentile95(inputSamplesMS)
        }
        sampledFrames += 1
        let elapsed = lastFrameSample.duration(to: now)
        if elapsed >= .seconds(1) {
            metrics.fps = Double(sampledFrames) / seconds(elapsed)
            sampledFrames = 0
            lastFrameSample = now
            refreshProcessMetrics()
        }
    }

    private func refreshProcessMetrics() {
        metrics.memoryMB = Self.currentMemoryMB()
        metrics.peakParseMemoryMB = max(metrics.peakParseMemoryMB, metrics.memoryMB)
        metrics.thermal = Self.thermalName(ProcessInfo.processInfo.thermalState)
        if Self.thermalRank(metrics.thermal) > Self.thermalRank(metrics.worstThermal) {
            metrics.worstThermal = metrics.thermal
        }
    }

    private func markInput() {
        guard isReady else { return }
        pendingInputStart = ContinuousClock.now
    }

    private func percentile95(_ values: [Double]) -> Double {
        let sorted = values.sorted()
        let index = max(0, Int(ceil(Double(sorted.count) * 0.95)) - 1)
        return sorted[index]
    }

    private var animationsDisabled: Bool {
        ProcessInfo.processInfo.environment["SPIKE_DISABLE_ANIMATIONS"] == "1"
    }

    private func loadBindingReport() throws -> BindingReport {
        guard let url = Bundle.main.url(
            forResource: "\(procedure.rawValue)-bindings",
            withExtension: "json"
        ) else { throw CocoaError(.fileNoSuchFile) }
        return try JSONDecoder().decode(BindingReport.self, from: Data(contentsOf: url))
    }

    private func verificationStatus(
        adapter: RealitySceneAdapter,
        snapshot: ACDFSceneSnapshot
    ) -> String {
        adapter.verifies(snapshot)
            ? "ready; bindings \(adapter.boundEntityCount)/39; state \(snapshot.step) verified"
            : "failed: state \(snapshot.step) mismatch"
    }

    private func runAutomationSequenceIfRequested() {
        guard procedure == .acdf,
              let rawSequence = ProcessInfo.processInfo.environment["SPIKE_AUTOMATION_SEQUENCE"]
        else { return }
        let sequence = rawSequence.split(separator: ",").compactMap { Int($0) }
        guard !sequence.isEmpty, sequence.allSatisfy(ACDFSceneDefinition.stepRange.contains)
        else { return }

        Task { @MainActor [weak self] in
            guard let self else { return }
            for target in sequence {
                self.select(step: target)
                try? await Task.sleep(for: .milliseconds(50))
            }
            try? await Task.sleep(for: .milliseconds(600))
            guard let adapter = self.adapter else { return }
            self.sceneStatus = self.verificationStatus(
                adapter: adapter,
                snapshot: ACDFSceneDefinition.snapshot(step: self.step)
            ) + "; automation complete"
        }
    }

    private func startEnduranceIfRequested() {
        guard enduranceTask == nil,
              let rawDuration = ProcessInfo.processInfo.environment["SPIKE_ENDURANCE_SECONDS"],
              let duration = Int(rawDuration), duration > 0
        else { return }

        enduranceTask = Task { @MainActor [weak self] in
            guard let self else { return }
            let clock = ContinuousClock()
            let start = clock.now
            var tick = 0
            while !Task.isCancelled, start.duration(to: clock.now) < .seconds(duration) {
                if self.procedure == .acdf, tick.isMultiple(of: 5) {
                    self.select(step: tick / 5 % ACDFSceneDefinition.stepRange.count + 1)
                }
                self.setOrbit(
                    yaw: sin(Float(tick) / 18) * .pi / 2,
                    pitch: sin(Float(tick) / 31) * .pi / 8
                )
                self.setZoom(1 + sin(Float(tick) / 23) * 0.25)
                tick += 1
                try? await Task.sleep(for: .milliseconds(100))
            }
            self.logger.notice(
                "ENDURANCE complete seconds=\(duration) fps=\(self.metrics.fps) memory_mb=\(self.metrics.memoryMB) input_p95_ms=\(self.metrics.inputP95MS) worst_thermal=\(self.metrics.worstThermal)"
            )
        }
    }

    private func milliseconds(_ duration: Duration) -> Double {
        seconds(duration) * 1_000
    }

    private func seconds(_ duration: Duration) -> Double {
        let components = duration.components
        return Double(components.seconds) + Double(components.attoseconds) / 1e18
    }

    private static func currentMemoryMB() -> Double {
        var info = task_vm_info_data_t()
        var count = mach_msg_type_number_t(
            MemoryLayout<task_vm_info_data_t>.size / MemoryLayout<integer_t>.size
        )
        let result = withUnsafeMutablePointer(to: &info) { pointer in
            pointer.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                task_info(mach_task_self_, task_flavor_t(TASK_VM_INFO), $0, &count)
            }
        }
        guard result == KERN_SUCCESS else { return 0 }
        return Double(info.phys_footprint) / 1_048_576
    }

    private static func thermalName(_ state: ProcessInfo.ThermalState) -> String {
        switch state {
        case .nominal: "nominal"
        case .fair: "fair"
        case .serious: "serious"
        case .critical: "critical"
        @unknown default: "unknown"
        }
    }

    private static func thermalRank(_ value: String) -> Int {
        switch value {
        case "nominal": 0
        case "fair": 1
        case "serious": 2
        case "critical": 3
        default: -1
        }
    }
}
