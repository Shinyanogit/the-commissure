import argparse
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import sys
import traceback

import bpy
from pxr import Usd


EXPECTED_BLENDER = (5, 2, 0)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", required=True)
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--report", required=True)
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])


def load_manifest(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def material_for(role: str, palette: dict[str, dict]) -> bpy.types.Material:
    definition = palette[role]
    material = bpy.data.materials.get(f"material_{role}")
    if material is not None:
        return material

    material = bpy.data.materials.new(f"material_{role}")
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    color = definition["color"]
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Metallic"].default_value = definition.get("metallic", 0.0)
    shader.inputs["Roughness"].default_value = definition.get("roughness", 0.55)
    return material


def triangle_count(obj: bpy.types.Object) -> int:
    obj.data.calc_loop_triangles()
    return len(obj.data.loop_triangles)


def apply_decimation(obj: bpy.types.Object, ratio: float) -> None:
    if ratio >= 0.999 or triangle_count(obj) < 1_000:
        return
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    modifier = obj.modifiers.new(name="commissure_spike_decimate", type="DECIMATE")
    modifier.ratio = ratio
    modifier.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.select_set(False)


def attach_preserving_world(obj: bpy.types.Object, parent: bpy.types.Object) -> None:
    world = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_world = world


def canonicalize_layer(path: Path) -> None:
    stage = Usd.Stage.Open(str(path))
    if stage is None:
        raise RuntimeError(f"unable to reopen USD layer: {path}")
    prims = [stage.GetPseudoRoot(), *stage.TraverseAll()]
    for prim in prims:
        children = sorted(child.GetName() for child in prim.GetAllChildren())
        prim.SetChildrenReorder(children)
        if not prim.IsPseudoRoot():
            properties = sorted(prop.GetName() for prop in prim.GetProperties())
            prim.SetPropertyOrder(properties)
    flattened = stage.Flatten()
    if not flattened.Export(str(path)):
        raise RuntimeError(f"unable to export canonical USD layer: {path}")


def normalize_zip_timestamps(path: Path) -> None:
    data = bytearray(path.read_bytes())
    dos_time = 0
    dos_date = 33
    cursor = 0
    while cursor <= len(data) - 4:
        signature = struct.unpack_from("<I", data, cursor)[0]
        if signature == 0x04034B50:
            struct.pack_into("<HH", data, cursor + 10, dos_time, dos_date)
            name_length, extra_length = struct.unpack_from("<HH", data, cursor + 26)
            compressed_size = struct.unpack_from("<I", data, cursor + 18)[0]
            cursor += 30 + name_length + extra_length + compressed_size
        elif signature == 0x02014B50:
            struct.pack_into("<HH", data, cursor + 12, dos_time, dos_date)
            name_length, extra_length, comment_length = struct.unpack_from(
                "<HHH", data, cursor + 28
            )
            cursor += 46 + name_length + extra_length + comment_length
        else:
            cursor += 1
    path.write_bytes(data)


def validate_final_entity_paths(
    path: Path, root_entity: str, records: list[dict]
) -> None:
    stage = Usd.Stage.Open(str(path))
    if stage is None:
        raise RuntimeError(f"unable to reopen final USDZ: {path}")
    roots = [prim for prim in stage.TraverseAll() if prim.GetName() == root_entity]
    if len(roots) != 1:
        raise RuntimeError(f"expected one final {root_entity} prim, found {len(roots)}")
    root_path = str(roots[0].GetPath())

    seen_paths = set()
    for record in records:
        entity_path = f"{root_path}/{record['group']}/{record['semanticID']}"
        mesh_path = f"{entity_path}/mesh_{record['semanticID']}"
        entity_prim = stage.GetPrimAtPath(entity_path)
        mesh_prim = stage.GetPrimAtPath(mesh_path)
        if not entity_prim.IsValid() or not entity_prim.IsActive():
            raise RuntimeError(f"missing final entity path: {entity_path}")
        if not mesh_prim.IsValid() or mesh_prim.GetTypeName() != "Mesh":
            raise RuntimeError(f"missing final mesh path: {mesh_path}")
        if entity_path in seen_paths:
            raise RuntimeError(f"duplicate final entity path: {entity_path}")
        seen_paths.add(entity_path)
        record["entityPath"] = entity_path
        record.pop("group")
        record.pop("semanticID")


def main() -> None:
    args = parse_args()
    if bpy.app.version[:3] != EXPECTED_BLENDER:
        raise RuntimeError(
            f"Blender {EXPECTED_BLENDER} required, found {bpy.app.version[:3]}"
        )

    repo_root = Path(args.repo_root).resolve()
    manifest_path = Path(args.manifest).resolve()
    output_path = Path(args.output).resolve()
    report_path = Path(args.report).resolve()
    manifest = load_manifest(manifest_path)
    input_path = (repo_root / manifest["input"]).resolve()

    if repo_root not in input_path.parents:
        raise RuntimeError("input must stay within the repository")
    if not input_path.is_file():
        raise FileNotFoundError(input_path)

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(input_path))
    imported = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    by_name = {obj.name: obj for obj in imported}
    if len(by_name) != len(imported):
        raise RuntimeError("duplicate source object name after GLB import")

    bindings = manifest["bindings"]
    expected_names = set(bindings)
    actual_names = set(by_name)
    if actual_names != expected_names:
        raise RuntimeError(
            json.dumps(
                {
                    "missing": sorted(expected_names - actual_names),
                    "unexpected": sorted(actual_names - expected_names),
                },
                ensure_ascii=False,
            )
        )

    semantic_ids = [binding["id"] for binding in bindings.values()]
    if len(semantic_ids) != len(set(semantic_ids)):
        raise RuntimeError("semantic IDs must be unique")

    root = bpy.data.objects.new(manifest["rootEntity"], None)
    anatomy = bpy.data.objects.new("anatomy", None)
    implants = bpy.data.objects.new("implants", None)
    bpy.context.scene.collection.objects.link(root)
    bpy.context.scene.collection.objects.link(anatomy)
    bpy.context.scene.collection.objects.link(implants)
    anatomy.parent = root
    implants.parent = root

    before_triangles = 0
    records = []
    for source_name in sorted(bindings):
        binding = bindings[source_name]
        source = by_name[source_name]
        obj = source.copy()
        obj.data = source.data.copy()
        bpy.context.scene.collection.objects.link(obj)
        before = triangle_count(obj)
        before_triangles += before

        obj.data.materials.clear()
        obj.data.materials.append(material_for(binding["material"], manifest["palette"]))
        apply_decimation(obj, float(binding["decimationRatio"]))
        after = triangle_count(obj)

        semantic_id = binding["id"]
        obj.name = semantic_id
        obj.data.name = f"mesh_{semantic_id}"
        attach_preserving_world(obj, anatomy if binding["group"] == "anatomy" else implants)
        records.append(
            {
                "sourceName": source_name,
                "semanticID": semantic_id,
                "group": binding["group"],
                "material": binding["material"],
                "trianglesBefore": before,
                "trianglesAfter": after,
            }
        )

    for source in imported:
        bpy.data.objects.remove(source, do_unlink=True)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    intermediate_path = output_path.with_suffix(".usdc")
    intermediate_path.unlink(missing_ok=True)
    result = bpy.ops.wm.usd_export(
        filepath=str(intermediate_path),
        check_existing=False,
        export_animation=False,
        export_armatures=False,
        export_cameras=False,
        export_curves=False,
        export_hair=False,
        export_lights=False,
        export_materials=True,
        export_mesh_colors=False,
        export_normals=True,
        export_points=False,
        export_shapekeys=False,
        export_subdivision="IGNORE",
        export_textures_mode="KEEP",
        export_uvmaps=False,
        export_volumes=False,
        generate_materialx_network=False,
        generate_preview_surface=True,
        relative_paths=True,
        triangulate_meshes=True,
        use_instancing=False,
    )
    if result != {"FINISHED"} or not intermediate_path.is_file():
        raise RuntimeError(f"USDZ export failed: {result}")

    canonicalize_layer(intermediate_path)
    output_path.unlink(missing_ok=True)
    subprocess.run(
        ["usdzip", "--arkitAsset", str(intermediate_path), str(output_path)],
        check=True,
    )
    intermediate_path.unlink()
    normalize_zip_timestamps(output_path)
    validate_final_entity_paths(output_path, manifest["rootEntity"], records)

    archive_hash = hashlib.sha256(output_path.read_bytes()).hexdigest()
    report = {
        "procedure": manifest["procedure"],
        "input": manifest["input"],
        "inputSHA256": hashlib.sha256(input_path.read_bytes()).hexdigest(),
        "blenderVersion": bpy.app.version_string,
        "blenderBuildHash": bpy.app.build_hash.decode(),
        "entityCount": len(records),
        "trianglesBefore": before_triangles,
        "trianglesAfter": sum(record["trianglesAfter"] for record in records),
        "archiveBytes": output_path.stat().st_size,
        "archiveSHA256": archive_hash,
        "entities": records,
    }
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print("COMMISSURE_EXPORT=" + json.dumps(report, separators=(",", ":")))


try:
    main()
except Exception:
    traceback.print_exc()
    sys.exit(1)
