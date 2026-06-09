---
description: New test pipeline (design → cases → code → review)
argument-hint: <feature-slug>
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

# Context

- Story (if exists): @docs/stories/$ARGUMENTS.md
- Layout: @tests-config.json
- Existing pages: !`ls tests/pages 2>/dev/null | head -50`
- Existing factories: !`ls tests/factories 2>/dev/null | head -30`

# Pipeline

1. Use the `requirements-to-test-design` skill on `$ARGUMENTS`. Save to `docs/test-design/$ARGUMENTS.md`.
2. Use `gherkin-test-case-author` on the design. Save `tests/specs/$ARGUMENTS.feature` (or skip if BDD is not configured).
3. Decompose scenarios into UI vs API tests. Use `playwright-test-author-ui` and/or `playwright-test-author-api` accordingly.
4. Wire missing factories via `test-data-factory-builder` and missing fixtures via `fixture-architect`.
5. Use `test-code-reviewer`. Do NOT finish until exit 0.
6. Run target tests; if any retry hits the limit, hand off to `playwright-debug-conductor`.
