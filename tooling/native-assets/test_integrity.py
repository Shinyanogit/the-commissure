#!/usr/bin/env python3

import json
from pathlib import Path
import shutil
import tempfile
import unittest

from build_bundle import validate_report


REPO_ROOT = Path(__file__).resolve().parents[2]


class NativeAssetIntegrityTests(unittest.TestCase):
    def make_fixture(self, procedure: str = "acdf") -> Path:
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        paths = (
            f"tooling/native-assets/manifests/{procedure}.json",
            f"tooling/native-assets/output/{procedure}/export-report.json",
            f"tooling/native-assets/output/{procedure}/model.usdz",
            f"content/ios-scenes/{procedure}.json",
        )
        for relative in paths:
            source = REPO_ROOT / relative
            target = root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)
        return root

    def test_rejects_corrupt_archive(self) -> None:
        root = self.make_fixture()
        asset = root / "tooling/native-assets/output/acdf/model.usdz"
        asset.write_bytes(asset.read_bytes() + b"corrupt")
        with self.assertRaisesRegex(ValueError, "archive digest mismatch"):
            validate_report(root, "acdf")

    def test_rejects_scene_path_missing_from_archive(self) -> None:
        root = self.make_fixture()
        scene_path = root / "content/ios-scenes/acdf.json"
        scene = json.loads(scene_path.read_text())
        scene["parts"][0]["entityPath"] = (
            "/root/procedure_acdf/anatomy/not_in_archive"
        )
        scene_path.write_text(json.dumps(scene))
        with self.assertRaisesRegex(ValueError, "scene path absent"):
            validate_report(root, "acdf")


if __name__ == "__main__":
    unittest.main()
