# Locator priority

A strict ordering. Use the first one that fits. Drop only with peer-review.

| Priority | Locator                                    | When                                              |
| -------- | ------------------------------------------ | ------------------------------------------------- |
| 1        | `getByRole('button', { name: 'Submit' })`  | Almost everything users interact with has a role. |
| 2        | `getByLabel('Email')`                      | Form fields with associated `<label>`.            |
| 3        | `getByPlaceholder('email@example.com')`    | Inputs without a label (legacy UI).               |
| 4        | `getByText('Welcome')`                     | Pure text targets (links, headings).              |
| 5        | `getByTestId('submit-cta')`                | Custom widgets where roles/text are insufficient. |
| 6        | `getByAltText('Avatar')`                   | Images.                                           |
| 7        | `getByTitle('Settings')`                   | Tooltips.                                         |
| 8        | `locator('[data-anything]')` / CSS / XPath | LAST RESORT. Justify in code review.              |

## Why role-first

- Reflects the user's mental model — clicks the same things screen readers do.
- Survives most refactors — class names change, ARIA roles rarely.
- Doubles as a basic accessibility check — if no role exists, the UI may have a real a11y issue worth surfacing.

## test-id contract

- Add `data-testid` only where role/text cannot disambiguate.
- Naming: `kebab-case`, scoped (`checkout-submit-cta`, not `submit`).
- Adding test-ids is a product change — propose in the PR description, not a unilateral commit.

## Locator composition

```ts
const row = page.getByRole('row', { name: 'Order #42' });
await row.getByRole('button', { name: 'Cancel' }).click();
```

Compose **inside** page-object methods, never in specs.

## Forbidden patterns

- `page.locator('div > .foo:nth-child(3)')` — brittle.
- `page.locator('text=...')` outside of `getByText` builder — legacy syntax.
- XPath that traverses ancestors — coupling to layout structure.
- Querying inside `waitFor` polling without `getBy*` semantics.
