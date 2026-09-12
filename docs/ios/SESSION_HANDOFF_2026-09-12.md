# 2026-09-12 local WIP handoff

The owner requested winding down to documentation and local commits at about
2% weekly remaining. No phase exit, independent QC success, release readiness,
new deployment, remote push or App Store submission is claimed.

## Latest order of work

1. **First reproduce the existing Web UI faithfully**, including actual layout,
   typography, spacing, explanation panel and step navigation. The owner rejected
   the temporary native UI. Only then refine it for iPhone/iPad. Keep the current
   ViewState/AppAction/session/runtime/storage boundaries and tested functionality.
2. Fix native export portability: `Usd.Stage.Flatten()` currently embeds an
   absolute checkout path in USD documentation. Strip that source-file comment,
   compare archives from two different scratch paths, regenerate all four packs,
   then repeat integrity and native-binding tests and independent QC.
3. Finish functional/adversarial review of signed updates, activation/fallback,
   cancellation, locale and persistence. The fresh app reviewer was interrupted
   for this checkpoint and returned no verdict. A reviewer needs a writable
   scratch directory for tests while keeping production sources read-only.
4. Resume toward the point immediately before App Store submission using
   `app-store-review` and Fastlane. Existing Apple registration/signing must be
   investigated before asking for new enrollment. Final UI/icon, medical/rights,
   devices, privacy/support, signed IPA and exact-candidate evidence remain open.
5. Build a separate shared Vercel support site, linked to the existing CV page;
   do not alter The Commissure Web or existing Vocabry endpoints.

## Preserved implementation and verification

- Four real USDZs, 26 canonical states, 189 entities, 597,017 triangles.
  Generated payload: 26,353,196 bytes (25.13 MiB); resources remain ignored.
- Absolute state projection over captured archive baselines; interrupted/reverse
  transitions; gesture, accessible action, zoom/orbit/reset; progress and language.
- Signed exact-byte Ed25519 catalogs, replay/equivocation/version mutation
  rejection, retained catalogs, verified atomic cache installation, cancellation,
  explicit update UI, native activation and fallback.
- Local immutable publication tooling, protected workflow definitions, release
  evidence validator, Fastlane lanes, privacy manifest and EN/JA metadata draft.
- `full-test-5` and `full-test-6`: **42 app + 4 UI tests passed** on iPhone 17 Pro
  Simulator iOS 26.2, including real bindings for all four models and locale races.
- Core 15 tests; source content validator and 26 negative fixtures; publication
  8 tests; release 5 tests; strict Swift formatting; Git diff check all passed.
- Unsigned iOS archive passed before the final clear-download state guard.
  The final guard passed full-test-6; the archive was not repeated afterward.
- Root manually operated Library → ACDF, next/previous and accessibility zoom.
  This does not count as independent visual or medical approval.

## Known findings and limits

- Asset independent QC: **FAIL** due to cross-checkout determinism. The same
  checkout is repeatable; bytes vary with its absolute path. The converter repair
  was not started. Its incorrect section link and old ACCF/PCF status were corrected.
- Asset reviewer confirmed exact source inventories, triangles, materials,
  required paths, archive hashes and strict ARKit validation for all four models.
  Its temporary-file negative tests were blocked by the read-only sandbox; root
  ran those tests successfully earlier, but that is not an independent PASS.
- App independent QC: **INCOMPLETE**, interrupted for owner-directed handoff.
- Production CDN round trip, clean hosted CI, signed distribution archive,
  current/floor physical-device performance, thermal/memory soak, full accessibility,
  final UI and medical/rights approvals remain unverified.
- First physical attempt used CN suffix instead of certificate OU as Team ID.
  Second used an Xcode-managed wildcard profile with manual signing and failed.
  A development identity, matching-device wildcard profile and other-app Store
  profiles exist. Current account permissions and this app's signing remain open.
- Vercel auth probe was stopped during CLI setup; login/deployment is unverified.
  No support-site implementation or deployment was saved in this checkpoint.

## Support site decision

The CV stays at `https://shinyanogit.github.io/`. Link to it from a separate
shared support hub, with application-specific support/privacy paths. Existing
Vocabry `/support.html`, `/privacy.html`, `/terms.html` are app-specific and
referenced by the app; do not overwrite them. A CV page is not automatically
rejected, but the submitted Support URL must expose actual support contact.
See [Apple's Support URL requirement](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/).

The latest owner permission covers a new standalone support site on Vercel.
It does not authorize pushing this iOS branch, changing the live Web application,
submitting to App Store, or altering the CV/Vocabry production pages.

## Evidence locations

Local logs, xcresult bundles, unsigned archive, frozen identity manifests and
asset QC result: `/tmp/commissure-ios-run/` (temporary, not versioned).
Rebuild assets with `tooling/native-assets/build-all.sh`, then regenerate the
Xcode project with `ios/generate-project.sh`. The pinned toolchain and known
portability finding are in `tooling/native-assets/README.md`.

The weekly reset monitor ran every 15 seconds. No reset to 100% remaining was
observed before this owner-requested pause; last observed remaining was 1%.
