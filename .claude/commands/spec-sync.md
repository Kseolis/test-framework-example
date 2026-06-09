---
description: Sync OpenAPI spec → typed clients → drift report
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

# Context

- Spec: @specs/openapi.yaml
- Generated: @tests/api/generated/

# Pipeline

1. Use the `api-client-from-openapi` skill.
2. Validate spec via `scripts/validate-spec.sh`.
3. Regenerate types via `scripts/gen-openapi-fetch.sh`.
4. Run `scripts/contract-diff.ts`. If breaking, write `CONTRACT_DRIFT.md` and stop.
5. Update affected client wrappers in `tests/api/clients/`.
6. Suggest test updates for breaking changes (do not auto-edit).
