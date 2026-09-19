# App Store submission audit, 2026-09-20

Status: submission blocked by factual and candidate-bound release gates.

This audit used the local `app-store-review` checklist, the Fastlane contract,
the Release archive, source inspection, and the release-control test suite. It
does not claim App Store Connect access or submission.

## Verified locally

- `The Commissure` builds as a native SwiftUI and RealityKit iPhone and iPad
  app, with iOS 18 as the minimum deployment target and arm64 device output.
- A 1024 by 1024 opaque AppIcon is present and accepts asset compilation.
- `PrivacyInfo.xcprivacy` is valid. It declares no tracking or collected data,
  and required-reason entries for local preferences and low-storage checks.
- Source inspection found no account flow, advertising or tracking framework,
  external payment flow, Web view wrapper, hard-coded IPv4 endpoint, or obvious
  forced cast or forced try in app source.
- `xcodebuild archive` succeeds when code signing is disabled. The archive is
  37 MiB and contains one arm64 app.
- Release and content control tests pass 13 cases. They reject unresolved
  medical or rights review, altered evidence, cross-candidate evidence, and a
  tampered IPA.
- Fastlane 2.239.0 is runnable using the repository lockfile with Homebrew Ruby
  4.0.1 and Bundler 4.0.3. The test, archive, screenshots, metadata, beta,
  release_candidate, and submit lanes are available.

## Submission cannot proceed

The archive is not signed. It reports version `0.1.0` build `1`, an empty
signing identity, and no team. The local keychain currently exposes only one
Apple Development identity. There is no Apple Distribution identity, app
specific distribution provisioning profile, IPA, release-evidence JSON, or
App Store Connect API key configuration for this project.

All four content provenance records have `medicalReview` set to
`inheritedWebsiteSource` and `rightsReview` set to
`ownerConfirmationRequired`, with both release gates true. The release controls
correctly reject publishing while these values remain. They require factual
owner approval. A local implementation agent cannot supply that approval.

Source Blender files were subsequently inspected. Their identifiable BlenderKit
assets resolve to Royalty-Free records, and the remaining source inventory is
tracked in `RELEASE_APPROVAL_RECORD.md`. Procedure-specific components without
a recoverable source record still require owner confirmation.

The store metadata is an unuploaded draft. Local `/support` and `/privacy`
pages now name a real temporary support contact and are configured for the
product site's public URLs, but production deployment has not been verified.
The draft still lacks a confirmed copyright holder, review contact, age-rating
and regulated-medical-device answers, export-compliance answer, exact-build
screenshots, and candidate-bound reviewer notes. No internal or external TestFlight candidate,
physical-device reports, App Thinning report, final accessibility acceptance,
or final App Store review scan exists. The native pinch implementation was
corrected after this audit and still needs exact-candidate visual acceptance.

## Fastlane safety check

Running `bundle exec fastlane ios submit` with no environment inputs stopped at
the required `IPA_PATH` check. It made no App Store Connect request. The submit
lane is intentionally designed to accept only a prevalidated, already uploaded
build, and skips binary upload.

## Candidate verification checkpoint

The XcodeBuildMCP Release build for iPhone 17 Pro Max Simulator succeeded. A
Debug test run completed 56 of 57 tests successfully. The only failure was a
remote-transfer test that asserted exactly two concurrent URLSession requests,
although its stated contract is an upper bound of two. The assertion now checks
that the observed maximum is at most two, and the corrected test passes in an
isolated rerun.

An attached iPad Pro 12.9-inch was visible to Xcode but could not mount its
developer disk image. The physical-device Release build therefore could not
begin. This is a local device pairing or developer-image condition, not an
accepted physical-device validation.

## Required owner inputs

1. Confirm medical accuracy for each shipped procedure revision.
2. Confirm rights for each model, illustration, text, font, icon, and store
   screenshot.
3. Deploy and production-verify the configured support contact and public
   privacy-policy URL.
4. Confirm the App Store legal answers, including age rating,
   regulated-medical-device status, export compliance, copyright, and review
   contact.
5. Make Apple Distribution signing and an App Store Connect API key available
   for this bundle identifier.

After those inputs, the remaining candidate work is signing, physical-device
validation, TestFlight, exact screenshots and metadata, release-evidence
validation, and the final Fastlane submission.
