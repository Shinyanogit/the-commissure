# Shared Content

This directory contains the validated Phase 3 content contract:

```text
catalog/catalog.json          immutable file records, hashes, sizes, and capabilities
procedures/<id>/              metadata, English/Japanese strings, and provenance
ios-scenes/<id>.json          iOS-only canonical RealityKit state data
source-entities/<id>.json     asset-hash-bound GLB entity inventories
schema/                       closed JSON Schema v1 contracts
```

The English localization is a mechanical restricted-Markdown migration of
`web/src/content/procedureText.js` plus three allowlisted PCF terminology
corrections (`spine cord`, and the expanded ACDF/PCDF names). Provenance records
each from/to pair, and validation rejects any other drift while Web still owns
its legacy import. Japanese has identical stable keys and an editorial review
record. Medical wording and model/text rights remain explicit release gates in
provenance rather than being implied by successful schema validation.

Stable IDs never inherit spelling mistakes or array order from source models.
`sourceEntity` records the exact legacy GLB name, while `entityPath` records the
canonical absolute iOS path under `/root/procedure_<id>/`. ACDF/PCDF bindings
must also match the accepted native conversion manifest exactly. Every dynamic
part has a complete absolute state at every step. Relative transforms, unknown
fields/easing, missing or duplicate bindings, incomplete/finally divergent
states, degenerate cameras/rotation axes, HTML, external links, and locale-key
differences fail. Locale identity, provenance revision, procedure/scene view
policy, canonical procedure root, and internal-link labels are cross-file
invariants rather than schema-local assumptions. URL-like content is rejected
for URI schemes, protocol-relative forms, and `www.` hosts; only the four
allowlisted `procedure:<id>` links are accepted.

Web GSAP and iOS scene states remain renderer-specific. The shared procedure
metadata and prose may be consumed by both, but the repository does not define a
downloadable animation language.

Run from `tooling/content`:

```sh
npm ci
npm run migrate
npm run validate
npm test
```

`migrate` is deterministic and refreshes the catalog hashes. Content CI reruns
it and rejects a dirty result before validating the contracts and 26 negative
fixtures.
