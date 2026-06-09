---
name: test-code-reviewer
description: Reviews changed test code for anti-patterns (hard waits, brittle selectors, leaky fixtures, shared state, DRY abuse, missing assertions, snapshot abuse) and SOLID violations. Outputs a structured review with severity. MUST BE USED before committing or opening a PR with test changes; also use when user says "review my test", "is this test ok", "audit /tests". Do NOT use for production (non-test) code.
allowed-tools: Read, Grep, Glob, Bash
---

# Test Code Reviewer

## Process

1. `git diff --staged --name-only -- 'tests/**'` (or use `$ARGUMENTS` for ad-hoc paths).
2. For each file run the matching validator(s):
   - `scripts/lint-ui-spec.ts` (from playwright-test-author-ui)
   - `scripts/lint-page-object.ts` (here)
   - `scripts/fixture-rules.ts` (from fixture-architect)
   - `scripts/factory-rules.ts` (from test-data-factory-builder)
   - `tsc --noEmit`
   - `eslint --ext .ts tests/`
3. Aggregate findings into table:
   | File:Line | Severity (blocker/major/minor) | Anti-pattern | Fix |
4. NEVER auto-fix; suggest. Block commit (exit 2) if any blocker.

## Anti-patterns checklist (excerpt — full list in references/)

- `page.waitForTimeout` → blocker
- `page.locator('css=...')` or `xpath=` → major
- `expect(...).toEqual(snapshot)` on dynamic content → major
- Test depending on previous test order → blocker
- Fixture without cleanup → major
- `test.use({ storageState })` per-test for unrelated session → minor
- Inline domain object literal as data → minor (factory candidate)
- `if/else` inside `test()` body → major (split scenarios)
- `console.log` in spec → minor
- Hardcoded sleep ≥ 1000ms → blocker

## References

- `references/aqa-anti-patterns.md` (the full catalogue)
- `references/solid-in-tests.md`
- `references/damp-vs-dry-in-tests.md`
- `references/review-template.md`
