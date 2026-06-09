# Trace Viewer cheatsheet

## Open a trace

```bash
npx playwright show-trace test-results/<dir>/trace.zip
# or open the HTML report and click any failed test → "Trace"
```

## What to look at, in order

1. **Last action before failure** — pick the red step. Its DOM snapshot is on the right. Compare expected locator vs actual DOM.
2. **Action timing** — was the action queued long before resolution? Likely actionability gate (visible/enabled/stable).
3. **Network tab** — last few requests. 4xx/5xx, slow responses, missing CORS.
4. **Console tab** — uncaught errors, deprecation warnings.
5. **Source tab** — the line that called the failing API.
6. **Snapshots side-by-side** — toggle "Before" and "After" of the failing step.

## Generate a richer trace

```bash
npx playwright test path/to/spec --trace on --video on --headed --workers=1
```

## Targeted trace for an investigation

```ts
test('investigate intermittent submit', async ({ page }, testInfo) => {
  await testInfo.attach('initial-html', { body: await page.content(), contentType: 'text/html' });
  // ... actions ...
});
```

## Common findings

- Element exists but is covered by a sticky header → `scrollIntoViewIfNeeded` or assert on `toBeInViewport`.
- Element re-renders mid-action → use `getByRole` (re-resolves) instead of `locator(...).nth(0)`.
- Animation hides the element briefly → `prefers-reduced-motion` env or wait for `transition-end`.
- Element resolves to 2 because a dialog and the main page share the same role/text → scope inside `getByRole('dialog')`.
