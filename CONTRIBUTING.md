# Contributing

This guide covers how to add a test, the hard layer rules you must respect, the gates that run before your commit lands, and a troubleshooting section for the live-site flakiness you _will_ hit.

Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) once before your first contribution, and treat [`docs/CONSTRAINTS.md`](docs/CONSTRAINTS.md) as authoritative — any workflow that conflicts with §2 must stop.

---

## Prerequisites

```bash
make install        # npm ci + playwright install --with-deps (3 browsers)
```

No `.env.local` is required — [`tests/infra/env.ts`](tests/infra/env.ts) ships safe defaults (the public production URLs + `SEED=1234`). Create `.env.local` only to target alternate hosts or override `SYNTHETIC_EMAIL_DOMAIN` (read in [`tests/factories/_seed.ts`](tests/factories/_seed.ts), default `yopmail.com`).

---

## Adding a test — the AI-assisted path (recommended)

This repo ships a committed SDET kit under [`.claude/`](.claude/). With Claude Code open in the repo, the fastest correct path is the `/test-new` pipeline:

```
/test-new <feature description>
```

It chains: `requirements-to-test-design` → `gherkin-test-case-author` → `playwright-test-author-ui` → `test-data-factory-builder` + `fixture-architect` → `test-code-reviewer`. The result is a reviewed spec that already respects the layer rules below. Useful follow-ups:

- `/factory <Entity>` — scaffold a Fishery factory for a new entity.
- `/page <url>` — scaffold a page object from a URL.
- `/test-fix <path>` — debug + patch + re-run a failing spec.
- `/test-review` — anti-pattern review of staged tests.
- `/flake-hunt [N]` — `--repeat-each=N` then triage.

> The OpenAPI-oriented commands (`/spec-sync`) and skills are **disabled** for this black-box project per [`docs/CONSTRAINTS.md`](docs/CONSTRAINTS.md) §4. Don't invoke them here.

---

## Adding a test — the manual path

If you author by hand, place each concern in its layer (see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)):

1. **Page object** — add or extend a class under `tests/pages/`. Locators and actions only; no `expect`. A `*Page` class must live here.
2. **Factory** — if you need new synthetic data, add a `*.factory.ts` under `tests/factories/` using Fishery + Faker. Import the seed from `_seed.ts`; never call the network, `Date.now`, or `Math.random`.
3. **Fixture** — expose the new page object / factory through `tests/fixtures/` via `mergeTests`. Always `await use(...)` and clean up. No business logic here.
4. **Spec** — write the test under `tests/specs/` in AAA structure. Use injected fixtures, web-first assertions, and the correct locale tag (`@ru` / `@en`) and `@smoke` where appropriate. Stop at the payment boundary — never submit card/crypto data.

Then run the gates locally:

```bash
npm run validate    # layout + factory + fixture + spec checks (or: make validate)
make lint           # eslint + tsc + prettier
make test-smoke     # quick sanity run
```

---

## Hard layer rules

These are enforced by [`tools/`](tools/), not by convention. A violation fails `npm run validate`, the pre-commit hook, and CI.

- Selectors live in page objects — never inline in specs.
- No `page.waitForTimeout`. Use web-first assertions or `expect.poll`.
- No `axios` / raw `fetch` in specs.
- No `process.env.X` inline — read env through [`tests/infra/env.ts`](tests/infra/env.ts).
- Factories never call the network; side effects belong in `seed()`.
- `BasePage` may not import `expect`.
- Fixtures always call `await use(...)` and clean up.
- No hard-coded URLs in `tests/` (except inside `tests/infra/env.ts`).
- A single test must not mix locales — keep `@ru` and `@en` separate.

See [`tools/README.md`](tools/README.md) for exactly which script guards which rule.

---

## Commit gates

### Pre-commit (`.husky/pre-commit`)

1. `lint-staged` — Prettier + `eslint --fix` on staged files.
2. `bash tools/validate-layout.sh` — layer-boundary enforcement.
3. `npx tsx tools/lint-ui-spec.ts` — spec anti-pattern scan.

### Commit message (`.husky/commit-msg`)

Conventional Commits are mandatory:

```
type(scope?): subject
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`. Example: `test(checkout): add cancel-order scenario`. Merge/revert/fixup commits are exempt.

### CI

`.github/workflows/tests.yml` runs the full `chromium`/`firefox`/`webkit` matrix plus a lint + typecheck + `npm run validate` + `format:check` step on the chromium leg, then a SonarCloud job that consumes the JUnit report. **CI is the authoritative green signal** (see below).

---

## Troubleshooting

These tests drive **live, third-party production sites**. Flakiness is expected and mitigated by `retries: 2` — it is not a sign your change is broken. Per [`docs/CONSTRAINTS.md`](docs/CONSTRAINTS.md) §3, a genuine 4xx/5xx is a **finding** (document it in [`docs/ux-findings.md`](docs/ux-findings.md)), not something to silently retry away.

**A local run shows flakes; CI is green.**
This is the documented norm (~11% first-attempt flake, often SPA-hydration timing). Trust CI as the authoritative signal. Re-run locally before assuming a regression.

**Inspect a failing test interactively.**

```bash
make test-headed    # run with a visible browser
make test-debug     # PWDEBUG=1 — Playwright Inspector, step through
make test-ui        # interactive UI Mode (time-travel, watch)
```

**Read a trace after the fact.**

```bash
make report                                  # open the latest HTML report
npx playwright show-trace path/to/trace.zip  # open a specific trace
npx playwright test --trace=on               # force a trace for every test
```

Traces, screenshots, and videos are retained on failure (and uploaded as CI artefacts) per [`playwright.config.ts`](playwright.config.ts).

**Browsers missing / version mismatch.**

```bash
npx playwright install --with-deps           # reinstall the 3 browsers
```

**Env / URL problems.**
The suite runs without `.env.local`. If you overrode a `BASE_URL_*` and the run fails at boot with a zod error, fix the value — env is validated on import in [`tests/infra/env.ts`](tests/infra/env.ts) and the process exits with code `2` on an invalid URL.

**A purchase test fails at the post-`/payment/` redirect assertion.**
This is a known, documented open question — see the final section of [`docs/ux-findings.md`](docs/ux-findings.md). Reproduce with `make test-headed` and capture a trace before changing the spec; do not auto-heal selectors.

**Hunt a flake systematically.**

```bash
make flake-hunt     # rerun the suite 5x to surface instability
```

or `/flake-hunt N` to run `--repeat-each=N` and triage via the kit.
