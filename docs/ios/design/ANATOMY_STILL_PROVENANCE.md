# Phase 5R anatomy still provenance manifest

Status: intake template; no design candidate may claim completion until each
used still is recorded and checked
Date: 2026-08-02

Static design candidates must use only anatomy imagery already present in the
validated native/content boundary. A placeholder or generated anatomy image may
be used while exploring layout only when it is visibly marked as a placeholder;
it cannot close the anatomy-first, 7:2:1, or App Store evidence gates.

## Required record

Add one record per still before it appears in a candidate that is submitted for
owner selection:

| Field | Required value |
|---|---|
| `still_id` | Stable repository identifier, not a filename-only label |
| `procedure_id` | One of the validated procedure IDs |
| `step_id` | Canonical step represented by the still |
| `source_path` | Tracked source asset or generated derivative path |
| `source_sha256` | Hash of the source bytes |
| `derivative_path` | Exact exported still used by the design tool, if any |
| `derivative_sha256` | Hash of the exported bytes, if any |
| `license_or_rights` | Existing provenance/rights record reference |
| `content_review` | Medical/editorial review status; never infer approval |
| `candidate_usage` | Candidate IDs and frames in which it appears |
| `notes` | Crop, overlay, redaction, or deliberate placeholder note |

## Intake rules

- The design tool may crop or scale a still, but it may not invent anatomy,
  labels, procedure steps, or clinical claims.
- The manifest points back to `content/` provenance and source-asset hashes;
  it does not replace the content validator or medical/rights approval.
- A candidate with an unresolved rights or medical-review field is a design
  exploration artifact only and cannot become a store screenshot or release
  evidence.
- The final selected candidate must list every still used by the static frames,
  interaction prototype, SwiftUI previews, and App Store materials.

## Records

No anatomy still has been selected for Phase 5R yet. Populate this section only
after the design specialist identifies a real shipped still and its source
provenance is mechanically verified.
