# Project Constraints

> **Authoritative file for all agents, skills, and slash-commands in this repo.**
> Any workflow that conflicts with these constraints must STOP and surface the conflict.
> Last reviewed: 2026-04-28.

## 1. Context

This project automates **black-box E2E tests for three external sites** owned by a third party (freevpnplanet ecosystem):

| Scenario          | Entry URL                           | Locale | Notes                                                                                                                 |
| ----------------- | ----------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| Sign Up           | https://freevpnplanet.com/          | EN     | Log In → Sign Up → fill form + payment method → "Get your subscription" → assert payment URL/page is opened correctly |
| Personal VPN (RU) | https://planetconfig.com/           | RU     | Pick plan → payment method page → payment page. Repeat for several methods incl. crypto                               |
| Personal VPN (EN) | https://personal.freevpnplanet.com/ | EN     | Pick monthly/yearly plan → payment method page → payment page. Repeat for both methods                                |

We do **not** own these sites, do **not** have access to their backend, and have **no** OpenAPI spec for them.

## 2. Hard constraints (MUST)

### 2.1 Black-box only — no contract testing

- **OpenAPI / contract testing is N/A.** There is no spec we control.
- The `api-client-from-openapi` skill is **DISABLED** for this project. Do not invoke it, do not run `/spec-sync`, do not generate `tests/api/generated/**`.
- `tests-config.json` has `openapi.enabled = false`. Any tooling that reads this flag must skip OpenAPI work.
- The `contract-drift-watch` subagent is **DISABLED**.

### 2.2 No production telemetry on third-party sites

- The **Sentry MCP is DISABLED** for this project. The sites are not ours, we have no Sentry org for them. Do not call any `mcp__plugin_sentry_sentry__*` tool. Do not invoke `sentry:*` skills.

### 2.3 Tests stop at the payment page

- Every payment-flow test **MUST stop** at the page where a real payment would be initiated (card form, crypto invoice, Apple Pay sheet, redirect target like `*.stripe.com`, `*.paddle.com`, `*.cryptomus.com`, etc.).
- Tests **MUST NEVER** submit card data, crypto wallet data, OTP, 3DS, or any final "Pay" action.
- Assertions allowed at the boundary: URL pattern, presence of payment-provider DOM markers, absence of error banners, presence of an `amount`/`currency`/`order id` element. **Disallowed**: clicking final pay buttons, filling card numbers (even Stripe test cards), uploading crypto TX hashes.

### 2.4 Synthetic test data only

- Test emails are synthetic, generated via **Faker with `SEED=1234`** for deterministic runs.
- Email domain default = `@yopmail.com` (disposable-mail service with valid MX). This is a deliberate amendment from `@example.test`: the sites under test perform server-side MX-record validation and reject reserved RFC TLDs by routing to a `/payment/failed/` page (see `docs/ux-findings.md`, item B-payment-validation). yopmail accepts any local-part, has no per-user delivery, and is the industry-standard QA convention for third-party signups.
- Local parts are clearly synthetic (`firstname.lastname.<sequence>`) so they don't collide with real human-readable addresses.
- Override the default domain via `SYNTHETIC_EMAIL_DOMAIN` env var when a target site requires something else.
- Passwords, names, phone numbers — also Faker, same seed.
- Never use real personal data, never reuse a real email, never sign up with a domain we don't own.

### 2.5 Localization split

- RU specs live in their own `test.describe("…@ru", …)` group (or dedicated file/project).
- EN specs (Sign Up + personal.freevpnplanet.com) live in their own `test.describe("…@en", …)` group.
- A single test MUST NOT mix locales. The `@ru` / `@en` tags are mandatory and used by Playwright `--grep`.

### 2.6 Resilience for external sites

All three targets are external and outside our control. In `playwright.config.ts`:

- `retries: 2`
- `trace: 'on-first-retry'`
- `video: 'retain-on-failure'`
- `screenshot: 'only-on-failure'` (recommended companion)

These values are non-negotiable defaults. Per-project overrides are allowed only to **strengthen** evidence (e.g. `trace: 'on'`), never to weaken it.

## 3. Soft constraints (SHOULD)

- Prefer `getByRole` / `getByLabel` / `getByTestId` per `tests-config.json`. Inline CSS/XPath only as last resort, with a TODO and a UX-feedback note in the accompanying Google Doc.
- Do **not** auto-heal or silently retry broken selectors — if the third-party DOM changes, surface it as a finding in the UX/issues doc instead of patching tests opaquely.
- Treat any 4xx/5xx during navigation as a real finding, not a flake. Quarantine with `test.fixme` + ticket reference, do not delete.

## 4. What changes downstream

The following project-level skills/agents are auto-disabled while this file says so:

- `api-client-from-openapi` → DISABLED
- `contract-drift-watch` (subagent) → DISABLED
- `/spec-sync` (slash command) → DISABLED
- `sentry:*` (all Sentry skills + MCP) → DISABLED
- `playwright-test-author-api` → DISABLED (no API contract to test)
- `release-report-composer` → ALLOWED but must omit contract-drift section

Still active and recommended: `playwright-framework-bootstrap`, `fixture-architect`, `test-data-factory-builder`, `config-and-secrets`, `requirements-to-test-design`, `gherkin-test-case-author`, `playwright-test-author-ui`, `test-code-reviewer`, `playwright-debug-conductor`, `flaky-triage`, `run-analyzer`, `coverage-gap-analyzer`.

## 5. Three E2E scenarios (canonical extraction from `docs/test-Assignment.pdf`)

### Scenario A — Sign Up (EN)

1. Open `https://freevpnplanet.com/`.
2. Click **Log In**.
3. Click **Sign Up**.
4. Fill all required fields + payment method (synthetic data, no real card).
5. Click **Get your subscription**.
6. Assert payment URL is generated and the correct payment page opens. **STOP here.**

### Scenario B — Personal VPN, RU

1. Open `https://planetconfig.com/`.
2. Pick purchase options, proceed to payment-method selection.
3. Pick a payment method, proceed to payment page. **STOP.**
4. Repeat for **several** payment methods, **including cryptocurrency**.

### Scenario C — Personal VPN, EN

1. Open `https://personal.freevpnplanet.com/`.
2. Pick plan (**monthly** or **yearly**), proceed to payment-method selection.
3. Pick a payment method, proceed to payment page. **STOP.**
4. Repeat for **both** payment methods.

## 6. Change protocol

This file is the contract. To change a constraint:

1. Open a PR that edits this file _only_.
2. Get explicit user approval in the PR description.
3. Then propagate to skills/agents/configs.

Agents/skills MUST re-read this file at the start of any session and abort if asked to violate any §2 rule.
