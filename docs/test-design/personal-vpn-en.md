# Test Design — Personal VPN EN (Scenario C, @en)

> Skill: `requirements-to-test-design` | Author: test-design-agent | Date: 2026-04-28
> Next step: `gherkin-test-case-author` consumes this document.

---

## 1. Scope and Links

| Item                      | Value                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Source PRD                | `docs/test-Assignment.pdf` — canonical extraction: CONSTRAINTS §5 Scenario C                                                               |
| Entry URL                 | `https://personal.freevpnplanet.com/`                                                                                                      |
| Exit boundary             | Payment page loads (URL matches provider pattern OR payment-provider DOM marker is visible). **STOP — do not interact with payment form.** |
| Locale tag                | `@en`                                                                                                                                      |
| Playwright describe group | `test.describe("Personal VPN purchase — EN @en", ...)`                                                                                     |
| Constraint source         | `docs/CONSTRAINTS.md` §2.3 (stop at payment), §2.4 (Faker SEED=1234, @example.test), §2.5 (@en tag), §2.6 (retries:2, trace, video)        |

### In scope

- Landing page renders and `<form id="PPG">` is present.
- Plan selection: `offer_id` radio group — primary paths `1_month` and `1_year`; secondary `2_days` as an additional equivalence class.
- Email field interaction (valid, invalid, empty, boundary lengths).
- "Pay" button submit — navigates to payment-method selection page.
- Payment-method selection page: exactly **two** methods (assumed Card + Crypto — see §9).
- For each method: selecting it and proceeding reaches the final payment page (URL/DOM assertion). **STOP.**
- Assignment constraint: **repeat the full flow for both payment methods** (2 primary happy-path E2E tests minimum).

### Out of scope

See §8 for full list. Summary: real payment submission, card data entry (including Stripe test cards), 3DS, Apple/Google Pay sheets, crypto wallet auth, crypto TX hash upload, account-exists branch, password reset, SSO with `account.freevpnplanet.com`, locale toggling mid-flow, VPN config download/delivery.

### Assignment note on plan choice

The assignment explicitly narrows the main path to **monthly or yearly** ("план на месяц или год"). The `2_days` trial is treated as a secondary equivalence class — its select+submit behaviour is verified in one additional lower-priority test, not repeated for both payment methods.

### Selector strategy (differs from Site A and Site B)

`personal.freevpnplanet.com` exposes **no `qa-*` IDs** and **no `data-testid`** attributes (contrast: Site B `planetconfig.com` has `qa-*` IDs). All selectors must use:

- `page.locator('input[name="offer_id"][value="1_month"]')` — attribute selector on radio inputs.
- `page.getByRole('button', { name: 'Pay' })` — submit button.
- `page.getByPlaceholder('name@example.com')` — email field.
- Role/text selectors for payment-method cards on the next page.

This is the **#1 maintenance risk** for this scenario (§9).

---

## 2. State Diagram

```
[Landing / Home]
    │
    │  select offer_id ∈ {2_days*, 1_month, 1_year}
    ▼
[PlanSelected]
    │
    │  fill email (valid | invalid | empty)
    ▼
[EmailEntered]
    │
    │  click "Pay" (submit form#PPG GET /payment/)
    ▼
[PaymentMethodPage]  ← /payment/ or similar
    │
    ├── choose Card  ──────────────────────────────────►  [PaymentPage — Card]  ★ STOP
    │
    └── choose Crypto  ────────────────────────────────►  [PaymentPage — Crypto]  ★ STOP

* 2_days is the default selected radio on page load.
```

**State guard notes:**

- The `gateway` hidden field is presumed to be set by the payment-method selection page before the final redirect, not on the landing form. Direct `GET /payment/` without prior form submission is presumed inaccessible or returns an error — this is not exercised (out of scope for direct URL access tests).
- Browser Back from [PaymentMethodPage] should return to [EmailEntered] state with form values preserved (see §7 negative paths).

---

## 3. Equivalence Classes

### 3.1 `offer_id` — Plan

| Class ID | Partition               | Values    | Priority | Notes                                     |
| -------- | ----------------------- | --------- | -------- | ----------------------------------------- |
| EC-P1    | Monthly plan (primary)  | `1_month` | P0       | Required by assignment                    |
| EC-P2    | Yearly plan (primary)   | `1_year`  | P0       | Required by assignment                    |
| EC-P3    | 2-day trial (secondary) | `2_days`  | P2       | Default on load; additional coverage only |

### 3.2 Email

| Class ID | Partition                     | Example                                    | Priority | Notes                                       |
| -------- | ----------------------------- | ------------------------------------------ | -------- | ------------------------------------------- |
| EC-E1    | Valid, standard               | `user-1234@example.test` (Faker SEED=1234) | P0       | Happy path                                  |
| EC-E2    | Empty string                  | `""`                                       | P0       | No HTML5 `required`; behaviour TBD          |
| EC-E3    | Missing @                     | `userexample.test`                         | P1       | Basic format violation                      |
| EC-E4    | Missing TLD / domain          | `user@`                                    | P1       | RFC violation                               |
| EC-E5    | Double @                      | `user@@example.test`                       | P1       | RFC violation                               |
| EC-E6    | Leading whitespace            | `" user@example.test"`                     | P1       | Trimming check                              |
| EC-E7    | Trailing whitespace           | `"user@example.test "`                     | P1       | Trimming check                              |
| EC-E8    | Max local-part (64 chars)     | `${'a'.repeat(64)}@example.test`           | P2       | RFC 5321 boundary                           |
| EC-E9    | Max total length (254 chars)  | local+domain = 254                         | P2       | RFC 5321 boundary                           |
| EC-E10   | Exceeds max total (255 chars) | local+domain = 255                         | P2       | Over-boundary                               |
| EC-E11   | XSS payload                   | `"><script>alert(1)</script>@x.test`       | P1       | Security — assert sanitisation on next page |
| EC-E12   | SQL injection pattern         | `' OR 1=1--@example.test`                  | P2       | Security                                    |
| EC-E13   | Punycode / IDN domain         | `user@xn--nxasmq6b.test`                   | P2       | i18n edge case                              |
| EC-E14   | Subaddress (plus tag)         | `user+tag@example.test`                    | P2       | RFC-valid; should pass                      |

### 3.3 Location

| Class ID | Partition                  | Value | Priority | Notes                                              |
| -------- | -------------------------- | ----- | -------- | -------------------------------------------------- |
| EC-L1    | Netherlands (only visible) | `NL`  | P0       | Single radio, pre-checked; no UI variation to test |

Flag: No multi-location selector is present on this domain (differs from potential future multi-location offering). If a second location radio appears, this becomes P0.

### 3.4 Currency

| Class ID | Partition          | Value | Priority | Notes                                              |
| -------- | ------------------ | ----- | -------- | -------------------------------------------------- |
| EC-C1    | USD (only visible) | `USD` | P0       | Single radio, pre-checked; no UI variation to test |

Flag: Site B (planetconfig.com) may offer RUB; Site C is USD-only at time of inspection.

### 3.5 Payment Method (on payment-method page)

| Class ID | Partition | Assumed label                  | Priority | Notes                       |
| -------- | --------- | ------------------------------ | -------- | --------------------------- |
| EC-PM1   | Card      | "Credit Card" or equivalent    | P0       | Assignment: repeat for both |
| EC-PM2   | Crypto    | "Cryptocurrency" or equivalent | P0       | Assignment: repeat for both |

Assumption: exactly two methods visible, by parity with Site A. See §9 open questions.

---

## 4. Boundary Values

| Parameter               | Lower bound                             | Nominal   | Upper bound          | Over-upper | Source            |
| ----------------------- | --------------------------------------- | --------- | -------------------- | ---------- | ----------------- |
| Email local-part length | 1 char                                  | ~10 chars | 64 chars (RFC 5321)  | 65 chars   | RFC 5321 §4.5.3.1 |
| Email total length      | 6 chars (`a@b.cd`)                      | ~25 chars | 254 chars (RFC 5321) | 255 chars  | RFC 5321 §4.5.3.1 |
| `offer_id` enum         | N/A — discrete values, no numeric range | —         | —                    | —          | DOM inspection    |

Note: The landing page form exposes no HTML5 `minLength`, `maxLength`, `pattern`, or `min`/`max` attributes on any field. All boundaries above are inferred from RFC 5321 and common server-side practice. Any server-side length enforcement is opaque — surface mismatches as findings. This is flagged in §9.

---

## 5. Decision Table — Plan × Payment Method × Email Validity

Inputs:

- **P** = offer_id ∈ {1_month (M), 1_year (Y)}
- **PM** = payment method ∈ {Card (C), Crypto (K)}
- **E** = email validity ∈ {valid (V), invalid/empty (I)}

Expected outputs:

- `nav` = navigates from landing to payment-method page after submit.
- `pm_page` = payment-method page renders with both method options.
- `pay_page` = payment page for selected method loads (STOP point).
- `err` = inline error or blocked navigation (email rejected client or server side).

| Rule | P   | PM  | E             | nav | pm_page | pay_page     | err   | Priority | Test ID |
| ---- | --- | --- | ------------- | --- | ------- | ------------ | ----- | -------- | ------- |
| R1   | M   | C   | V             | yes | yes     | yes (Card)   | no    | P0       | TC-C-01 |
| R2   | M   | K   | V             | yes | yes     | yes (Crypto) | no    | P0       | TC-C-02 |
| R3   | Y   | C   | V             | yes | yes     | yes (Card)   | no    | P0       | TC-C-03 |
| R4   | Y   | K   | V             | yes | yes     | yes (Crypto) | no    | P0       | TC-C-04 |
| R5   | M   | —   | I (empty)     | ?   | —       | —            | maybe | P1       | TC-C-05 |
| R6   | M   | —   | I (malformed) | ?   | —       | —            | maybe | P1       | TC-C-06 |
| R7   | Y   | —   | I (empty)     | ?   | —       | —            | maybe | P1       | TC-C-07 |

Collapse note: R1 and R3 are structurally equivalent at the plan-selection level; their difference is `offer_id` value and potentially the displayed price on the payment-method page. Both are P0 because the assignment requires testing both plans. R5–R7 collapse to "invalid email" behaviour — outcome is unknown without live observation; expected is either client-side HTML5 validation (popover) or server-side rejection. Both outcomes must be asserted explicitly.

---

## 6. State Transitions Table

| From State            | Event                 | Guard                  | To State                             | Assertion                                                                    |
| --------------------- | --------------------- | ---------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| Landing               | Page load             | —                      | PlanDefault (`2_days` selected)      | `input[name="offer_id"][value="2_days"]` is checked                          |
| PlanDefault           | Click `1_month` radio | —                      | PlanSelected(1_month)                | `input[name="offer_id"][value="1_month"]` is checked                         |
| PlanDefault           | Click `1_year` radio  | —                      | PlanSelected(1_year)                 | `input[name="offer_id"][value="1_year"]` is checked                          |
| PlanSelected          | Type valid email      | —                      | EmailEntered(valid)                  | email field value equals typed string                                        |
| PlanSelected          | Leave email empty     | —                      | EmailEntered(empty)                  | email field value is empty string                                            |
| EmailEntered(valid)   | Click Pay             | form valid             | PaymentMethodPage                    | URL contains `/payment/` or equivalent; both method options visible          |
| EmailEntered(empty)   | Click Pay             | no HTML5 required      | PaymentMethodPage OR ValidationError | Either navigates (server validates) or shows inline error                    |
| EmailEntered(invalid) | Click Pay             | HTML5 pattern may fire | ValidationError OR PaymentMethodPage | Inline validation popover OR server-side error; must not silently proceed    |
| PaymentMethodPage     | Choose Card           | —                      | PaymentPage(Card)                    | URL matches card provider pattern; card form / payment marker visible        |
| PaymentMethodPage     | Choose Crypto         | —                      | PaymentPage(Crypto)                  | URL matches crypto provider pattern; crypto invoice / payment marker visible |
| PaymentMethodPage     | Browser Back          | —                      | Landing (form state)                 | Form values potentially preserved (browser-native); no crash                 |
| PaymentPage           | —                     | **STOP**               | —                                    | No further interaction                                                       |

---

## 7. Negative Paths

Listed by priority.

### P0 Negative

| ID     | Scenario                                                     | Steps                                                        | Expected Result                                                                                                                                                |
| ------ | ------------------------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NEG-01 | Empty email, click Pay                                       | Load page, do NOT fill email, click Pay button               | Either HTML5 validation popover blocks submit (inspect `validity.valueMissing`), OR server-side error shown on next page. Must NOT silently complete checkout. |
| NEG-02 | No plan change (stays at `2_days` default), valid email, Pay | Leave radio at default `2_days`, fill valid email, click Pay | Form submits with `offer_id=2_days`; payment-method page renders (server accepts it). Assert plan label on payment page.                                       |

### P1 Negative

| ID     | Scenario                            | Steps                                                | Expected Result                                                                                                                |
| ------ | ----------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| NEG-03 | Malformed email — missing @         | Fill `userexample.test`, click Pay                   | HTML5 type=email validation fires and blocks submission, OR server returns error.                                              |
| NEG-04 | Malformed email — missing domain    | Fill `user@`, click Pay                              | HTML5 validation or server error. No successful navigation to payment.                                                         |
| NEG-05 | Double @ in email                   | Fill `user@@example.test`, click Pay                 | Validation error.                                                                                                              |
| NEG-06 | Leading whitespace in email         | Fill ` user@example.test` (space prefix)             | Either trimmed and accepted, or rejected. Assert actual behaviour; flag as finding if trimmed silently.                        |
| NEG-07 | XSS payload in email field          | Fill `"><script>alert(1)</script>@x.test`, click Pay | If navigation proceeds to payment-method page, assert the email string is HTML-escaped / sanitised in the DOM. No alert fires. |
| NEG-08 | Double-click Pay button quickly     | Click Pay twice within 200 ms                        | Single navigation occurs; no duplicate form submissions or double requests. Observe network tab / final URL.                   |
| NEG-09 | Browser Back from PaymentMethodPage | Navigate forward to payment-method page, press Back  | Returns to landing; form fields may or may not be preserved (browser behaviour). No error page, no crash.                      |

### P2 Negative

| ID     | Scenario                                        | Steps                                                                                         | Expected Result                                                                                                                            |
| ------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| NEG-10 | Email at RFC max local-part boundary (64 chars) | Fill 64-char local-part + `@example.test`, click Pay                                          | Accepted and proceeds.                                                                                                                     |
| NEG-11 | Email over RFC max local-part (65 chars)        | Fill 65-char local-part + `@example.test`, click Pay                                          | Server may reject or truncate. Assert outcome; flag as finding either way.                                                                 |
| NEG-12 | Email total 254 chars (at max)                  | Construct 254-char valid email, click Pay                                                     | Accepted.                                                                                                                                  |
| NEG-13 | Email total 255 chars (over max)                | Construct 255-char email, click Pay                                                           | Server may reject. Assert and flag.                                                                                                        |
| NEG-14 | Tampered `gateway` hidden field                 | JS: set `document.querySelector('input[name="gateway"]').value = 'invalid_xyz'` before submit | Server should reject or ignore tampered value. Expect error page or default payment-method page.                                           |
| NEG-15 | SQL injection in email                          | Fill `' OR 1=1--@example.test`, click Pay                                                     | Sanitised. No server error traceable to injection.                                                                                         |
| NEG-16 | Network offline at click Pay                    | Intercept / throttle to offline, click Pay                                                    | Browser network error displayed. No partial submission state. No double-charge risk (payment page never reached).                          |
| NEG-17 | 4xx/5xx from `/payment/` endpoint               | (Simulate via proxy or observe if server error occurs naturally)                              | UX surfaces error banner; does not crash silently. Treat as real finding, not flake; quarantine with `test.fixme` + ticket if encountered. |

---

## 8. Out of Scope

| Item                                 | Rationale                                                           |
| ------------------------------------ | ------------------------------------------------------------------- |
| Real payment submission              | CONSTRAINTS §2.3 — hard stop at payment page                        |
| Card number / CVV / expiry entry     | CONSTRAINTS §2.3 — even Stripe test cards forbidden                 |
| 3DS / OTP flow                       | CONSTRAINTS §2.3                                                    |
| Apple Pay / Google Pay sheets        | CONSTRAINTS §2.3                                                    |
| Crypto wallet authentication         | CONSTRAINTS §2.3                                                    |
| Crypto TX hash upload                | CONSTRAINTS §2.3                                                    |
| Account-already-exists branch        | No authenticated state; out of black-box scope                      |
| Password reset                       | Not part of this scenario; handled in Scenario A if applicable      |
| SSO with `account.freevpnplanet.com` | Separate subdomain, separate concern                                |
| VPN config download / delivery       | Post-payment; never reached                                         |
| Locale toggle EN→RU mid-flow         | No locale switcher observed on landing; flag if one appears         |
| Direct `GET /payment/` URL access    | No backend access; presumed auth-gated. Not part of happy-path E2E. |
| Performance / load testing           | Not in assignment scope                                             |
| Accessibility (a11y) audit           | Not in assignment scope                                             |
| RU locale paths                      | Covered by Scenario B on `planetconfig.com`                         |
| Scenario A (Sign Up flow)            | Separate design document                                            |

---

## 9. Open Questions and Assumptions

| ID   | Item                                                                                                                                                                                                                                                         | Status                         | Impact if Wrong                                                                                                                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OQ-1 | **Exact payment method labels on `/payment/` page.** Assumed: "Credit Card" (or "Card") and "Cryptocurrency" (or "Crypto") based on parity with Site A's order page.                                                                                         | **Assumption**                 | Selectors for payment-method cards will break; test will fail at NEG step. Treat as P0 blocker on first run.                                                     |
| OQ-2 | **Selector stability — no `data-testid` / `qa-*` IDs.** This site exposes no stable test hooks. All selectors rely on `name` attributes, placeholder text, and button text. Any DOM restructuring will break tests silently or loudly.                       | **Risk — #1 maintenance risk** | High churn on selector fixes. Recommend filing a UX-feedback note requesting `data-testid` attributes on `#PPG` inputs and Pay button.                           |
| OQ-3 | **Whether empty email is blocked client-side.** The email `<input type="email">` has no HTML5 `required` attribute. Browser may not validate emptiness, meaning the form submits and the server must validate. Actual behaviour is unknown without live run. | **Assumption**                 | NEG-01 test assertion branch depends on this. Design handles both outcomes; choose correct assertion at authoring time.                                          |
| OQ-4 | **Whether `2_days` plan navigates to the same payment-method page.** Assumed yes (same form action `/payment/`).                                                                                                                                             | **Assumption**                 | NEG-02 scope changes if `2_days` routes differently.                                                                                                             |
| OQ-5 | **Whether location or currency ever changes on this domain.** Currently single-value radios (`NL`, `USD`). If multi-value options are added, EC-L and EC-C tables require expansion.                                                                         | **Watch**                      | Currently low risk; flag for re-inspection each sprint.                                                                                                          |
| OQ-6 | **CSRF nonce `ppg_nonce_1` validity window.** If the nonce expires before the form is submitted in slow tests, submission may fail with a 403.                                                                                                               | **Risk**                       | Tests may be flaky on slow CI. Mitigate with `retries: 2` (already mandated by CONSTRAINTS §2.6).                                                                |
| OQ-7 | **Payment provider identity.** The provider behind the card and crypto payment pages is unknown until the flow is run. Possible providers by ecosystem: Stripe, Paddle, Cryptomus. URL assertion pattern must be determined on first run.                    | **Assumption**                 | Payment-page URL assertion in TC-C-01 through TC-C-04 will need provider-specific pattern. Placeholder: assert URL changed from `/payment/` to any external URL. |

---

## 10. Risk-Prioritised Test Condition List

Priority legend: **P0** = smoke / must-pass for release; **P1** = regression; **P2** = edge-case / exploratory.

Smoke suite (≤ 3 conditions, tagged `@smoke @en`): **TC-C-01, TC-C-02, TC-C-03** cover the primary assignment requirement (monthly plan + both payment methods; yearly plan + card). TC-C-04 (yearly + crypto) is P0 but can run outside the smoke gate.

| Test ID | Condition                                                  | offer_id  | Email                | Payment Method           | Priority    | Tag   | Stop Point                                           |
| ------- | ---------------------------------------------------------- | --------- | -------------------- | ------------------------ | ----------- | ----- | ---------------------------------------------------- |
| TC-C-01 | Monthly plan → Card payment page reached                   | `1_month` | valid (Faker)        | Card                     | P0 `@smoke` | `@en` | Payment page URL / DOM marker                        |
| TC-C-02 | Monthly plan → Crypto payment page reached                 | `1_month` | valid (Faker)        | Crypto                   | P0 `@smoke` | `@en` | Payment page URL / DOM marker                        |
| TC-C-03 | Yearly plan → Card payment page reached                    | `1_year`  | valid (Faker)        | Card                     | P0 `@smoke` | `@en` | Payment page URL / DOM marker                        |
| TC-C-04 | Yearly plan → Crypto payment page reached                  | `1_year`  | valid (Faker)        | Crypto                   | P0          | `@en` | Payment page URL / DOM marker                        |
| TC-C-05 | Empty email blocks or reports error on submit              | `1_month` | empty                | —                        | P1          | `@en` | Error state asserted; no payment page                |
| TC-C-06 | Malformed email (missing @) blocked                        | `1_month` | `userexample.test`   | —                        | P1          | `@en` | Validation error                                     |
| TC-C-07 | Malformed email (missing domain) blocked                   | `1_year`  | `user@`              | —                        | P1          | `@en` | Validation error                                     |
| TC-C-08 | XSS payload in email sanitised on next page                | `1_month` | XSS string           | Card                     | P1          | `@en` | No script executes; email shown escaped              |
| TC-C-09 | Double-click Pay — single navigation only                  | `1_month` | valid                | Card                     | P1          | `@en` | Single payment-method page load                      |
| TC-C-10 | Browser Back from PaymentMethodPage — no crash             | `1_month` | valid                | — (back before choosing) | P1          | `@en` | Returns to landing, no error                         |
| TC-C-11 | 2-day trial plan submits and reaches payment-method page   | `2_days`  | valid (Faker)        | Card                     | P2          | `@en` | PaymentMethodPage (STOP at method selection)         |
| TC-C-12 | Email at RFC local-part max (64 chars) accepted            | `1_month` | 64-char local        | Card                     | P2          | `@en` | Payment page reached                                 |
| TC-C-13 | Email over RFC local-part max (65 chars) — observe outcome | `1_month` | 65-char local        | —                        | P2          | `@en` | Error or accepted — assert and flag                  |
| TC-C-14 | Tampered `gateway` field — server handles gracefully       | `1_month` | valid                | —                        | P2          | `@en` | Error page or default method page; no silent success |
| TC-C-15 | Leading whitespace in email — trimmed or rejected          | `1_month` | ` user@example.test` | Card                     | P2          | `@en` | Either proceeds (trimmed) or error; flag as finding  |

### Risk heuristic summary

| Risk Vector                                    | Severity | Mitigations in design                                                                                             |
| ---------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| Selector fragility (no `qa-*` / `data-testid`) | High     | Attribute selectors on `name`/`value`; role selectors; placeholder selector. File UX-feedback ticket.             |
| CSRF nonce expiry on slow CI                   | Medium   | `retries: 2`; keep test fast; no `waitForTimeout`.                                                                |
| Payment method labels unknown until first run  | Medium   | TC-C-01..04 use placeholder assertion (URL changed); update after first run.                                      |
| Empty email not blocked client-side            | Medium   | NEG-01 / TC-C-05 dual-branch assertion handles both outcomes.                                                     |
| External site downtime / 5xx                   | Medium   | `retries: 2`, `trace: on-first-retry`, `video: retain-on-failure`; treat persistent failure as finding not flake. |
| Over-reaching into payment submission          | Critical | Hard stop enforced by design; all test IDs terminate at payment page entry assertion.                             |

---

_End of test design. Hand off to `gherkin-test-case-author` for TC-C-01 through TC-C-15._
