---
name: run-analyzer
description: Analyses a Playwright test run (HTML/JSON/JUnit/Allure reporters) to surface duration trends, parallel utilisation, retry counts, and top-N slowest tests. Outputs an executive summary plus drill-down. Use when user asks "how was the run", "trends", "performance of test suite", or after CI completes. Do NOT use for individual debug; defer to playwright-debug-conductor.
allowed-tools: Read, Glob, Grep, Bash
---

# Run Analyzer

## Reporters supported

- `playwright-json` (default), `junit`, `html`, Allure (via `allure-playwright`).

## Outputs

- `RUN_SUMMARY.md`: total/failed/flaky, P50/P95 duration, top-10 slowest, worker utilisation.
- Trend graph hint (if `runs/history.jsonl` exists): regression flags ±20%.

## Workflow

1. Read `playwright-report/results.json`.
2. Compute aggregates via `scripts/analyze-run.ts`.
3. If `runs/history.jsonl` exists, append today's record and compare against the last 5 runs.
4. Emit `RUN_SUMMARY.md`.

## What good looks like

| Metric                          | Target         | Action if violated                       |
| ------------------------------- | -------------- | ---------------------------------------- |
| Pass rate                       | ≥ 99%          | Investigate top failures                 |
| Flaky rate (retried but passed) | ≤ 1%           | flaky-triage                             |
| P95 single-test duration        | ≤ 60s          | Top-10 slow → factor or move to API tier |
| Worker utilisation              | ≥ 70%          | Re-balance shards                        |
| Total wallclock                 | ≤ 15 min on CI | Sharding strategy                        |

## References

- `references/parsers.md` (JUnit / Allure parsing notes)
- `references/summary.template.md`
