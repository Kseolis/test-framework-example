---
name: playwright-test-author-ui
description: Writes Playwright UI tests in TypeScript using project page objects, fixtures, and factories — never inline locators. Enforces web-first assertions, getByRole/getByTestId, no hard waits, AAA structure, and explicit data setup via factories+API. Use when user asks for a new UI test, "automate this scenario in UI", "Playwright test for the login page", or after gherkin-test-case-author finishes. Do NOT use for pure API tests (playwright-test-author-api) or for fixture/page-object scaffolding (fixture-architect / playwright-framework-bootstrap).
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Playwright Test Author — UI

## Hard rules (validated by `scripts/lint-ui-spec.ts`)

1. **No `page.waitForTimeout`**. Use `expect.poll`, web-first assertions, `toBeVisible({ timeout })`.
2. **No raw CSS/XPath selectors in spec**. Selectors live in page objects only.
3. **Selector preference**: `getByRole` > `getByLabel` > `getByPlaceholder` > `getByTestId` > others. CSS only as last resort and reviewed.
4. **One assertion per behaviour, AAA structure**. `expect.soft` for grouped assertions on the same state.
5. **Data setup via API + factory**, not by clicking through UI to seed.
6. **Authentication via storageState fixture**, not by performing UI login per test.
7. **No `test.use()` global mutations** unless the entire file requires it.

## Workflow

1. Read corresponding test design + Gherkin (if any) + page objects.
2. Map scenario steps → page-object methods. If a method is missing, add it to the page object (NOT to spec).
3. Wrap data setup in `test.beforeEach` via fixture; cleanup in `afterEach`.
4. Run `scripts/lint-ui-spec.ts`. Fix until exit 0.
5. Run target spec: `npx playwright test <file> --reporter=list`. Iterate.

## Auto-debug loop

On failure: emit Trace Viewer link via `--trace on-first-retry`. If three retries fail, hand off to `playwright-debug-conductor`.

## References

- `references/web-first-assertions.md`
- `references/locator-priority.md`
- `references/aaa-template.ts`
- `references/anti-flake-checklist.md`
