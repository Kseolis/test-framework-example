---
name: config-and-secrets
description: Manages environment-specific Playwright configuration, secrets, and test data isolation. Wires dotenv-flow / @playwright/test projects per env, enforces no-secrets-in-repo, and validates baseURL injection. Use when user mentions "env config", "staging vs prod", "secrets", "process.env", or when a baseURL/secret is hardcoded in a test or page object. Do NOT use to scaffold the whole framework; that is playwright-framework-bootstrap.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Config & Secrets

## Trigger

- Hardcoded URL/credentials detected by `scripts/scan-hardcoded.sh`.
- User mentions: env, dotenv, secrets, staging, prod, .env.

## Workflow

1. Establish `.env.example` with documented keys, NEVER `.env` itself in repo (verify in `.gitignore`).
2. Use `dotenv-flow` or `dotenv` + `process.env` strict accessor (`tests/infra/env.ts` with `zod` schema).
3. Per environment: define a Playwright `project` with overridden `use.baseURL`.
4. Secrets: integrate with the host secret store (1Password/AWS SM/GH Actions secrets) via `scripts/load-secrets.sh`.
5. Forbid `console.log(process.env...)` via ESLint custom rule.

## Validators

- `scripts/scan-hardcoded.sh`: greps for `https?://`, `password|token|secret|apiKey` literals in `tests/`.
- Returns non-zero with file:line list.

## References

- `references/env.template.ts` (zod-validated env loader)
- `references/multi-env-projects.md`
- `references/secret-stores.md`
