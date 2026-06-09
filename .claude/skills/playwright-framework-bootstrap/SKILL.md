---
name: playwright-framework-bootstrap
description: Bootstraps or refactors a TypeScript+Playwright repository into a canonical layered architecture (UI/API/Data/Infra/Test). Creates page-objects/, components/, api/, fixtures/, factories/, data/, specs/ with strict boundaries and writes tests-config.json. Use when user starts a new automation project, asks to "set up a framework", "scaffold tests", "refactor folder structure", or when tests-config.json is missing. Do NOT use when only writing a single test or feature; use playwright-test-author-* instead.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Playwright Framework Bootstrap

## When to trigger

- New empty repo or one without `tests-config.json`.
- User says "scaffold", "bootstrap", "set up framework", "structure tests folder".
- Migration from a flat `tests/*.spec.ts` layout.

## When NOT to trigger

- A single test/page-object change → defer to `playwright-test-author-*`.
- Config-only edits → defer to `config-and-secrets`.

## Workflow

1. **Detect state.** Read `package.json`, `playwright.config.ts`, `tsconfig.json`, existing `tests/`. If `tests-config.json` exists, only verify and gap-fill.
2. **Pin layout.** Generate `tests-config.json` from `references/layout.template.json`.
3. **Create directories** matching the config (idempotent).
4. **Install minimal deps** (only if user opts in): `@playwright/test`, `fishery`, `openapi-typescript`, `openapi-fetch`, `zod`, `dotenv`. Confirm versions against `references/deps.lock.md`.
5. **Write `playwright.config.ts`** from `references/playwright.config.template.ts` with: projects per browser, `fullyParallel: true`, `retries: process.env.CI ? 2 : 0`, `reporter: [['list'], ['html', { open: 'never' }]]`, traces `on-first-retry`, screenshots `only-on-failure`.
6. **Write `BasePage.ts`** (locators-only abstract class, NO assertions, NO navigation logic in base).
7. **Validate** with `scripts/validate-layout.sh` (exit 0 required).

## Required outputs

- `tests-config.json` committed.
- `playwright.config.ts`, `tsconfig.json` paths aligned (`@pages/*`, `@api/*`, `@fixtures/*`).
- README diff snippet appended explaining layout.

## Hard rules (enforced by `scripts/validate-layout.sh`)

- No file in `specs/` may import from `pages/*/locators` directly — only via the page class.
- `BasePage` must not import `expect`.
- No two classes named `*Page` outside `pages/`.

## References

- `references/layout.template.json`
- `references/playwright.config.template.ts`
- `references/base-page.template.ts`
- `references/folder-rationale.md` (why each layer exists)

## Composability

- Pairs with `config-and-secrets`, `fixture-architect`, `api-client-from-openapi`.
- Always run BEFORE any `playwright-test-author-*` skill.
