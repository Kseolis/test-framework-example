#!/usr/bin/env bash
#
# gherkin-lint.sh — runs gherkin-lint over feature files (best-effort soft check).
#
set -euo pipefail
ROOT="${1:-$(pwd)}"

if ! find "$ROOT/tests" -name '*.feature' -print -quit 2>/dev/null | grep -q .; then
  echo "OK: no .feature files."
  exit 0
fi

# Use npx with --yes to avoid interactive prompts; tolerate missing config
npx --yes gherkin-lint "tests/**/*.feature" || {
  echo "Gherkin lint reported issues. Address smells in references/gherkin-smells.md."
  exit 1
}
