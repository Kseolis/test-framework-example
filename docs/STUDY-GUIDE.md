# Study Guide — the project, from first principles

> A self-study companion for this repo, in the spirit of "learn by building intuition, not memorizing."
> Every question is answered from **this codebase** — the snippets are real, not illustrative.
> Read a question, try to answer it out loud before reading on, then check yourself against the snippet.

## How to use this

This guide exists because the fastest way to understand a codebase is to interrogate it: ask the
question an interviewer (or a curious colleague) would ask, then answer it from the actual code.
It is organised into four tracks. They build on each other, but you can enter anywhere.

1. **TypeScript & JavaScript syntax** — the language features the code leans on, and _why_ each one.
2. **Playwright & the test framework** — fixtures, locators, auto-waiting, assertions, config.
3. **Architecture & design patterns** — the layers, GRASP/SOLID, the patterns and their trade-offs.
4. **Tooling, CI & the AI-assisted kit** — the machines that keep the architecture from eroding.

A suggested path: skim Track 1 for the syntax you don't recognise, read Track 3 to get the shape of
the system, then Tracks 2 and 4 for the mechanics. The deep "why" behind the non-obvious workarounds
lives in [`ARCHITECTURE.md` §5](ARCHITECTURE.md); the project's hard constraints live in
[`CONSTRAINTS.md`](CONSTRAINTS.md).

The throughline of the whole project: **conventions are not prose, they are programs.** Almost every
rule here is enforced by a compiler flag, a linter, a validator, or a CI gate — so the architecture
is mechanical, not aspirational. Keep asking "what breaks if this rule weren't enforced?"

---

## 1. TypeScript & JavaScript syntax

Grounded in `tests/pages/*`, `tests/support/*`, `tests/factories/*`, `tests/infra/env.ts`, `tests/fixtures/*`, `tsconfig.json`.

### Q: What is an `abstract class` and why is `BasePage` one?

An abstract class is a class you can't instantiate directly — it's a _template_ that forces subclasses to fill in blanks.

```ts
// tests/pages/BasePage.ts
export abstract class BasePage {
  constructor(protected readonly page: Page) {}
  protected abstract readonly url: string;
  async goto(): Promise<void> {
    await this.page.goto(this.url);
  }
}
```

`new BasePage(page)` is a compile error. The contract is: "every page _has_ a `url`, but I (the base) don't know what it is — you must declare it." `goto()` is shared behaviour written once; `url` is the hole each page plugs.

**Why it matters:** common machinery (navigation, the reactive-fill helper) lives in one place while the compiler guarantees no concrete page can forget its own URL.

### Q: What does `protected abstract readonly url: string` mean, word by word?

Four orthogonal modifiers on one member: `abstract` (no value here; a subclass _must_ supply one), `protected` (visible to subclasses, not outside callers — a spec can't read `homePage.url`), `readonly` (assign once), `: string` (the type). All are compile-time-only and generate **zero** runtime code.

### Q: `constructor(protected readonly page: Page) {}` has an empty body. Where is `this.page` assigned?

It's a **parameter property** — putting an access modifier on a constructor parameter tells TS to declare the field _and_ assign it. It is exactly equivalent to declaring `protected readonly page: Page;` then `this.page = page;`. The empty `{}` is the giveaway.

### Q: Why are locators _getters_ (`private get emailField(): Locator`) instead of fields set in the constructor?

```ts
// tests/pages/PlanetConfigPage.ts
private get emailField(): Locator { return this.page.locator('#qa-input-email'); }
```

A getter is a method that _looks_ like a property — a function runs on each read. `page.locator(...)` builds a _lazy locator description_, not a live element. A getter re-derives the locator against the page's **current** DOM each access — exactly right for an SPA that re-renders between steps. Setting it once in the constructor would query before navigation.

### Q: `offerRadio(offer)` is a method but `submitButton` is a getter. What's the rule?

Parameterless locators are getters; argument-dependent locators are methods.

```ts
private offerRadio(offer: Offer): Locator { ... }   // needs input → method
private get submitButton(): Locator { ... }          // no input → getter
```

The syntax encodes intent: `this.submitButton` reads as "the one submit button"; `this.offerRadio(offer)` reads as "the radio _for this offer_."

### Q: `extends BasePage implements OfferLandingPage` — difference between `extends` and `implements`?

`extends` inherits _implementation_ (one base only). `implements` is a pure _type obligation_ — "I promise to have this shape" — and you can implement many. `extends BasePage` gives `goto()` and `page`; `implements OfferLandingPage` adds a compile check that `selectOffer`/`fillEmail`/`submit` exist with the right signatures. Because both landing pages implement the same interface, the flow function can treat them interchangeably.

### Q: How does `purchaseVpn` achieve Dependency Inversion, and what is "structural typing"?

```ts
// tests/support/purchase-flow.ts
export async function purchaseVpn(request: PurchaseRequest): Promise<void> {
  const { page, landing, payment, offer, method, email } = request;
  await landing.goto();
  await landing.selectOffer(offer);
  // ...
}
```

`purchaseVpn` depends on the _interfaces_ (`OfferLandingPage`, `PaymentStep`), never on concrete classes — high-level policy and low-level detail both depend on the same abstraction (the "D" in SOLID). **Structural typing** is why it works without ceremony: TypeScript decides compatibility by _shape_, not declared name. "If it has these four methods, it _is_ one."

### Q: Why string-literal unions (`type Offer = '2_days' | '1_month' | '1_year'`) over `string` or `enum`?

The only legal values are exactly those strings — a typo is a compile error, which `string` would accept silently. Unlike a TS `enum`, a literal union emits **no runtime code** and the values _are_ the strings the DOM expects (no `Offer.TwoDays` indirection). The cheapest possible "closed set."

### Q: What is `Record<Offer, string>` and what does it guarantee?

```ts
const radioIds: Record<Offer, string> = {
  '2_days': '#qa-radio-offer-2-days',
  '1_month': '#qa-radio-offer-1-month',
  '1_year': '#qa-radio-offer-1-year',
};
```

`Record<K, V>` is "object with keys `K`, values `V`." Because `K` is the _union_, TS requires **every** member present — drop one and it won't compile. Add a fourth `Offer` and every `Record<Offer, …>` in the codebase lights up red until handled. Exhaustiveness via the type system.

### Q: What does `readonly Offer[]` do, and what about `as const`?

```ts
const EN_OFFERS: readonly Offer[] = ['1_month', '1_year'];
```

`readonly` arrays may be iterated but not mutated (`.push` is a compile error) — a contract of intent for test-data tables. `as const` goes further (freezes an array into a tuple of literal types); here a `readonly Offer[]` annotation suffices because the element type is already the literal union.

### Q: How do generics flow types through `Factory.define<User>(...)`?

```ts
export const userFactory = Factory.define<User>(({ sequence }) => { ... return { email, password, firstName, lastName }; });
```

`<User>` pins two things at once: the builder's return must be assignable to `User` (forget `password` → compile error), and `userFactory.build()` is typed `User` so `user.email` autocompletes at the call site. One generic threads the type from interface → factory body → consumer.

### Q: What is `z.object(...)` in `env.ts`, and how is it "a type and a validator at once"?

```ts
const schema = z.object({
  BASE_URL_FREEVPN: z.string().url().default('https://freevpnplanet.com/'),
  SEED: z.coerce.number().int().nonnegative().default(1234),
  CI: z.string().optional(),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.format());
  process.exit(2);
}
export const env = parsed.data;
```

Zod is a _runtime_ schema that also _carries_ a static type. `env.SEED` is statically a `number` (via `z.coerce.number()` parsing the env string) and _verified_ to be one at startup. `process.env` is the classic typed/untyped boundary; zod is the single checkpoint — `safeParse` returns a result object instead of throwing, and the program exits early with a readable report.

### Q: Why `import type { Locator, Page }` instead of a plain import?

`import type` says "needed only as types — erase the whole statement from emitted JS." `Locator`/`Page` are interfaces with no runtime existence, so a normal import could leave a dead import behind. It's also required to play well with `isolatedModules` (set in this tsconfig), where each file is transpiled alone.

### Q: Why is every page method `async` returning `Promise<void>`?

Browser automation is inherently asynchronous; `async` lets you `await` each step so they run in order. `Promise<void>` means "resolves with no value." This is the spine of the suite — forget an `await` and the test races ahead of the browser (the #1 flake source), which the lint config also flags as a floating promise.

### Q: Walk through `field.evaluate((node, value) => {...}, value)` — what crosses the browser/Node boundary?

```ts
// tests/pages/BasePage.ts
protected async fillReactively(field: Locator, value: string): Promise<void> {
  await field.evaluate((node, text) => {
    const input = node as HTMLInputElement;
    input.value = text;
    for (const eventType of ['input', 'change', 'blur']) {
      input.dispatchEvent(new Event(eventType, { bubbles: true }));
    }
  }, value);
}
```

`evaluate` ships the **callback to run inside the browser page**, not in Node. The two are separate processes with separate memory, so the callback _cannot_ close over `value` from Node scope — it must be passed as the **second argument**, serialized (structured-clone), and received as `text` on the other side. That boundary is the whole reason for the two-argument shape: anything the in-browser code needs must be an explicit serializable argument (a `Locator` or function won't serialize).

### Q: Why `const input = node as HTMLInputElement`?

`evaluate`'s callback receives `node` typed as the generic `Element` — Playwright can't know which element your locator resolved to. `.value`/`.checked` only exist on `HTMLInputElement`, so the `as` **type assertion** tells the compiler "trust me." It's a compile-time claim with no runtime check, justified because the page object's selector guarantees the element type.

### Q: How does `choosePaymentMethod` narrow the union with a discriminating `if`?

```ts
async choosePaymentMethod(method: PaymentMethod): Promise<void> {
  if (method === 'crypto') { await this.cryptoPicker.click(); await this.cryptoOption('BTC').click(); return; }
  await this.toggleHiddenControl(this.gatewayRadio(method));
}
```

Inside `if (method === 'crypto')` TS narrows `method` to `'crypto'`; the early `return` means that after the block `method` is narrowed to `'card_ru' | 'stripe'` — exactly what `gatewayRadio(gateway: 'card_ru' | 'stripe')` accepts, with no cast. Control-flow analysis subtracts the handled case; the `return` does double duty.

### Q: Break down the regexes in `payment-boundary.ts`.

```ts
if (!/^https?:\/\//i.test(currentUrl)) return false;
if (/\/(failed|fail|error|declined)\b/i.test(currentUrl)) return false;
return /[?&]gateway=[^&]+/.test(currentUrl);
```

- `/^https?:\/\//i` — `^` start; `https?` = http with optional s; `\/\/` two literal slashes (escaped); `i` case-insensitive.
- `/\/(failed|fail|error|declined)\b/i` — a slash, a failure word, then `\b` a **word boundary** so `/failed` matches but `/failsafe` doesn't (the load-bearing subtlety).
- `/[?&]gateway=[^&]+/` — `?` or `&`, literal `gateway=`, then `[^&]+` (one-or-more non-`&`) for the value.

Regex literals are first-class JS — `/.../.test(str)` returns a boolean, no `new RegExp`.

### Q: Why `15_000`, and what's the template literal in the factory?

`15_000` uses a **numeric separator** (underscore ignored by the engine, grouping for humans). The factory uses a **template literal** to interpolate inline: `` `${localPart}@${SYNTHETIC_EMAIL_DOMAIN}` ``. Both are zero-cost legibility; the template literal also produces distinct test titles per data-driven case.

### Q: What's `value.toLowerCase().replaceAll(/[^a-z0-9]+/g, '.').replaceAll(/(^\.|\.$)/g, '')`?

A concise **arrow function** chaining string methods into a pipeline. `[^a-z0-9]+` matches runs of non-alphanumerics (collapsed to one `.`); the `g` flag is required by `replaceAll` with a regex; `(^\.|\.$)` strips a leading/trailing dot. It turns a name into a safe email local-part.

### Q: Why `for…of` and indexed `for` instead of `forEach`?

```ts
for (const eventType of ['input', 'change', 'blur']) { input.dispatchEvent(...); }   // values
const total = await this.consentCheckboxes.count();
for (let index = 0; index < total; index++) { await this.toggleHiddenControl(this.consentCheckboxes.nth(index)); }  // await + index
```

You **cannot reliably `await` inside `Array.prototype.forEach`** — its callback is fire-and-forget, so the loop won't pause and the test races. A `for` loop with `await` runs async steps strictly in sequence. A correctness reason, not style.

### Q: What does `"type": "module"` change?

It flips the package to **ES Modules**: `import`/`export` everywhere (matching the tsconfig's `"module": "ESNext"`). ESM is statically analyzable — imports resolve before run, enabling tree-shaking and the type-only erasure of `import type`.

### Q: How do path aliases like `@support/*` and `@infra/env` work?

```json
// tsconfig.json
"baseUrl": "./",
"paths": {
  "@pages/*": ["tests/pages/*"],
  "@fixtures": ["tests/fixtures/index.ts"],
  "@infra/*": ["tests/infra/*"],
  "@support/*": ["tests/support/*"]
}
```

Two flavours: wildcard (`@infra/env` → `tests/infra/env`) and bare (`@fixtures` → the _barrel_ `index.ts`). Aliases make imports location-independent and let each layer present one import surface (`@fixtures`, `@factories`), enforcing architectural boundaries.

### Q: What's a "barrel" file, and what does the fixtures/factories `index.ts` accomplish?

```ts
// tests/fixtures/index.ts
export const test = mergeTests(pagesTest);
export { expect } from '@playwright/test';
```

A barrel re-exports a module's public surface so consumers import from one path. A spec writes `import { test, expect } from '@fixtures'` and gets a `test` already extended with all page fixtures. The barrel is the seam: internal layout can change as long as exports stay stable.

### Q: `"strict": true` is on — what do the _extra_ strict flags catch?

- `noUncheckedIndexedAccess` — array indexing adds `| undefined`, forcing a check. A `Record<Offer, string>` lookup stays `string` (known key, not open index) — which is exactly why the Record-over-union pattern is safe under this flag.
- `exactOptionalPropertyTypes` — distinguishes "key absent" from "key present, value `undefined`."
- `noImplicitOverride` — overriding a base method needs the `override` keyword.
- `noFallthroughCasesInSwitch` — a `case` without `break`/`return` is an error.

These close the gaps that survive plain `strict`.

### Q: Why does `PaymentMethodsPage` assign `url` in the constructor while others assign inline?

```ts
protected readonly url: string;
constructor(page: Page, origin: PaymentMethodsOrigin) {
  super(page);
  this.url = new URL('payment/', ORIGIN_BASE_URL[origin]).toString();
}
```

Its URL _depends on a constructor argument_, so it can't be an inline initializer — it's computed after `super(page)` and assigned to the `readonly` field (the constructor counts as the one allowed assignment). `new URL(path, base)` is the WHATWG constructor: it joins origin + path correctly regardless of trailing slashes — the right, concatenation-free way to compose URLs.

---

## 2. Playwright & the test framework

Mental model: a Playwright test is a function that receives **fixtures** (DI'd by name), drives the browser through **locators** (lazy queries) via **auto-waiting actions** and **retrying assertions**.

### Q: What does `base.extend<PageFixtures>()` do, and what is `PageFixtures`?

```ts
// tests/fixtures/pages.ts
type PageFixtures = {
  homePage: HomePage;
  /* … */ paymentMethodsPageFor: (origin: PaymentMethodsOrigin) => PaymentMethodsPage;
};
export const pagesTest = base.extend<PageFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  } /* … */,
});
```

`.extend` returns a _new_ test object that knows extra fixtures; `PageFixtures` is the type contract (name → type) so DI is type-checked. Fixtures are **lazy** — a fixture's setup runs only if a test (or another fixture) names it. A spec asking only for `signupPage` never constructs `HomePage`.

### Q: Explain `async ({ page }, use) => { await use(...) }` line by line.

A fixture takes its **dependencies** (other fixtures, destructured) and a **`use` callback**. Everything **before** `await use(value)` is setup; the test body runs **during** the awaited call; everything **after** is teardown. Same shape as a context manager / `try…finally`.

### Q: Why `await use(...)` instead of `return new HomePage(page)`?

`return` ends the function — no place for teardown, and Playwright couldn't keep the fixture alive for the test's duration. `await use(value)` _blocks_ until the test (and dependents) finish, then resumes for cleanup, which runs even when the test fails. The single most important fixture idiom.

### Q: What is `mergeTests` and why route everything through `@fixtures`?

```ts
export const test = mergeTests(pagesTest);
```

`mergeTests` combines multiple `extend`-ed tests into one carrying all their fixtures. Specs never import `@playwright/test` directly; add an `apiTest`/`authTest` later and you change one line — every spec gains the fixtures with no edits. Composition over a god-fixture-file.

### Q: How does a fixture get injected, and how does Playwright know which to build?

By **destructuring argument name** — names pulled from the first argument are matched to registered fixtures; only those are instantiated. Name-based DI, pay-for-what-you-use. The parameter list _is_ the dependency manifest.

### Q: What's special about `paymentMethodsPageFor` — a fixture that returns a function?

```ts
paymentMethodsPageFor: async ({ page }, use) => { await use((origin) => new PaymentMethodsPage(page, origin)); },
```

`PaymentMethodsPage` needs a runtime `origin` the fixture can't know, so the fixture resolves to a **factory function** instead of an instance — a lazy curried constructor that closes over `page` while the spec supplies `origin` (`paymentMethodsPageFor('planetconfig')`). The idiomatic way to parameterize a page object.

### Q: Locators are "lazy" — what does that mean?

A `Locator` is a _description of how to find an element_, not the element. Nothing happens at creation; the DOM is queried only on act/assert. So a locator survives re-renders (build it before the element exists, then `toBeVisible()` waits) — unlike `querySelector`, which snapshots a node that can go stale.

### Q: When does the repo use `getByRole`/`getByLabel`/`getByPlaceholder` vs raw CSS?

Semantic, user-facing locators for human-meaningful controls; CSS/ID where the app exposes stable hooks or non-semantic widgets.

```ts
get nextButton(): Locator { return this.page.getByRole('button', { name: 'Next' }); }   // semantic
private get emailField(): Locator { return this.page.locator('#qa-input-email'); }        // app QA hook
return this.page.locator(`input[type="radio"][name="gateway"][value="${gateway}"]`);     // non-semantic radio
```

`getByRole`/`getByLabel` couple to _accessible semantics_ (most stable, doubles as an a11y check); CSS is the fallback for elements with no accessible name.

### Q: Why `.first()` on the Log In link?

`getByRole('link', { name: 'Log In' })` matches more than one element; acting on an ambiguous locator throws a **strict-mode violation**. `.first()` is the explicit "there are several, I want the first" — better than loosening the selector and risking the wrong element.

### Q: Why don't `.click()`/`.fill()` need manual waits? What is "actionability"?

Every action auto-waits for the element to be attached, visible, stable, enabled, and event-receiving (up to `actionTimeout: 10_000`). That's why the refactor **dropped manual `toBeEnabled()` waits before clicks** — redundant and slower. The one kept assertion, `expect(nextButton).toBeDisabled()`, is there because disabled-ness is the _thing under test_, not a precondition.

### Q: Where does the repo wait explicitly, and why is it legitimate?

```ts
await this.planToggle.waitFor({ state: 'visible' }); // render gate (SPA hydration)
await page.waitForURL(/\/payment\//); // navigation gate
```

Both wait on a _condition_, never a fixed duration, so the "no `page.waitForTimeout`" rule holds. `waitForURL` is the correct way to bridge a multi-page flow — proceed only once the URL proves the payment page loaded.

### Q: What makes web-first assertions different from a plain `expect(value)`?

`expect(locator)` / `expect(page)` **retry** until the predicate passes or times out; a plain `expect(jsValue)` checks once. So `await expect(page).toHaveURL(/login/)` after a click _is_ the synchronization — no explicit wait needed. The `await` is mandatory; these return promises.

### Q: Why `expect.poll(...)` for the payment-boundary oracle instead of `toHaveURL`?

```ts
await expect
  .poll(() => reachedPaymentProvider(page.url(), PLANETCONFIG_ORIGINS), {
    timeout: PAYMENT_BOUNDARY_TIMEOUT,
  })
  .toBe(true);
```

Success isn't "URL equals X" — it's a _predicate over the URL_ (left source origin, OR stayed with a `gateway=` param, AND not a failure path). `expect.poll` retries an arbitrary function with assertion semantics. The oracle stays pure and unit-testable (no `page` inside); `toHaveURL` can't express "any origin that isn't ours, excluding error pages."

### Q: Explain the `page.evaluate` escape hatch. Why bypass `.fill()`/`.check()`?

Some inputs are **visually hidden** (custom-styled radios/checkboxes, JS-driven fields) and fail actionability — Playwright refuses to click an invisible control. So `BasePage` sets the DOM property directly and **dispatches the events the app's listeners expect** (`input`/`change`/`blur`). Setting `.value`/`.checked` alone is invisible to a reactive framework; the dispatched events make its state update. **When NOT to use it:** any visible standard control — there `fill()`/`check()`/`click()` exercise the real event path _and_ validate actionability. Note `PersonalFreeVpnPage.fillEmail` uses plain `.fill()` (visible input) while `SignupPage.fillEmail` uses `fillReactively` (controlled input).

### Q: How is the browser matrix configured?

```ts
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
],
```

Three projects, one per engine; with no `--project` filter every test runs on all three. `devices[...]` sets viewport/UA/engine in one spread. Projects are also the unit of selective execution.

### Q: Why no `baseURL`?

The suite spans three origins, so a single `baseURL` can't serve them. URLs are derived per-page from validated env (`new URL('order/', env.BASE_URL_ACCOUNT)`), satisfying the "no inline `process.env`" rule, and `PaymentMethodsPage` picks its base from a `Record<origin, url>` map.

### Q: What is `testIdAttribute: 'data-testid'`, and the subtle gotcha here?

It makes `getByTestId('x')` look for `data-testid="x"`. But the app's own hooks are `data-test-id` (hyphenated) and `#qa-*` ids, which the pages target via explicit `locator(...)` — so `getByTestId` isn't actually used for those. An interview-grade observation: the configured attribute and the app's attribute differ by a hyphen.

### Q: Walk through reporters and the retry/trace/video/screenshot policy.

```ts
retries: 2,
reporter: [['list'], ['html', {...}], ['json', {...}], ['junit', {...}]],
use: { trace: 'on-first-retry', screenshot: 'only-on-failure', video: 'retain-on-failure' },
```

`list` for console, `html` for triage, `json`+`junit` for CI ingestion. `trace: 'on-first-retry'` captures a full timeline only after one failure (cheap on green runs, rich when needed); screenshots/videos kept only on failure to bound artifact size. The CONSTRAINTS §2.6 defaults for flaky external sites.

### Q: How does worker scaling differ local vs CI?

```ts
const isCI = !!process.env.CI;
forbidOnly: isCI,
...(isCI ? { workers: '50%' as const } : {}),
```

CI caps workers to 50% of cores (browsers are RAM-hungry; over-subscription causes timeout-flakes) and `forbidOnly` fails the build on a stray `test.only`. The spread idiom omits the key locally so the default applies.

### Q: How do tags and `--grep` work?

Tags are just substrings in titles (`@smoke`, `@ru`, `@en`); `--grep` filters by regex over the full (describe + test) title. Tags compose — `@smoke @ru` is selected by either `--grep @smoke` or `--grep @ru`. No special API, just disciplined titles.

### Q: How are data-driven tests generated, and what's the gotcha?

```ts
for (const offer of EN_OFFERS) for (const method of EN_METHODS) {
  test(`@en reaches the payment boundary for ${offer} via ${method}`, async ({...}) => {...});
}
```

Plain `for` loops calling `test(...)` with interpolated titles generate 4 distinct tests — each gets its own retry/trace/report row, so a failure points at the exact `offer×method`. **Gotcha:** the loop runs at collection time (module load), so titles must be unique — the interpolation guarantees it.

### Q: What does `test.fixme` do, and the empty-body warning concern?

```ts
test.fixme('@ru crypto gateway is not exposed on planetconfig.com — see docs/ux-findings.md', async () => {});
```

`test.fixme` registers a test but marks it skip/expected-broken — it won't run. It documents a real product gap _as code_ with a pointer to the findings doc, honouring "quarantine, don't silently skip." Because the body never executes, the `expect-expect` lint rule (test with no assertion) doesn't fire — a normal empty `test()` would warn.

### Q: How does the suite stay deterministic against a _live_ third-party site?

Three layers: unique synthetic data per run (Fishery `sequence` → no collision across the parallel matrix), a _tolerant_ boundary oracle (asserts a class of acceptable outcomes, not a brittle exact URL), and `retries: 2`. A live site can't be reset, so each test fabricates a unique `@yopmail.com` email and asserts "reached a provider." **CI is the authoritative verdict** — full matrix, controlled concurrency, diagnostics captured only when a retry was needed.

---

## 3. Architecture & design patterns

### Q: What are the six layers, and what does the import graph look like?

```
specs/  ──>  fixtures/ ──> pages/, factories/
specs/  ──>  support/
pages/  ──>  support/, infra/
factories/ ──> infra/
```

| Layer        | Responsibility                                      | Must not                                               |
| ------------ | --------------------------------------------------- | ------------------------------------------------------ |
| `infra/`     | zod-validated env, cross-cutting helpers            | import any layer above                                 |
| `support/`   | pure orchestration: `purchaseVpn` + boundary oracle | import concrete pages; contain `expect`                |
| `pages/`     | verb actions over private locators                  | contain `expect`; import specs                         |
| `factories/` | deterministic synthetic data                        | network, `Date.now`, `Math.random`, top-level mutables |
| `fixtures/`  | compose pages + factories into injected deps        | hold business logic                                    |
| `specs/`     | the AAA tests                                       | inline locators, raw fetch, `waitForTimeout`           |

**Trade-off:** a reverse import is a _build failure_ (enforced by `tools/validate-layout.sh`). The cost is ceremony — you can't reach "up," so shared logic must be pushed _down_ where every consumer sees it. That pressure is the point (the Acyclic Dependencies Principle).

### Q: Why forbid reverse imports — isn't TS fine with cycles?

TS compiles cycles fine; the ban is about _dependency direction as a design invariant_. If `pages/` could import `specs/`, a page would couple to a scenario and stop being reusable. Downward-only means lower layers know nothing about consumers and stay generic.

### Q: Why no `api/`, `clients/`, or `generated/` layer?

Black-box UI E2E with no API contract under the team's control (CONSTRAINTS §2.1) — those layers were deleted rather than carried as empty scaffolding. YAGNI at architecture scale. The OpenAPI skills remain _committed but disabled_ (CONSTRAINTS §4) because the kit is a reusable template.

### Q: Show the canonical Page Object. What's the convention?

```ts
export class HomePage extends BasePage {
  protected readonly url = env.BASE_URL_FREEVPN;
  private get logInLink(): Locator {
    return this.page.getByRole('link', { name: 'Log In' }).first();
  }
  async clickLogIn(): Promise<void> {
    await this.logInLink.click();
  }
}
```

Locators **private**; public methods **verbs**. A spec speaks user intent, not CSS — when the DOM changes, only the private getter changes; the verb method and every calling spec stay untouched.

### Q: Why no `expect` in any page object?

A page models _what the user can do_, not _what should be true_. Putting `expect` in a page bakes one scenario's success criteria into a reusable component and produces stack traces far from the test that cares. Separating _action_ (page) from _judgment_ (spec) lets the same `fillEmail` serve happy-path, negative, and boundary tests. Enforced by `validate-layout.sh`.

### Q: GRASP — Information Expert. Example?

`PaymentMethodsPage` owns the gateway-vs-crypto locators, so it owns `choosePaymentMethod`'s branching. The expert in the markup is the class that holds it; if the spec branched, it would need the locators, breaking encapsulation.

### Q: GRASP — Pure Fabrication & Indirection. What is `support/purchase-flow.ts`?

`purchaseVpn` is a fabricated coordinator (not a page/spec/entity) that sequences a multi-page flow, and provides indirection so the RU and EN specs share one flow instead of copy-pasting five page calls. One named, testable seam.

### Q: GRASP — Low Coupling / High Cohesion. How does `purchaseVpn` stay decoupled?

It depends on two narrow interfaces it declares itself (`OfferLandingPage`, `PaymentStep`) — zero concrete coupling to `pages/`. Each interface is one screen's cohesive contract; structural typing (`implements`) catches drift at compile time.

### Q: SOLID — Dependency Inversion. Why does it dedupe the RU/EN twin?

`PlanetConfigPage` (RU) and `PersonalFreeVpnPage` (EN) have wildly different selectors but both `implements OfferLandingPage`. `purchaseVpn` depends on the interface; the spec injects whichever page. Swap `planetConfigPage` for `personalFreeVpnPage` and the flow is reused verbatim. Policy written once; also testable with a fake `OfferLandingPage` and no browser.

### Q: SOLID — Open/Closed & Liskov here?

Open/Closed: a third locale site = a new class implementing the interface; `purchaseVpn` is closed to modification, open to extension. Liskov: any `OfferLandingPage` is substitutable because the contract is honest — `PersonalFreeVpnPage.fillEmail` uses native `.fill()` while `SignupPage.fillEmail` uses `fillReactively`; same contract, different mechanism, which LSP permits.

### Q: The Oracle pattern — why a pure function, not a "PaymentRedirectPage"?

```ts
export function reachedPaymentProvider(
  currentUrl: string,
  sourceOrigins: readonly string[],
): boolean {
  if (!/^https?:\/\//i.test(currentUrl)) return false;
  if (/\/(failed|fail|error|declined)\b/i.test(currentUrl)) return false;
  const stillOnSource = sourceOrigins.some((o) => currentUrl.startsWith(o));
  if (stillOnSource) return /[?&]gateway=[^&]+/.test(currentUrl);
  return true;
}
```

A redirect target isn't a page the suite drives — it has no actions, only a verdict; modelling a verdict as a page object is a category error (the old `PaymentRedirectPage` "masqueraded as a page"). A pure oracle is trivially unit-testable, deterministic, free of timing, and composes with `expect.poll`. The success definition lives in a tested regex rather than an un-testable page.

### Q: Why the special `gateway=` check when "stayed on our origin"?

Some flows redirect off-origin to a PSP (`*.stripe.com` → success outright); others stay in-house rendering an in-page invoice carrying `?gateway=…`. The function encodes both, and either way a `/failed|error|declined` URL is failure. Real, messy boundary semantics in one place.

### Q: Factory pattern — what makes it a factory, not an object literal?

```ts
export const userFactory = Factory.define<User>(({ sequence }) => {
  const localPart = `${toEmailSlug(firstName)}.${toEmailSlug(lastName)}.${sequence}`;
  return {
    email: `${localPart}@${SYNTHETIC_EMAIL_DOMAIN}`,
    password: `${faker.internet.password({ length: 16 })}A1!`,
    firstName,
    lastName,
  };
});
```

Centralized construction: the slug rule, the `A1!` complexity suffix, and the synthetic domain live in one place; the `sequence` guarantees uniqueness. Specs call `userFactory.build()`, never hand-write literals. CONSTRAINTS §2.4 mandates clearly-fake local parts — the factory enforces it.

### Q: Determinism — how is Faker seeded, and why does it matter for live-site E2E?

```ts
faker.seed(env.SEED); // _seed.ts, runs once at import; SEED defaults to 1234
```

Same seed → same data every run. Against sites you can't reset, determinism makes failures reproducible and collisions predictable. `tools/factory-rules.ts` forbids `Date.now`/`Math.random`/top-level mutables to protect it; the `sequence` suffix + disposable `@yopmail.com` avoid backend collisions.

### Q: Why `@yopmail.com`, not `@example.test`?

The sites do server-side MX validation and route reserved RFC TLDs (`.test`) to `/payment/failed/`. yopmail has valid MX and accepts any local-part. A "correct" reserved-TLD address silently broke the flow — a finding (`ux-findings.md` item B) turned into a config decision (`SYNTHETIC_EMAIL_DOMAIN`).

### Q: YAGNI in the factory — what was removed?

`User` is exactly four fields — the minimal set the flows touch. No transient params, no traits, no association helpers (Fishery supports them; nothing needs them yet). Add a field when a flow actually needs it, not speculatively.

### Q: DRY/KISS/YAGNI — name the concrete moves.

(1) RU+EN orchestration deduped into one `purchaseVpn` behind interfaces. (2) `PaymentMethodsPage` serves both origins via a constructor arg + `ORIGIN_BASE_URL` map, not two classes. (3) `PaymentRedirectPage` plus the `api/clients/generated/components/data` layers deleted as dead scaffolding. "No helper-class zoo" — no `Utils`, no `PaymentHelper`, no hierarchy beyond `BasePage`. **Trade-off:** one parametrized payment class bets RU and personal won't diverge sharply; if they do, it splits again.

### Q: Self-documenting code, no comments — how is intent carried, and where did the "why" go?

The names carry it: `fillReactively` ("this typing must trigger the framework's reactivity"), `toggleHiddenControl` ("this input is hidden, drive it programmatically"). The load-bearing _why_ (PrimeVue enables buttons only after `input`+`change`+`blur`; radios sit outside the viewport behind styled cards) lives in `ARCHITECTURE.md §5`. Names answer "what/why-at-a-glance"; the doc answers "why this exact event chain." Comments rot next to changing code; a name and a doc survive.

### Q: Config-as-validation — how does the zod env loader fail fast?

```ts
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.format());
  process.exit(2);
}
export const env = parsed.data;
```

Every page imports `env`, so a bad `BASE_URL_*` blows up at import, before a browser launches — fail-fast vs a cryptic mid-test navigation error. `process.exit(2)` is blunt but correct for config errors: no recovery, loudest signal.

### Q: The payment-boundary "hard stop" — what's the constraint and why non-negotiable?

CONSTRAINTS §2.3: every payment test STOPS where a real payment would initiate and NEVER submits card/crypto/OTP/3DS data — even Stripe test cards. Enforced structurally: the oracle never inspects card forms, the flow ends at "select a method," and the spec only polls a URL. These are third-party sites the team doesn't own (§1) — paying would trigger real charges/fraud signals/ToS issues. **Trade-off:** the suite can't verify the _actual_ payment succeeds (a real coverage gap), but for someone else's payment rails, stopping at the boundary is the only responsible design.

### Q: How does the `@ru`/`@en` split interact with the architecture?

CONSTRAINTS §2.5 forbids mixing locales per test and mandates tags for `--grep`. The _shared_ `purchaseVpn` is locale-agnostic — the split lives in the specs and the injected page, not the flow. DIP buys the dedup; the tag/describe convention preserves the locale separation. Two orthogonal concerns: behaviour shared, classification per-spec.

### Q: Why is the fixture layer so thin?

```ts
export const test = mergeTests(pagesTest);
export { expect } from '@playwright/test';
```

`mergeTests` is the composition seam — future fixture groups merge here without touching specs. Thinness satisfies "fixtures hold no business logic" (they only construct + inject); `tools/fixture-rules.ts` checks every fixture calls `await use(...)`.

---

## 4. Tooling, CI & the AI-assisted kit

First principle: **conventions are programs.** Every rule in `CLAUDE.md`/`CONSTRAINTS.md` has a machine that fails the build when broken. Keep asking "what breaks if this weren't enforced?"

### Q: Why a flat ESLint config, and how is it assembled?

```js
export default tseslint.config(
  { ignores: ['node_modules/**', 'tests/api/generated/**', '.husky/_/**', '.claude/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['tests/**/*.ts', 'playwright.config.ts'], plugins: { playwright }, rules: {...} },
  { files: ['tests/factories/**/*.ts'], rules: {...} },
);
```

ESLint 9 dropped `.eslintrc` cascades for a flat array, evaluated top-to-bottom, last-match-wins. `tseslint.config(...)` is a typed identity wrapper. Order matters: global ignores, base JS, TS recommended, then _narrowing_ per-glob overrides. A linear pipeline with no hidden inheritance.

### Q: Why ignore `.claude/**` and `tests/api/generated/**`?

`.claude/**` is the kit — skill templates and deliberately-broken example code; linting it flags intentional anti-patterns. `tests/api/generated/**` is machine-generated. A linter that screams about files you can't touch trains people to ignore it.

### Q: What do the SDET `no-restricted-syntax` rules forbid, and why AST selectors over regex?

```js
{ selector: "CallExpression[callee.object.name='page'][callee.property.name='waitForTimeout']", message: '...use expect.poll' },
{ selector: "ImportDeclaration[source.value='axios']", message: '...use the typed client' },
```

The selector matches the _parsed shape_, not text, so it won't false-positive on a comment or string. Hard waits are the #1 flake source; raw `axios` bypasses the typed client. Banning at parse-time means "won't lint," not "flaky at 2am."

### Q: How are factories kept pure by ESLint, and why?

```js
'no-restricted-globals': ['error', { name: 'fetch', ... }],
'no-restricted-properties': ['error', { object: 'Date', property: 'now', ... }, { object: 'Math', property: 'random', ... }],
```

Factories build _data_, not side effects. `Date.now()`/`Math.random()` silently destroy the `SEED=1234` determinism; network calls turn data-construction into an integration test.

### Q: Why is `expect-expect` a `warn` but `no-wait-for-timeout` an `error`?

Hard waits, `test.only` (`no-focused-test`), and un-awaited assertions (`missing-playwright-await`) are _always wrong_ → errors. `expect-expect` (no assertion) is _usually_ wrong but has valid exceptions (assertion inside a page method / a `fixme`) → warning. Severity signals confidence; over-erroring teaches people to `eslint-disable`.

### Q: What does Prettier own vs ESLint?

Prettier owns _formatting_ (`singleQuote`, `printWidth: 100`, `trailingComma: all`, `endOfLine: lf`); ESLint owns _correctness/anti-patterns_. No overlap — formatting never blocks on taste, ESLint never re-implements a formatter. `npm run format:check` is the read-only CI gate.

### Q: What runs on `git commit`, in what order?

```sh
# .husky/pre-commit
npx --no-install lint-staged || exit 1
bash tools/validate-layout.sh || exit 1
npx --no-install tsx tools/lint-ui-spec.ts || exit 1
```

`lint-staged` runs `eslint --fix` + `prettier --write` on _staged_ files (fast); then the two architecture gates run repo-wide (cheap grep/regex — a violation in an untouched file is still a broken build). `--no-install` fails loudly if a tool is missing. Then `.husky/commit-msg` validates the message.

### Q: How are Conventional Commits enforced, and why bother?

`.husky/commit-msg` greps the subject against `^(feat|fix|docs|…)(\(scope\))?!?: .{1,100}$`, letting merge/revert/fixup through. A parseable history enables changelogs, semver, and `git log` filtering — enforced client-side so history is uniformly clean, via a one-line regex (no commitlint dependency).

### Q: What does each `tools/` validator enforce?

| Script               | Enforces                                                                                                                          | Exit  |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `validate-layout.sh` | specs don't import `pages/*/locators`; `BasePage` no `expect`; `*Page` only under `tests/pages/`; no raw `axios`/`fetch` in specs | 0/1/2 |
| `lint-ui-spec.ts`    | per-line: `waitForTimeout`, `xpath=`, axios, `console.log`, `setTimeout`, inline `new XxxPage(page)`                              | 0/1/2 |
| `factory-rules.ts`   | purity: no `fetch`/`axios`, no `Date.now()`/`Math.random()`, no top-level `let`, no factory inheritance                           | 0/1   |
| `fixture-rules.ts`   | every fixture `await use(...)`; no Playwright-builtin name collisions; scope sanity                                               | 0/1   |

ESLint warns the author; these _fail the pipeline_ — the redundant, language-agnostic backstop (`validate-layout.sh` is plain grep, runs even if `node_modules` is broken).

### Q: Why does `lint-ui-spec.ts` have three exit codes?

```ts
if (blockerCount > 0) process.exit(2);
if (majorCount > 0) process.exit(1);
process.exit(0);
```

`waitForTimeout`/`axios` are blockers (2); `xpath`/`setTimeout`/inline page construction are major (1); `console.log` is minor (0, prints but passes). Encoding severity in the _exit code_ lets each caller (pre-commit vs CI) choose its tolerance — mirrors the ESLint error/warn split.

### Q: How is `tests-config.json` the "single source of layout truth"?

Every validator reads paths from it (`cfg.layout.factories`), TS via `JSON.parse`, shell via `jq` with a hardcoded fallback. Change the layout once and every gate, skill, and the CLAUDE.md contract follow — no second place to forget.

### Q: How are validators wired into the three enforcement points?

```json
"validate": "bash tools/validate-layout.sh && tsx tools/factory-rules.ts && tsx tools/fixture-rules.ts && tsx tools/lint-ui-spec.ts"
```

Pre-commit runs the two fast gates; CI runs the full `npm run validate` on one leg; devs run it locally. The `&&` chain short-circuits so you fix one class at a time.

### Q: npm scripts vs Makefile?

`package.json` has the primitives (`test`, `test:smoke`, `typecheck`, `validate`, `verify`…); the `Makefile` is a self-documenting front door (`make help` greps `## ` descriptions). `make lint` is _broader_ than `npm run lint` — it bundles typecheck + format:check to match the CI gate.

### Q: Why `tsc --noEmit`?

Playwright transpiles via esbuild, which _strips types without checking them_ — a type error won't fail a run. `tsc --noEmit` does a full type check and emits nothing, making "does it type-check" a first-class CI gate.

### Q: What is `verify.sh` vs `validate`?

`verify` is a repo _health_ check (tooling present, required files, kit integrity, no committed `.env`), wrapped `|| true` so it never blocks, with `check` (hard) vs `softcheck` (warn) levels. `validate` answers "is the _code_ well-structured"; `verify` answers "is the _environment_ set up." Different questions, different audiences.

### Q: How is the CI matrix structured, and why `fail-fast: false`?

```yaml
strategy: { fail-fast: false, matrix: { project: [chromium, firefox, webkit] } }
```

Three parallel legs; a webkit failure doesn't kill chromium. For black-box tests against real sites, cross-browser differences are exactly what you want to catch — and you want the full picture of _which_ browsers broke.

### Q: How are Playwright browsers cached, and why key by lockfile hash + project?

```yaml
key: playwright-${{ runner.os }}-${{ matrix.project }}-${{ hashFiles('package-lock.json') }}
```

The browser version is pinned by `@playwright/test` in the lockfile, so hashing it invalidates the cache exactly when the browser could change; keying by project caches each browser separately. On a cache hit, `install-deps` still runs (apt libs live outside `~/.cache`).

### Q: Why does the lint/typecheck/validate/format gate run on only one leg?

```yaml
- if: matrix.project == 'chromium'
  run: |
    npm run lint && npm run typecheck && npm run validate && npm run format:check
```

These are browser-independent — identical on every leg. Running on all three triples cost for zero extra signal.

### Q: What artifacts does CI upload, and on what conditions?

HTML report `if: always()` (wanted even on green, named per-browser to avoid collision); traces + videos `if: failure()` (large, only useful on a red run). The post-mortem kit for a third-party-site failure you can't reproduce locally; `if: failure()` keeps storage cheap.

### Q: How does the SonarCloud job work and why `needs: test`?

It runs _after_ `test` to ingest the JUnit XML the legs produced; `fetch-depth: 0` gives full git blame for new-code gating; a fork guard skips it on PRs that can't access `SONAR_TOKEN`. Sonar adds cross-file duplication, security hotspots, and maintainability ratings on top of the test gate — defence in depth.

### Q: Why `concurrency: cancel-in-progress`?

```yaml
concurrency: { group: tests-${{ github.ref }}, cancel-in-progress: true }
```

Only the latest commit's result matters; cancelling superseded runs saves runner minutes and avoids piling redundant traffic on rate-limited external sites.

### Q: What does `.gitignore` deliberately commit, and what's the principle?

It ignores secrets (`.env*`), artifacts (`playwright-report/`, `test-results/`, `.tsbuildinfo`), and `settings.local.json` — but force-includes `!.env.example` and commits the _entire `.claude/` kit_. The AI-assisted workflow is part of the deliverable, so skills/agents/commands/hooks are version-controlled; only machine-specific settings are personal. **Commit the contract, ignore the secrets and the noise.**

### Q: What are the four building blocks of the `.claude/` kit?

15 **skills** (auto-trigger off `description` frontmatter, each ships its own validator), 3 **subagents** (isolated context, minimal tools; `contract-drift-watch` pins `model: haiku`), 9 **slash commands** (compose skills into pipelines), 3 **hooks** (deterministic shell guards). This separates _judgment_ (skills/agents, LLM-driven) from _guarantees_ (hooks/validators, deterministic). The LLM proposes; the shell disposes.

### Q: What does the `/test-new` pipeline do?

`requirements-to-test-design` → `gherkin-test-case-author` → `playwright-test-author-ui/-api` → wire factories + fixtures → `test-code-reviewer` (don't finish until exit 0) → run; on retry-limit, `playwright-debug-conductor`. It encodes the whole SDET workflow — design before code, review before done — as one command, with a deterministic validator as a hard pipeline gate.

### Q: What do the three hooks do, and when?

- **PreToolUse/Bash → `guard-bash.sh`**: `exit 2` (block) on `rm -rf`, `git push --force`, hard reset on `main`/`master`/`release`, `sudo`, `playwright codegen` in CI.
- **PreToolUse/Edit|Write → `guard-paths.sh`**: blocks edits to `tests/api/generated/*`, snapshots, `node_modules`, `.env` (allows `.env.example`).
- **PostToolUse/Edit|Write → `typecheck-touched.sh`**: typechecks the touched file, _soft-fails_ (`exit 0`) so the agent can keep iterating.
- **Stop**: prints a smoke-suite reminder.

Hooks enforce what you must never trust an LLM to get right (destructive commands, protected paths) with hard `exit 2`; typecheck is soft so it surfaces as feedback, not a trap. _(Observed live this session: `guard-bash.sh` blocked an `rm -rf` and a hard reset on `main`.)_

### Q: How do the kit's validators relate to `tools/`?

The same validator lives in both places. Per `tools/README.md`: the kit copies are portable _templates_ (drop `.claude/` into any repo and the skills carry their own checks); the `tools/` copies are _this repo's wired-in, active gates_ (referenced by `package.json`, pre-commit, CI). The kit is the source/template; `tools/` is the running instance.

### Q: Why are OpenAPI / contract capabilities disabled here?

CONSTRAINTS §2.1/§4: the sites are third-party, no backend access, no spec the team controls — black-box only. So `api-client-from-openapi`, `playwright-test-author-api`, `contract-drift-watch`, and `/spec-sync` are disabled, and `tests/api/generated/**` must never be created. The capability isn't deleted — the project contract switches it off. Configurability in action.

### Q: Why a SonarCloud gate _on top of_ ESLint, validators, and tests?

ESLint is per-file pattern matching; the validators are architecture-specific; tests verify behaviour; Sonar adds the holistic, historical, security-aware layer (duplication, hotspots, new-code gating). Layered gates each catch a different failure class — defence in depth, not a single point of trust.

---

## Source map

The files worth reading as a set:

- **Language & types:** `tests/pages/BasePage.ts`, `tests/support/purchase-flow.ts`, `tests/pages/PaymentMethodsPage.ts`, `tests/infra/env.ts`, `tests/factories/user.factory.ts`, `tsconfig.json`.
- **Framework:** `playwright.config.ts`, `tests/fixtures/{pages,index}.ts`, `tests/specs/**`, `tests/support/payment-boundary.ts`.
- **Architecture:** `docs/ARCHITECTURE.md`, `docs/CONSTRAINTS.md`, `CLAUDE.md`, all of `tests/pages/*` and `tests/support/*`.
- **Tooling/CI/kit:** `eslint.config.mjs`, `.husky/*`, `tools/*`, `tests-config.json`, `.github/workflows/tests.yml`, `Makefile`, `.claude/` (skills/agents/commands/hooks, `settings.json`).
