# Starter — first 30 minutes after init

You just ran `init.sh`. The repo is now greenfield-ready: scaffolded, dependencies installed, hooks set, kit copied. Here is the shortest path to your first green test.

## 1. Sanity check (1 min)

```bash
npm run verify
```

You should see all green or warnings only. Failures are blocking — fix them before moving on.

## 2. Open in Claude Code (1 min)

```bash
claude
```

Skills auto-discover from `.claude/skills/`. The first message Claude Code sees is `CLAUDE.md`.

## 3. Scaffold the test framework folders (5 min)

In Claude Code:

> Scaffold the test framework folders.

This triggers `playwright-framework-bootstrap`. It will create:

- `tests/{pages,components,fixtures,factories,api,specs,data,infra}/`
- `tests/pages/BasePage.ts`
- `playwright.config.ts`
- Path aliases (`@pages/*`, `@api/*`, …) wired into `tsconfig.json`.

If the agent asks confirmation, say yes.

## 4. Configure environment (3 min)

```bash
cp .env.example .env.local
```

Edit `.env.local` and set at least:

- `BASE_URL` — your application URL (or `http://localhost:3000`).
- `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` — a test user that can log in.

Do not commit `.env.local`. It is gitignored.

## 5. Write your first test (10 min)

In Claude Code:

> Design and write a smoke test that verifies the homepage loads and shows the header.

This pipeline triggers:

1. `requirements-to-test-design` — quick design doc.
2. `playwright-test-author-ui` — actual spec.

Run it:

```bash
npm run test:smoke
```

If green, commit:

```bash
git add -A && git commit -m "test: smoke for homepage"
```

The pre-commit hook will lint and typecheck staged files.

## 6. When you have your first API spec (later)

Create `specs/openapi.yaml` with at least one endpoint, then:

```bash
# Tell Claude Code:  Sync the OpenAPI spec.
# Or run manually:
node -e "const fs=require('fs');const c=JSON.parse(fs.readFileSync('tests-config.json'));c.openapi.enabled=true;fs.writeFileSync('tests-config.json',JSON.stringify(c,null,2)+'\n')"
npm run spec:sync
```

This generates types in `tests/api/generated/` and unlocks `playwright-test-author-api` and the `contract-drift-watch` subagent.

## Common issues

| Symptom                                          | Fix                                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `npx playwright install` fails                   | Run `sudo npx playwright install-deps` (Linux) or skip with `--no-deps`.                           |
| `husky install` fails                            | You need a git repo. `init.sh` runs `git init`, but if you skipped, do it manually.                |
| `tsc` complains about missing `@playwright/test` | `npm install` did not finish. Re-run.                                                              |
| Hook says "tsc-files: command not found"         | `npm install` did not finish. Hooks soft-fail (warning only) — fix when convenient.                |
| Skill fires when you don't expect it             | Check the skill's `description` field. Tighten "Do NOT use when..." block or add a CLAUDE.md note. |

## Next reading

- `CLAUDE.md` — project conventions enforced by skills.
- `SDET_KIT_README.md` — full kit reference (15 skills, 3 subagents, 9 commands).
- `.claude/skills/playwright-framework-bootstrap/references/folder-rationale.md` — why the layout looks like this.
- `docs/greenfield-checklist.md` — sprint-by-sprint adoption plan.
