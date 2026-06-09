---
description: Generate coverage gap report (endpoints + AC + pages)
allowed-tools: Read, Bash, Glob, Grep, Write
model: sonnet
---

# Pipeline

1. Use the `coverage-gap-analyzer` skill.
2. Run `scripts/analyze-coverage.ts`.
3. Read `COVERAGE_GAPS.md`. Highlight P0 gaps in your message.
