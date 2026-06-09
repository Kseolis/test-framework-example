# OpenAPI tooling decision

## TL;DR

For TypeScript+Playwright **test** clients we default to `openapi-typescript` + `openapi-fetch` + `zod`. The combo is the lightest, type-only at compile time, and lets us bolt on runtime validation per-endpoint.

## Comparison

| Tool                                   | Output                                        | Bundle size    | Strengths                                               | Weaknesses                                          |
| -------------------------------------- | --------------------------------------------- | -------------- | ------------------------------------------------------- | --------------------------------------------------- |
| `openapi-typescript` + `openapi-fetch` | `.d.ts` types + tiny fetch wrapper            | ≈ 6 KB runtime | Treeshakable, idiomatic, no boilerplate, fastest builds | No runtime validation built-in; we add `zod`        |
| `orval`                                | Full TS clients (axios/fetch), Zod, MSW mocks | Larger         | One-stop: types + clients + mocks + validators          | Heavier config, slower codegen, harder tree-shaking |
| `swagger-typescript-api`               | Class-style clients                           | Medium         | Good for legacy Swagger 2.x                             | Less active, opinionated class-style API            |

## When to choose orval over the default

- You need MSW mocks generated alongside types (UI dev mode).
- You want runtime Zod validators auto-generated (no manual step).
- The team is already on orval in the production codebase and unification matters.

## When to choose `openapi-typescript`

- Test-only consumer; minimal blast radius.
- You want explicit control over which endpoints produce zod validators (avoid mass schema generation).
- Build performance is a constraint (large mono-spec).

## Folder layout

```
tests/api/
├── generated/
│   ├── schema.d.ts          # openapi-typescript output
│   └── zod/                 # openapi-to-zod generated (per resource)
├── clients/
│   ├── ordersClient.ts      # typed wrapper using openapi-fetch
│   └── usersClient.ts
├── contract.ts              # expectMatchesSchema() helper
└── index.ts                 # re-exports
```
