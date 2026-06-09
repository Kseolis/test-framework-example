# Fixture leak checklist

A "leak" = state created in one test surfaces in the next. Symptoms: order-dependent failures, ghost data, "passes alone, fails in suite".

## Hard checks

1. Every fixture body has exactly one `await use(...)` call.
2. Resources created before `use` are torn down after `use` (try/finally if necessary).
3. No fixture writes to a file path shared across tests without a per-test suffix.
4. No fixture mutates `process.env` without restoring.
5. No fixture mutates the imported factory (e.g. assigns `userFactory.someProp = ...`).
6. Worker-scope fixtures avoid mutable maps/sets that grow across tests.
7. `page.route` handlers are removed via `page.unroute` or live in a `test`-scope fixture that auto-cleans on teardown.

## Soft checks (warn)

- Fixture name shadows a built-in (`page`, `request`, `browser`, `context`, `browserName`).
- Two fixtures depend on each other in a cycle.
- A `test`-scope fixture is consumed by more than 5 other fixtures (refactor candidate).

## Diagnosis when a leak is suspected

```bash
npx playwright test --workers=1 --shuffle  # randomise order
npx playwright test --repeat-each=3        # detect order-dependent failures
```

If the suite passes with `--workers=1` but fails parallel — concurrent state mutation.
If it fails with `--shuffle` only — order-dependent leak.

## Common offenders

- Login that writes a single `auth.json` shared across users.
- Test data factories that return the same `id` because the sequence resets.
- `beforeAll` in spec files that mutates a module-level singleton.
- Mock servers started in `worker` scope, configured in `test` scope, never reset.
