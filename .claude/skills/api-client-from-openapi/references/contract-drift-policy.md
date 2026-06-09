# Contract drift policy

## What counts as drift

| Change                                          | Severity               | Action                             |
| ----------------------------------------------- | ---------------------- | ---------------------------------- |
| New optional field added                        | non-breaking           | log only                           |
| New required field added                        | breaking               | block PR; update factories + tests |
| Field renamed                                   | breaking               | block PR; coordinate with backend  |
| Field removed                                   | breaking               | block PR                           |
| Type widened (e.g. `string` → `string \| null`) | non-breaking but risky | warn                               |
| Type narrowed                                   | breaking               | block PR                           |
| Endpoint removed                                | breaking               | block PR                           |
| New endpoint                                    | non-breaking           | log; consider new tests            |
| Status code changed                             | breaking               | block PR                           |
| Auth scheme changed                             | breaking               | block PR                           |

## Process

1. On every spec change, `scripts/contract-diff.ts` runs.
2. Diff is rendered as `CONTRACT_DRIFT.md` and committed alongside the PR.
3. `contract-drift-watch` subagent classifies each diff and proposes test patches for breaking changes.
4. PR cannot be merged with an unresolved breaking-change marker.

## Snapshot baseline

The "previous" baseline is `tests/api/generated/.snapshot/schema.d.ts`. It is updated by an explicit human-confirmed step (`/spec-sync --commit-baseline`).

## Reporting layout

```markdown
# Contract drift report (vs baseline @ <git-sha>)

## Breaking changes (must address)

- POST /orders: response schema renamed `customer_id` → `customerId`.
- DELETE /orders/{id}: status `204` → `200` with body.

## Non-breaking

- GET /users: new optional field `nickname`.

## Test impact

- tests/specs/api/orders/\*.spec.ts (3 files): need camelCase update.
```
