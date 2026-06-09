# Flake taxonomy

Each flake belongs to exactly one class. Class drives the fix.

| Class                  | Hallmarks                                                               | Fix                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Timing**             | Same step fails fast on retry; trace shows assertion before DOM stable. | Web-first; `expect.poll` for value-based polling; remove arbitrary `actionTimeout`.                                |
| **Animation**          | Headed passes, headless fails; element fades in/out.                    | Disable animations via CSS (`animation: none !important`) in test fixture; or assert with `toHaveClass(/active/)`. |
| **Network**            | 429/5xx in trace; passes in isolation.                                  | Mark `@external`; mock or run only against staging.                                                                |
| **Data leak**          | Fails in suite, passes alone; depends on prior test.                    | Per-test cleanup; per-test factory namespace; `--shuffle --workers=1` repro.                                       |
| **Sequence collision** | Two parallel workers create the same id.                                | Factory uses `sequence` + worker-index suffix.                                                                     |
| **Time-dependent**     | Fails near midnight, daylight-saving, end-of-month.                     | `page.clock.install()` and pin a timestamp.                                                                        |
| **Locator drift**      | Trace shows multiple elements match; element re-rendered.               | Switch to `getByRole`; scope inside ancestor; never `nth(N)`.                                                      |
| **Env**                | Specific worker / browser / OS only.                                    | Reproduce on the matching env; if irreproducible, classify "haunted" and quarantine.                               |
| **Real bug**           | Reproduces via API client without UI; consistent under load.            | File `BUG.md`; do not modify the test.                                                                             |

## Heuristic: probability x reproducibility

| Reproducibility      | Action                                                     |
| -------------------- | ---------------------------------------------------------- |
| 100% (deterministic) | Not flake; debug as failure.                               |
| 30–95%               | Triage; classify.                                          |
| < 30%                | Repeat with `--repeat-each=20`; if still rare, quarantine. |
| 0%                   | Already fixed or environment artifact; close.              |

## Why care about classification

Untyped flakes accumulate. After 6 months of "rerun" culture you have 200 tests with hidden bugs and no signal worth trusting. The skill enforces a class per case so the team can plot the distribution and target the worst class first.
