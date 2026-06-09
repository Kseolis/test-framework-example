---
name: release-report-composer
description: Composes an executive release-readiness report from run-analyzer, coverage-gap-analyzer, flaky-triage outputs and contract-drift report. Targets product/QA leads. Use when user asks "release report", "QA sign-off", "go/no-go summary", before a release branch cut. Do NOT use for daily test reports.
allowed-tools: Read, Glob, Grep, Write
---

# Release Report Composer

## Required template

1. **Verdict**: ✅ go / ⚠️ go-with-risks / ❌ no-go.
2. **Test execution**: pass/fail/flaky, durations, environments.
3. **Coverage**: % AC covered, endpoints covered, critical gaps.
4. **Contract drift**: breaking/non-breaking changes vs prod baseline.
5. **Top risks** with mitigations.
6. **Recommendations** (must-do / should-do / nice-to-have).

Saves to `docs/releases/<version>.md`.

## Inputs (all optional but at least one required)

- `RUN_SUMMARY.md`
- `COVERAGE_GAPS.md`
- `FLAKE_REPORT.md`
- `CONTRACT_DRIFT.md`

## Workflow

1. Detect which inputs exist.
2. Read each and extract key numbers via simple regex.
3. Compose `docs/releases/<version>.md` from `references/release.template.md`.
4. Suggest verdict based on rules:
   - Pass rate < 95%, or any breaking contract change unaddressed → no-go.
   - 95% ≤ pass rate < 99%, or P0 coverage gaps present → go-with-risks.
   - Otherwise → go.

## References

- `references/release.template.md`
- `references/verdict-rules.md`
