---
description: Detect flakes by repeating the suite and triaging
argument-hint: <repeat-count, default 10>
allowed-tools: Read, Bash, Glob, Grep
model: sonnet
---

# Context

- Repeat count: $ARGUMENTS (default 10)

# Pipeline

1. Run: `mkdir -p runs && for i in $(seq 1 ${ARGUMENTS:-10}); do npx playwright test --reporter=json --output=runs/$i.json || true; done`.
2. Hand off to the `flaky-detective` subagent.
3. The subagent runs `flake-rate.ts ./runs > FLAKE_REPORT.md` and classifies.
4. Output the report path.
