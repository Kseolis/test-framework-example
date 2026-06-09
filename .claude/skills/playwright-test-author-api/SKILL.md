---
name: playwright-test-author-api
description: Writes Playwright API/contract tests using the typed OpenAPI client and zod schemas. Enforces request/response schema validation, idempotent setup, status-code + body assertions, and contract-driven negative tests. Use when user asks for an API test, "test the endpoint", "verify response schema", "contract test", "negative test for API". Do NOT use for UI flows; defer to playwright-test-author-ui.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Playwright Test Author — API

## Hard rules

- Use generated client (`tests/api/clients/*`) — no `fetch()`/`axios` directly in spec.
- ALWAYS validate response body via the corresponding `zod` schema (auto-generated from OpenAPI).
- Cover: happy path, schema integrity, auth boundary, validation errors per AC, idempotency where applicable.
- Each test must clean up its data (or use a per-test factory tag).
- 5xx → flaky → mark `test.fail()` with TODO ticket, do NOT silently retry.

## Workflow

1. Read endpoint definition in `specs/openapi.yaml` (path, methods, params, responses).
2. Read corresponding test design — pick scenarios tagged for `api` layer.
3. Author test in `tests/specs/api/<resource>/<endpoint>.spec.ts` using `references/api-spec.template.ts`.
4. Run `scripts/lint-api-spec.ts` until exit 0.
5. Run target spec: `npx playwright test tests/specs/api/<resource> --project=api`.

## Test matrix per endpoint (minimum)

- Happy path: valid request → success status + schema.
- Auth boundary: missing/invalid token → 401/403.
- Validation: each required field individually omitted → 4xx.
- Boundary values: numeric/length min/max ± 1.
- Idempotency: repeating the same request (where applicable) yields the same result.
- Negative: forbidden role, deleted resource, version conflict.

## References

- `references/contract-test-patterns.md`
- `references/idempotency-strategies.md`
- `references/error-taxonomy.md`
- `references/api-spec.template.ts`
