#!/usr/bin/env bash
#
# apply-kit.sh — copy the SDET Claude Code kit into the current repo.
# Use this if init.sh did not find the kit automatically.
#
#   bash apply-kit.sh /path/to/sdet-claude-code-kit
#
set -euo pipefail

KIT_DIR="${1:-}"
if [[ -z "$KIT_DIR" || ! -d "$KIT_DIR/.claude/skills" ]]; then
  echo "Usage: $0 /path/to/sdet-claude-code-kit"
  echo "       (the directory must contain .claude/skills)"
  exit 2
fi

echo "Copying kit from: $KIT_DIR"
echo "Target:           $(pwd)"
read -rp "Continue? [y/N] " ans
[[ "${ans,,}" == "y" ]] || { echo "Aborted."; exit 0; }

cp -nR "$KIT_DIR/.claude"          .claude
cp -n  "$KIT_DIR/CLAUDE.md"        CLAUDE.md           2>/dev/null || true
cp -n  "$KIT_DIR/tests-config.json" tests-config.json   2>/dev/null || true
cp -n  "$KIT_DIR/README.md"        SDET_KIT_README.md   2>/dev/null || true

# make scripts executable
chmod +x .claude/hooks/*.sh                 2>/dev/null || true
chmod +x .claude/skills/*/scripts/*.sh      2>/dev/null || true
chmod +x .claude/skills/*/scripts/*.ts      2>/dev/null || true

# disable openapi skill on greenfield
if [[ -f "tests-config.json" ]] && command -v node >/dev/null 2>&1; then
  node -e '
    const fs=require("fs");
    const p="tests-config.json"; const cfg=JSON.parse(fs.readFileSync(p,"utf8"));
    cfg.openapi = cfg.openapi || {};
    if (cfg.openapi.enabled === undefined) cfg.openapi.enabled = false;
    fs.writeFileSync(p, JSON.stringify(cfg,null,2)+"\n");
  '
fi

echo "Done."
