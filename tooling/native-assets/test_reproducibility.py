"""Compare the production USDZ exports against a separate checkout directory."""
import json
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[2]

with tempfile.TemporaryDirectory(prefix="commissure-portability-") as temporary:
    checkout = Path(temporary)
    for procedure in ("acdf", "accf", "pcdf", "pcf"):
        manifest_path = Path(f"tooling/native-assets/manifests/{procedure}.json")
        manifest = json.loads((ROOT / manifest_path).read_text())
        for relative in (manifest_path, manifest["input"], manifest["sourceInventory"], manifest["sceneContract"]):
            target = checkout / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / relative, target)
        output = checkout / "output" / procedure / "model.usdz"
        subprocess.run([
            "blender", "--background", "--factory-startup", "--threads", "1",
            "--python", str(ROOT / "tooling/native-assets/export_usdz.py"), "--",
            "--repo-root", str(checkout), "--manifest", str(checkout / manifest_path),
            "--output", str(output), "--report", str(output.with_name("report.json")),
        ], check=True)
        reference = ROOT / f"tooling/native-assets/output/{procedure}/model.usdz"
        assert reference.read_bytes() == output.read_bytes(), f"{procedure}: checkout-dependent USDZ"
        print(f"PORTABILITY PASS: {procedure}", flush=True)
