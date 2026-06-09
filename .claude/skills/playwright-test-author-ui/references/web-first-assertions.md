# Web-first assertions

Web-first means: the assertion retries automatically until it passes or times out. No `waitFor`, no `sleep`.

## Use these (auto-retrying)

```ts
await expect(locator).toBeVisible();
await expect(locator).toHaveText('Hello');
await expect(locator).toHaveValue('user@example.com');
await expect(locator).toHaveCount(3);
await expect(locator).toBeEnabled();
await expect(locator).toBeChecked();
await expect(page).toHaveURL(/\/dashboard$/);
await expect(page).toHaveTitle('Dashboard');
```

## Avoid these (single-shot)

```ts
expect(await locator.textContent()).toBe('Hello'); // ❌ no retry
expect(await locator.isVisible()).toBe(true); // ❌ no retry
await page.waitForTimeout(2000); // ❌ blind sleep
await page.waitForSelector('.foo'); // ❌ legacy, prefer locator-based
```

## When you really need a poll

```ts
await expect
  .poll(
    async () => {
      const r = await ordersClient.getById(id);
      return r.data?.status;
    },
    { timeout: 10_000, intervals: [200, 500, 1000] },
  )
  .toBe('paid');
```

## Soft assertions

Group several checks on the same screen so one failure does not hide others:

```ts
await expect.soft(header.title).toHaveText('Dashboard');
await expect.soft(header.userMenu).toBeVisible();
await expect.soft(header.notifications).toHaveCount(2);
```

`expect.soft` failures are reported but do not abort the test until a regular `expect` fails.

## Tuning timeouts

- Per-action: `await locator.click({ timeout: 5000 })` — last resort.
- Per-test: `test.setTimeout(60_000)` for genuinely long flows.
- Globally tune `actionTimeout` and `navigationTimeout` in `playwright.config.ts`, never per-spec.
