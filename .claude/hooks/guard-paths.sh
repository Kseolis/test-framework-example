#!/usr/bin/env bash
#
# guard-paths.sh — PreToolUse hook for Edit/Write. Blocks edits to paths
# that must be touched only via dedicated skill scripts.
#
set -euo pipefail

INPUT=$(cat)
PATH_TO_TOUCH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")
[[ -z "$PATH_TO_TOUCH" ]] && exit 0

deny() {
  echo "BLOCKED: $1" >&2
  exit 2
}

# Generated artefacts — only the api-client-from-openapi skill should regenerate
case "$PATH_TO_TOUCH" in
  *tests/api/generated/*)
    deny "tests/api/generated/** is regenerated only via gen-openapi-fetch.sh." ;;
  *.snapshot/*)
    deny "Snapshots are baselines; update via /spec-sync --commit-baseline." ;;
  */node_modules/*)
    deny "Do not edit node_modules." ;;
  *.env|*.env.*)
    case "$PATH_TO_TOUCH" in
      *.env.example|*.env.*.template) ;;  # allowed
      *) deny "Editing .env files via the agent is forbidden. Use secret store." ;;
    esac ;;
esac

exit 0
