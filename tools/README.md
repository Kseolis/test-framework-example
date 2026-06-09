# `tools/` — this repo's quality gates

These scripts mechanically enforce the layered architecture described in
[`../CLAUDE.md`](../CLAUDE.md) and [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).
They turn the "hard rules" from prose into checks that fail the build, so the
boundaries can't quietly erode.

Run them all at once:

```bash
npm run validate     # layout + factory + fixture + spec checks
npm run verify       # repo health check (tooling, files, kit, no leaked secrets)
```

| Script               | What it guards                                                                                                                                                 | Invoked by                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `validate-layout.sh` | specs don't import locators directly, `BasePage` has no `expect`, `*Page` classes live only under `tests/pages/`, no raw `axios`/`fetch` in specs              | `npm run validate`, `.husky/pre-commit`, CI |
| `lint-ui-spec.ts`    | no `waitForTimeout`, no XPath, no raw HTTP client, no inline page-object construction, no stray `console.log`/`setTimeout` (severity-graded: blocker → exit 2) | `npm run validate`, `.husky/pre-commit`, CI |
| `factory-rules.ts`   | factories stay pure: no network, no `Date.now()`/`Math.random()` (determinism), no inheritance, no top-level mutable state                                     | `npm run validate`, CI                      |
| `fixture-rules.ts`   | every fixture calls `await use(...)`, no name collisions with Playwright built-ins, worker/test scope sanity                                                   | `npm run validate`, CI                      |
| `verify.sh`          | repo health check: tooling present, required files exist, the `.claude/` kit is intact, no `.env` committed                                                    | `npm run verify`                            |

All scripts read paths from [`../tests-config.json`](../tests-config.json) and exit
non-zero on violation (`0` = pass).

## Relationship to the `.claude/` kit

The same validators ship inside the [`.claude/` SDET kit](../.claude/) as
self-contained skill templates (e.g.
`.claude/skills/playwright-test-author-ui/scripts/lint-ui-spec.ts`), so each skill
remains portable into any TS + Playwright repo. The copies here in `tools/` are
**this repository's wired-in, active gates** — referenced by `package.json`,
the pre-commit hook, and CI. The kit is the source/template; `tools/` is the
running instance.
