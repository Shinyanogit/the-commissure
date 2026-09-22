"""Run with the pinned Blender Python to verify checkout-independent USD layers."""
from pathlib import Path
import sys
import tempfile

sys.path.insert(0, str(Path(__file__).resolve().parent))
from export_usdz import canonicalize_layer
from pxr import Usd, UsdGeom

with tempfile.TemporaryDirectory() as temporary:
    root = Path(temporary)
    outputs = []
    for checkout in ("first-checkout", "second-checkout"):
        directory = root / checkout
        directory.mkdir()
        path = directory / "model.usdc"
        stage = Usd.Stage.CreateNew(str(path))
        UsdGeom.Xform.Define(stage, "/root")
        cube = UsdGeom.Cube.Define(stage, "/root/anatomy")
        cube.GetSizeAttr().Set(0.25)
        stage.GetRootLayer().Save()
        del stage, cube
        canonicalize_layer(path)
        flattened = Usd.Stage.Open(str(path))
        assert not flattened.GetRootLayer().comment
        assert str(root) not in flattened.GetRootLayer().ExportToString()
        outputs.append(path.read_bytes())
    assert outputs[0] == outputs[1], "Canonical bytes depend on checkout path"
print("Canonical USD bytes match across distinct checkout directories")
