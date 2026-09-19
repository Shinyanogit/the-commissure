# Native explanation copy

`ExplanationCopy.json` owns the experimental iOS-only reading copy requested on
September 19, 2026. The canonical medical content, titles, ordering, accessibility
summaries and Web copy remain in `content/`. This file is presentation copy, not
a new medical specification or independent content delivery channel.

All 26 steps in both languages have semantic paragraph breaks. Ten steps in
each language also simplify repetitive wording. Concision is not a quota:
causes, indications, conditional language, alternatives, numerical information,
risks and links must be retained. Short originals are only reformatted.
Markdown emphasis becomes the Web light-blue semibold highlight in the native
renderer. Full procedure names remain in titles; established acronyms may be
used in the body.

Each entry includes the SHA-256 of the exact original body. A different remote
or updated source body bypasses the override and displays that source verbatim,
so edited bundled prose cannot mask a medical-content update. To revise an
entry, compare both language sources and update its digest only after checking
meaning. Do not mechanically rehash overrides when upstream content changes.

This copy is an owner-requested experiment awaiting visual/editorial review;
it does not establish medical accuracy or distribution rights approval.

Run `python3 tooling/native-copy/validate.py` after edits. This checks coverage,
source hashes, emphasis delimiters, link targets and numerical tokens. It is a
structural guard, not a semantic or medical review. Hashing and copy decoding
run off MainActor when a procedure or locale is loaded; view updates use the
already prepared strings.
