# Verdict rules

The release-report-composer infers a recommendation. The human sign-off is still required.

## Decision matrix

| Condition                                                                          | Verdict          |
| ---------------------------------------------------------------------------------- | ---------------- |
| Pass rate ≥ 99% AND no P0 coverage gap AND no breaking contract drift              | ✅ go            |
| 95% ≤ pass rate < 99% OR P0 coverage gap present OR non-breaking drift unannotated | ⚠️ go-with-risks |
| Pass rate < 95% OR breaking contract drift unaddressed OR security AC not covered  | ❌ no-go         |

## Caveats

- Smoke pass on prod ≠ full sign-off. The verdict refers to staging coverage; prod smoke is a separate gate.
- Quarantined tests do not contribute to pass rate; they are reported separately.
- A green run with stale baselines (no recent CI history) downgrades to ⚠️.

## Override

A human can overrule the verdict. The override is logged in the report's "Sign-off" section with a justification. Auditors can later see when humans bypassed automation and why.
