#!/usr/bin/env bash
#
# scan-hardcoded.sh — fail when hardcoded URLs / credentials slip into tests/.
#
set -euo pipefail
ROOT="${1:-$(pwd)}"
TARGET_DIRS=("tests")

violations=0

for dir in "${TARGET_DIRS[@]}"; do
  [[ -d "$ROOT/$dir" ]] || continue

  # Hardcoded https/http literals (allow localhost & .env.example references)
  if grep -RInE "https?://[^'\"\` ]+" "$ROOT/$dir" \
     --include='*.ts' --include='*.js' \
     --exclude-dir=generated --exclude-dir=node_modules \
     | grep -vE "(localhost|127\.0\.0\.1|baseURL|@example\.com|process\.env|env\.[A-Z_]+|//\s*example|tests/infra/env\.ts)"; then
    echo "FAIL: hardcoded URL(s) above. Move to env config."
    violations=$((violations + 1))
  fi

  # Hardcoded credentials
  if grep -RInE "(password|token|secret|apiKey|api_key)\s*[:=]\s*['\"][^'\"]{6,}" "$ROOT/$dir" \
     --include='*.ts' --include='*.js' \
     --exclude-dir=generated --exclude-dir=node_modules; then
    echo "FAIL: hardcoded credential(s) above."
    violations=$((violations + 1))
  fi
done

if [[ $violations -gt 0 ]]; then
  exit 1
fi
echo "OK: no hardcoded secrets/URLs."
