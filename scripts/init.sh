#!/usr/bin/env bash
#
# init.sh — bootstrap a greenfield TS+Playwright SDET repository in the current directory.
#
# Run from the EMPTY (or near-empty) target repo:
#   bash /path/to/sdet-greenfield-addon/scripts/init.sh
# Or pipe:
#   bash <(cat /path/to/sdet-greenfield-addon/scripts/init.sh)
#
# What it does (idempotent — re-running is safe):
#   1. Confirms the target directory.
#   2. Initialises git if missing (greenfield-friendly: husky needs a git repo).
#   3. Copies/merges template files (package.json, tsconfig.json, eslint, .env.example, .gitignore, .vscode, .husky).
#   4. Copies the SDET kit (.claude/, CLAUDE.md, tests-config.json) if available alongside this script.
#   5. Sets the OpenAPI skill to "disabled" by default for greenfield (re-enable later via tests-config.json).
#   6. Installs npm deps, runs Playwright browser install, sets up husky.
#   7. Writes a STARTER.md with the next 5 commands you should run.
#
set -euo pipefail

ADDON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$(pwd)"
KIT_DIR=""

# Try to discover the companion kit (sdet-claude-code-kit/) sibling to this addon
for candidate in \
  "$ADDON_DIR/../sdet-claude-code-kit" \
  "$ADDON_DIR/../sdet-claude-code-kit-main" \
  "$HOME/sdet-claude-code-kit" \
  "$HOME/Downloads/sdet-claude-code-kit"
do
  if [[ -d "$candidate/.claude/skills" ]]; then
    KIT_DIR="$candidate"; break
  fi
done

echo "===  SDET greenfield bootstrap"
echo "Target:    $TARGET_DIR"
echo "Addon:     $ADDON_DIR"
echo "Kit:       ${KIT_DIR:-(not found — kit copy will be skipped; run apply-kit.sh later)}"
echo

read -rp "Continue? [y/N] " ans
[[ "${ans,,}" == "y" ]] || { echo "Aborted."; exit 0; }

# 1. git init
if [[ ! -d ".git" ]]; then
  echo "[1/7] git init"
  git init -q
  git checkout -b main 2>/dev/null || true
fi

# 2. copy templates (root)
echo "[2/7] applying templates"
copy_if_absent() {
  local src="$1" dst="$2"
  if [[ -e "$dst" ]]; then
    echo "    keep   $dst (exists)"
  else
    cp "$src" "$dst"
    echo "    write  $dst"
  fi
}

copy_if_absent "$ADDON_DIR/templates/root/package.json"        package.json
copy_if_absent "$ADDON_DIR/templates/root/tsconfig.json"       tsconfig.json
copy_if_absent "$ADDON_DIR/templates/root/eslint.config.mjs"   eslint.config.mjs
copy_if_absent "$ADDON_DIR/templates/root/.prettierrc.json"    .prettierrc.json
copy_if_absent "$ADDON_DIR/templates/root/.env.example"        .env.example
copy_if_absent "$ADDON_DIR/templates/root/.editorconfig"       .editorconfig
copy_if_absent "$ADDON_DIR/templates/root/.nvmrc"              .nvmrc

# .gitignore — merge instead of overwrite
if [[ -f ".gitignore" ]]; then
  cat "$ADDON_DIR/templates/root/.gitignore" >> .gitignore.tmp
  cat .gitignore        >> .gitignore.tmp
  sort -u .gitignore.tmp -o .gitignore
  rm  .gitignore.tmp
  echo "    merge  .gitignore"
else
  cp "$ADDON_DIR/templates/root/.gitignore" .gitignore
  echo "    write  .gitignore"
fi

# .vscode (recommended extensions + settings)
mkdir -p .vscode
copy_if_absent "$ADDON_DIR/templates/vscode/extensions.json" .vscode/extensions.json
copy_if_absent "$ADDON_DIR/templates/vscode/settings.json"   .vscode/settings.json

# 3. copy the SDET kit (if discovered)
if [[ -n "$KIT_DIR" ]]; then
  echo "[3/7] copying SDET kit from $KIT_DIR"
  cp -nR "$KIT_DIR/.claude"          .claude        2>/dev/null || true
  cp -n  "$KIT_DIR/CLAUDE.md"        CLAUDE.md       2>/dev/null || true
  cp -n  "$KIT_DIR/tests-config.json" tests-config.json 2>/dev/null || true
  cp -n  "$KIT_DIR/README.md"        SDET_KIT_README.md 2>/dev/null || true
else
  echo "[3/7] kit not found — skipping. Run scripts/apply-kit.sh later."
fi

# 4. mark OpenAPI as disabled by default for greenfield
if [[ -f "tests-config.json" ]] && command -v node >/dev/null 2>&1; then
  echo "[4/7] disabling openapi skill until you have a spec"
  node -e '
    const fs=require("fs");
    const p="tests-config.json"; const cfg=JSON.parse(fs.readFileSync(p,"utf8"));
    cfg.openapi = cfg.openapi || {};
    if (cfg.openapi.enabled === undefined) cfg.openapi.enabled = false;
    fs.writeFileSync(p, JSON.stringify(cfg,null,2)+"\n");
  '
fi

# 5. npm install
if command -v npm >/dev/null 2>&1; then
  echo "[5/7] npm install"
  npm install --no-audit --no-fund
else
  echo "[5/7] npm not found — install Node 20+ then run 'npm install' manually"
fi

# 6. playwright install
if [[ -f "package.json" ]] && command -v npx >/dev/null 2>&1; then
  echo "[6/7] playwright install"
  npx --no-install playwright install --with-deps chromium 2>/dev/null \
    || npx playwright install chromium 2>/dev/null \
    || echo "    skip — run 'npx playwright install' manually"
fi

# 7. husky
if [[ -d ".git" ]] && command -v npx >/dev/null 2>&1 && [[ -f "package.json" ]]; then
  echo "[7/7] husky setup"
  npx --no-install husky 2>/dev/null || true
  mkdir -p .husky
  cp "$ADDON_DIR/templates/husky/pre-commit" .husky/pre-commit
  cp "$ADDON_DIR/templates/husky/commit-msg" .husky/commit-msg
  chmod +x .husky/pre-commit .husky/commit-msg
fi

# Final hint
cp "$ADDON_DIR/templates/root/STARTER.md" STARTER.md 2>/dev/null || true

cat <<EOF

===  Done.
Next steps:
  1. Read STARTER.md
  2. Open the repo in Claude Code:    claude
  3. First request:                   "Scaffold the framework folders"
                                      → playwright-framework-bootstrap will do it
  4. Add your first env values:       cp .env.example .env.local && edit
  5. Commit baseline:                 git add -A && git commit -m "chore: scaffold SDET kit"

EOF
