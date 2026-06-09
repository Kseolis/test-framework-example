---
name: test-data-factory-builder
description: Designs and writes type-safe test data factories using Fishery + Faker, sourced from OpenAPI-generated types. Enforces Builder/Factory patterns, transient params, sequences, and association helpers. Use when the user creates new test data, mentions "factory", "fixture data", "seed user", "fake data", or when a spec uses object literals as test data instead of factories. Do NOT use to define Playwright fixtures (those are in fixture-architect).
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Test Data Factory Builder

## Trigger

- Spec contains an inline object literal that looks like a domain entity (`const user = { email: 'x@y.com', ... }`).
- User: "create factory", "build data", "seed", "fake user".

## Workflow

1. Read target type from `tests/api/generated/schema.d.ts` (or local model). Reject if type is `any`.
2. Generate `tests/factories/<entity>.factory.ts` from `references/factory.template.ts`:
   - `Factory.define<Entity, TransientParams>(...)`.
   - `sequence` for unique fields.
   - `Faker.locale = 'en'` deterministic seed when `process.env.SEED` is set (idempotency).
   - `transientParams` for boolean toggles like `{ admin: true }`.
   - `afterBuild` for relations.
3. Add `tests/factories/index.ts` aggregator.
4. Validate with `scripts/factory-rules.ts` (no top-level `Date.now()`, no hidden network calls, no shared mutable state).

## Hard rules

- Never call API or DB inside `Factory.define`. Side effects belong to a separate `seed()` helper.
- Never expose constructor dependencies; everything via params/transient.
- One factory file = one entity. Composition via `associations`, not inheritance.

## DAMP guidance

Prefer overrides at the call site (`userFactory.build({ role: 'admin' })`) over creating `userAdminFactory`. Multiple thin factories beat one mega-factory with switch logic.

## References

- `references/fishery-patterns.md` (transient params, sequence rewind, afterBuild)
- `references/faker-determinism.md`
- `references/builder-vs-factory.md`
