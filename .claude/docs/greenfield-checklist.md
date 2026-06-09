# Greenfield adoption checklist

A pragmatic week-by-week plan for a brand-new TS+Playwright project that uses the SDET Claude Code kit.

## Pre-flight (before opening Claude Code)

- [ ] Node 20+, npm 10+ installed (`node -v`, `npm -v`).
- [ ] Git installed and configured (`git config user.email`).
- [ ] Claude Code CLI installed and authenticated (`claude --version`).
- [ ] Target repository created or empty directory cloned.

## Sprint 0 (Day 1 — ~2 hours)

The kit drops in, the framework is scaffolded, the first smoke test passes.

- [ ] Run `bash sdet-greenfield-addon/scripts/init.sh` from repo root.
- [ ] Confirm `npm run verify` returns no failures.
- [ ] Open Claude Code: `claude`.
- [ ] Ask: **"Scaffold the test framework folders."** Confirm `playwright-framework-bootstrap` runs.
- [ ] Edit `tests-config.json` if your folder names differ from the default.
- [ ] Copy `.env.example` → `.env.local`. Fill `BASE_URL` at minimum.
- [ ] Ask Claude Code: **"Write a smoke test for the homepage that asserts the page title is correct."**
- [ ] Run `npm run test:smoke`. Iterate until green.
- [ ] First commit: `git add -A && git commit -m "chore: scaffold SDET kit"`.

**Exit criteria:** one green test, hooks active, kit operational.

## Sprint 1 (Week 1)

Build the foundation. Add fixtures, factories, first page objects, real auth.

- [ ] Pick the first user story you actually need to test.
- [ ] Ask: **"Design tests for [story]."** → triggers `test-design-agent`.
- [ ] Review the produced `docs/test-design/<slug>.md`.
- [ ] If using BDD: ask **"Write Gherkin scenarios from the design."** Otherwise skip.
- [ ] Add the first real page object: ask **"Create a page object for the [X] page with these elements: …"**.
- [ ] Add an authenticated `storageState` setup project. Use `references/auth.setup.template.ts` from `fixture-architect`.
- [ ] Add the first factory: **"Create a factory for User with admin transient param."**
- [ ] Write the actual UI test using all the above.
- [ ] Make sure `pre-commit` hook fires and lints staged files.

**Exit criteria:** 3–5 real tests, real fixtures, real factories, pre-commit hook battle-tested.

## Sprint 2 (Week 2)

Light up contract testing once the API exists.

- [ ] Backend team produces `specs/openapi.yaml` (or you document the actual API yourself).
- [ ] Re-enable the OpenAPI skill: edit `tests-config.json` → `openapi.enabled = true`.
- [ ] Ask: **"Sync the OpenAPI spec."** → triggers `api-client-from-openapi`.
- [ ] Verify `tests/api/generated/schema.d.ts` is created.
- [ ] Ask: **"Write API tests for /orders endpoint covering 201, 400, 404."**
- [ ] Add `playwright.config.ts` `api` project pointed at `API_BASE_URL`.
- [ ] First baseline contract snapshot: `cp tests/api/generated/schema.d.ts tests/api/generated/.snapshot/schema.previous.d.ts`.

**Exit criteria:** API tests run via `npm run test:api`. Drift detection works on next spec change.

## Sprint 3 (Week 3)

Quality gates and CI.

- [ ] Add the GitHub Actions workflow: `cp sdet-greenfield-addon/templates/github-workflows/tests.yml .github/workflows/`.
- [ ] Configure repo secrets: `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`.
- [ ] Configure repo vars: `BASE_URL`, `API_BASE_URL`.
- [ ] First CI run on a PR. Address failures.
- [ ] Run `flaky-detective` after the first multi-run to baseline flakiness.
- [ ] Add `@smoke` and `@regression` tags to your tests.

**Exit criteria:** PRs blocked on lint/typecheck/test failures. Reports archived as artifacts.

## Sprint 4 (Week 4)

Analytics + release readiness.

- [ ] After ~2 weeks of CI runs, ask: **"Analyze the run history and surface trends."** → `run-analyzer`.
- [ ] Ask: **"Generate a coverage gap report."** → `coverage-gap-analyzer`.
- [ ] Pre-release: ask: **"Compose a release report for v0.1."** → `release-report-composer`.
- [ ] Optional: integrate Allure / Sentry / TestOps via MCP.

**Exit criteria:** weekly trend reports, gap reports inform sprint planning, release sign-off doc generated automatically.

## Anti-patterns to avoid in greenfield

- ❌ **Don't** write 50 page objects upfront. Let real tests drive the locator inventory.
- ❌ **Don't** mock everything in early E2E. Real backend (staging) gives the most signal.
- ❌ **Don't** chase coverage % before stability. A flaky 90% suite is worse than a stable 40%.
- ❌ **Don't** disable hooks because they fire too often. Tighten the rule, don't silence the alarm.
- ❌ **Don't** commit `.env.local`. The `pre-commit` scanner catches it; do not bypass with `--no-verify`.

## When you outgrow the kit

After ~2 months of real usage, you will accumulate project-specific knowledge that should live as **new** skills:

- Common test patterns specific to your domain → `<your-domain>-test-patterns` skill.
- Custom reporters or data sources → workflow skills.
- Onboarding playbooks → document creation skill.

Use `skill-creator` to scaffold them.
