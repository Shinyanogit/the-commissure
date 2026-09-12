# iOS Release Readiness

> Current checkpoint: see `SESSION_HANDOFF_2026-09-12.md`. The temporary UI
> was rejected and must first reproduce the Web UI. Asset portability QC failed;
> app QC is incomplete. This is not an App Store-ready candidate.


Status: local release controls implemented, release blocked
Last audited: 2026-09-12

This file records observed repository state. It is not a release approval. The
authoritative release gates remain in [RELEASE_SPEC.md](RELEASE_SPEC.md).
No workflow was dispatched, and no content, build, deployment, pull request, or
Git branch was pushed by this implementation session. The current Web product
was not changed.

## Implemented controls

### Content publication

`tooling/content-publish/build.mjs` builds four static data-only packs from the
validated content catalog and `ios/Resources/NativeAssets/manifest.json`.
Each published procedure has exactly these roles: `procedure`, `scene`,
`localization-en`, `localization-ja`, `provenance`, `model`, and
`pack-metadata`.

The immutable directory is
`packs/<procedure>/<semantic-version>/<pack-json-sha256-prefix>/`. The prefix is
the first 16 lowercase hexadecimal characters of the exact `pack.json` SHA-256.
The root manifest pins the complete SHA-256 and byte count for every file.
Reusing a semantic version with different bytes is rejected.

`manifest.sig` is the raw 64-byte Ed25519 signature over the exact
`manifest.json` bytes. `public-key.raw` is the corresponding 32-byte public key.
The workflow requires the private PKCS#8 key only through the protected
`CONTENT_SIGNING_PRIVATE_KEY_BASE64` secret and checks it against the protected
`CONTENT_SIGNING_PUBLIC_KEY_BASE64` variable.

`retained-files.json` and `retained-files.sig` form a separately signed inventory
of all immutable pack files on the Pages publication. Before a later generation
is built, the prior site is hydrated and both signatures and every retained byte
are verified. A lower semantic version can be selected only when its exact pack
already exists in that inventory. Rollback therefore uses a new, higher manifest
generation and never overwrites an old pack.

The builder requires all four procedure provenance records to contain
`medicalReview.status = ownerApproved`, `rightsReview.status = ownerApproved`,
and `releaseGate = false` for both records. Current content correctly fails this
gate.

Commands:

```sh
node tooling/content-publish/build.mjs \
  --root . \
  --output "$RUNNER_TEMP/content-site" \
  --generation 1 \
  --published-at 2026-09-12T00:00:00Z \
  --asset-base-url https://content.example.invalid/

node tooling/content-publish/verify.mjs \
  --site "$RUNNER_TEMP/content-site" \
  --public-key "$RUNNER_TEMP/content-site/public-key.raw"
```

For generation 2 and later, pass both `--previous-manifest` and
`--previous-site`. The `content-production` GitHub Environment must hold the
signing secret and public configuration. The `github-pages` Environment controls
the final atomic Pages deployment.

### Native candidate validation

`tooling/release/validate-release.mjs` accepts a release evidence JSON file and
an optional `--artifact` override. It verifies the exact IPA SHA-256 and byte
count, signed content publication, full Git commit, release tag, every required
gate report hash, and each report's binding to both the IPA and content manifest.
On macOS it also extracts the IPA, requires one application bundle, verifies the
distribution signature, rejects simulator architectures, reads the real bundle
version and team identifier, and requires the bundled privacy manifest and
provisioning profile.

The three stages are `internal-testflight`, `external-testflight`, and
`app-store`. External TestFlight adds mandatory floor-device, current iPhone,
current iPad, accessibility, visual acceptance, App Thinning, and pre-external
App Store scan evidence. App Store submission adds release-candidate scan,
metadata, URL, screenshot, reviewer-note, and internal/external TestFlight
evidence. Missing evidence fails with the exact gate ID.

```sh
node tooling/release/validate-release.mjs \
  --root . \
  --evidence /absolute/path/release-evidence.json \
  --artifact /absolute/path/TheCommissure.ipa
```

The evidence directory is a portable artifact. Its `content.sitePath`,
`content.publicKeyPath`, IPA, and gate reports must stay inside that directory.
Fastlane never rebuilds in `beta`, `release_candidate`, or `submit`; those lanes
accept only this already signed and validated IPA. `submit` selects an already
uploaded version/build and sets `skip_binary_upload`.

## Privacy manifest basis

The source audit currently finds app-local `UserDefaults` and a disk-capacity
check used to stop downloads when capacity is insufficient. The privacy manifest
therefore declares `CA92.1` for app-local preferences and `E174.1` for observable
low-storage behavior. It declares no tracking or collected data types. This is a
source-level declaration, not a final App Privacy answer. The signed archive's
aggregated privacy report and linked SDK behavior still require review before
external TestFlight.

## Current blocking evidence

| Gate | Observed state | Required closure |
|---|---|---|
| Medical review | All four provenance records use `inheritedWebsiteSource` | Owner-approved medical review per shipped revision |
| Rights review | All four provenance records use `ownerConfirmationRequired` | Owner confirmation for models, text, images, fonts, icons, portraits, and screenshots |
| Content signing | No production key configuration is stored in Git | Configure protected signing secret and pinned public key |
| Signed IPA | Development signing and other-app Store profiles exist; a distribution candidate for this bundle ID has not been verified | Produce one signed IPA and package its exact evidence |
| Version and icon | Project settings remain `0.1.0` build `1`, and no AppIcon app icon set is configured | Set the approved 1.0 version/build and supply the final 1024 px App Store icon before candidate archive |
| Physical device | The current physical test attempt failed because the first attempt used the wrong team identifier and the second mixed an Xcode-managed profile with manual signing | Run the unchanged candidate on the required devices after signing is configured |
| Floor device | No oldest-supported iOS 18 device trace is recorded | Pass the complete performance and resilience suite on that device |
| Current devices | No candidate-bound current iPhone and iPad reports are recorded | Pass both device reports |
| App Thinning | No exact-candidate report is recorded | Verify all supported variants and total installed size |
| Visual and accessibility acceptance | No exact-candidate owner visual approval or complete accessibility report is recorded | Record both without changing the candidate |
| Privacy | Source manifest exists; signed-archive aggregate report has not been reviewed | Audit the archive report, linked SDKs, network behavior, and App Privacy answers |
| App Review scans | Neither required exact-stage scan is recorded | Run before external TestFlight and on the final candidate |
| Store materials | Final URLs, metadata, screenshots, age rating, content-rights answer, and reviewer notes are not recorded | Complete and bind them to the candidate |
| TestFlight | No internal or external candidate result is recorded | Upload through protected environments and retain results |

No blocker above may be converted to a pass by an empty file, a CI success from
another commit, simulator evidence, or an unsigned archive.

## App Store review source scan

This pre-archive source scan follows the `app-store-review` checklist. It cannot
replace either required scan of a signed candidate.

### Pass

- The project targets iPhone and iPad with iOS 18, declares launch presentation,
  and declares phone/tablet orientations.
- The app is native SwiftUI/RealityKit rather than a Web wrapper.
- No account, external payment, tracking framework, hard-coded IPv4 address,
  embedded third-party framework, or obvious forced cast/unwrap was found in the
  scanned native source.
- The bilingual colophon includes the educational-use and supervised-training
  boundary.
- The source privacy manifest covers the observed app-local preferences and
  low-storage API purposes.

### Warning

- Privacy nutrition labels, public privacy/support URLs, accessibility behavior,
  final screenshots, and metadata require exact-candidate evidence.
- The signed archive privacy report and embedded dependency behavior have not
  been audited.

### Fail

- No AppIcon app icon set is configured.
- Marketing version remains `0.1.0` and no signed App Store candidate exists.
- Medical and rights review remain unresolved for every procedure.
- Floor-device, current-device, visual, accessibility, and App Thinning gates
  lack candidate-bound evidence.

Submission readiness is blocked. A numeric percentage is intentionally omitted
because the absent owner, signing, physical-device, and exact-build gates are
binary requirements rather than partial credit.

## Local verification

As of 2026-09-12:

- Content publication tests pass 7 cases, including tampered manifest, tampered
  pack, path traversal, medical review, rights review, and replay generation.
- Release readiness tests pass 5 cases, including tampered gate evidence,
  candidate hash mismatch, cross-candidate evidence, and absent floor-device
  evidence.
- `PrivacyInfo.xcprivacy` passes `plutil -lint`.
- `ios/fastlane/Fastfile` passes Ruby syntax validation.
- The Fastlane dependency graph is locked in `ios/Gemfile.lock`.
