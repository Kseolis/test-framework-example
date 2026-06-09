# Test tagging convention

Tags are how the coverage analyser knows what each test covers. Without tags, a test contributes nothing to coverage metrics.

## Required tags

| Tag                         | Format                          | Required when                             |
| --------------------------- | ------------------------------- | ----------------------------------------- |
| `@ac:<ID>`                  | `@ac:AC-12`                     | The test verifies an acceptance criterion |
| `@endpoint:<METHOD> <PATH>` | `@endpoint:DELETE /orders/{id}` | API spec                                  |
| `@page:<PageName>`          | `@page:CheckoutPage`            | UI spec                                   |
| `@feature:<feature>`        | `@feature:auth`                 | All specs (used for grouping)             |
| `@owner:<team>`             | `@owner:qa-platform`            | All specs                                 |

## Optional tags

- `@smoke` — runs against every env including prod.
- `@regression` — runs in nightly suite.
- `@external` — depends on an external service; CI may skip when unreachable.
- `@quarantine` — unstable; allowed for ≤ 2 sprints.
- `@dangerous` — never runs against prod.
- `@fuzz` — uses randomized input.

## How to tag

In Playwright, embed in the test title (matched by the `grep` and parsers):

```ts
test('cancel pending order @ac:AC-12 @endpoint:DELETE /orders/{id} @feature:orders @owner:qa-platform', async ({ ... }) => {
  /* ... */
});
```

For `describe` blocks, place tags at the describe level — they apply to all child tests:

```ts
test.describe('Order cancellation @feature:orders @owner:qa-platform', () => {
  /* ... */
});
```

## Validation

`scripts/validate-tags.ts` (in this skill) ensures:

- Every test has at least `@feature` and `@owner`.
- `@endpoint:` tags reference real endpoints from the OpenAPI spec.
- `@ac:` tags reference IDs that exist in `docs/test-design/*.md`.
- `@page:` tags reference real page-object class names.

Mismatches show up in the gap report.
