---
description: Debug and fix a failing test (debug → patch → re-run)
argument-hint: <path/to/spec.ts>
allowed-tools: Read, Edit, Bash, Glob, Grep
model: sonnet
---

# Context

- Target spec: @$ARGUMENTS
- Last run: !`test -f playwright-report/results.json && echo present || echo missing`

# Pipeline

1. Use `playwright-debug-conductor` on `$ARGUMENTS`.
2. Classify the failure per `references/failure-taxonomy.md`.
3. Propose ONE patch. Apply it.
4. Re-run: `npx playwright test $ARGUMENTS --reporter=list --workers=1 --trace=on-first-retry`.
5. If still failing, iterate (max 3 cycles). After that, escalate to `flaky-detective` subagent.
