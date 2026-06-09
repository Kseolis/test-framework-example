#!/usr/bin/env bash
#
# validate-spec.sh — lint OpenAPI spec via redocly.
#
set -euo pipefail
ROOT="${1:-$(pwd)}"
CFG="$ROOT/tests-config.json"
SRC=$(jq -r '.openapi.source' "$CFG")

if ! command -v npx >/dev/null 2>&1; then
  echo "FAIL: npx required."
  exit 2
fi

npx --yes @redocly/cli@latest lint "$ROOT/$SRC"
