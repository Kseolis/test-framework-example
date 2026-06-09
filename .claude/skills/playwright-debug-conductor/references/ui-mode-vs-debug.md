# UI mode vs --debug vs codegen

A quick map of when to reach for which tool.

## UI mode (`npx playwright test --ui`)

Best default for interactive debugging.

- Time-travel through actions with DOM snapshots.
- Live watch: edits to spec/page-object re-run automatically.
- Filter by test name / project / tags / status.
- Pick locator interactively against the live page.

Use when: iterating on a single test, choosing locators, exploring why a step misbehaves.

## `--debug` (`npx playwright test --debug`)

Drops you into the Playwright Inspector with `pause()` semantics.

- Step over each action.
- Edit locators on the fly via the Inspector.
- Useful when UI mode is too "watchy" and you need full control.

Use when: pinpoint debugging deep inside a long test.

## `codegen` (`npx playwright codegen <url>`)

Records actions and emits suggestion-quality scaffolding.

- Fastest way to get a candidate locator.
- Output is NOT production-ready — it goes through `playwright-test-author-ui` to be reformulated.

Use when: bootstrapping a new page object, exploring a new flow.

## Headed + slow-mo

```bash
PWDEBUG=1 npx playwright test path/spec --headed --workers=1
# or
npx playwright test --headed --workers=1 --use-args slowMo=300
```

Use when: visually verifying a flow, or when a test passes headless and fails headed (or vice versa).

## When NOT to use these

- In CI. CI runs headless with `--reporter=list,html`. Trace Viewer post-mortem is the right tool there.
- For flake triage on a wide scale — that's `flaky-triage` running over JSON results, not interactive.
