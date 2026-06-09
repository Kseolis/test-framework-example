---
name: gherkin-test-case-author
description: Authors Gherkin (Given-When-Then) or structured test cases from an existing test design document. Enforces declarative style, single-purpose scenarios, ubiquitous domain language, and correct level of abstraction. Use when a docs/test-design/*.md exists and user says "write test cases", "gherkin", "feature file", "BDD", "scenarios". Do NOT use to author Playwright TypeScript code; defer to playwright-test-author-*.
allowed-tools: Read, Write, Glob, Grep
---

# Gherkin Test Case Author

## Hard rules

- One scenario = one behaviour. If you write `And ... And ... And` more than 3 times, split.
- Use **declarative** language ("user submits the form"), not **imperative** ("user clicks #submit").
- No UI selectors in `.feature`. Selectors live in step definitions / page objects.
- Use `Background` only for setup shared by ALL scenarios in the file. Otherwise factor to fixtures.
- Scenario Outline only when the test logic is identical and only data changes.

## Workflow

1. Read `docs/test-design/<feature>.md`.
2. Generate `tests/specs/<feature>.feature` (or structured TC json if BDD is not used).
3. Run `scripts/gherkin-lint.sh` (gherkin-lint with strict ruleset).

## References

- `references/declarative-vs-imperative.md`
- `references/gherkin-smells.md` (UI leak, "And" abuse, conjunctions, abstract verbs)
- `references/feature.template.feature`
