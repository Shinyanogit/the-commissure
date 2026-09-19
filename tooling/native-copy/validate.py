"""Check editorial source binding and structural preservation, not medical meaning."""
import hashlib
import json
from pathlib import Path
import re

root = Path(__file__).resolve().parents[2]
copy = json.loads((root / "ios/App/Content/ExplanationCopy.json").read_text())
assert set(copy) == {"acdf", "accf", "pcdf", "pcf"}
count = 0
for procedure, languages in copy.items():
    assert set(languages) == {"en", "ja"}
    for language, entries in languages.items():
        source_file = root / f"content/procedures/{procedure}/{language}.json"
        originals = json.loads(source_file.read_text())["strings"]
        bodies = {key: value for key, value in originals.items() if key.endswith(".body")}
        assert entries.keys() == bodies.keys(), (procedure, language, "body coverage")
        for key, original in bodies.items():
            entry = entries[key]
            revised = entry["text"]
            identity = (procedure, language, key)
            assert entry["sourceSHA256"] == hashlib.sha256(original.encode()).hexdigest(), identity
            assert revised.strip() and revised.count("**") % 2 == 0, identity
            links = lambda text: re.findall(r"\]\(([^)]+)\)", text)
            assert links(original) == links(revised), (identity, "link targets")
            numbers = lambda text: set(re.findall(r"\d+", text.replace("3D", "")))
            assert numbers(original) <= numbers(revised), (identity, "numerical tokens")
            count += 1
assert count == 52
print(f"Checked {count} localized bodies: source hashes, coverage, emphasis, links and numerical tokens")
print("Manual review is still required for semantic equivalence and medical accuracy")
