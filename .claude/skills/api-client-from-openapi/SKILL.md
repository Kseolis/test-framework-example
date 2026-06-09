---
name: api-client-from-openapi
description: Generates a typed REST API client layer for tests from an OpenAPI/Swagger specification using openapi-typescript + openapi-fetch (default) or orval. Wires zod runtime validators for contract assertions. Use when user mentions OpenAPI, Swagger, API client, generated types, "sync the spec", contract testing, or when paths in tests/api/generated/ are missing or stale. Do NOT use to write business test logic; defer to playwright-test-author-api.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# API Client From OpenAPI

## Trigger

- New endpoints in `specs/openapi.yaml`.
- `tests-config.json.openapi.source` exists but generated dir is empty/stale.
- User says: "regenerate types", "spec changed", "contract drift", "typed API client".

## Decision tree

1. Read `tests-config.json.stack.openapi`.
2. If `openapi-typescript+openapi-fetch` → run `scripts/gen-openapi-fetch.sh`.
3. If `orval` → run `scripts/gen-orval.sh` with `references/orval.config.template.ts`.

## Workflow

1. **Validate spec** via `scripts/validate-spec.sh` (uses `redocly lint`). Halt on errors.
2. **Generate types** to `tests-config.json.openapi.generated` (e.g. `tests/api/generated/schema.d.ts`).
3. **Wrap fetch client** in `tests/api/clients/<resource>Client.ts` with retry/log/baseURL injected from config-and-secrets.
4. **Generate zod schemas** from JSON-Schema (`scripts/openapi-to-zod.ts`).
5. **Add `expectMatchesSchema(response, schema)`** helper in `tests/api/contract.ts`.
6. **Run contract drift check** (`scripts/contract-diff.ts`): compares last committed types snapshot vs new — emits a Markdown report and a non-zero exit if breaking changes are unannotated.

## Anti-patterns this prevents

- `axios` ad-hoc calls in spec files.
- `any` returns from API helpers.
- Tests asserting on snake_case while DTO is camelCase (caught by generated types).
- Spec drift ignored — drift report is required artefact in PR.

## Outputs

- Updated `tests/api/generated/`.
- `CONTRACT_DRIFT.md` if there are diffs.
- Re-export aggregator `tests/api/index.ts`.

## References

- `references/tooling-decision.md` (openapi-typescript vs orval vs swagger-typescript-api)
- `references/zod-from-openapi.md`
- `references/contract-drift-policy.md`
