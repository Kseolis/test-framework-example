---
description: Review staged test changes for anti-patterns
allowed-tools: Read, Bash, Grep, Glob
model: sonnet
---

# Context

- Staged files: !`git diff --staged --name-only -- 'tests/**' 2>/dev/null`
- All changed files: !`git diff --name-only -- 'tests/**' 2>/dev/null`

# Pipeline

1. Use the `test-code-reviewer` skill.
2. Run all relevant validators (`lint-ui-spec.ts`, `lint-api-spec.ts`, `lint-page-object.ts`, `fixture-rules.ts`, `factory-rules.ts`, `tsc --noEmit`).
3. Aggregate findings per `references/review-template.md`.
4. Output report and exit code summary.
