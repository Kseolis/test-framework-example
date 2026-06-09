---
name: requirements-to-test-design
description: Converts user stories, acceptance criteria, or PRDs into a structured test design (equivalence partitioning, boundary values, decision tables, state transitions, pairwise). Outputs a Markdown test design report ready for review BEFORE writing test cases. Use when user provides a user story, requirement, or acceptance criteria, or asks "what should we test", "design tests", "coverage analysis for this story". Do NOT use to write Gherkin or code; that is gherkin-test-case-author / playwright-test-author-*.
allowed-tools: Read, Write, Glob, Grep, WebFetch
---

# Requirements → Test Design

## Trigger

- User pastes a user story, AC, or PRD link.
- User: "design tests for X", "what to test", "test ideas", "coverage gaps before code".

## Output structure (ALWAYS follow this template)

1. **Risks & Quality attributes** (functional, security, perf, a11y, i18n).
2. **Equivalence classes** table.
3. **Boundary values** table (one row per numeric/string-length boundary).
4. **Decision table** (if multiple conditions).
5. **State transitions** (if stateful).
6. **Pairwise combinations** when ≥3 categorical inputs.
7. **Negative scenarios & error paths**.
8. **Out-of-scope** (explicit, with rationale).
9. **Test pyramid placement** for each idea: unit / contract / API / UI / e2e.

## Process

1. Read the story; ask clarifying questions ONLY when AC are ambiguous (max 3 questions).
2. Run `scripts/risk-heuristic.ts` to score each scenario `{prob, impact}`; sort by risk-weighted priority.
3. Save to `docs/test-design/<feature-slug>.md`.

## Anti-patterns prevented

- Jumping straight to Gherkin without a coverage map.
- Missing negative paths.
- "Test everything" (everything-trophy worse than nothing).

## References

- `references/heuristics.md` (Heuristic test strategy + RIMGEN + CRUSSPIC STMPL)
- `references/test-pyramid-vs-trophy.md`
- `references/design-template.md`
