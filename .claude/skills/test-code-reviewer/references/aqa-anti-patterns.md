# AQA anti-patterns — full catalogue

## Spec body

| Anti-pattern                                           | Severity | Fix                                           |
| ------------------------------------------------------ | -------- | --------------------------------------------- |
| `page.waitForTimeout(N)`                               | blocker  | Web-first matchers / `expect.poll`.           |
| `setTimeout(...)` inside `test()`                      | blocker  | Same as above.                                |
| Raw CSS selector `page.locator('.foo > div')`          | major    | Move to page object; use `getByRole`.         |
| XPath selector                                         | major    | Same as above.                                |
| `await page.locator(...).nth(N)` outside page object   | major    | Scope with parent; never index.               |
| Branch (`if/else`/`switch`) in test body               | major    | Split into separate scenarios.                |
| `test.only` committed                                  | blocker  | Remove.                                       |
| `test.skip` without ticket reference                   | minor    | Comment with issue link.                      |
| Hardcoded URL/credential                               | blocker  | Move to env via `tests/infra/env.ts`.         |
| `console.log` left behind                              | minor    | Remove.                                       |
| Inline data literal for a domain entity                | minor    | Use a factory.                                |
| Snapshot of dynamic content w/o mask                   | major    | Mask via `toHaveScreenshot({ mask: [...] })`. |
| Asserting on error.message string                      | minor    | Assert on `code`.                             |
| Multiple unrelated assertions interleaved with actions | minor    | Group with `expect.soft`.                     |

## Page objects

| Anti-pattern                                                 | Severity | Fix                               |
| ------------------------------------------------------------ | -------- | --------------------------------- |
| Public locator field                                         | major    | Expose method, not locator.       |
| Method that returns boolean for assertion                    | major    | Return locator; let spec assert.  |
| Page does its own `expect(...)`                              | major    | Move assertion to spec.           |
| Hardcoded `path` not computed from baseURL                   | major    | Use relative path.                |
| Multi-page navigation in one method                          | major    | Split by destination.             |
| God-class > 400 LOC                                          | major    | Split or compose with components. |
| Inheritance for variants (`AdminPage extends DashboardPage`) | major    | Composition over inheritance.     |

## Fixtures

| Anti-pattern                                | Severity | Fix                                         |
| ------------------------------------------- | -------- | ------------------------------------------- |
| Missing `await use(...)`                    | blocker  | Always `use`, even if value is `undefined`. |
| Cleanup omitted                             | major    | After `use`, tear down.                     |
| Worker-scope fixture mutates per-test state | major    | Move to `test` scope.                       |
| Fixture name shadows built-in               | major    | Rename.                                     |
| Cross-fixture cycles                        | major    | Untangle dependency graph.                  |

## Factories

| Anti-pattern                           | Severity | Fix                                     |
| -------------------------------------- | -------- | --------------------------------------- |
| Network call inside factory            | major    | Move to `seed()` helper.                |
| Top-level `Date.now()` / `Math.random` | major    | `faker` with SEED.                      |
| Inheritance among factories            | major    | Use overrides + transient params.       |
| Hidden mutable state                   | major    | Recreate via `Factory.define` per call. |

## Configuration

| Anti-pattern                                  | Severity | Fix                   |
| --------------------------------------------- | -------- | --------------------- |
| `.env` committed                              | blocker  | `.gitignore`; rotate. |
| Secrets logged                                | blocker  | Mask in CI; remove.   |
| Per-spec `test.use({ baseURL })` mutating env | major    | Use a project.        |

## Reporting

| Anti-pattern                                                        | Severity | Fix                 |
| ------------------------------------------------------------------- | -------- | ------------------- |
| `--retries=5` to mask flake                                         | major    | Triage, don't bury. |
| `expect.configure({ timeout: 60_000 })` global to dodge timing bugs | major    | Fix the timing bug. |
