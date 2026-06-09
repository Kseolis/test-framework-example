---
description: Generate a Fishery-based factory for an entity
argument-hint: <EntityName>
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
model: sonnet
---

# Pipeline

1. Use the `test-data-factory-builder` skill.
2. Read the type for `$ARGUMENTS` from `tests/api/generated/schema.d.ts` or fall back to a domain model.
3. Generate `tests/factories/$ARGUMENTS.factory.ts` from `references/factory.template.ts`.
4. Update `tests/factories/index.ts` aggregator.
5. Run `scripts/factory-rules.ts`. Fix until exit 0.
