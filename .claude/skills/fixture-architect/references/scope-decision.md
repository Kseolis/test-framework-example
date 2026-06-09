# Fixture scope decision

Playwright supports two scopes:

- `test` — default; fixture is created per test, cleaned up after.
- `worker` — fixture is created once per worker process and reused across tests.

## When to use worker scope

Use it when **all** of the following hold:

1. The fixture is read-only across tests (no mutation that could leak).
2. Construction is expensive (auth flow, browser launch, large dataset preload).
3. Tests using it do not rely on a fresh state (otherwise pin to `test`).

## Common cases

| Resource                                        | Scope                               | Why                                    |
| ----------------------------------------------- | ----------------------------------- | -------------------------------------- |
| Logged-in `storageState` for a stable test user | `worker`                            | Avoid logging in 1000 times; immutable |
| API client with baseURL & auth token            | `worker`                            | Stateless wrapper                      |
| Page object                                     | `test`                              | Bound to a `page` (which is per-test)  |
| User created via factory then deleted           | `test`                              | Side effects must be cleaned up        |
| Mock server                                     | `worker` (start), `test` (handlers) | Server up once; handlers per test      |

## Do NOT mix scopes incorrectly

A `worker`-scope fixture cannot consume `test`-scope fixtures. Playwright will throw at runtime. The fixture-rules.ts validator catches this statically by checking the dependency graph.

## Caveats

- worker-scope state is reset between projects, not between tests within a project.
- If a worker-scope fixture mutates state during a test, parallel tests in the same worker will interfere.
- Prefer multiple small worker-scope fixtures over one fat one — Playwright reuses across the dependency graph anyway.
