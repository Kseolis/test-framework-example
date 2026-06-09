#!/usr/bin/env bash
#
# typecheck-touched.sh — PostToolUse hook for Edit/Write.
# Runs tsc --noEmit on the touched file via tsc-files (incremental).
# Soft-fails: prints errors, never blocks (exit 0) so the agent can iterate.
#
set -euo pipefail

INPUT=$(cat)
PATH_TO_CHECK=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")
[[ -z "$PATH_TO_CHECK" ]] && exit 0
[[ "$PATH_TO_CHECK" != *.ts ]] && exit 0

if ! command -v npx >/dev/null 2>&1; then exit 0; fi

# tsc-files runs the project's tsconfig but only for the listed files.
npx --no-install tsc-files --noEmit "$PATH_TO_CHECK" 2>&1 || true

exit 0
