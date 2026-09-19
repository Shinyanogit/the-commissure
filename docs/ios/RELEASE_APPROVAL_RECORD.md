# Release approval record

Status: factual review pending. This record does not constitute medical or
rights approval.

This is the release-gate dossier for the first public iOS build. It identifies
the exact content and source evidence that require owner review before
`medicalReview` or `rightsReview` can be changed in the four procedure
provenance records.

## Medical content

All four procedures use English source revision
`cd49d3bbaa3a2ff9ec26368509f72bae1036f077f831a77e54a6fcbdcca4cc00`
from `web/src/content/procedureText.js`. Japanese copy is stored alongside each
procedure under `content/procedures/`.

| Procedure | Bundled model digest |
| --- | --- |
| ACDF | `15b1254d853a8ca7d96c27299b212bea531359cf1c45ddaab6fdd31a704b6426` |
| ACCF | `ab13b22ffabca7153e456b13cdd751bfbbe964f17ef70905c44ea6de29fb9af6` |
| PCDF | `d8d57774af3e59cdbfccf2636f6b4ab3f8934e0c48c542086684935cc3eedff9` |
| PCF | `f292255dafe7646ce48014f71555f05587ea0f0791a2dc9e4ff75d2fbd0ae403` |

Required attestation: a medically qualified owner has reviewed the procedure
names, steps, explanatory text, and educational disclaimer for these exact
content revisions and approves the first public release as educational content.

## Third-party model trace

The source `.blend` files contain BlenderKit metadata. The earlier generic
license statement is therefore insufficient for public distribution.

| Evidence | Current finding | What is still required |
| --- | --- | --- |
| `blender/Spine Disection.blend`, `blender/spine anatomy.blend`, PCDF source | BlenderKit asset `c7bb1f9e-c59d-4844-abc7-958750fe01a7`, “Full skeleton human”, is recorded in the blend. Its live API record returned `royalty_free` on 2026-09-20. | Save the asset page or purchase/download record and confirm that the recorded license covers this App Store distribution. |
| ACDF, PCDF, PCF sources and home source | BlenderKit metadata names “Stylized Human Brain” and records asset base ID `31f93934-2350-42d6-9fe9-f6de68b75300`; the embedded asset ID `94c75452-1679-4613-b9e5-8b3c9c6ef14c` did not resolve publicly on 2026-09-20. | Obtain the original BlenderKit library record or creator permission. Do not infer commercial rights from the local `is_free` flag. |
| Procedure-specific implants and authored transformations | The local source files contain objects without a recoverable BlenderKit asset ID. | Identify whether each object is original, vendor-provided, or separately licensed, and record the source. |

Required attestation: the rights holder has checked every source that reaches a
bundled GLB, preview, home image, background, or AppIcon, and confirms public
App Store distribution is allowed. Editorial assets or unknown source material
must be removed or replaced before approval.

## Approval transition

When the two attestations and the supporting license evidence are available:

1. Update each `content/procedures/*/provenance.json` with the factual reviewer,
   date, license/source detail, and approved status.
2. Run the publication and release-control tests.
3. Regenerate the release candidate and bind the approvals to its commit and
   artifact digest in `RELEASE_READINESS.md`.

No status transition is allowed from this document alone.
