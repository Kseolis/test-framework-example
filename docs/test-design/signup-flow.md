# Test Design — Sign Up Flow (Scenario A, EN)

> **Status**: Draft — awaiting downstream authoring by `gherkin-test-case-author` / `playwright-test-author-ui`.
> **Last updated**: 2026-04-28
> **Author agent**: `test-design-agent` (requirements-to-test-design skill)

---

## 1. Scope and links

| Item                 | Value                                                         |
| -------------------- | ------------------------------------------------------------- |
| Source PRD           | `docs/test-Assignment.pdf` §"Проверка Sign Up"                |
| Canonical scenario   | `docs/CONSTRAINTS.md` §5 Scenario A                           |
| Entry URL            | `https://freevpnplanet.com/`                                  |
| Login form URL       | `https://account.freevpnplanet.com/login/`                    |
| Order/Sign-up URL    | `https://account.freevpnplanet.com/order/`                    |
| Exit boundary (STOP) | Payment page opens — assert URL pattern and page markers only |
| Locale               | EN (default)                                                  |
| Test data            | Faker `SEED=1234`, email domain `@example.test`               |

**In scope:**

- Navigation from Home → Log In link → `/login/` page → Sign Up link → `/order/` page
- Email field on `/order/` (Form 1, email step)
- Plan period selector on `/order/`
- Payment method selection on `/order/` (Form 2: Credit Card vs Cryptocurrency)
- Terms-of-use checkbox on `/order/`
- "Get your subscription" submit button behaviour and the resulting redirect
- Asserting the payment URL is generated and a recognisable payment page opens
- Negative and edge-case paths for all form fields

**Out of scope (per CONSTRAINTS §2.3 and project decisions):**

- Clicking any final "Pay" / "Submit payment" button on the payment gateway page
- Filling card numbers, CVV, expiry — including Stripe test cards
- Crypto wallet addresses, TX hash submission
- OTP / 3DS / SCA challenges
- Apple Pay / Google Pay sheets
- Stripe iframe internals (rendered inside cross-origin frame)
- Cryptomus / Paddle internal payment-page validation
- Account-already-registered scenario (no backend access to clean up)
- Email confirmation link / inbox verification
- Password reset / forgot-password flow
- Login flow correctness (Login page is a navigation step only; its own correctness is a separate scenario)
- RU-locale variants (separate Scenario B/C)
- Cookie / GDPR consent modal behaviour (environmental, not functional)
- Accessibility audit (separate workstream)

---

## 2. State diagram

```
[Home]
  │  User clicks "Log In" nav link
  ▼
[Login Page — /login/]
  │  User clicks "Sign Up" link
  ▼
[Order Page — /order/ — Email Step (Form 1)]
  │  Guard: email field contains a well-formed address
  │  User clicks "Next"
  ▼
[Order Page — Plan Step]
  │  Guard: plan period is selected (default "1 year" is pre-selected)
  │  (Plan selection may be done before or after email step; selector is on the same page)
  ▼
[Order Page — Payment Method Step (Form 2)]
  │  Guard: payment method chosen (Credit Card or Cryptocurrency)
  │
  ├─[Terms NOT accepted]──► button "Get your subscription" disabled / error displayed
  │
  │  Guard: Terms checkbox checked
  ▼
[Terms Accepted + Method Chosen]
  │  User clicks "Get your subscription"
  ▼
[Payment Page — STOP]
  Assert: URL matches known payment-provider pattern
  Assert: Payment page DOM markers visible (amount, currency, order reference)
  Assert: No error banner present
```

**Negative transitions (annotated on the same diagram):**

- Email step "Next" with empty/invalid email → stays on email step, error displayed
- "Get your subscription" with terms unchecked → button disabled or error
- "Get your subscription" with no payment method selected → error displayed
- Double-click "Get your subscription" → only one redirect (idempotency)
- Network offline before click → error banner / graceful failure, no crash

---

## 3. Equivalence classes

### 3.1 Email field (both `/login/` and `/order/` Form 1 — same validation rules assumed)

| Field | Class ID | Valid / Invalid    | Representative value          | Notes                                                                           |
| ----- | -------- | ------------------ | ----------------------------- | ------------------------------------------------------------------------------- |
| Email | EC-E-01  | Valid              | `faker@example.test`          | Well-formed, standard TLD                                                       |
| Email | EC-E-02  | Valid              | `user+tag@example.test`       | Plus-addressing (RFC 5321 compliant)                                            |
| Email | EC-E-03  | Valid              | `a@b.test`                    | Minimal valid length                                                            |
| Email | EC-E-04  | Valid (edge)       | `user@subdomain.example.test` | Subdomain in domain part                                                        |
| Email | EC-E-05  | Valid (edge)       | `"quoted space"@example.test` | Quoted local-part (RFC 5321) — server may reject                                |
| Email | EC-E-06  | Invalid            | `notanemail`                  | No `@` or domain                                                                |
| Email | EC-E-07  | Invalid            | `user@@example.test`          | Double `@`                                                                      |
| Email | EC-E-08  | Invalid            | `@example.test`               | Missing local part                                                              |
| Email | EC-E-09  | Invalid            | `user@`                       | Missing domain                                                                  |
| Email | EC-E-10  | Invalid            | ` user@example.test`          | Leading whitespace                                                              |
| Email | EC-E-11  | Invalid            | `user@example.test `          | Trailing whitespace                                                             |
| Email | EC-E-12  | Invalid            | `` (empty)                    | Empty field                                                                     |
| Email | EC-E-13  | Invalid (boundary) | 255-char email string         | Exceeds RFC 5321 254-char max                                                   |
| Email | EC-E-14  | Invalid            | `<script>@example.test`       | XSS payload in local-part                                                       |
| Email | EC-E-15  | Valid (i18n)       | `用户@例子.test`              | Internationalised (IDN); server may accept or reject — observe actual behaviour |

### 3.2 Password field (`/login/` only — Sign Up has no password field on `/order/`)

| Field    | Class ID | Valid / Invalid   | Representative value                 | Notes                                    |
| -------- | -------- | ----------------- | ------------------------------------ | ---------------------------------------- |
| Password | EC-P-01  | Valid             | Faker-generated 12-char alphanumeric | Nominal valid                            |
| Password | EC-P-02  | Invalid           | `` (empty)                           | Empty                                    |
| Password | EC-P-03  | Invalid (assumed) | `abc` (3 chars)                      | Below assumed min of 8                   |
| Password | EC-P-04  | Invalid (assumed) | `password`                           | Common weak password — server may reject |
| Password | EC-P-05  | Valid (edge)      | 128-char string                      | At assumed max                           |
| Password | EC-P-06  | Invalid (assumed) | 129-char string                      | Above assumed max                        |
| Password | EC-P-07  | Valid (edge)      | Unicode glyphs `Пароль123!`          | Non-ASCII password                       |

### 3.3 Plan period selector (`/order/`)

| Field | Class ID | Valid / Invalid | Representative value | Notes                                          |
| ----- | -------- | --------------- | -------------------- | ---------------------------------------------- |
| Plan  | EC-PL-01 | Valid           | `1 year`             | Default; pre-selected                          |
| Plan  | EC-PL-02 | Valid           | `1 month`            | Shorter period — inferred from site            |
| Plan  | EC-PL-03 | Valid           | `2 days`             | Trial/short — inferred from RU sister site     |
| Plan  | EC-PL-04 | Invalid         | No plan selected     | If selector can be cleared — observe behaviour |

### 3.4 Payment method (`/order/` Form 2)

| Field   | Class ID | Valid / Invalid | Representative value | Notes                                    |
| ------- | -------- | --------------- | -------------------- | ---------------------------------------- |
| Payment | EC-PM-01 | Valid           | Credit Card          | Standard button                          |
| Payment | EC-PM-02 | Valid           | Cryptocurrency       | "Select cryptocurrency 16+" button       |
| Payment | EC-PM-03 | Invalid         | Neither selected     | Neither button clicked; submit attempted |

### 3.5 Terms checkbox (`/order/` Form 2)

| Field    | Class ID | Valid / Invalid     | Representative value                  | Notes                       |
| -------- | -------- | ------------------- | ------------------------------------- | --------------------------- |
| Terms    | EC-TC-01 | Valid               | Checked                               | Prerequisite for submission |
| EC-TC-02 | Invalid  | Unchecked (default) | Must prevent submission or show error |

---

## 4. Boundary values

**Note:** HTML5 `required`, `minLength`, `maxLength`, and `pattern` attributes are absent on all observed fields. The boundaries below are inferred from RFC 5321 (email), common industry conventions (password), and inspection data (plan options). The downstream test author MUST verify each assumption against actual server behaviour.

### 4.1 Email length (RFC 5321 max = 254 chars total)

| Boundary | Value                                                                       | Expected                                 |
| -------- | --------------------------------------------------------------------------- | ---------------------------------------- |
| Min−1    | 0 chars (empty)                                                             | Validation error                         |
| Min      | 1-char local + `@` + domain = shortest well-formed (~6 chars, e.g. `a@b.c`) | Likely accepted                          |
| Nominal  | ~20 chars (Faker default)                                                   | Accepted                                 |
| Max−1    | 253-char valid email                                                        | Accepted                                 |
| Max      | 254-char valid email                                                        | Accepted (RFC limit)                     |
| Max+1    | 255-char string                                                             | Expected rejection; observe actual error |

### 4.2 Password length (ASSUMED: min=8, max=128 — see §9 open questions)

| Boundary | Value     | Expected           |
| -------- | --------- | ------------------ |
| Min−1    | 7 chars   | Rejected (assumed) |
| Min      | 8 chars   | Accepted (assumed) |
| Min+1    | 9 chars   | Accepted           |
| Nominal  | 12 chars  | Accepted           |
| Max−1    | 127 chars | Accepted (assumed) |
| Max      | 128 chars | Accepted (assumed) |
| Max+1    | 129 chars | Rejected (assumed) |

**Note:** Password field appears only on the `/login/` page (existing account login), not on `/order/`. The sign-up flow on `/order/` does NOT prompt for a password — the user receives credentials by another mechanism (email link or auto-generated password). This is flagged as assumption A-05 in §9.

### 4.3 Plan period (inferred from inspection + RU sister site)

| Boundary | Value          | Expected                        |
| -------- | -------------- | ------------------------------- |
| Shortest | 2 days (trial) | Accepted — maps to cheapest SKU |
| Mid      | 1 month        | Accepted                        |
| Longest  | 1 year         | Accepted — default              |

**Note:** If the dropdown exposes raw period IDs or if additional options (3 months, 6 months) exist, boundaries expand. Flag any selector value not listed here.

---

## 5. Decision table — payment method × terms acceptance × email validity

Inputs:

- **PM** = paymentMethod ∈ {Credit Card (CC), Cryptocurrency (CR), None (N)}
- **TC** = termsChecked ∈ {true (Y), false (N)}
- **EV** = emailValid ∈ {true (Y), false (N)}

| Rule | PM  | TC  | EV  | Button Enabled  | Redirect                   | Error shown                                  |
| ---- | --- | --- | --- | --------------- | -------------------------- | -------------------------------------------- |
| R01  | CC  | Y   | Y   | YES             | Payment page (Stripe-like) | No                                           |
| R02  | CR  | Y   | Y   | YES             | Payment page (Crypto)      | No                                           |
| R03  | N   | Y   | Y   | NO or disabled  | No                         | Method-required error                        |
| R04  | CC  | N   | Y   | NO or disabled  | No                         | Terms-required error                         |
| R05  | CR  | N   | Y   | NO or disabled  | No                         | Terms-required error                         |
| R06  | N   | N   | Y   | NO              | No                         | Method + Terms errors                        |
| R07  | CC  | Y   | N   | Depends on step | No                         | Email-invalid error (Form 1 blocks progress) |
| R08  | CR  | Y   | N   | Depends on step | No                         | Email-invalid error (Form 1 blocks progress) |
| R09  | N   | Y   | N   | NO              | No                         | Email-invalid + method errors                |
| R10  | CC  | N   | N   | NO              | No                         | Email-invalid + terms errors                 |
| R11  | CR  | N   | N   | NO              | No                         | Email-invalid + terms errors                 |
| R12  | N   | N   | N   | NO              | No                         | All three error conditions                   |

**Collapsed / notes:**

- R07/R08 collapse to "Form 1 prevents reaching Form 2 when email is invalid." The button state for Form 2 is moot because the user cannot advance past "Next". Treat R07-R12 as a single category: "invalid email blocks the entire flow before payment method is even choosable."
- R03/R04/R05/R06: the exact UI manifestation (button disabled vs click produces inline error) is unknown and must be observed. The oracle records the actual behaviour on first run.
- R01/R02 are the primary happy-path rules and must be smoke-tagged.

---

## 6. State transitions table

| From State                      | Trigger                           | Guard                                     | To State                       | Negative Branch                                      |
| ------------------------------- | --------------------------------- | ----------------------------------------- | ------------------------------ | ---------------------------------------------------- |
| Home                            | Click "Log In" nav link           | Link present and clickable                | Login Page (`/login/`)         | Link absent → test blocked, surface as finding       |
| Login Page                      | Click "Sign Up" link              | Link present                              | Order Page (`/order/`)         | Link absent → test blocked                           |
| Order Page — Email Step         | Type valid email; click "Next"    | Email passes client-side validation       | Order Page — Plan/Method Step  | Invalid email → error displayed, stays on email step |
| Order Page — Email Step         | Click "Next" with empty email     | —                                         | Error state (same page)        | —                                                    |
| Order Page — Plan Step          | Select plan from dropdown         | Dropdown available                        | Plan selected state            | Default pre-selected; if dropdown broken → surface   |
| Order Page — Payment Step       | Click "Credit Card" button        | Form 2 rendered                           | CC selected state              | Button absent → surface                              |
| Order Page — Payment Step       | Click "Select cryptocurrency 16+" | Form 2 rendered                           | Crypto selected state          | Button absent → surface                              |
| Terms unchecked + method chosen | Check terms checkbox              | Checkbox interactive                      | Terms accepted state           | Checkbox unresponsive → surface                      |
| Terms accepted + method chosen  | Click "Get your subscription"     | Terms checked, method chosen, email valid | Payment Page (STOP)            | Error banner → record, do not proceed                |
| Terms NOT accepted              | Click "Get your subscription"     | —                                         | Error state or button disabled | Assert error / disabled state                        |
| Payment Page                    | —                                 | —                                         | STOP — no further transitions  | —                                                    |

---

## 7. Negative paths

**NP-01 — Invalid email format, Form 1**

- Precondition: On `/order/`, Form 1 visible
- Action: Enter `notanemail` in email field; click "Next"
- Expected: Form 1 does not advance; inline error message appears near the email field
- Oracle: `expect(page.getByRole('alert')).toBeVisible()` OR error text adjacent to email input is visible; URL remains `/order/`

**NP-02 — Empty email field, Form 1**

- Precondition: On `/order/`, Form 1 visible, email field empty
- Action: Click "Next"
- Expected: Error indicating email is required; no navigation
- Oracle: Error element visible; URL still `/order/`

**NP-03 — Email with leading/trailing whitespace**

- Precondition: On `/order/`, Form 1
- Action: Enter `user@example.test` (spaces both sides); click "Next"
- Expected: Either stripped and accepted, or rejected with trim error. Record actual behaviour.
- Oracle: Observe whether form advances; if rejected, record error text verbatim

**NP-04 — Terms checkbox NOT accepted**

- Precondition: On `/order/`, valid email entered and "Next" passed, payment method chosen (CC), terms checkbox unchecked
- Action: Click "Get your subscription"
- Expected: Submission blocked; error or disabled state
- Oracle: `getByRole('button', { name: 'Get your subscription' })` is disabled OR error text near checkbox is visible; no navigation away from `/order/`

**NP-05 — No payment method selected**

- Precondition: On `/order/`, valid email, terms accepted, neither CC nor Crypto button clicked
- Action: Click "Get your subscription"
- Expected: Submission blocked; error message indicating payment method required
- Oracle: Error visible; URL remains `/order/`

**NP-06 — Double-click "Get your subscription" (idempotency)**

- Precondition: On `/order/`, all fields valid, terms checked, method chosen
- Action: Double-click "Get your subscription" rapidly
- Expected: Single redirect to payment page; no duplicate order created (observable: one payment URL, no error)
- Oracle: Assert final URL matches payment pattern exactly once; assert no duplicate-order error banner

**NP-07 — Back button after advancing to payment page**

- Precondition: Happy path completed, payment page reached
- Action: Press browser back button
- Expected: Returns to `/order/` OR a confirmation/warning dialog. Observe actual behaviour.
- Oracle: URL is `/order/` or an intermediate page; no crash; form state is observable

**NP-08 — Network offline at click of "Get your subscription"**

- Precondition: All fields valid, terms checked, method chosen; simulate offline via `context.setOffline(true)` before click
- Action: Click "Get your subscription"
- Expected: Graceful error (network-error banner, no white screen/JS crash)
- Oracle: An error indicator is visible; no unhandled exception in console (collect via `page.on('pageerror')`)

**NP-09 — Very long email input (255+ chars)**

- Precondition: On `/order/`, Form 1
- Action: Enter a 260-char syntactically-valid-looking email string in the email field; click "Next"
- Expected: Rejection with error message; no server 5xx
- Oracle: Error visible OR form does not advance; no `console.error` HTTP 500 logged

**NP-10 — XSS payload in email field**

- Precondition: On `/order/`, Form 1
- Action: Enter `<script>alert(1)</script>@example.test` in email field; click "Next"
- Expected: Input is sanitised — either rejected by validation or rendered as literal text (no JS execution)
- Oracle: No `alert` dialog observed; error message (if shown) renders payload as escaped text; `page.on('dialog')` listener reports no unexpected dialogs

**NP-11 — Email already registered (observable variant)**

- Precondition: Attempt sign-up with an email that the server may consider already registered
- Action: Complete Form 1 with a plausibly already-registered email (if detectable without real accounts)
- Expected: Error message "email already in use" or equivalent, or redirect to login
- Oracle: Observe and record response; this test is informational — exact assertion TBD (see §9 A-08)

---

## 8. Out of scope (explicit)

- Clicking the final "Pay" / "Confirm payment" button on any payment gateway page
- Filling card number, expiry, CVV — including Stripe test card numbers
- OTP, 3DS / SCA authentication challenges
- Crypto wallet address submission, TX hash upload
- Apple Pay / Google Pay modal sheet behaviour
- Stripe iframe internals (cross-origin, not inspectable)
- Cryptomus / Paddle internal payment-page field validation
- Real personal data in any form field
- Account-already-registered cleanup via API (no backend access — see NP-11 caveat)
- Email confirmation / magic-link inbox verification
- Password reset / "Forgot password" flow
- Login form correctness beyond using it as a navigation step
- RU-locale variants of the sign-up flow (Scenarios B and C)
- Cookie/GDPR consent modal (environmental noise, not functional)
- Accessibility (WCAG audit — separate workstream)
- Performance / load testing
- OpenAPI / contract testing (CONSTRAINTS §2.1 — disabled for this project)

---

## 9. Open questions / assumptions for the test author

| ID   | Assumption / Open question                                                                                                                                                                                                                                                  | Impact if wrong                                                                          |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| A-01 | Password minimum length is **8 characters**. Not stated in HTML attrs or PRD.                                                                                                                                                                                               | Boundary tests for password (EC-P-03, BV-P) may give false positives/negatives           |
| A-02 | Password maximum length is **128 characters**. Industry default assumed.                                                                                                                                                                                                    | BV-P max/max+1 boundary tests may be inaccurate                                          |
| A-03 | The `/order/` page plan dropdown includes **"2 days"** and **"1 month"** in addition to the default **"1 year"** (inferred from RU sister site). The EN locale may differ.                                                                                                  | EC-PL-02 / EC-PL-03 tests will fail if options are absent; update equivalence classes    |
| A-04 | Validation on the email and password fields is **client-side JS or server-side** (HTML5 attrs absent). Error UI must be observed and recorded on first run; do not assume browser-native popup.                                                                             | Oracle assertions must use observed selectors, not `page.evaluate` on HTML5 validity API |
| A-05 | The `/order/` sign-up flow **does NOT present a password field** — the user receives account credentials by email or auto-generated link. If a password field appears, re-scope accordingly.                                                                                | Password BV tests become in-scope for sign-up, not just login                            |
| A-06 | The "Get your subscription" button is **disabled** when terms are unchecked (NP-04). Alternatively, the button is enabled but produces an inline error on click. The test author must observe actual behaviour on the first exploratory run and set the oracle accordingly. | NP-04 oracle may need adjustment                                                         |
| A-07 | Both payment-method buttons ("Credit Card" and "Select cryptocurrency 16+") lead to **distinct payment provider URLs** (e.g. Stripe vs Cryptomus). The URL-pattern assertions for each must be confirmed on first run.                                                      | R01 and R02 URL-pattern assertions must be calibrated                                    |
| A-08 | Testing "email already registered" is **deferred** because no backend exists to create or clean test accounts. If a pre-registered test email is ever provided, NP-11 can be promoted to a full assertion.                                                                  | NP-11 remains informational only                                                         |
| A-09 | The form uses **method=GET** on `/login/` (observed). The `/order/` form submit mechanism (GET/POST/XHR) is not confirmed — affects whether URL parameters leak email on redirect. Inspect during first run.                                                                | Privacy/security observation, not a blocker                                              |
| A-10 | Locale is fixed at **EN** for this scenario. The locale switcher is present on `/order/` but must NOT be interacted with during these tests.                                                                                                                                | Accidentally switching locale would invalidate selector text matching                    |
| A-11 | The payment page URL pattern includes domains such as `*.stripe.com`, `*.cryptomus.com`, or a redirect via `account.freevpnplanet.com`. Exact patterns must be confirmed on first successful run and locked into `expect(page.url()).toMatch(/pattern/)`.                   | Without calibration, URL assertion is too loose and may pass on error pages              |

---

## 10. Risk-prioritised test-condition list

| ID    | Description                                                                                                                                           | Risk   | Why                                                                         | Smoke |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------- | ----- |
| TC-01 | Happy path — Credit Card: Home → Login → Sign Up → valid email → 1-year plan → CC → accept terms → "Get your subscription" → assert payment URL opens | HIGH   | Core revenue path; if this breaks, no user can purchase                     | YES   |
| TC-02 | Happy path — Cryptocurrency: same as TC-01 but choose "Select cryptocurrency 16+"                                                                     | HIGH   | Second primary payment path; crypto users represent distinct segment        | YES   |
| TC-03 | Terms checkbox bypass — attempt submit with terms unchecked                                                                                           | HIGH   | Legal/compliance risk if terms can be skipped; also regression risk         | YES   |
| TC-04 | Email validation — invalid format blocked at Form 1 "Next"                                                                                            | HIGH   | Broken email allows orphaned accounts, downstream failures                  | NO    |
| TC-05 | Payment URL integrity — assert URL contains expected provider domain and non-empty order/amount params                                                | HIGH   | Open-redirect or wrong-page risk — user could land on a phishing/wrong page | NO    |
| TC-06 | Empty email field — "Next" is blocked with error                                                                                                      | MEDIUM | UX correctness; also guards against server receiving empty strings          | NO    |
| TC-07 | No payment method selected — "Get your subscription" blocked                                                                                          | MEDIUM | Form completeness guard                                                     | NO    |
| TC-08 | Double-click idempotency — single order created                                                                                                       | MEDIUM | Duplicate-charge risk for users; financial impact                           | NO    |
| TC-09 | XSS payload in email field — sanitised, no script execution                                                                                           | MEDIUM | Security hygiene; third-party site but reflects on QA coverage              | NO    |
| TC-10 | Very long email (255+ chars) — rejected gracefully, no 5xx                                                                                            | MEDIUM | Input robustness; protects against server errors surfacing to users         | NO    |
| TC-11 | Network offline during submit — graceful error, no crash                                                                                              | MEDIUM | Resilience on flaky connections; relevant for VPN product's audience        | NO    |
| TC-12 | Plan period switching — 1 month plan reaches payment page                                                                                             | LOW    | Different SKU IDs may break payment URL params                              | NO    |
| TC-13 | Back button after reaching payment page — no crash, state observable                                                                                  | LOW    | Browser navigation robustness                                               | NO    |
| TC-14 | Trailing/leading whitespace in email — trimmed or clearly rejected                                                                                    | LOW    | UX polish; edge-case users copy-paste emails                                | NO    |
| TC-15 | Internationalised (IDN) email — server accepts or rejects without crash                                                                               | LOW    | Niche audience; useful for robustness signal                                | NO    |

**Smoke set (≤ 3 conditions blocking merge):** TC-01, TC-02, TC-03.
Rationale: TC-01 and TC-02 prove both payment paths are reachable. TC-03 proves the legal gate cannot be bypassed. All three must pass before any PR merges.

---

_End of design document. Hand off to `gherkin-test-case-author` for test case authoring, then to `playwright-test-author-ui` for implementation._
