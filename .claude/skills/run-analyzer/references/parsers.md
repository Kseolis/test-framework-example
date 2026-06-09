# Reporter parser notes

## Playwright JSON reporter

Default. Path: `playwright-report/results.json`. Stable shape per Playwright minor; we read defensively (`results.suites`, recursive). Each test has `.results[]` with `status`, `duration`, `errors`, `attachments`.

## JUnit XML

Used by older CI dashboards. Path: `playwright-report/junit.xml`. Parse with `fast-xml-parser`. Less rich (no attachments), but interoperable.

## Allure

If `allure-playwright` is installed:

```
package.json:
  "scripts": { "allure:open": "allure serve ./allure-results" }
playwright.config.ts reporter:
  reporter: [['allure-playwright', { detail: true, suiteTitle: false }]]
```

Generates `allure-results/*.json` per test.

We do NOT prescribe Allure; teams should choose between Playwright HTML (zero-config, excellent traces) and Allure (richer historical trends, larger runtime). Our run-analyzer reads both.

## Custom reporter pattern

For metrics we cannot derive from existing reporters (e.g. memory delta, fixture timing), implement a custom reporter:

```ts
// tools/metrics-reporter.ts
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
export default class MetricsReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult) {
    // append to runs/metrics.jsonl
  }
}
```

Wire via `reporter: [['./tools/metrics-reporter.ts']]` in config.
