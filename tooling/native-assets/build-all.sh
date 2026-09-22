#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repo_root=$(CDPATH= cd -- "$script_dir/../.." && pwd)

python3 "$script_dir/generate_manifests.py" --repo-root "$repo_root"
for procedure_id in acdf accf pcdf pcf; do
  "$script_dir/export-usdz.sh" "$procedure_id"
done
python3 "$script_dir/build_bundle.py" --repo-root "$repo_root"
