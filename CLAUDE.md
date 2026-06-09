# Project conventions for Claude Code

This file is the thin contract between you (Claude Code) and this repository.
It must stay short — under 300 lines. All deeper knowledge lives in `.claude/skills/*`.

## Stack

- TypeScript + Playwright as the only test framework. Black-box UI E2E — no backend access.
- This project has **no OpenAPI spec**: the three sites under test are third-party and not ours, so contract testing is N/A (see `docs/CONSTRAINTS.md` §2.1). The `.claude/` kit _supports_ OpenAPI/contract testing (`api-client-from-openapi`, `playwright-test-author-api`, `/spec-sync`) for repos that own a spec, but those capabilities are disabled here.
- Test data uses Fishery + Faker (`SEED=1234`); runtime/env validation via `zod`.

## Layered layout

The repository follows the layout declared in `tests-config.json`. The validators in
`tools/` enforce the boundaries (the `.claude/` kit carries portable copies). Reverse imports
across layers are forbidden. Five layers only — no `components/`, `api/`, `clients/`, `generated/`, `data/`.

```
specs/  ──>  fixtures/  ──>  pages/, factories/, infra/
pages/      ──>  infra/
factories/  ──>  infra/
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

`PreToolUse Bash` → `guard-bash.sh` blocks destructive commands (`rm -rf`, `git push --force`, `sudo`, …).
`PreToolUse Edit|Write` → `guard-paths.sh` blocks writes to `tests/api/generated`, snapshots, and `.env`.
`PostToolUse Edit|Write` → `typecheck-touched.sh` **typechecks** touched files only. ESLint + Prettier run separately, via `lint-staged` in `.husky/pre-commit` — not in this hook.
`Stop` echoes a smoke-test reminder. See `.claude/settings.json`.

## Hard rules (enforced by validators, not just culture)

- Selectors live in page objects. Never inline in specs.
- No `page.waitForTimeout`. Web-first assertions or `expect.poll`.
- No `axios`/`fetch` in specs. Drive the UI through page objects.
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
- By locale: `npx playwright test --grep '@ru'` / `--grep '@en'`.
- With trace: `npx playwright test --trace=on`.
- UI Mode: `npx playwright test --ui`.
