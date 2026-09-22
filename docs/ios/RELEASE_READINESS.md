# iOS Release Readiness

> Current checkpoint: `UI_REDESIGN_2026-09-19.md`. The native UI is locally
> verified and release preparation has resumed. Asset portability is verified;
> exact-candidate release gates remain open.

Status: local release controls implemented, release blocked
Last audited: 2026-09-20 (source, signed IPA, App Store Connect record, Fastlane checkpoint, and uploaded store media; no uploaded build candidate)

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
and `releaseGate = false` for both records. The current approved catalog meets
this provenance requirement.

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
| Medical review | Owner approval is recorded for all four shipped revisions | Bind the approval to the final candidate evidence |
| Rights review | Owner approval is recorded for all four provenance records | Keep source-trace evidence with the exact candidate and do not add unreviewed assets |
| Content signing | No production key configuration is stored in Git | Configure protected signing secret and pinned public key |
| Signed IPA | A distribution-signed arm64 IPA was exported with the app-specific App Store profile. The artifact was inspected locally and intentionally left outside the repository. | Bind one retained candidate IPA to the release-evidence package before TestFlight. |
| Version and icon | Project settings are `1.0.0` build `1`; the owner-requested Web favicon is configured as an opaque 1024 px AppIcon and compiles successfully | Verify the version and icon in the signed candidate |
| Physical device | The current physical test attempt failed because the first attempt used the wrong team identifier and the second mixed an Xcode-managed profile with manual signing | Run the unchanged candidate on the required devices after signing is configured |
| Floor device | No oldest-supported iOS 18 device trace is recorded | Pass the complete performance and resilience suite on that device |
| Current devices | No candidate-bound current iPhone and iPad reports are recorded | Pass both device reports |
| App Thinning | No exact-candidate report is recorded | Verify all supported variants and total installed size |
| Visual and accessibility acceptance | No exact-candidate owner visual approval or complete accessibility report is recorded | Record both without changing the candidate |
| Privacy | Source manifest exists; signed-archive aggregate report has not been reviewed | Audit the archive report, linked SDKs, network behavior, and App Privacy answers |
| App Review scans | Neither required exact-stage scan is recorded | Run before external TestFlight and on the final candidate |
| Store materials | Product-page text, screenshots, URLs, age rating, copyright, review contact, price, availability, and published App Privacy are saved in App Store Connect | Bind the exact candidate and retain final verification evidence |
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

- Privacy nutrition labels, production privacy/support URL verification, accessibility behavior,
  final screenshots, and metadata require exact-candidate evidence.
- The signed archive privacy report and embedded dependency behavior have not
  been audited.

### Fail

- The 1024 px opaque AppIcon is present and the asset compiler accepts it, but the
  marketing version remains `0.1.0` and no signed App Store candidate exists.
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

## 2026-09-20 App Store submission audit

The `app-store-review` source audit found a native SwiftUI and RealityKit app
with iPhone and iPad support, iOS 18 minimum deployment, arm64 Release output,
a launch screen, an AppIcon, no account or payment flow, and a privacy manifest
that declares no collected data or tracking. The source exposes only the
declared UserDefaults and low-storage required-reason APIs. This is a source
and unsigned-archive finding, not a candidate scan.

`xcodebuild archive` succeeded with code signing deliberately disabled. The
archive reports version `0.1.0` build `1`, no signing identity, and no team;
its app is not signed. The installed keychain has one Apple Development
identity and no Apple Distribution identity. No IPA or release-evidence JSON
exists. The release and content control tests pass 13 cases, including
fail-closed medical, rights, evidence, and artifact tamper checks.

The project Fastlane environment is now executable through Homebrew Ruby 4.0.1
and Bundler 4.0.3. It lists all seven local lanes. A deliberately incomplete
`ios submit` invocation stopped at `IPA_PATH`, before any App Store Connect
request. No upload, metadata sync, TestFlight distribution, submission, push,
or deployment occurred.

The current submission blockers remain factual gates: approval of the four
medical procedure revisions, confirmation of rights for every shipped asset,
distribution signing, production verification of the public privacy policy and
support contact, final store answers and materials, exact-candidate device and accessibility evidence,
internal and external TestFlight evidence, and a signed release-candidate scan.
The latest local build separates one-finger orbit from two-finger pan and pinch
recognition. Its exact candidate still needs visual acceptance on iPhone and
iPad hardware. These records cannot be manufactured from local checks.

## 2026-09-20 signed IPA checkpoint

The App Store Connect iOS record for `The Commissure` now exists with bundle
identifier `app.thecommissure.ios`, English (U.S.) as its primary locale, and
SKU `thecommissure-ios`. It remains in Prepare for Submission with the English
promotional text, description, keywords, and reviewer notes saved. It contains
no uploaded screenshots, build, or review request.

Fastlane 2.239.0 successfully archived and exported a Release IPA after the
target received Team `8WSQBQX6C5` and the Fastlane-compatible export method
was set to `app-store`. The inspected artifact had identifier
`app.thecommissure.ios`, version `1.0.0` build `1`, an embedded
`iOS Team Store Provisioning Profile: app.thecommissure.ios`, and an
`Apple Distribution: Shinya Yamaguchi (8WSQBQX6C5)` signature. The only build
warning is the existing unused `try?` result in `ContentDelivery.swift`.

An App Manager App Store Connect API key was created for the Fastlane workflow.
Its private key and environment file are Git-ignored and permission-restricted.
A read-only Spaceship request verified that the key can access this app record.

The Web support and privacy routes were deployed to the existing Vercel
production project and both returned HTTPS 200. Their URLs are saved in App
Store Connect. The record also has Medical and Education categories, the
16+ age-rating result from a frequent medical-information answer, and a
not-regulated-medical-device declaration. App Privacy has a Data Not Collected
draft and awaits the account holder's final publish attestation.

The English (U.S.) product page now has four ordered iPhone 6.5-inch media
files and four ordered iPad 13-inch media files. Both sets were generated from
the source-controlled artwork project, validated at Apple's accepted native
dimensions without alpha channels, and uploaded as truthful representations of
the shipped native UI. No IPA has been uploaded, no TestFlight build exists,
and no review request has been made.

## 2026-09-20 current IPA refresh

Fastlane rebuilt the candidate after the media checkpoint and exported
`TheCommissure.ipa` outside the repository. Its SHA-256 is
`8321777e8bc7e9236591b2131e8e157f8aa7522c7c1d2603497bf7d9594ea7b3`.
The inspected payload identifies itself as `app.thecommissure.ios`, version
`1.0.0`, build `1`, and is signed by the Team `8WSQBQX6C5` Apple Distribution
identity with the app-specific Store provisioning profile. The existing
`ContentDelivery.swift` unused `try?` warning remains the only build warning.

This refresh does not close any release gate. In particular, no build has been
uploaded to App Store Connect, and the candidate still lacks the required owner
attestations, device validation, and TestFlight evidence.

## 2026-09-20 release test refresh

The full Fastlane `ios test` lane passed 57 tests with zero failures on the
iPhone 17 Pro simulator. The suite includes all 47 unit tests and 10 UI tests,
including App Store screenshot capture, gesture separation, zoom, panel resize,
Japanese localization, and the procedure return path after orientation changes.

The return-path UI test now waits until the visible back control is present and
hittable after restoring portrait orientation. This fixes an automation race in
the test itself. It does not modify the shipped app target or the current signed
IPA.

## 2026-09-20 encryption declaration refresh

With owner authorization, the target Info.plist declares
`ITSAppUsesNonExemptEncryption` as `false`. The source uses Apple CryptoKit for
SHA-256 integrity checks and Curve25519 signature verification, together with
system `URLSession` transport. The prior IPA predates this declaration and must
not be uploaded.

Fastlane exported and the project inspected the replacement IPA at
`/tmp/the-commissure-app-store-ipa-20260920102945/TheCommissure.ipa`. Its
SHA-256 is `d520c07864c5bb10d52a7a3bf85dcf821a5cb8d1ce490b3a11e711443b360aeb`.
The payload has bundle identifier `app.thecommissure.ios`, version `1.0.0`,
build `1`, `ITSAppUsesNonExemptEncryption=false`, the expected Team
`8WSQBQX6C5` Apple Distribution signature, and the app-specific Store profile.
It has not been uploaded.

## 2026-09-20 rights-approved candidate refresh

Following the owner rights confirmation, all four bundled provenance records
now declare `rightsReview.ownerApproved`. The catalog hashes were regenerated,
the content validation and publication and release-control tests passed, and a
fresh signed IPA was exported at
`/tmp/the-commissure-app-store-ipa-20260920105957/TheCommissure.ipa`.

Its SHA-256 is `61a53fb2b9c67129214c7b6dcc7c34d355cb92274ca192295863669cfedf30f1`.
Inspection confirms `app.thecommissure.ios`, version `1.0.0`, build `1`,
`ITSAppUsesNonExemptEncryption=false`, every bundled rights status, Team
`8WSQBQX6C5` Apple Distribution signing, and the app-specific Store profile.
It has not been uploaded.

The full simulator suite executed all 57 tests after this source change. The
47 unit tests passed. One panel-resize UI assertion was susceptible to an
ignored first automation drag, so the test retries that input once before
asserting the visible resize. Its focused rerun passed. This changes only the
test synchronization, not the app target.

## 2026-09-20 pricing and availability checkpoint

App Store Connect now records the app as free with the United States as the
base country. Distribution is selected for 174 countries or regions. China
mainland is explicitly unavailable, and automatic availability for future App
Store countries or regions is disabled. This release configuration is saved;
it does not close the App Privacy, candidate evidence, TestFlight, or
submission gates.

## 2026-09-20 App Privacy publication

The App Privacy record is published in App Store Connect. It identifies the
public privacy policy URL and states that the app does not collect data. The
release still requires candidate-bound privacy review, medical approval,
device evidence, TestFlight evidence, and App Store submission.

## 2026-09-20 medical-content approval

The owner confirmed that the names, steps, explanatory text, and educational
notice are accurate for ACDF, ACCF, PCDF, and PCF in the exact current content
revisions. Each provenance record now declares `medicalReview.ownerApproved`
with its release gate closed. The catalog provenance hashes were regenerated,
and `node tooling/content/validate-content.mjs` passed for all four procedures
and 26 steps. A new signed IPA is required because this catalog changed.

## 2026-09-20 medical-approved candidate refresh

Fastlane exported a fresh distribution-signed IPA after the medical-content
approval. It is stored outside the repository at
`/tmp/the-commissure-app-store-ipa-20260920-medical/TheCommissure.ipa` and has
SHA-256 `40f622954e9d2abd7e02bd284fc254ec868dbaec8326da51c62a19e820daa803`
with 16,726,482 bytes. Inspection confirms bundle identifier
`app.thecommissure.ios`, version `1.0.0`, build `1`, Team `8WSQBQX6C5`, and an
Apple Distribution signature. The embedded provenance records mark both
medical and rights reviews as owner-approved. It has not been uploaded.

## 2026-09-20 TestFlight upload

Fastlane uploaded the final candidate IPA to App Store Connect without external
tester distribution. App Store Connect accepted version `1.0.0` build `1` at
11:25 JST and reports its status as Processing. The build must finish Apple
processing before it can be attached to the App Store version.

## 2026-09-20 App Review submission

Apple completed processing for the final candidate, version `1.0.0` build `1`.
The build was attached to iOS App Version `1.0` and submitted through App Store
Connect at 11:32 JST. Submission ID: `b0ad28f8-1cd3-4298-826c-1bfd424b7c5d`.
App Store Connect reports `Waiting for Review`.

The submitted build is the final distribution IPA at
`/tmp/the-commissure-app-store-ipa-20260920-final/TheCommissure.ipa`, with
SHA-256 `ba32decf15a2e457ecb68a966d992f6ab78500ff846606b0d7aa5496b3278294`.
No external TestFlight tester or group was selected.

## 2026-09-20 App icon verification

The Xcode project assigns `AppIcon` through
`ASSETCATALOG_COMPILER_APPICON_NAME`. The source asset is the opaque 1024 px
`ios/App/Assets.xcassets/AppIcon.appiconset/AppIcon.png`, which contains the
white The Commissure logo on black. App Store Connect also displayed that icon
for submitted build `1.0.0` build `1`.

## 2026-09-22 integration and review follow-up

PR #84 reports a 4.2.2 rejection. Direct Apple review-message verification and
exact-build physical-device evidence remain open. The roadmap now distinguishes
the submitted iOS branch from the older main shell and treats existing native
functionality as verification work, not an unconditional rewrite. September 20
review status above is historical, not a current approval claim.

The integration PR exposed two clean-checkout CI defects: iOS CI omitted the
content validator dependency installation, and migration regenerated previously
approved provenance with unapproved defaults. CI now installs the pinned
content dependencies. Migration preserves reviews only when procedure, scene,
both localizations, and all non-review provenance fields are unchanged; changes
reset reviews to their unapproved defaults. Regression tests cover unchanged
content, changed content, changed asset provenance, and absent prior reviews.
