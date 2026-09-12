#!/usr/bin/env python3
"""Validate converted assets and assemble the ignored iOS resource bundle."""

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import zipfile


PROCEDURES = ("acdf", "accf", "pcdf", "pcf")
EXPECTED_BLENDER = "5.2.0 LTS"
EXPECTED_BLENDER_HASH = "fbe6228777e7"
EXPECTED_USD_TOOLS = "Apple USD Tools (0.25.2)"


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate_report(repo_root: Path, procedure: str) -> tuple[Path, dict, list[dict]]:
    output_dir = repo_root / "tooling/native-assets/output" / procedure
    asset_path = output_dir / "model.usdz"
    report_path = output_dir / "export-report.json"
    if not asset_path.is_file() or not report_path.is_file():
        raise ValueError(f"missing converted output for {procedure}")

    report = load_json(report_path)
    manifest = load_json(
        repo_root / "tooling/native-assets/manifests" / f"{procedure}.json"
    )
    scene = load_json(repo_root / "content/ios-scenes" / f"{procedure}.json")
    if report["procedure"] != procedure or manifest["procedure"] != procedure:
        raise ValueError(f"procedure mismatch in report for {procedure}")
    if report["input"] != manifest["input"]:
        raise ValueError(f"input mismatch in report for {procedure}")
    if report["archiveSHA256"] != sha256(asset_path):
        raise ValueError(f"archive digest mismatch for {procedure}")
    if report["archiveBytes"] != asset_path.stat().st_size:
        raise ValueError(f"archive size mismatch for {procedure}")
    with zipfile.ZipFile(asset_path) as archive:
        if archive.namelist() != ["model.usdc"]:
            raise ValueError(f"unexpected USDZ members for {procedure}")
    if report["blenderVersion"] != EXPECTED_BLENDER:
        raise ValueError(f"Blender version mismatch for {procedure}")
    if report["blenderBuildHash"] != EXPECTED_BLENDER_HASH:
        raise ValueError(f"Blender build mismatch for {procedure}")

    entities = sorted(report["entities"], key=lambda entity: entity["entityPath"])
    if len(entities) != report["entityCount"]:
        raise ValueError(f"entity count mismatch for {procedure}")
    report_paths = {entity["entityPath"] for entity in entities}
    if len(report_paths) != len(entities):
        raise ValueError(f"duplicate entity path for {procedure}")
    expected_paths = {
        f"/root/{manifest['rootEntity']}/{binding['group']}/{binding['id']}"
        for binding in manifest["bindings"].values()
    }
    if report_paths != expected_paths:
        raise ValueError(f"report paths disagree with manifest for {procedure}")
    scene_paths = {part["entityPath"] for part in scene["parts"]}
    if not scene_paths.issubset(report_paths):
        raise ValueError(f"scene path absent from converted asset for {procedure}")
    return asset_path, report, entities


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", default=Path(__file__).resolve().parents[2])
    args = parser.parse_args()
    repo_root = Path(args.repo_root).resolve()
    destination = repo_root / "ios/Resources/NativeAssets"
    records = []

    usd_tools_version = subprocess.run(
        ["usdchecker", "--version"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()
    if usd_tools_version != EXPECTED_USD_TOOLS:
        raise ValueError(
            f"USD tools version mismatch: expected {EXPECTED_USD_TOOLS}, "
            f"found {usd_tools_version or 'unknown'}"
        )

    validated = {
        procedure: validate_report(repo_root, procedure) for procedure in PROCEDURES
    }
    for procedure in PROCEDURES:
        asset_path, report, entities = validated[procedure]
        subprocess.run(
            ["usdchecker", "--arkit", "--strict", str(asset_path)], check=True
        )
        relative_filename = f"{procedure}/model.usdz"
        destination_path = destination / relative_filename
        destination_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(asset_path, destination_path)
        if sha256(destination_path) != report["archiveSHA256"]:
            raise ValueError(f"copied archive digest mismatch for {procedure}")
        records.append(
            {
                "id": procedure,
                "filename": relative_filename,
                "sha256": report["archiveSHA256"],
                "bytes": report["archiveBytes"],
                "triangles": report["trianglesAfter"],
                "entityCount": report["entityCount"],
                "entityPaths": [entity["entityPath"] for entity in entities],
                "entities": [
                    {
                        "sourceName": entity["sourceName"],
                        "entityPath": entity["entityPath"],
                    }
                    for entity in entities
                ],
            }
        )

    bundle_manifest = {
        "schemaVersion": 1,
        "generator": "tooling/native-assets/build_bundle.py",
        "toolchain": {
            "blenderVersion": EXPECTED_BLENDER,
            "blenderBuildHash": EXPECTED_BLENDER_HASH,
            "usdToolsVersion": EXPECTED_USD_TOOLS,
        },
        "procedureCount": len(records),
        "totalBytes": sum(record["bytes"] for record in records),
        "procedures": records,
    }
    destination.mkdir(parents=True, exist_ok=True)
    (destination / "manifest.json").write_text(
        json.dumps(bundle_manifest, indent=2) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
