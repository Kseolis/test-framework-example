---
name: playwright-debug-conductor
description: Conducts an interactive debugging session for a failing Playwright test using Trace Viewer, headed mode, --debug, slow-mo, and UI mode. Produces a root-cause hypothesis with evidence (screenshot, trace event, network log). Use when a test fails repeatedly, user asks "why is this flaky", "debug this test", "trace viewer says...", or after playwright-test-author-* hits 2+ retries. Do NOT use to write new tests.
allowed-tools: Read, Edit, Bash, Glob, Grep
---

# Playwright Debug Conductor

## Workflow

1. Re-run the failing spec with `--trace on --reporter=list --workers=1 --headed=$HEADED`.
2. Open `test-results/.../trace.zip` programmatically and `scripts/extract-failing-step.ts` summarises:
   - failing locator + last DOM snapshot
   - last 5 network calls + status
   - last 20 console messages
   - duration of each step
3. Classify failure: `selector`, `timing`, `data`, `env`, `app-bug`, `flake`.
4. Propose ONE fix at a time. Validate by re-running.
5. If app bug: stop, file `BUG.md` with reproducer.

## Failure classifier

| Signal                                           | Class          | First action                                         |
| ------------------------------------------------ | -------------- | ---------------------------------------------------- |
| `Locator expected to be visible` after long wait | timing         | switch to web-first; widen actionTimeout per-action  |
| `strict mode violation: resolved to N elements`  | selector       | scope locator inside an ancestor; use `getByRole`    |
| 401/403 in last network call                     | env / auth     | verify storageState; rotate test creds               |
| 5xx in last network call                         | env / app-bug  | reproduce via API client; if reproducible → BUG.md   |
| Order-dependent failure                          | data leak      | run with `--shuffle --workers=1`; suspect a fixture  |
| Passes headed, fails headless                    | timing / focus | check animation, autofocus, `prefers-reduced-motion` |

## References

- `references/failure-taxonomy.md`
- `references/trace-cheatsheet.md`
- `references/ui-mode-vs-debug.md`
