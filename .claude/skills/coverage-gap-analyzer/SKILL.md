---
name: coverage-gap-analyzer
description: Cross-references OpenAPI endpoints + UI pages + Gherkin scenarios with executed tests to surface untested paths and uncovered acceptance criteria. Use when user asks "coverage gaps", "what's not tested", "which endpoints have no tests", before a release sign-off. Do NOT use for line/branch coverage of production code (that's a different tool).
allowed-tools: Read, Glob, Grep, Bash
---

# Coverage Gap Analyzer

## Workflow

1. Build inventory:
   - Endpoints: parse `specs/openapi.yaml` for `paths × methods`.
   - Pages: glob `tests-config.json.layout.pages/**/*Page.ts`.
   - AC: parse `docs/test-design/*.md` for "AC-x" tags.
2. Build executed map: parse last `playwright-report/results.json` + spec annotations (`test('... @endpoint:GET /orders @ac:AC-3')`).
3. Diff inventory vs executed.
4. Output `COVERAGE_GAPS.md` with prioritised list (risk × frequency).

## Tagging convention (must follow)

```ts
test('cancel pending order @ac:AC-12 @endpoint:DELETE /orders/{id}', async ({ ... }) => { ... });
```

The skill grep-extracts `@ac:`, `@endpoint:`, `@page:` tags and matches them to the inventory. Untagged tests do not contribute coverage.

## References

- `references/test-tagging-convention.md`
- `references/coverage-template.md`
