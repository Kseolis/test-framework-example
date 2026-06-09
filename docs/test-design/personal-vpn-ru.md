# Test Design — Personal VPN RU (Scenario B, @ru)

> **Skill**: `requirements-to-test-design`
> **Site**: https://planetconfig.com/
> **Locale**: RU
> **Tag**: `@ru`
> **Stop boundary**: Payment page (after payment-method selection). No real payment action is ever executed.
> **Last updated**: 2026-04-28

---

## 1. Scope and links

| Item               | Detail                                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Source PRD         | `docs/test-Assignment.pdf` §Scenario B; canonical extraction in `docs/CONSTRAINTS.md` §5 Scenario B                           |
| Entry URL          | `https://planetconfig.com/`                                                                                                   |
| Form ID            | `#PPG` (method=GET, action `/payment/`)                                                                                       |
| Exit boundary      | Payment page loads (URL matches provider pattern OR provider DOM marker is visible). **STOP — do not fill card/crypto data.** |
| Locale             | RU (all UI labels in Russian; currency locked to RUB on landing)                                                              |
| Config constraints | `retries: 2`, `trace: on-first-retry`, `video: retain-on-failure`, `screenshot: only-on-failure` (CONSTRAINTS §2.6)           |

**In scope**

- Landing page rendering (plan cards, pricing, form controls)
- Plan selection via `offer_id` radios (`2_days`, `1_month`, `1_year`)
- Email entry and client-side / server-side validation observable in the UI
- Form submit ("Оплатить") → navigation to `/payment/` (method selection page)
- Payment method selection on `/payment/` page → navigation to provider payment page
- Assertions at the provider payment page boundary (URL pattern, amount displayed, absence of error banners)
- Cryptocurrency payment method path (mandatory per assignment)
- State persistence (email, plan) when navigating back

**Out of scope**

- Real payment execution, card number entry, 3DS/OTP, crypto TX submission
- Telegram bot purchase channel (`t.me/Planet_Vpn_Key_Bot`)
- VPN config delivery email / account creation post-payment
- SBP in-banking-app confirmation flow
- Any non-web channel
- Backend / API contract testing (CONSTRAINTS §2.1 — black-box only)

---

## 2. State diagram

```
[Home]
  │  load https://planetconfig.com/
  ▼
[PlanSelected]            ← default: 2_days (qa-radio-offer-2-days checked)
  │  user clicks 1_month or 1_year card (or keeps default)
  ▼
[CurrencySet]             ← always RUB (single option exposed; no user action needed)
  │
  ▼
[EmailEntered]
  │  user types email into #qa-input-email
  │
  ├─[INVALID EMAIL]──► [ErrorVisible] ──► (back-arrow) EmailEntered
  │
  ▼
[SubmitClicked]           ← #qa-btn-submit-step1 "Оплатить"
  │
  ├─[EMPTY EMAIL / bad format]──► [ValidationErrorVisible] ──► (back-arrow) EmailEntered
  │
  ├─[network 4xx/5xx]──► [ErrorPage / UX error banner]   ← STOP with finding
  │
  ▼
[PaymentMethodPage]       ← GET /payment/ with offer_id + email + currency in query
  │  user selects method (Card / Crypto / Other)
  │
  ├─[back button]──► [Home re-prefilled]   ← assert state preserved
  │
  ▼
[PaymentPage] ◄──── STOP BOUNDARY
  │  assertions: URL pattern, amount, currency, order id, no error banners
  │  NO further action taken
  ▼
[END TEST]
```

---

## 3. Equivalence classes

### 3.1 `offer_id` (plan selection)

| Class       | Value          | Representative | Notes                                                                         |
| ----------- | -------------- | -------------- | ----------------------------------------------------------------------------- |
| EC-PLAN-1   | `2_days`       | `2_days`       | Default on page load; 49.99 ₽                                                 |
| EC-PLAN-2   | `1_month`      | `1_month`      | 499 ₽                                                                         |
| EC-PLAN-3   | `1_year`       | `1_year`       | 2990 ₽                                                                        |
| EC-PLAN-INV | Tampered value | `999_years`    | Submitted via URL manipulation; oracle: server error or redirect to safe plan |

### 3.2 `email` field

| Class                                   | Representative value                       | Expected UI outcome                                              |
| --------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| EC-EMAIL-1 — Valid, Latin, standard     | `user.1234@example.test` (Faker SEED=1234) | Accepted; form submits                                           |
| EC-EMAIL-2 — Empty                      | `""`                                       | Validation error OR no navigation                                |
| EC-EMAIL-3 — Missing `@`                | `userexample.test`                         | Validation error                                                 |
| EC-EMAIL-4 — Missing domain             | `user@`                                    | Validation error                                                 |
| EC-EMAIL-5 — Missing TLD                | `user@example`                             | Validation error or acceptance (browser-dependent) — flag result |
| EC-EMAIL-6 — Space in local-part        | `foo bar@example.test`                     | Validation error                                                 |
| EC-EMAIL-7 — Leading `@`                | `@example.test`                            | Validation error                                                 |
| EC-EMAIL-8 — Cyrillic local-part        | `пользователь@example.test`                | IDN / punycode handling; flag acceptance or rejection            |
| EC-EMAIL-9 — XSS probe                  | `<script>@example.test`                    | Must not execute script; next page must render sanitised value   |
| EC-EMAIL-10 — Max local-part (64 chars) | 64-char local + `@example.test`            | Accepted (RFC 5321 conformant)                                   |
| EC-EMAIL-11 — Local-part = 65 chars     | 65-char local + `@example.test`            | Rejected or accepted — flag                                      |
| EC-EMAIL-12 — Total length = 254 chars  | pad domain to hit 254                      | Accepted (RFC 5321 max)                                          |
| EC-EMAIL-13 — Total length = 255 chars  | pad domain to hit 255                      | Rejected or accepted — flag                                      |

> **Note on HTML5 validation**: `required` is NOT set on `#qa-input-email`. The `type="email"` attribute triggers browser format hints but these are not reliable oracles for E2E assertions. Test by observing: (a) absence of navigation, (b) presence of a visible UI error message, (c) the URL does NOT change to `/payment/`.

### 3.3 `location` (radio)

| Class    | Value              | Notes                                                                                                     |
| -------- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| EC-LOC-1 | `NL` (Netherlands) | Only option currently exposed on landing; pre-checked. Flag: if more locations appear, new EC row needed. |

### 3.4 `currency_code` (radio)

| Class    | Value | Notes                                        |
| -------- | ----- | -------------------------------------------- |
| EC-CUR-1 | `RUB` | Only option exposed on landing; pre-checked. |

### 3.5 Payment method (next page — inferred)

| Class    | Method                         | Mandatory coverage                                 |
| -------- | ------------------------------ | -------------------------------------------------- |
| EC-PAY-1 | Card (Visa/MC/Mir)             | Yes                                                |
| EC-PAY-2 | Cryptocurrency                 | Yes — explicitly required by assignment            |
| EC-PAY-3 | SBP / Fast Payment System      | Assumed present (common RU market); flag if absent |
| EC-PAY-4 | Digital wallet (e.g. YooMoney) | Assumed possible; flag if absent                   |

> **Assumption A**: The payment-method page exposes at least Card and Crypto options. Exact method list requires live inspection (see §9).

---

## 4. Boundary values

### 4.1 Email length (RFC 5321)

| Dimension     | Boundary    | Value     | Class       |
| ------------- | ----------- | --------- | ----------- |
| Local-part    | Max allowed | 64 chars  | EC-EMAIL-10 |
| Local-part    | Max + 1     | 65 chars  | EC-EMAIL-11 |
| Total address | Max allowed | 254 chars | EC-EMAIL-12 |
| Total address | Max + 1     | 255 chars | EC-EMAIL-13 |

### 4.2 Plan period

Discrete set of 3 values — no numeric range to sweep. Boundary analysis degenerates to full coverage of all 3 classes (EC-PLAN-1 through EC-PLAN-3) plus one tampered value (EC-PLAN-INV). No additional boundary rows are meaningful.

### 4.3 Pricing oracle (use to assert amount on payment page)

| Plan      | Expected displayed amount |
| --------- | ------------------------- |
| `2_days`  | 49.99 ₽                   |
| `1_month` | 499 ₽                     |
| `1_year`  | 2990 ₽                    |

These values must be visible on the payment page (or payment-method confirmation step). A mismatch is a P0 finding.

---

## 5. Decision table — plan × payment method × email validity

Columns: `offer_id` | `paymentMethod` | `emailValid` | Expected outcome

| #   | offer_id  | paymentMethod | emailValid             | Expected outcome                                                        |
| --- | --------- | ------------- | ---------------------- | ----------------------------------------------------------------------- |
| D1  | `2_days`  | Card          | true                   | Payment page loads; URL matches card-provider pattern; amount = 49.99 ₽ |
| D2  | `1_month` | Card          | true                   | Payment page loads; amount = 499 ₽                                      |
| D3  | `1_year`  | Card          | true                   | Payment page loads; amount = 2990 ₽                                     |
| D4  | `2_days`  | Crypto        | true                   | Crypto payment page loads; amount = 49.99 ₽ in RUB equivalent           |
| D5  | `1_month` | Crypto        | true                   | Crypto payment page loads; amount = 499 ₽                               |
| D6  | `1_year`  | Crypto        | true                   | Crypto payment page loads; amount = 2990 ₽                              |
| D7  | `1_month` | SBP/Other     | true                   | Payment page loads for that method; amount = 499 ₽ (if method exists)   |
| D8  | any       | any           | false (empty)          | No navigation; validation error visible                                 |
| D9  | any       | any           | false (bad format)     | No navigation; validation error visible                                 |
| D10 | `1_year`  | Card          | true (XSS probe email) | Payment page loads; no script injection on any page in the flow         |

> Rows D1–D7 are collapsible where plan and method are independent (no cross-effect expected). D4–D6 are the mandatory crypto rows. D8–D9 cover all plan combinations — one representative row per validation class is sufficient.

---

## 6. State transitions table

| From state        | Trigger                                   | Guard                                                            | To state                        | Negative branch                  |
| ----------------- | ----------------------------------------- | ---------------------------------------------------------------- | ------------------------------- | -------------------------------- |
| Home              | Page loads                                | —                                                                | PlanSelected (default = 2_days) | Page fails to load → 5xx finding |
| PlanSelected      | Click different plan card                 | Plan radio `#qa-radio-offer-1-month` or `#qa-radio-offer-1-year` | PlanUpdated                     | Radio non-functional → finding   |
| PlanUpdated       | —                                         | —                                                                | EmailEntry ready                | —                                |
| EmailEntry        | Type valid email                          | `type="email"` passes                                            | EmailEntered                    | —                                |
| EmailEntered      | Click "Оплатить" (`#qa-btn-submit-step1`) | email non-empty, format valid                                    | PaymentMethodPage               | Invalid email → ValidationError  |
| EmailEntered      | Click "Оплатить"                          | email empty                                                      | ValidationError                 | —                                |
| ValidationError   | Fix email                                 | Valid format entered                                             | EmailEntered                    | —                                |
| PaymentMethodPage | Select Card method                        | method radio/button present                                      | PaymentPage (card provider)     | Method absent → finding          |
| PaymentMethodPage | Select Crypto method                      | crypto option present                                            | PaymentPage (crypto provider)   | Crypto absent → P0 finding       |
| PaymentMethodPage | Click browser back                        | —                                                                | Home (form pre-filled)          | State lost → finding             |
| PaymentPage       | —                                         | STOP BOUNDARY                                                    | [END TEST]                      | Error banner visible → finding   |

---

## 7. Negative paths

Listed in risk order (P0 first):

**N1 — Empty email submit** (P0)

- Action: Leave `#qa-input-email` empty, click `#qa-btn-submit-step1`.
- Oracle: URL does not change to `/payment/`; a visible error message appears OR the button is disabled OR the field is highlighted. No navigation must occur.
- Tags: `@ru`, `@smoke`

**N2 — Invalid email format: missing `@`** (P0)

- Action: Enter `userexample.test`, submit.
- Oracle: Same as N1.

**N3 — Invalid email format: missing domain** (P1)

- Action: Enter `user@`, submit.
- Oracle: No navigation; UI error.

**N4 — Invalid email format: leading `@`** (P1)

- Action: Enter `@example.test`, submit.
- Oracle: No navigation; UI error.

**N5 — Space in local-part** (P1)

- Action: Enter `foo bar@example.test`, submit.
- Oracle: No navigation; UI error.

**N6 — Cyrillic local-part (IDN)** (P1)

- Action: Enter `пользователь@example.test`, submit.
- Oracle: Accepted or rejected with a clear UI message. Flag the result — both outcomes are testable truths for a RU-locale site. No crash or unhandled exception.

**N7 — XSS probe in email** (P1)

- Action: Enter `<script>alert(1)</script>@example.test`, submit.
- Oracle: (a) Form may or may not navigate — either is valid. (b) On the payment-method page, the email value rendered in the DOM must NOT execute as script. Assert `page.evaluate(() => window._xss_probe)` is undefined, or assert the raw text `<script>` appears escaped in any visible element.

**N8 — Double-click "Оплатить"** (P1)

- Action: Click `#qa-btn-submit-step1` twice in rapid succession.
- Oracle: Exactly one navigation occurs. No duplicate order or duplicate form submission error on the next page.

**N9 — Switch plan after entering email** (P1)

- Action: Enter valid email, then change plan from `2_days` to `1_year`, then submit.
- Oracle: Payment-method page reflects the new plan (`1_year`). Email is preserved in the GET query string.

**N10 — Browser back from payment-method page** (P1)

- Action: Submit form → land on payment-method page → click browser back.
- Oracle: Home page is displayed; `#qa-input-email` retains the previously entered email; the plan radio retains the prior selection (or browser default — flag if state is lost as a UX finding).

**N11 — Network error / 4xx on `/payment/`** (P2)

- Action: Simulate network failure (Playwright `page.route` to abort `/payment/`) then submit.
- Oracle: A non-fatal error UX is displayed (error banner, or safe page). No unhandled JS exception. No blank white screen with no user guidance.
- Note: Per CONSTRAINTS §3, treat any 4xx/5xx as a real finding, quarantine with `test.fixme` + ticket ref.

**N12 — Tampered hidden `gateway` value** (P2)

- Action: Before form submit, use `page.evaluate` to set `document.querySelector('[name=gateway]').value = 'invalid_gateway_xyz'`, then submit.
- Oracle: Server returns an error response or redirects to a safe error page. Assert no silent acceptance.

**N13 — Disable JS** (P2)

- Action: Launch browser with JS disabled; navigate to landing.
- Oracle: Form is still present (it's `method=GET`). Submit behaviour with JS disabled: either navigates (if pure HTML) or shows a graceful degradation message. Flag result — the CSRF-like `ppg_nonce_1` hidden field may break server validation without JS. Document finding without asserting a specific outcome.

**N14 — Email max-length boundary (64 local-part chars)** (P2)

- Action: Enter 64-char local-part + `@example.test`.
- Oracle: Accepted; form submits; payment-method page loads.

**N15 — Email local-part 65 chars** (P2)

- Action: Enter 65-char local-part + `@example.test`.
- Oracle: Rejected with visible error OR accepted (flag whichever — RFC non-compliance is a finding).

---

## 8. Out of scope

The following items are explicitly excluded. Downstream skill `gherkin-test-case-author` MUST NOT generate cases for these.

- Real payment execution of any kind (card submit, crypto TX hash, Apple Pay sheet action)
- 3DS / OTP handling
- Crypto wallet authentication or address validation
- Telegram-bot purchase channel (`t.me/Planet_Vpn_Key_Bot`) — alternate channel, not web E2E
- VPN config delivery email (post-payment)
- Account creation, login, session management
- SBP confirmation flow inside the banking app (the STOP boundary is the SBP redirect, not the bank app)
- Admin/backend validation of gateway or nonce fields beyond observable UI behaviour
- Load / performance testing
- Accessibility (WCAG) — not in assignment scope
- Mobile app flows

---

## 9. Open questions and assumptions

| #                | Question / Assumption                                                                                                                                                             | Impact if wrong                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---- | ------------------------------ |
| OQ-1             | **Payment method list on `/payment/` is unknown** (page not directly inspectable). Assumed: Card, Crypto, possibly SBP/YooMoney.                                                  | If crypto is absent → P0 blocker; report as finding                                   |
| OQ-2             | **Terms-of-Service checkbox**: Site A (freevpnplanet.com) has a ToS checkbox. Does `/payment/` page also require checkbox acceptance before method selection?                     | If yes, add TC: assert checkbox present; assert method buttons disabled until checked |
| OQ-3             | **`location` field**: Only `NL` exposed on landing. Are other locations available via URL param or a hidden UI element?                                                           | If yes → new EC-LOC rows needed                                                       |
| OQ-4             | **`currency_code`**: Only `RUB` on landing. Same question.                                                                                                                        | If yes → new EC-CUR rows needed                                                       |
| OQ-5             | **Is there a phone-number field** on the payment-method page? The landing only has email.                                                                                         | If yes → additional EC/BV rows for phone                                              |
| OQ-6             | **Crypto provider identity**: Which provider handles crypto (Cryptomus? CoinPayments? BitPay?)? This determines the URL pattern assertion at STOP boundary.                       | If unknown, assert generic pattern `/.\*(crypto                                       | coin | pay).\*/i` and flag for update |
| OQ-7             | **Email display on payment-method page**: Is the entered email echoed back in the UI (for XSS N7 oracle)?                                                                         | If not echoed, N7 oracle needs adjustment                                             |
| OQ-8             | **`ppg_nonce_1` lifetime**: Is this a session-scoped nonce? Can the same nonce be replayed? Relevant for N8 double-click test.                                                    | If nonce is single-use, second submission fails with a clear error — document         |
| **Assumption A** | Payment-method page has at least Card and Crypto options                                                                                                                          | See OQ-1                                                                              |
| **Assumption B** | The GET query string reaching `/payment/` carries `offer_id`, `email`, `currency_code`, `location`. The `gateway` field is empty on submit and is set on the payment-method page. | Affects TC design for back-navigation state checks                                    |
| **Assumption C** | No login/account is required before purchase on this RU landing page                                                                                                              | If a login gate appears → Scenario A-style auth flow must precede Scenario B          |
| **Assumption D** | Faker SEED=1234 deterministic email domain is `@example.test` per CONSTRAINTS §2.4                                                                                                | Hard constraint — do not deviate                                                      |

---

## 10. Risk-prioritised test-condition list

| ID       | Description                                                                                                                                                             | Risk | Rationale                                                                                    | Smoke |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------- | ----- |
| TC-RU-01 | Open landing; assert 3 plan cards visible with correct prices (49.99 ₽ / 499 ₽ / 2990 ₽); assert form `#PPG` present                                                    | P0   | Entry condition for all other tests; if landing is broken nothing else runs                  | Yes   |
| TC-RU-02 | Select `1_year`, enter valid synthetic email, click "Оплатить"; assert navigation to payment-method page (URL contains `/payment/`)                                     | P0   | Core happy path; most revenue-impactful plan                                                 | Yes   |
| TC-RU-03 | On payment-method page, select **Crypto** method; assert navigation to crypto payment page (URL matches provider); assert displayed amount = 2990 ₽ (or RUB equivalent) | P0   | Crypto coverage is mandatory per assignment; highest-value plan maximises regression surface | Yes   |
| TC-RU-04 | Select `1_month`, valid email, "Оплатить"; select **Card** method; assert payment page loads; assert amount = 499 ₽; assert no error banners                            | P0   | Card is primary payment method; mid-tier plan                                                | No    |
| TC-RU-05 | Select `2_days`, valid email, "Оплатить"; select **Card** method; assert payment page loads; assert amount = 49.99 ₽                                                    | P0   | Trial plan path; separate pricing oracle check                                               | No    |
| TC-RU-06 | Select **Crypto** with `1_month` plan; assert amount = 499 ₽ on crypto page                                                                                             | P0   | Cross-plan crypto coverage                                                                   | No    |
| TC-RU-07 | Select **Crypto** with `2_days` plan; assert crypto page loads; assert amount = 49.99 ₽                                                                                 | P1   | Full crypto × plan matrix                                                                    | No    |
| TC-RU-08 | Select SBP/Other method (if present); assert payment page loads for that method                                                                                         | P1   | Additional RU payment method — flag if absent                                                | No    |
| TC-RU-09 | Empty email + click "Оплатить"; assert no navigation; assert visible error or button state                                                                              | P0   | Primary validation gate; prevents spurious orders                                            | No    |
| TC-RU-10 | Invalid email (`foo`) + submit; assert no navigation; assert validation error                                                                                           | P1   | Client-side validation contract                                                              | No    |
| TC-RU-11 | XSS probe email (`<script>alert(1)</script>@example.test`) through full flow; assert no script execution on any page                                                    | P1   | Security hygiene; RU locale sites are high-frequency attack targets                          | No    |
| TC-RU-12 | Change plan after entering email; submit; assert correct plan reflected on payment-method page                                                                          | P1   | State mutation during form fill — common regression source                                   | No    |
| TC-RU-13 | Browser back from payment-method page; assert form state preserved                                                                                                      | P1   | UX correctness; prevents user confusion and re-entry errors                                  | No    |
| TC-RU-14 | Double-click "Оплатить"; assert single navigation / no duplicate submission error                                                                                       | P1   | Idempotency — duplicate orders are a billing risk                                            | No    |
| TC-RU-15 | Cyrillic local-part email; assert graceful accept or reject (no crash)                                                                                                  | P1   | IDN edge case relevant specifically to RU locale                                             | No    |
| TC-RU-16 | Network abort on `/payment/`; assert non-fatal error UX                                                                                                                 | P2   | Resilience; external site may be flaky                                                       | No    |
| TC-RU-17 | Tampered `gateway` value; assert server rejects gracefully                                                                                                              | P2   | Security — prevents bypassing payment provider                                               | No    |
| TC-RU-18 | Email local-part = 64 chars; assert accepted                                                                                                                            | P2   | RFC 5321 compliance boundary                                                                 | No    |
| TC-RU-19 | Email local-part = 65 chars; assert result (flag compliance)                                                                                                            | P2   | RFC 5321 boundary + 1                                                                        | No    |
| TC-RU-20 | Disable JS; assert form renders and submit behaviour is documented                                                                                                      | P2   | Progressive-enhancement audit; informational                                                 | No    |

**Smoke suite** (3 conditions): TC-RU-01, TC-RU-02, TC-RU-03.
All items tagged `@ru`. Smoke items also tagged `@smoke`.
Crypto path (TC-RU-03, TC-RU-06, TC-RU-07) tagged additionally `@crypto`.

---

## Selector reference (stable QA hooks for downstream authoring)

| Element            | Primary selector          | Fallback                                     |
| ------------------ | ------------------------- | -------------------------------------------- |
| Plan card: 2 days  | `#qa-radio-offer-2-days`  | `input[name="offer_id"][value="2_days"]`     |
| Plan card: 1 month | `#qa-radio-offer-1-month` | `input[name="offer_id"][value="1_month"]`    |
| Plan card: 1 year  | `#qa-radio-offer-1-year`  | `input[name="offer_id"][value="1_year"]`     |
| Email input        | `#qa-input-email`         | `input[type="email"][name="email"]`          |
| Submit button      | `#qa-btn-submit-step1`    | `button[type="submit"]:has-text("Оплатить")` |
| Currency radio     | `#qa-radio-currency`      | `input[name="currency_code"][value="RUB"]`   |
| Location radio     | `#qa-radio-location`      | `input[name="location"][value="NL"]`         |
| Form               | `#PPG`                    | `form[action="/payment/"]`                   |

> Payment-method page selectors are **unknown** pending live inspection (OQ-1). The `gherkin-test-case-author` skill must perform a read-only DOM inspection of the payment-method page before generating cases for TC-RU-03 through TC-RU-08.

---

_Next pipeline step_: `gherkin-test-case-author` — consumes this file and produces `.feature` files under `tests/scenarios/ru/`.
