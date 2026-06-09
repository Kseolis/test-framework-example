# SOLID applied to test code

SOLID is a production-code mantra; it works for tests too if you read it pragmatically.

## SRP — Single Responsibility

- One class per page (`LoginPage`, not `AuthPage` doing login + signup + reset).
- One factory file per entity.
- One fixture per concern (pages / api / data / mocks).
- One spec file per feature; one `describe` per behaviour group; one `test` per scenario.

## OCP — Open / Closed

- Page objects expose methods. Adding a new field on the page is a new method, not editing an old one.
- Factories accept overrides + transient params. New variants don't require a new factory.

## LSP — Liskov

- Component objects substitutable across pages: any `HeaderComponent` instance behaves the same way regardless of which page hosts it.
- Avoid inheritance hierarchies that violate substitutability ("AdminLoginPage extends LoginPage but skips MFA" — break.)

## ISP — Interface Segregation

- Fixtures expose narrow types. A spec should only need to declare the fixtures it uses; not be forced to consume a god-fixture.
- Page-object methods take only the params they need; don't accept big "options" bags.

## DIP — Dependency Inversion

- Specs depend on abstractions: `OrdersClient`, `userFactory`, `LoginPage`. They never `import 'axios'` or `import 'pg'`.
- API client wrappers depend on `openapi-fetch` interface, not on a specific URL.
- Storage state path is injected via config, not hardcoded.

## How the reviewer enforces this

- SRP / SoC violations show up as oversized files (LOC threshold).
- DIP violations are caught by `lint-ui-spec.ts` (no axios/fetch in specs).
- ISP violations show up as fixture aggregation imports beyond what a test uses (warning, not blocker).
