# App Store submission audit, 2026-09-20

Status: submission blocked by factual and candidate-bound release gates. A signed IPA and App Store Connect record now exist, and English descriptive metadata is saved, but no build has been uploaded.

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

A distribution-signed IPA was successfully exported after this initial source
audit. It reports `1.0.0` build `1`, bundle identifier `app.thecommissure.ios`,
Team `8WSQBQX6C5`, an Apple Distribution signature, and the app-specific
`iOS Team Store Provisioning Profile: app.thecommissure.ios`. The IPA remains
outside the repository and has not been uploaded. A retained release-evidence
package is still absent. An App Manager API key has been created and its
downloaded secret is stored only in a Git-ignored local file; read-only API
authentication against this app record has succeeded.

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

The later App Store Connect checkpoint saved the English product-page text,
Support URL, Marketing URL, Privacy Policy URL, Medical and Education
categories, a 16+ age-rating result, and a not-regulated-medical-device
declaration. App Privacy is prepared as Data Not Collected and awaits only the
account holder's final legal attestation. The Vercel production support and
privacy routes were verified with HTTPS 200. These updates do not close the
rights, screenshot, copyright, review-contact, candidate-evidence, or
TestFlight gates.

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

Fastlane Snapshot subsequently captured four English and four Japanese iPad
Pro 13-inch (M5) Simulator images at `2064 × 2752 px`, with
`testAppStoreScreenshots` passing in both locales. The first attempt exposed a
Ruby path mismatch in the `xcpretty` child process; the captures succeeded
after exporting the Homebrew Ruby and bundled Gem bin paths. Final artwork
approval remains open.

## Required owner inputs

1. Confirm medical accuracy for each shipped procedure revision.
2. Confirm rights for each model, illustration, text, font, icon, and store
   screenshot.
3. Deploy and production-verify the configured support contact and public
   privacy-policy URL.
4. Confirm the App Store legal answers, including age rating,
   regulated-medical-device status, export compliance, copyright, and review
   contact.
5. Complete the remaining upload fields in the browser or through Fastlane,
   using the already verified local App Store Connect API configuration.

After those inputs, the remaining candidate work is signing, physical-device
validation, TestFlight, exact screenshots and metadata, release-evidence
validation, and the final Fastlane submission.

## Replacement candidate scan

The replacement signed IPA was scanned after the target added
`ITSAppUsesNonExemptEncryption=false`. Its SHA-256 is
`d520c07864c5bb10d52a7a3bf85dcf821a5cb8d1ce490b3a11e711443b360aeb`.
It contains one arm64 application bundle, supports iPhone and iPad, has a
minimum OS of 18.0, passes strict code-signature verification, and has no
embedded third-party frameworks. Its Info.plist and Privacy Manifest both pass
`plutil -lint`; the payload reports `get-task-allow=false` and the expected
distribution team `8WSQBQX6C5`.

The scan found no source use of WebKit, StoreKit payment APIs, advertising or
tracking APIs, private-selector invocation, hard-coded IPv4 endpoints, or
privacy permission-description keys. The public Support, Privacy, and marketing
URLs each returned HTTPS 200. These technical checks close no factual content,
physical-device, TestFlight, or legal-attestation gate. The IPA has not been
uploaded.

App Store Connect was also inspected after this scan. It currently records
Education as the primary category, no secondary category, no third-party
content, and no regulated medical device. The App Privacy final publication,
copyright, App Review phone, candidate-bound device evidence, and protected
release-evidence package remain open.

The paired physical iPad Pro 12.9-inch (5th generation) is visible as an iOS
destination and has Developer Mode enabled. It runs iPadOS 26.6.2, while the
installed Xcode is 26.2. `devicectl` cannot mount a Developer Disk Image and
reports `ddiServicesAvailable=false`, so installation, launch, and device-bound
validation cannot begin on this Mac until Xcode has the matching device support.
