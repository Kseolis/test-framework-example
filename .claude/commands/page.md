---
description: Scaffold a new page object class
argument-hint: <PageName>
allowed-tools: Read, Write, Edit, Glob, Grep
model: sonnet
---

# Pipeline

1. Use the `playwright-framework-bootstrap` skill (page-object generator portion).
2. Generate `tests/pages/$ARGUMENTS.ts` extending `BasePage`. No `expect`, no hardcoded URL, locators-only by default.
3. Update `tests/pages/index.ts` aggregator.
4. Run `lint-page-object.ts` from `test-code-reviewer`. Fix until exit 0.
