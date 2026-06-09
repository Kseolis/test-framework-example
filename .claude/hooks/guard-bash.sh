#!/usr/bin/env bash
#
# guard-bash.sh — PreToolUse hook for Bash. Reads JSON from stdin (Claude Code passes
# tool input there) and exits non-zero to block destructive or risky commands.
#
# Risk patterns:
#   - rm -rf  (anywhere)
#   - git push --force / -f
#   - git reset --hard on main/master
#   - npx playwright codegen in CI
#   - direct edits to tests/api/generated/** (must go via skill scripts)
#
set -euo pipefail

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || echo "")
[[ -z "$CMD" ]] && exit 0

deny() {
  echo "BLOCKED: $1" >&2
  exit 2  # exit 2 tells Claude Code: blocked, do not run
}

# Catastrophic
echo "$CMD" | grep -qE '\brm\s+(-[a-z]*r[a-z]*f|-rf|-fr)\b' && deny "rm -rf is forbidden via Bash hook."
echo "$CMD" | grep -qE 'git\s+push\s+(--force|-f)' && deny "git push --force is forbidden."
echo "$CMD" | grep -qE 'git\s+reset\s+--hard\s+(origin/)?(main|master|release)' && deny "Hard reset on protected branch."
echo "$CMD" | grep -qE 'sudo\s+' && deny "sudo is not allowed in agent commands."

# Restricted in CI
if [[ -n "${CI:-}" ]]; then
  echo "$CMD" | grep -qE 'playwright\s+codegen' && deny "playwright codegen is interactive; not allowed in CI."
fi

exit 0
