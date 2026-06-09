# Recommended dependency versions

Update with care; pin in `package.json` to `^` minor.

| Package                  | Min version          | Reason                                     |
| ------------------------ | -------------------- | ------------------------------------------ |
| `@playwright/test`       | `^1.50.0`            | web-first assertions, UI mode, traces      |
| `typescript`             | `^5.4.0`             | satisfies operator, const type params      |
| `fishery`                | `^2.2.2`             | sequence + transient params + associations |
| `@faker-js/faker`        | `^9.0.0`             | deterministic seeding                      |
| `openapi-typescript`     | `^7.0.0`             | spec → types                               |
| `openapi-fetch`          | `^0.13.0`            | tiny typed client                          |
| `zod`                    | `^3.23.0`            | runtime contract validation                |
| `dotenv` / `dotenv-flow` | `^16.0.0` / `^4.0.0` | env layering                               |
| `eslint`                 | `^9.0.0`             | flat config                                |
| `husky` + `lint-staged`  | `^9.0.0` / `^15.0.0` | pre-commit gates                           |
