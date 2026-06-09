#!/usr/bin/env bash
#
# validate-layout.sh — checks that the repo follows tests-config.json layout.
# Exit codes:
#   0 = OK
#   1 = layout violation (see stdout)
#   2 = config missing
#
set -euo pipefail

ROOT="${1:-$(pwd)}"
CFG="$ROOT/tests-config.json"

if [[ ! -f "$CFG" ]]; then
  echo "FAIL: tests-config.json missing at $CFG"
  exit 2
fi

# Pull paths via jq if present; fall back to defaults
if command -v jq >/dev/null 2>&1; then
  PAGES=$(jq -r '.layout.pages' "$CFG")
  SPECS=$(jq -r '.layout.specs' "$CFG")
  FIXTURES=$(jq -r '.layout.fixtures' "$CFG")
else
  PAGES="tests/pages"
  SPECS="tests/specs"
  FIXTURES="tests/fixtures"
fi

violations=0

# 1. specs/ must not import directly from pages/*/locators
if grep -RE "from ['\"].*pages/.+/locators['\"]" "$ROOT/$SPECS" 2>/dev/null; then
  echo "FAIL: specs/ imports locators directly. Use page object public API."
  violations=$((violations + 1))
fi

# 2. BasePage must not import expect
if [[ -f "$ROOT/$PAGES/BasePage.ts" ]] && grep -E "from ['\"]@playwright/test['\"]" "$ROOT/$PAGES/BasePage.ts" | grep -q expect; then
  echo "FAIL: BasePage.ts imports expect. Assertions belong in specs."
  violations=$((violations + 1))
fi

# 3. *Page classes must live under pages/
if grep -RE "class [A-Za-z]+Page " "$ROOT" --include='*.ts' --exclude-dir node_modules \
   | grep -v "$PAGES" \
   | grep -v ".claude/skills/" >/dev/null 2>&1; then
  echo "FAIL: *Page classes found outside $PAGES."
  violations=$((violations + 1))
fi

# 4. specs/ must not contain raw axios/fetch
if grep -RE "from ['\"]axios['\"]|new XMLHttpRequest|require\\(['\"]axios" "$ROOT/$SPECS" 2>/dev/null; then
  echo "FAIL: specs/ contains raw HTTP client. Use generated typed client."
  violations=$((violations + 1))
fi

if [[ $violations -gt 0 ]]; then
  echo "Layout violations: $violations"
  exit 1
fi

echo "OK: layout valid."
exit 0
