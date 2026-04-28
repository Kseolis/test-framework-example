#!/usr/bin/env bash
#
# verify.sh — sanity check after init.sh.
# Reports what is missing and what is good. Exit code 0 = green, 1 = warnings, 2 = failures.
#
set -uo pipefail

green='\033[0;32m'; yellow='\033[0;33m'; red='\033[0;31m'; nc='\033[0m'
fails=0; warns=0

ok() {
  local label="$1"
  printf "  ${green}✓${nc} %s\n" "$label"
  return 0
}

warn() {
  local label="$1"
  printf "  ${yellow}!${nc} %s\n" "$label"
  warns=$((warns + 1))
  return 0
}

fail() {
  local label="$1"
  printf "  ${red}✗${nc} %s\n" "$label"
  fails=$((fails + 1))
  return 0
}

check() {
  local label="$1"
  local cond="$2"
  if eval "$cond"; then ok "$label"; else fail "$label"; fi
  return 0
}

softcheck() {
  local label="$1"
  local cond="$2"
  if eval "$cond"; then ok "$label"; else warn "$label"; fi
  return 0
}

echo "===  SDET greenfield repo health check"
echo

echo "[ Tooling ]"
check "git initialised"                "[[ -d .git ]]"
check "Node 20+ available"             "node -e 'process.exit(parseInt(process.versions.node)>=20?0:1)' >/dev/null 2>&1"
softcheck "jq available (recommended)" "command -v jq >/dev/null 2>&1"

echo "[ Project files ]"
check "package.json"                   "[[ -f package.json ]]"
check "tsconfig.json"                  "[[ -f tsconfig.json ]]"
check "tests-config.json"              "[[ -f tests-config.json ]]"
check "CLAUDE.md"                      "[[ -f CLAUDE.md ]]"
check ".env.example"                   "[[ -f .env.example ]]"
check ".gitignore"                     "[[ -f .gitignore ]]"
softcheck "ESLint config"              "[[ -f eslint.config.mjs || -f .eslintrc.json || -f eslint.config.js ]]"
softcheck "Prettier config"            "[[ -f .prettierrc.json || -f .prettierrc ]]"

echo "[ Claude Code kit ]"
check ".claude/settings.json"          "[[ -f .claude/settings.json ]]"
check ".claude/skills/ has 15 skills"  "[[ \$(ls .claude/skills 2>/dev/null | wc -l) -ge 15 ]]"
check ".claude/agents/ has subagents"  "[[ \$(ls .claude/agents 2>/dev/null | wc -l) -ge 1 ]]"
check ".claude/hooks/*.sh executable"  "[[ -x .claude/hooks/guard-bash.sh ]]"

echo "[ Greenfield-specific ]"
softcheck "OpenAPI skill disabled (recommended on greenfield)" \
  "node -e 'const c=require(\"./tests-config.json\");process.exit(c.openapi&&c.openapi.enabled===false?0:1)' 2>/dev/null"
softcheck "node_modules installed"     "[[ -d node_modules ]]"
softcheck "Playwright browsers installed" \
  "[[ -d \$(npm config get cache 2>/dev/null)/ms-playwright ]] || ls ~/.cache/ms-playwright 2>/dev/null | grep -q chromium"
softcheck "husky configured"           "[[ -d .husky && -x .husky/pre-commit ]]"

echo "[ Network safety ]"
softcheck ".env files gitignored"      "grep -q '^\.env$' .gitignore 2>/dev/null"
check "no .env committed"              "! git ls-files 2>/dev/null | grep -E '^\\.env$'"

echo
if (( fails > 0 )); then
  printf "${red}%d failure(s), %d warning(s)${nc}\n" "$fails" "$warns"
  exit 2
elif (( warns > 0 )); then
  printf "${yellow}%d warning(s) — repo is usable but consider addressing them${nc}\n" "$warns"
  exit 1
else
  printf "${green}All checks passed.${nc}\n"
  exit 0
fi
