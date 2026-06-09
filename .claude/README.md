# SDET Claude Code Kit — TypeScript + Playwright (contract-first)

A composable set of **15 skills**, **3 subagents**, **9 slash commands** and **3 hooks** for Claude Code that turns a TS+Playwright repository into a SDET / Test Architect workspace. Designed around progressive disclosure, deterministic validators, and OpenAPI as the single source of truth.

> Companion artefact: see the full architectural blueprint in the `docs/` of the originating chat (or paste the markdown into your repo).

## What is in this kit

```
.claude/
├── settings.json                    # hooks configuration
├── skills/                          # 15 skills, each with SKILL.md + scripts/ + references/
│   ├── playwright-framework-bootstrap/
│   ├── api-client-from-openapi/
│   ├── test-data-factory-builder/
│   ├── fixture-architect/
│   ├── config-and-secrets/
│   ├── requirements-to-test-design/
│   ├── gherkin-test-case-author/
│   ├── playwright-test-author-ui/
│   ├── playwright-test-author-api/
│   ├── playwright-debug-conductor/
│   ├── test-code-reviewer/
│   ├── flaky-triage/
│   ├── run-analyzer/
│   ├── coverage-gap-analyzer/
│   └── release-report-composer/
├── agents/
│   ├── test-design-agent.md         # isolated context for test design
│   ├── flaky-detective.md           # post-run flake hunter
│   └── contract-drift-watch.md      # haiku-cheap drift checker
├── commands/                        # 9 slash commands (/test-new, /test-fix, /test-review, …)
└── hooks/
    ├── guard-bash.sh                # blocks rm -rf, force push, hard reset on protected branches
    ├── guard-paths.sh               # blocks edits to generated/, .env, node_modules/
    └── typecheck-touched.sh         # tsc --noEmit per touched file
CLAUDE.md                            # thin project conventions (≤ 300 lines)
tests-config.json                    # single source of layout truth
```

## Install

1. Drop `.claude/`, `CLAUDE.md`, and `tests-config.json` into the root of your TS+Playwright repo.
2. Make scripts executable (already done in this archive):
   ```bash
   chmod +x .claude/hooks/*.sh .claude/skills/*/scripts/*.sh .claude/skills/*/scripts/*.ts
   ```
3. Open the repo in Claude Code (`claude`). Verify skills are listed in `/skills`.
4. Adjust `tests-config.json` if your layout differs.

## How it works

- **Skills** (`.claude/skills/*`) auto-trigger via their `description` frontmatter. Each skill lints its own outputs through `scripts/*` validators that exit non-zero on violations.
- **Subagents** (`.claude/agents/*`) run with isolated context and minimal tools — invoke them when the main thread should not be polluted (test design, flake forensics, contract diff).
- **Slash commands** (`.claude/commands/*`) compose multiple skills into pipelines: `/test-new`, `/test-fix`, `/test-review`, `/spec-sync`, `/flake-hunt`, `/coverage`, `/release-report`, `/factory`, `/page`.
- **Hooks** (`.claude/hooks/*`) execute deterministic guards (Bash safety, path protection, typecheck) that should never be left to the LLM.

## Quick start

```bash
# In Claude Code:
/test-new coupon-apply       # full SDET pipeline from a user story
/spec-sync                   # regenerate OpenAPI types and drift report
/flake-hunt 20               # hunt flaky tests via 20 reruns + triage
/test-review                 # review staged test changes
/release-report v1.42.0      # executive release readiness summary
```

## Contract-first workflow (how it ties together)

```
specs/openapi.yaml
   │
   │  api-client-from-openapi  →  tests/api/generated/{schema.d.ts, zod/}
   │  contract-drift-watch     →  CONTRACT_DRIFT.md
   ▼
tests/factories/*.factory.ts   ←  test-data-factory-builder (uses generated types)
   │
   ▼
tests/api/clients/*Client.ts   ←  fixtures/api.ts  (DI)
                                  ↑
                                  fixture-architect
   ▼
tests/specs/api/**/*.spec.ts   ←  playwright-test-author-api  (asserts via zod schemas)
tests/specs/**/*.spec.ts       ←  playwright-test-author-ui
                                  ↓
                                  test-code-reviewer  (gates the PR)
                                  ↓
                                  run-analyzer + coverage-gap-analyzer + flaky-triage
                                  ↓
                                  release-report-composer
```

## Sprint roadmap (recommended)

- **Sprint 0** — Foundation: bootstrap, config-and-secrets, fixture-architect, factory-builder, api-client-from-openapi, hooks, CLAUDE.md, tests-config.json.
- **Sprint 1** — Authoring: requirements-to-test-design, gherkin-author, playwright-test-author-ui/-api, slash commands `/test-new`, `/factory`, `/spec-sync`.
- **Sprint 2** — Quality gates: test-code-reviewer, debug-conductor, flaky-triage, slash commands `/test-fix`, `/test-review`, `/flake-hunt`.
- **Sprint 3** — Analytics: run-analyzer, coverage-gap-analyzer, release-report-composer; subagent `contract-drift-watch`; GitHub MCP integration.
- **Sprint 4** — Advanced: Playwright MCP for exploratory loops, self-healing pipeline (flaky-detective → GitHub issue), custom Allure reporter.

## Customising

- **Different layout?** Edit `tests-config.json`. All skills read from it.
- **GraphQL or gRPC?** Add a parallel skill (e.g. `asyncapi-client-builder`) following the same template structure. Reuse factory and fixture skills.
- **Different model preferences?** Each skill respects the host Claude Code model setting; subagents pin their model in frontmatter.

## Anti-patterns this kit prevents

- `page.waitForTimeout(N)` and other hard waits → blocked by `lint-ui-spec.ts`.
- CSS/XPath selectors in specs → blocked by `lint-ui-spec.ts` and `test-code-reviewer`.
- Hardcoded URLs/secrets → blocked by `scan-hardcoded.sh` and the path hook.
- Inline data literals as test data → factory-builder rewrites to `factory.build()`.
- Page object instantiated inside a test → fixture-architect lifts it.
- Spec drift between API and tests → `contract-diff.ts` blocks the PR.

See `.claude/skills/test-code-reviewer/references/aqa-anti-patterns.md` for the full catalogue.

## Caveats

- The validators are heuristic, not full AST analysis. They favour false positives over false negatives.
- Hooks execute shell with the user's privileges. Audit them before sharing across teams.
- Playwright MCP is intentionally NOT wired in by default — the CLI + skills loop is far cheaper for repeated automation tasks. Wire MCP for exploratory or self-healing flows separately.
- The skill descriptions are tuned for Claude Code; transferring to Claude.ai requires re-checking trigger phrases.

## License

MIT.
