#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repo_root=$(CDPATH= cd -- "$script_dir/../../.." && pwd)
generated_assets="$script_dir/GeneratedAssets"

"$repo_root/tooling/native-assets/export-usdz.sh" acdf
"$repo_root/tooling/native-assets/export-usdz.sh" pcdf
mkdir -p "$generated_assets"
cp "$repo_root/tooling/native-assets/output/acdf/model.usdz" \
  "$generated_assets/acdf.usdz"
cp "$repo_root/tooling/native-assets/output/pcdf/model.usdz" \
  "$generated_assets/pcdf.usdz"
cp "$repo_root/tooling/native-assets/output/acdf/export-report.json" \
  "$generated_assets/acdf-bindings.json"
cp "$repo_root/tooling/native-assets/output/pcdf/export-report.json" \
  "$generated_assets/pcdf-bindings.json"
xcodegen generate --spec "$script_dir/project.yml" --project "$script_dir"
