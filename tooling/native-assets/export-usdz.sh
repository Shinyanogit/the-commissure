#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "usage: $0 <procedure-id>" >&2
  exit 64
fi

procedure_id=$1
case "$procedure_id" in
  acdf|pcdf) ;;
  *)
    echo "unsupported procedure: $procedure_id" >&2
    exit 64
    ;;
esac

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repo_root=$(CDPATH= cd -- "$script_dir/../.." && pwd)
manifest="$script_dir/manifests/$procedure_id.json"
output_dir="$script_dir/output/$procedure_id"
output_usdz="$output_dir/model.usdz"
report="$output_dir/export-report.json"

blender_version=$(blender --version | sed -n '1s/^Blender //p')
blender_build_hash=$(blender --version | sed -n 's/^[[:space:]]*build hash: //p')
case "$blender_version" in
  "5.2.0 LTS") ;;
  *)
    echo "Blender 5.2.0 LTS is required; found: ${blender_version:-unknown}" >&2
    exit 69
    ;;
esac
if [ "$blender_build_hash" != "fbe6228777e7" ]; then
  echo "Blender build fbe6228777e7 is required; found: ${blender_build_hash:-unknown}" >&2
  exit 69
fi

usd_tools_version=$(usdchecker --version 2>&1)
if [ "$usd_tools_version" != "Apple USD Tools (0.25.2)" ]; then
  echo "Apple USD Tools 0.25.2 is required; found: ${usd_tools_version:-unknown}" >&2
  exit 69
fi

mkdir -p "$output_dir"
rm -f "$output_usdz" "$report"

blender --background --factory-startup --threads 1 \
  --python "$script_dir/export_usdz.py" -- \
  --repo-root "$repo_root" \
  --manifest "$manifest" \
  --output "$output_usdz" \
  --report "$report"

usdchecker --arkit --strict "$output_usdz"
usdzip --list - "$output_usdz"
shasum -a 256 "$output_usdz"
