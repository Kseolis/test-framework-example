---
name: flaky-triage
description: Detects, classifies, and proposes fixes for flaky Playwright tests by analysing test results JSON and traces across multiple runs. Distinguishes timing flakes, data flakes, environment flakes, and real bugs. Use when user reports "flaky", "intermittent failure", "this test passes locally", or after a CI report shows reruns. Do NOT use to write new tests.
allowed-tools: Read, Glob, Grep, Bash
---

# Flaky Triage

## Inputs

- `playwright-report/` (HTML + JSON).
- N×raw runs in `test-results/`.
- Optional: CI history exported via `scripts/export-ci-runs.sh`.

## Workflow

1. Aggregate pass/fail per test across runs (`scripts/flake-rate.ts`).
2. For each test with rate ∈ (0, 1): pull traces, diff failing vs passing step.
3. Classify:
   - **Timing**: assertion fired before stable state → fix with `expect.poll` / web-first.
   - **Data**: shared seed, sequence collision → fix with `factory.sequence` + per-test namespace.
   - **Env**: external dep down/slow → quarantine + reproduce in isolation.
   - **Locator**: dynamic ID/class → switch to role/test-id.
   - **Real bug**: app race condition → file ticket, do NOT mark flaky.
4. Output `FLAKE_REPORT.md` + suggested patch.

## Quarantine policy

A flaky test may be tagged `@quarantine` for ≤ 2 sprints with an open issue link. After that, delete or fix.

## References

- `references/flake-taxonomy.md`
- `references/quarantine-policy.md`
- `references/repro-strategy.md`
