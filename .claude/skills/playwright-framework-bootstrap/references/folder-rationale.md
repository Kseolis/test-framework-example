# Folder rationale

The layered layout exists to enforce SRP and DIP at the file-system level. Skills validate that imports cross layers in one direction only.

| Folder              | Responsibility                                                                       | Forbidden inside                                      |
| ------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `tests/pages/`      | Page objects: locators + behaviours per page. One class per page.                    | `expect`, hardcoded URLs, business assertions         |
| `tests/components/` | Component objects shared across multiple pages (header, footer, modal).              | Cross-page navigation logic                           |
| `tests/api/`        | API client layer. `generated/` for OpenAPI artefacts, `clients/` for typed wrappers. | `axios`, raw `fetch` outside generated/clients        |
| `tests/fixtures/`   | Playwright `test.extend` composition. DI for tests.                                  | Domain logic, factories                               |
| `tests/factories/`  | Test data factories (Fishery + Faker). One file per entity.                          | Network calls, side effects                           |
| `tests/specs/`      | The actual tests. AAA / Given-When-Then.                                             | Locators (must come from pages), inline data literals |
| `tests/data/`       | Static JSON fixtures (golden files, schema samples).                                 | Generated code                                        |
| `tests/infra/`      | env loader, logger, base helpers.                                                    | Domain entities                                       |

## Import direction (allowed)

```
specs/  ──>  fixtures/  ──>  pages/, components/, factories/, api/clients/
                       \─>  infra/
factories/  ──>  api/generated (types only)
api/clients/  ──>  api/generated, infra/
```

Reverse imports are forbidden. The `validate-layout.sh` script greps imports and exits non-zero on violations.

## Why so many layers?

- Page objects encode "where" — locators and primitive interactions.
- Components encode reuse across pages.
- Fixtures encode "what is available in a test" — DI container.
- Factories encode "what data the test needs" — independent of how it's persisted.
- API clients encode "how to talk to the system" — typed and contract-aware.
- Specs encode "what behaviour we verify" — declarative, AAA, no mechanics.

Mixing these is the #1 source of brittleness in real-world Playwright suites.
