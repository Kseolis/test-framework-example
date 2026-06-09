#!/usr/bin/env bash
#
# gen-openapi-fetch.sh — regenerate types via openapi-typescript.
# Reads tests-config.json for source/target paths.
#
set -euo pipefail

ROOT="${1:-$(pwd)}"
CFG="$ROOT/tests-config.json"

if ! command -v jq >/dev/null 2>&1; then
  echo "FAIL: jq is required."
  exit 2
fi

SRC=$(jq -r '.openapi.source' "$CFG")
DST_DIR=$(jq -r '.openapi.generated' "$CFG")
mkdir -p "$ROOT/$DST_DIR"

OUT="$ROOT/$DST_DIR/schema.d.ts"

# Snapshot before regeneration for diffing
if [[ -f "$OUT" ]]; then
  mkdir -p "$ROOT/$DST_DIR/.snapshot"
  cp "$OUT" "$ROOT/$DST_DIR/.snapshot/schema.previous.d.ts"
fi

npx openapi-typescript "$ROOT/$SRC" -o "$OUT"
echo "OK: types written to $OUT"
