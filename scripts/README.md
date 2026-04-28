# SDET greenfield add-on

Companion pack for `sdet-claude-code-kit`. Closes the gaps that surface on a brand-new TS+Playwright repository: missing `package.json`, no `tsconfig.json`, no ESLint, no `husky`, no CI, no env scaffold, no first-run guidance.

> Use the main kit alone if you already have a TS+Playwright project. Use this add-on **on top of** it for greenfield repos.

## Contents

```
sdet-greenfield-addon/
├── README.md                       # this file
├── docs/
│   └── greenfield-checklist.md     # sprint-by-sprint adoption plan
├── scripts/
│   ├── init.sh                     # one-shot bootstrap (entry point)
│   ├── apply-kit.sh                # copy the SDET kit if init.sh did not find it
│   └── verify.sh                   # repo health check after init
└── templates/
    ├── root/                       # files for the repo root
    │   ├── package.json            # minimal deps + scripts (test, lint, format, spec:sync)
    │   ├── tsconfig.json           # strict + path aliases (@pages, @api, @fixtures, ...)
    │   ├── eslint.config.mjs       # flat config with playwright + custom rules
    │   ├── .prettierrc.json
    │   ├── .env.example            # validated by tests/infra/env.ts
    │   ├── .gitignore
    │   ├── .editorconfig
    │   ├── .nvmrc
    │   └── STARTER.md              # what to do in your first 30 minutes
    ├── vscode/
    │   ├── extensions.json
    │   └── settings.json
    ├── husky/
    │   ├── pre-commit              # lint-staged + UI spec lint + secret scan
    │   └── commit-msg              # Conventional Commits enforce
    └── github-workflows/
        └── tests.yml               # CI: lint, typecheck, sharded Playwright, blob report merge
```

## Two-pack workflow

```
sdet-claude-code-kit/        # the brain — skills, agents, hooks, slash commands
sdet-greenfield-addon/       # the body — package.json, tsconfig, eslint, husky, CI
```

Both are independent. The kit can be used in any TS+Playwright repo. The addon assumes you also use the kit, but it does not force it: every template is opt-in.

## Quick start (greenfield)

```bash
# 1. Get both packs side-by-side
unzip sdet-claude-code-kit.zip
unzip sdet-greenfield-addon.zip

# 2. Create your target repo
mkdir my-tests && cd my-tests

# 3. Bootstrap
bash ../sdet-greenfield-addon/scripts/init.sh
```

`init.sh` performs:

1. `git init` if missing.
2. Copies templates (idempotent — keeps existing files).
3. Discovers and copies the SDET kit.
4. Disables the OpenAPI skill until you have a spec.
5. Runs `npm install`.
6. `npx playwright install chromium`.
7. Sets up husky.
8. Drops `STARTER.md` with next steps.

Then:

```bash
npm run verify      # health check (green = ready)
claude              # open in Claude Code
```

In Claude Code, your first message:

> Scaffold the test framework folders.

This triggers `playwright-framework-bootstrap` from the kit and creates the layered layout.

## What the addon solves

| Gap on greenfield | Addon answer |
|---|---|
| No `package.json` → `npm install` fails | `templates/root/package.json` |
| No `tsconfig.json` → typecheck-touched hook errors | `templates/root/tsconfig.json` with paths |
| No ESLint → no rule-based anti-pattern catch | `eslint.config.mjs` with playwright plugin + custom rules |
| No env scaffolding → secrets leak risk | `.env.example` + `.gitignore` rules + scanner hook |
| No husky → no pre-commit gates | `templates/husky/{pre-commit,commit-msg}` |
| No CI → tests pass locally only | `templates/github-workflows/tests.yml` |
| OpenAPI skill expects a spec → red on day 1 | `init.sh` flips `openapi.enabled = false` |
| No "where do I start" doc | `STARTER.md` + `docs/greenfield-checklist.md` |
| Health checks scattered | `scripts/verify.sh` |

## Idempotency guarantees

- `init.sh` never overwrites an existing file. It only creates missing ones.
- `.gitignore` is merged (sorted, deduped) instead of overwritten.
- Re-running `init.sh` is safe — it will skip already-present files and only do the missing steps.

## Customising

- Don't want husky? Comment out the corresponding block in `init.sh` or delete `.husky/` after init.
- Want different ESLint rules? Edit `eslint.config.mjs` after init — the addon does not enforce updates.
- Want a different CI provider? Replace `templates/github-workflows/tests.yml` with your own.

## Limitations

- Tested mentally, not on a live empty repo. First real run may surface tooling-version mismatches (npm 9 vs 10, Node 18 vs 20). Adjust `engines` in `package.json` if needed.
- Husky 9 changed its API. Templates target husky 9; older versions won't work.
- The CI workflow assumes GitHub Actions. Translate to GitLab/CircleCI manually.

## License

MIT.
