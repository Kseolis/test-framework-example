# Test pyramid vs testing trophy

## Pyramid (Mike Cohn, ~2009)

```
     /\        E2E      few, slow, full stack
    /--\       Integration
   /----\      Unit      many, fast, isolated
  /------\
```

Bias: many cheap unit tests, few expensive E2E.

## Trophy (Kent C. Dodds, ~2018)

```
        /\        E2E
       /  \       Integration  (the bulk)
      /----\      Unit
     /______\     Static (TS, ESLint)
```

Bias: integration tests give the best ROI, because they reflect the way users actually use the system, while staying fast enough to run thousands.

## Where each test lives in our setup

| Layer             | Tooling                                                     | Owner      |
| ----------------- | ----------------------------------------------------------- | ---------- |
| Static            | TypeScript, ESLint, type-coverage, openapi-typescript types | dev + SDET |
| Unit              | Vitest/Jest in product repo                                 | dev        |
| Contract          | Playwright API tests with zod schema asserts                | SDET       |
| Integration / API | Playwright API project                                      | SDET       |
| Component / UI    | Playwright with mocked backend                              | SDET       |
| E2E               | Playwright UI project, real services in staging             | SDET       |

## Practical guidance

- For each test idea from `requirements-to-test-design`, place it on the lowest layer that can detect the failure cheaply.
- Duplicate **only** for safety nets that justify the maintenance: a critical login flow can have unit + integration + E2E checks.
- Use static analysis as ruthlessly as possible — every test you don't have to write is a win.
- Don't equate "integration" with "slow". Playwright's API project is often faster than Jest with heavy mocks.
