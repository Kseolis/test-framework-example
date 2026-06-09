---
name: fixture-architect
description: Designs Playwright fixtures with proper scoping (test vs worker), composition, and dependency injection. Wires page objects, API clients, factories, authenticated storage state, and per-test cleanup. Use when user adds a new fixture, mentions "test.extend", "worker scope", "auth state", "shared context", "DI for tests", or when a spec instantiates page objects manually inside the test body. Do NOT use to write business steps; defer to playwright-test-author-ui.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Fixture Architect

## Trigger

- Spec contains `new SomePage(page)` inline.
- User: "add fixture", "worker fixture", "shared login", "extend test".

## Decision tree

| Need                                           | Scope    | Pattern                                               |
| ---------------------------------------------- | -------- | ----------------------------------------------------- |
| Page object (per test)                         | `test`   | `({ page }, use) => use(new XPage(page))`             |
| API client                                     | `test`   | uses request-context fixture                          |
| Logged-in user (reused across tests in worker) | `worker` | `storageState` cached file                            |
| Test data lifecycle (create+delete)            | `test`   | factory + afterEach cleanup in fixture                |
| Network mocks (route handlers)                 | `test`   | `await use()` between `page.route` and `page.unroute` |

## Workflow

1. Read `tests-config.json.layout.fixtures`.
2. Compose into `tests/fixtures/index.ts` via `base.extend`. NEVER overwrite `page` without justification.
3. For worker-scope auth: use `references/auth.setup.template.ts` pattern (`storageState` saved by setup project, consumed by other projects).
4. Validate with `scripts/fixture-rules.ts`:
   - No fixture without `await use(...)`.
   - No fixture mutating global state outside its lifecycle.
   - Fixture name does not collide with built-ins (`page`, `request`, `browser`, `context`).
   - `worker`-scope fixtures must not depend on `test`-scope ones.

## Anti-patterns prevented

- Leaky fixtures (cleanup missing → next test inherits state).
- Implicit ordering between fixtures (rely on dependency graph, not file order).
- Mega-fixture file > 300 lines (skill splits per concern).

## References

- `references/scope-decision.md`
- `references/auth.setup.template.ts`
- `references/composing-fixtures.md`
- `references/anti-leaks-checklist.md`
