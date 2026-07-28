# Asset Delivery, Cache, and Content Update Specification

Status: implementation contract with one measured decision gate
Goal: low initial weight, instant cached reuse, zero-backend core operation

## 1. What “download” means

The product distinguishes four events so neither code nor UI conflates them:

1. **App Store installation** — signed native binary plus bundled content.
2. **First use of a remote procedure pack** — explicit, sized, user-confirmed
   network transfer.
3. **Cached reopen** — no network transfer; verified local files are reused.
4. **Content update** — a new immutable pack version is downloaded beside the
   working version, verified, then atomically activated.

The Library remains interactive during catalog refresh. No required launch-time
download blocks the first screen.

## 2. Current measured inventory

The prior local documentation's estimate of roughly 150 MB is stale. The actual
runtime GLB files audited on 2026-07-28 are:

| Procedure | Current GLB bytes | Approx. triangles |
|---|---:|---:|
| ACDF | 1,572,404 | 475,227 |
| ACCF | 1,484,260 | 459,289 |
| PCDF | 2,840,688 | 996,503 |
| PCF | 1,066,072 | 352,667 |
| **Four procedures** | **6,963,424 (6.64 MiB)** | **2,283,686** |

The homepage GLB adds 655,336 bytes but is not required by the native product.
All procedure GLBs require Draco and contain flat root meshes with runtime color
and motion applied by JavaScript. USDZ does not inherit the current compression
ratio, so converted size, decode time, GPU load, and peak memory—not current GLB
transfer size—determine the shipping split.

## 3. Bundled-baseline policy with a measured fallback

The current 1.0 decision is to bundle all four procedure packs as an immutable,
offline baseline while using the same logical pack format for later verified
updates. The app always bundles:

- the complete native shell;
- a signed catalog/content snapshot;
- Library still images and metadata;
- all four fully working procedure packs when the conversion gate below passes;
- all code needed to render every supported schema feature.

The ACDF conversion spike and App Thinning report must satisfy all hard gates:

- Executable and UI resources excluding procedure packs: target 12 MB compressed,
  hard 20 MB.
- Total bundled procedure payload: target 20 MB, hard 35 MB.
- Individual procedure pack: target 8 MB, hard 20 MB.
- Thinned initial App Store download: target 35 MB, hard 50 MB.
- Device decode/render/memory gates in section 10 also pass.

If any hard gate still fails after one focused geometry/material optimization
pass, bundle the optimized ACDF starter and offer ACCF, PCDF, and PCF as optional,
sized downloads through the same `AssetStore`. Do not weaken the size gate merely
because the App Store permits larger binaries.

This policy makes the first release backendless in behavior while preserving a
remote-content seam. Bundled and downloaded versions share one logical pack
contract, so size-gate fallback does not create a second scene or cache engine.

## 4. Pack format

```text
catalog-v1/
├── manifest.json
├── manifest.sig
└── packs/
    └── acdf/1.0.0/
        ├── procedure.json
        ├── model.usdz
        ├── preview.heic
        ├── en.json
        ├── ja.json              # required reviewed translation
        └── provenance.json
```

The logical pack is a small set of separately downloaded files, not another ZIP
archive. USDZ is already a container; avoiding a wrapper removes an extraction
dependency, memory spike, and path-traversal surface. The catalog entry includes:

- pack ID and immutable semantic version;
- scene schema version and minimum app build;
- network and installed sizes;
- URL and SHA-256 for each file;
- supported locales and procedure revision;
- provenance/license identifiers;
- publication timestamp and release notes;
- monotonic manifest generation and required capability IDs.

CI signs the exact `manifest.json` bytes with a Curve25519 signing key held as a
GitHub Actions secret. The app pins only the public key and verifies the detached
signature before decoding. Every asset is then checked against its SHA-256.
Installation uses a temporary directory and atomic rename; the previous ready
version remains available until commit succeeds.

The app remembers the highest accepted manifest generation and rejects an older
generation as replay. A rollback publishes a newly signed higher generation
that points to the prior immutable pack; it never republishes an old manifest.
A staged candidate becomes active only after RealityKit parses it and all
required semantic bindings resolve. Until then it is installed-but-unproven and
the prior known-good version remains active.

Remote JSON is data, not a program. It contains only fixed, versioned fields,
restricted Markdown, stable entity bindings, enumerated easing, and absolute
scene states already understood by the shipped app. It cannot load code,
JavaScript, custom shaders, arbitrary URLs, or new native features. This keeps
content updates within Apple's rule that downloaded material must not change the
app into an unreviewed executable product ([App Review Guideline 2.5.2](https://developer.apple.com/app-store/review/guidelines/#software-requirements)).

## 5. `AssetStore` lifecycle

```swift
struct PackRecord: Equatable, Sendable {
    let bundledVersion: String?
    let installed: InstalledPack?
    let offered: ManifestPack?
    let transfer: TransferState
    let compatibility: Compatibility
    let lastFailure: AssetFailure?
    let isInUse: Bool
}

enum PackPresentationState: Equatable, Sendable {
    case bundled
    case notDownloaded
    case queued
    case downloading(progress: Double)
    case verifying
    case ready(version: String)
    case stale(installed: String, available: String)
    case failed(AssetFailure)
    case evicted
    case incompatible(minimumBuild: Int)
}
```

`PackRecord` is the source of truth because bundled fallback, installed update,
new offer, and failed update can coexist. `PackPresentationState` is a derived,
single UI summary; it must not discard the orthogonal facts.

Rules:

- At most one procedure pack downloads at once; within that pack, at most two
  file transfers run concurrently.
- Requests for the same pack/version share one in-flight task.
- Hashing and JSON validation do not run on `MainActor`.
- The active pack, bundled pack, and last known-good catalog cannot be evicted.
- A failed update rolls back by retaining the prior directory and catalog entry.
- A ready version is never silently replaced while its procedure is open; the
  new version activates on the next safe open.
- OS purge of optional cache becomes `evicted`, not corrupt or ready.

## 6. Cache policy

- Persistent verified packs live in Application Support and are excluded from
  iCloud backup; incomplete files live in a staging/temp directory and are
  deleted after install or bounded recovery.
- Soft budget: 256 MB. Hard budget: 512 MB.
- Before transfer and again before activation, available capacity must cover the
  new payload, current-version rollback retention, staging overhead, and a
  50 MB safety reserve. Thresholds are centralized and tested.
- Eviction is least-recently-used among optional inactive versions. Remove old
  pack versions before current versions.
- “Clear Downloads” removes optional remote packs only. Bundled content always
  remains usable.
- A normal cached reopen performs local metadata/hash policy checks only; it
  does not redownload bytes because a catalog request failed or was skipped.
- The catalog uses HTTP validators (`ETag` / `If-None-Match`) and a bounded
  refresh interval. Offline use never waits for refresh timeout.

## 7. Network behavior

- Respect Low Data Mode, constrained network, cancellation, and background task
  expiration. Do not auto-fetch large optional packs under constrained access.
- Before any first-use required transfer, show exact size and ask permission,
  matching [App Review Guideline 4.2.3(ii)](https://developer.apple.com/app-store/review/guidelines/#minimum-functionality).
- Updates may auto-download only if the user has opted in and policy permits;
  otherwise show a non-blocking update badge.
- No model transfer begins merely from scrolling the Library.
- Still images may be bundled so the list never depends on remote thumbnails.

## 8. Hosting decision

No application backend or database is required. Version 1 uses static,
immutable files. The default origin and later migration order are:

The ¥500/month ceiling applies to delivery infrastructure. The mandatory Apple
Developer Program membership and any Apple-controlled fees are release costs,
not backend hosting, and cannot be eliminated by this architecture.

1. **GitHub Releases + Pages** for 1.0: Releases accept files
   below 2 GiB and document no total release size or bandwidth limit
   ([Releases limits](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases));
   Pages can publish a catalog from GitHub Actions but has a 1 GB site and soft
   100 GB/month bandwidth limit
   ([Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)).
   It requires no new provider account and connects directly to the requested
   GitHub workflow. It is not treated as a CDN SLA; the bundled baseline makes
   an outage non-critical.
2. **Cloudflare R2 + a small static catalog** when measured latency, availability,
   or traffic justifies migration: 10 GB-month, 1 million Class A operations,
   10 million Class B operations, and internet egress are included in its
   current free tier ([R2 pricing](https://developers.cloudflare.com/r2/pricing/)).
   Usage alerts are mandatory and ¥500/month is the hard project budget.
3. **Apple-hosted Background Assets** can become the preferred origin when the
   minimum OS moves to iOS 26 or later. Apple documents up to 200 GB and 200
   packs per app record
   ([overview](https://developer.apple.com/help/app-store-connect/manage-asset-packs/overview-of-apple-hosted-asset-packs/),
   [limits](https://developer.apple.com/help/app-store-connect/reference/app-uploads/apple-hosted-asset-pack-size-limits/)).

On-Demand Resources is not selected because Apple marks it deprecated beginning
with iOS/iPadOS 27 and directs developers toward Background Assets
([Apple reference](https://developer.apple.com/help/app-store-connect/reference/app-uploads/on-demand-resources-size-limits)).

`AssetSource` isolates origin details, so changing host does not change domain,
scene, cache, or UI code.

## 9. GitHub-driven content publication

An authorized collaborator can update data without running Xcode:

```text
push/merge content change
  → schema + medical metadata validation
  → stable entity-ID and canonical-state validation
  → USDZ inspection + size/performance budget checks
  → build immutable versioned pack
  → calculate hashes and sign manifest
  → upload release assets
  → publish catalog only after all checks pass
  → app discovers the data update on its next refresh
```

Publication is automated, but editorial accountability is not removed. Protected
main/CODEOWNERS and provenance fields distinguish “CI can publish this” from
“any unreviewed medical claim may ship.”

Native Swift or feature changes follow a separate workflow: GitHub push can run
tests, build, upload to TestFlight/App Store Connect, and request review, but the
installed app changes only through Apple's signed App Store process. A content
pipeline must never be used to bypass review.

## 10. Performance and delivery gates

Measured on the oldest supported physical device and a current iPhone/iPad:

| Metric | Target | Hard gate |
|---|---:|---:|
| Executable + UI, excluding procedure packs | ≤ 12 MB compressed | > 20 MB |
| Total bundled procedure payload | ≤ 20 MB | > 35 MB |
| Thinned initial App Store download | ≤ 35 MB | > 50 MB |
| Individual procedure pack | ≤ 8 MB | > 20 MB |
| Cold launch to interactive Library | p50 ≤ 0.8 s; p95 ≤ 1.5 s | p95 > 2.0 s |
| Bundled procedure to interactive model | p50 ≤ 2.0 s; p95 ≤ 3.5 s | p95 > 4.5 s |
| Cached-on-disk procedure reopen | p50 ≤ 1.2 s; p95 ≤ 2.0 s | p95 > 3.0 s |
| Input to visible response | p95 ≤ 100 ms | > 150 ms |
| Steady interaction | 60 fps target | sustained < 45 fps on floor device |
| Steady theater memory | ≤ 250 MB | > 350 MB |
| Peak memory during parse | ≤ 350 MB | > 450 MB |
| Triangles per procedure | ≤ 250,000 | > 500,000 |
| Renderable mesh nodes | ≤ 150 | > 250 |
| Material slots/draw-call proxy | ≤ 80 | > 120 |
| Texture dimension | none preferred; otherwise ≤ 2K | 4K without approved exception |
| Estimated GPU texture footprint | ≤ 64 MB | > 96 MB |
| Concurrent pack downloads/model parses | 1 / 1 | > 1 / > 1 |
| Cache | 256 MB soft | > 512 MB hard |

The first conversion spike is ACDF because it exercises bone, disc, cord,
nerve, transparency, implant translation/rotation, plate, and screws. PCDF then
serves as the worst-case triangle/memory gate and currently exceeds the
500,000-triangle hard gate before optimization. No delivery strategy is declared
final until both are measured after USDZ optimization. A 15-minute continuous
interaction test must avoid sustained serious thermal state; critical thermal
state is stop-ship.
