#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
xcodegen generate --spec "$script_dir/project.yml" --project "$script_dir"
