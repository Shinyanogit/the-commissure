# iOS release readiness validator

Run:

```sh
node tooling/release/validate-release.mjs \
  --root . \
  --evidence /absolute/path/release-evidence.json \
  --artifact /absolute/path/TheCommissure.ipa
```

The evidence JSON uses schema version 1. `artifact` contains `path`, `sha256`,
`bytes`, `bundleIdentifier`, `marketingVersion`, `buildNumber`, and
`signingTeamIdentifier`. `content` contains `sitePath`, `publicKeyPath`, and
`manifestSha256`. The root also contains `stage`, the full `commit`, `tag`, and
a `gates` object.

Each gate is keyed by its documented ID and contains:

```json
{
  "status": "passed",
  "approvedBy": "reviewer identity",
  "completedAt": "2026-09-12T00:00:00Z",
  "artifactSha256": "64 lowercase hex characters",
  "contentManifestSha256": "64 lowercase hex characters",
  "evidencePath": "reports/example.txt",
  "evidenceSha256": "64 lowercase hex characters"
}
```

Paths in the JSON are relative to the evidence file directory. Every file must
be regular, remain inside that directory, and match its hash. The exact required
gate IDs for each stage are defined in `lib.mjs` and summarized in
`docs/ios/RELEASE_READINESS.md`. The command exits nonzero at the first missing
or invalid gate. On macOS it also verifies the distribution signature,
provisioning identity, App Store profile, device architecture, bundle identity,
version, privacy manifest, and the single-app IPA shape.
