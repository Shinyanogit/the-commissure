#!/usr/bin/env python3
"""Generate conversion manifests from the tracked source and scene contracts."""

import argparse
import hashlib
import json
from pathlib import Path
import re


PROCEDURES = ("acdf", "accf", "pcdf", "pcf")

RATIO_OVERRIDES = {
    "acdf": {
        "c3 bone": 0.5,
        "c4 bone": 0.65,
        "c5 bone": 0.8,
        "c6 bone": 0.5,
    },
    "pcdf": {
        "c1 bone": 0.65,
        "c2 bone": 0.65,
        "c3 bone": 0.65,
        "c4 bone": 0.75,
        "c5 bone": 0.85,
        "c6 bone": 0.65,
        "c7 bone": 0.65,
        "t1 bone": 0.55,
        "t2 bone": 0.55,
        "t3 bone": 0.55,
        "t4 bone": 0.55,
        "t5 bone": 0.55,
        "t6 bone": 0.55,
        "cranium bone": 0.15,
        "c2-c3 disk": 0.18,
        "c3-c4 disk": 0.18,
        "c4-c5 disk": 0.18,
        "c5-c6 disk": 0.18,
        "c6-c7 disk": 0.18,
        "c7-t1 disk": 0.18,
        "t1-t2 disk": 0.18,
        "t2-t3 disk": 0.18,
        "t3-t4 disk": 0.18,
        "t4-t5 disk": 0.18,
        "t5-t6 disk": 0.18,
        "t6-t7 disk": 0.18,
        "c5 removed bone": 0.85,
        "removed bone": 0.7,
        "ligament flavum": 1.0,
        "ligament flavum.002": 1.0,
        "ligament flavum.003": 1.0,
        "removed ligament flavum.002": 1.0,
        "posterior longitudinal ligament": 0.7,
        "central nerve": 0.45,
    },
}

PALETTE = {
    "bone": {"color": [0.871, 0.791, 0.658], "roughness": 0.6},
    "disc": {"color": [0.888, 0.815, 0.776], "roughness": 0.62},
    "nucleus": {
        "color": [0.658, 0.831, 0.888],
        "metallic": 0.0,
        "roughness": 0.5,
    },
    "ligament": {"color": [0.913, 0.888, 0.816], "roughness": 0.7},
    "cord": {"color": [0.510, 0.332, 0.063], "roughness": 0.65},
    "nerve": {"color": [1.0, 0.708, 0.098], "roughness": 0.58},
    "spacer": {
        "color": [0.694, 0.701, 0.694],
        "metallic": 0.5,
        "roughness": 0.5,
    },
    "cage": {
        "color": [0.694, 0.701, 0.694],
        "metallic": 0.5,
        "roughness": 0.5,
    },
    "screw": {
        "color": [0.022, 0.407, 0.243],
        "metallic": 0.5,
        "roughness": 0.5,
    },
    "plate": {
        "color": [0.402, 0.397, 0.418],
        "metallic": 0.5,
        "roughness": 0.5,
    },
    "shaft": {
        "color": [0.694, 0.701, 0.694],
        "metallic": 0.5,
        "roughness": 0.5,
    },
    "saddle": {
        "color": [0.0, 0.455, 0.596],
        "metallic": 0.5,
        "roughness": 0.5,
    },
    "cap": {
        "color": [0.761, 0.755, 0.745],
        "metallic": 0.5,
        "roughness": 0.5,
    },
    "rod": {
        "color": [0.694, 0.701, 0.694],
        "metallic": 0.5,
        "roughness": 0.5,
    },
}


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inline_object(value: dict) -> str:
    fields = ", ".join(
        f"{json.dumps(key)}: {json.dumps(item)}" for key, item in value.items()
    )
    return f"{{ {fields} }}"


def serialize_manifest(manifest: dict) -> str:
    lines = [
        "{",
        f'  "procedure": {json.dumps(manifest["procedure"])},',
        f'  "input": {json.dumps(manifest["input"])},',
        f'  "rootEntity": {json.dumps(manifest["rootEntity"])},',
        f'  "sourceInventory": {json.dumps(manifest["sourceInventory"])},',
        f'  "sceneContract": {json.dumps(manifest["sceneContract"])},',
        '  "palette": {',
    ]
    palette = list(manifest["palette"].items())
    for index, (role, definition) in enumerate(palette):
        comma = "," if index < len(palette) - 1 else ""
        lines.append(f"    {json.dumps(role)}: {inline_object(definition)}{comma}")
    lines.append("  },")
    lines.append('  "bindings": {')
    bindings = list(manifest["bindings"].items())
    for index, (source_name, binding) in enumerate(bindings):
        comma = "," if index < len(bindings) - 1 else ""
        lines.append(
            f"    {json.dumps(source_name)}: {inline_object(binding)}{comma}"
        )
    lines.extend(["  }", "}"])
    return "\n".join(lines) + "\n"


def static_id(source_name: str) -> str:
    if source_name in {"cranial bone", "cranium bone"}:
        return "cranium"
    if source_name == "central nerve":
        return "central_nerve"
    if source_name in {"ligamentum flavum", "ligament flavum"}:
        return "ligamentum_flavum"
    if source_name == "posterior longitudinal ligament":
        return "posterior_longitudinal_ligament"

    match = re.fullmatch(r"([ct])(\d+) bone", source_name)
    if match:
        return f"vertebra_{match.group(1)}{match.group(2)}"
    match = re.fullmatch(r"([ct])(\d+)-([ct])(\d+) disk", source_name)
    if match:
        return (
            f"disc_{match.group(1)}{match.group(2)}_"
            f"{match.group(3)}{match.group(4)}"
        )
    raise ValueError(f"no stable static semantic ID for source entity: {source_name}")


def material_role(source_name: str, semantic_id: str) -> str:
    if semantic_id.startswith("cage_"):
        return "cage"
    if semantic_id == "interbody_spacer":
        return "spacer"
    if semantic_id.startswith("plate"):
        return "plate"
    if semantic_id.startswith("screw_shaft_"):
        return "shaft"
    if semantic_id.startswith("screw_saddle_"):
        return "saddle"
    if semantic_id.startswith("screw_cap_"):
        return "cap"
    if semantic_id.startswith("screw_"):
        return "screw"
    if semantic_id.startswith("rod_"):
        return "rod"
    if "nucleus pulposus" in source_name:
        return "nucleus"
    if "disk" in source_name:
        return "disc"
    if "ligament" in source_name:
        return "ligament"
    if "medulla" in source_name:
        return "cord"
    if "nerve" in source_name:
        return "nerve"
    if "bone" in source_name:
        return "bone"
    raise ValueError(f"no material role for source entity: {source_name}")


def decimation_ratio(
    source_name: str, semantic_id: str, role: str, dynamic: bool
) -> float:
    if semantic_id == "cranium":
        return 0.2
    if role == "bone":
        return 0.8 if "removed" in source_name else 0.4
    if role == "disc":
        return 0.8 if dynamic else 0.25
    if role == "nucleus":
        return 0.8
    if role == "ligament":
        return 0.6
    if role == "cord":
        return 1.0
    if role == "nerve":
        return 0.4 if semantic_id == "central_nerve" else 0.8
    if role in {"spacer", "cage", "plate"}:
        return 0.8
    if role == "screw":
        return 0.4
    if role == "shaft":
        return 0.05
    if role == "saddle":
        return 1.0
    if role == "cap":
        return 0.5
    if role == "rod":
        return 0.7
    raise ValueError(f"no decimation ratio for material role: {role}")


def generate(repo_root: Path, procedure: str, check: bool) -> None:
    source_rel = f"content/source-entities/{procedure}.json"
    scene_rel = f"content/ios-scenes/{procedure}.json"
    source_path = repo_root / source_rel
    scene_path = repo_root / scene_rel
    manifest_path = repo_root / f"tooling/native-assets/manifests/{procedure}.json"
    source = load_json(source_path)
    scene = load_json(scene_path)

    if source["procedureId"] != procedure or scene["procedureId"] != procedure:
        raise ValueError(f"procedure ID mismatch for {procedure}")
    input_path = repo_root / source["assetPath"]
    if sha256(input_path) != source["assetSha256"]:
        raise ValueError(f"source asset digest mismatch for {procedure}")
    if scene["rootEntityPath"] != f"/root/procedure_{procedure}":
        raise ValueError(f"noncanonical root entity path for {procedure}")

    parts = {part["sourceEntity"]: part for part in scene["parts"]}
    if len(parts) != len(scene["parts"]):
        raise ValueError(f"duplicate scene source binding for {procedure}")
    unknown_scene_sources = set(parts) - set(source["entities"])
    if unknown_scene_sources:
        raise ValueError(
            f"scene sources absent from source inventory for {procedure}: "
            f"{sorted(unknown_scene_sources)}"
        )

    bindings = {}
    seen_ids = set()
    seen_paths = set()
    for source_name in source["entities"]:
        part = parts.get(source_name)
        if part is None:
            semantic_id = static_id(source_name)
            group = "anatomy"
            entity_path = f"/root/procedure_{procedure}/{group}/{semantic_id}"
        else:
            semantic_id = part["id"]
            entity_path = part["entityPath"]
            expected_prefix = f"/root/procedure_{procedure}/"
            if not entity_path.startswith(expected_prefix):
                raise ValueError(f"scene path outside canonical root: {entity_path}")
            group = entity_path.removeprefix(expected_prefix).split("/", 1)[0]
            if entity_path != f"{expected_prefix}{group}/{semantic_id}":
                raise ValueError(f"scene path and semantic ID disagree: {entity_path}")

        if semantic_id in seen_ids or entity_path in seen_paths:
            raise ValueError(f"duplicate generated identity for {procedure}: {semantic_id}")
        seen_ids.add(semantic_id)
        seen_paths.add(entity_path)

        role = material_role(source_name, semantic_id)
        ratio = RATIO_OVERRIDES.get(procedure, {}).get(
            source_name,
            decimation_ratio(source_name, semantic_id, role, part is not None),
        )
        bindings[source_name] = {
            "id": semantic_id,
            "group": group,
            "material": role,
            "decimationRatio": ratio,
        }

    roles = {binding["material"] for binding in bindings.values()}
    manifest = {
        "procedure": procedure,
        "input": source["assetPath"],
        "rootEntity": f"procedure_{procedure}",
        "sourceInventory": source_rel,
        "sceneContract": scene_rel,
        "palette": {role: PALETTE[role] for role in PALETTE if role in roles},
        "bindings": bindings,
    }
    payload = serialize_manifest(manifest)

    if check:
        if not manifest_path.is_file() or manifest_path.read_text() != payload:
            raise ValueError(f"generated manifest is stale: {manifest_path}")
        return
    manifest_path.write_text(payload, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", default=Path(__file__).resolve().parents[2])
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    repo_root = Path(args.repo_root).resolve()
    for procedure in PROCEDURES:
        generate(repo_root, procedure, args.check)


if __name__ == "__main__":
    main()
