---
description: Compose release readiness report (verdict + summary)
argument-hint: <version e.g. v1.42.0>
allowed-tools: Read, Bash, Glob, Grep, Write
model: sonnet
---

# Pipeline

1. Use the `release-report-composer` skill.
2. Read `RUN_SUMMARY.md`, `COVERAGE_GAPS.md`, `FLAKE_REPORT.md`, `CONTRACT_DRIFT.md` (whichever exist).
3. Run `scripts/compose-release.ts $ARGUMENTS`.
4. Display the verdict and the path to the report.
