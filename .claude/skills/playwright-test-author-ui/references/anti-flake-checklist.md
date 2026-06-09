# Anti-flake checklist (UI)

Run mentally before merging any UI test. If any answer is "no", fix it.

## Determinism

- [ ] No `waitForTimeout`. Use web-first or `expect.poll`.
- [ ] No `setTimeout`/`setInterval` inside specs.
- [ ] All faker-generated data is seeded.
- [ ] Test does not depend on system time. Use `await page.clock.install()` if it must.
- [ ] Test does not depend on order — runs alone and in suite.

## Isolation

- [ ] Data setup via API + factory, not by clicking.
- [ ] Each test cleans up its own data (or fixture does).
- [ ] No global storage of `auth.json` mutated mid-suite.
- [ ] No shared mutable module state used across tests.

## Locators

- [ ] Selectors live in page objects, not specs.
- [ ] `getByRole` / `getByLabel` first. CSS/XPath only with justification.
- [ ] No `nth-child`, no `*:nth-of-type`.

## Assertions

- [ ] All assertions are web-first auto-retrying matchers.
- [ ] Soft assertions used to group related checks on the same state.
- [ ] No screenshot snapshots over dynamic content unless masked.

## Network

- [ ] External-service-dependent tests are mocked or marked `@external`.
- [ ] `page.route` handlers are unrouted before the test ends.
- [ ] No retry-on-5xx logic — let the test fail and surface the dependency issue.

## CI parity

- [ ] Test passes locally with `--workers=1` AND `--workers=4 --shuffle`.
- [ ] Test passes both headed and headless.
- [ ] Test passes on at least two browsers (chromium + firefox).
