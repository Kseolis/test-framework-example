# Failure taxonomy

Every failed test must end up in exactly one bucket. The bucket determines the fix path.

| Class        | Description                                                     | Fix owner                   |
| ------------ | --------------------------------------------------------------- | --------------------------- |
| **selector** | Locator misses, matches multiple, or matches the wrong element. | SDET                        |
| **timing**   | Assertion fired before stable state.                            | SDET                        |
| **data**     | Test data wrong/missing/leaked.                                 | SDET (factory or fixture)   |
| **env**      | Wrong baseURL, expired secret, broken setup.                    | SDET / DevOps               |
| **app-bug**  | The product genuinely misbehaves.                               | Dev                         |
| **flake**    | Intermittent, root cause unknown.                               | Hand off to flaky-detective |
| **harness**  | Playwright/Node/runner misconfig.                               | SDET / Platform             |

## Decision flow

```
Failure
 ├─ Reproducible alone? ── no ──> flake → flaky-detective
 ├─ yes
 │   ├─ Same on multiple browsers?
 │   │    yes ── reproducible via API client only? ── yes ──> app-bug → BUG.md
 │   │                                              no  ──> timing/selector
 │   │    no  ──> harness / browser-specific
 │   ├─ Wrong data? ──> data
 │   ├─ Wrong baseURL/secret? ──> env
 │   └─ otherwise ──> selector / timing per signals
```

## Anti-pattern: "fix" by retry

Retrying does NOT close any failure class. If the only "fix" you can propose is "increase retries / timeout", reclassify as flake and triage properly.
