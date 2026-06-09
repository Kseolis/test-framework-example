# Project conventions for Claude Code

This file is the thin contract between you (Claude Code) and this repository.
It must stay short — under 300 lines. All deeper knowledge lives in `.claude/skills/*`.

## Stack

- TypeScript + Playwright as the only test framework.
- OpenAPI (`specs/openapi.yaml`) is the single source of truth for the contract.
- Test data uses Fishery + Faker; clients use `openapi-typescript` + `openapi-fetch`; runtime validation via `zod`.

## Layered layout

The repository follows the layout declared in `tests-config.json`. The validators in
`.claude/skills/*/scripts/` enforce the boundaries. Reverse imports across layers are forbidden.

```
specs/  ──>  fixtures/  ──>  pages/, components/, factories/, api/clients/
                       \─>  infra/
factories/  ──>  api/generated (types only)
api/clients/  ──>  api/generated, infra/
```

## Skills index (use these for any non-trivial task)

Foundation:

- `playwright-framework-bootstrap` — scaffold/refactor the layout
- `api-client-from-openapi` — sync the OpenAPI spec → typed client + zod
- `test-data-factory-builder` — Fishery factories per entity
- `fixture-architect` — Playwright fixture composition with proper scoping
- `config-and-secrets` — env loader, multi-env projects, secret stores

Authoring:

- `requirements-to-test-design` — story/PRD → structured test design
- `gherkin-test-case-author` — declarative Gherkin from a design doc
- `playwright-test-author-ui` — UI specs
- `playwright-test-author-api` — API/contract specs

Quality gates:

- `test-code-reviewer` — anti-pattern + SOLID review (use before any commit to tests)
- `playwright-debug-conductor` — root-cause debugging
- `flaky-triage` — flake classification + suggested patches

Analytics:

- `run-analyzer` — run summaries, durations, retries
- `coverage-gap-analyzer` — endpoint × AC × executed tests
- `release-report-composer` — go/no-go executive report

## Subagents

- `test-design-agent` — isolated context for creating a test design.
- `flaky-detective` — proactive flake hunter after retried runs.
- `contract-drift-watch` — read-only diff against the API baseline (Haiku).

## Slash commands

- `/test-new <feature>` — full pipeline: design → cases → code → review.
- `/test-fix <path>` — debug + patch + re-run.
- `/test-review` — review staged tests.
- `/spec-sync` — regenerate OpenAPI artefacts and emit drift report.
- `/flake-hunt [N]` — `--repeat-each=N` then triage.
- `/coverage` — coverage gap report.
- `/release-report <version>` — readiness report.
- `/factory <Entity>` — factory for a specific entity.
- `/page <url>` — page-object scaffold.

## Hooks

`PreToolUse Bash` blocks destructive commands and writes to `tests/api/generated/**` outside the API skill.
`PostToolUse Edit/Write` runs ESLint --fix and Prettier on touched TS files, plus a typecheck of touched files.
`Stop` runs the smoke suite. See `.claude/settings.json`.

## Hard rules (enforced by validators, not just culture)

- Selectors live in page objects. Never inline in specs.
- No `page.waitForTimeout`. Web-first assertions or `expect.poll`.
- No `axios`/`fetch` in specs. Use generated typed clients.
- No `process.env.X` inline. Use `tests/infra/env.ts`.
- Factories never call the network. Side effects live in `seed()`.
- Fixtures always call `await use(...)` and clean up.

## What you should NOT do

- Do not silently retry failing tests. Triage and either fix or quarantine with a ticket.
- Do not auto-heal selectors. Surface the failure for review.
- Do not mix UI and API concerns in a single test.
- Do not duplicate factories per scenario. Use overrides + transient params.

## How to run tests

- Smoke: `npx playwright test --grep '@smoke'`.
- API only: `npx playwright test --project=api`.
- With trace: `npx playwright test --trace=on`.
- UI Mode: `npx playwright test --ui`.
