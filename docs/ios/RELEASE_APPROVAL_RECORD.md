# Release approval record

Status: owner approvals recorded for the first public release on 2026-09-20.

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

Owner attestation: on 2026-09-20, the owner confirmed that the procedure names,
steps, explanatory text, and educational disclaimer for these exact content
revisions are accurate for the first public release as educational content.

## Third-party model trace

The source `.blend` files contain BlenderKit metadata. The earlier generic
license statement is therefore insufficient for public distribution.

| Evidence | Current finding | What is still required |
| --- | --- | --- |
| `blender/Spine Disection.blend`, `blender/spine anatomy.blend`, PCDF source | BlenderKit asset `c7bb1f9e-c59d-4844-abc7-958750fe01a7`, “Full skeleton human”, is recorded in the blend. Its current search record is `royalty_free`. | Save the asset page or purchase/download record and confirm that the recorded license covers this App Store distribution. |
| ACDF, PCDF, PCF sources and home source | BlenderKit metadata names “Stylized Human Brain” and records asset ID `94c75452-1679-4613-b9e5-8b3c9c6ef14c`. Its current search record is `royalty_free`. | Save the asset page or purchase/download record and confirm that the recorded license covers this App Store distribution. |
| Procedure-specific implants and authored transformations | The local source files contain objects without a recoverable BlenderKit asset ID. | Identify whether each object is original, vendor-provided, or separately licensed, and record the source. |

Rights attestation: the owner confirms that all shipped models, text, artwork,
fonts, icons, and store screenshots may be distributed publicly through the App
Store. The app does not access third-party content at runtime. The source-trace
record remains retained for provenance and future updates.

The [BlenderKit licensing FAQ](https://www.blenderkit.com/faq-frequently-asked-questions/)
states that Royalty-Free assets may be used commercially provided the assets
themselves are not sold. Its current creator terms explicitly define a project
as including mobile applications. These terms support integration into this
educational app, but they do not establish the origin of the locally authored
or unlabelled components.

## Approval transition

The owner supplied the factual medical approval on 2026-09-20. All four
provenance records now use `medicalReview.status = ownerApproved` with
`releaseGate = false`. The content catalog hashes were regenerated and the
content validator passed. A new signed candidate must be generated and bound to
this approved catalog before TestFlight.
