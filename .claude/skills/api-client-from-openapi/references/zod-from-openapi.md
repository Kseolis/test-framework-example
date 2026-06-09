# Zod schemas from OpenAPI

## Rationale

`openapi-typescript` gives us **compile-time** types. For real contract testing we also need **runtime** validators that fail loudly when the live API drifts from the spec. Zod is the de-facto choice in TS test code: composable, narrowable, and integrates with `expect`.

## Generation strategy

1. Walk JSON-Schema components in `specs/openapi.yaml` (`components.schemas.*`).
2. For each schema, emit a Zod definition into `tests/api/generated/zod/<schema>.ts`.
3. Re-export from `tests/api/generated/zod/index.ts`.

We do not generate validators for every operation — only for response shapes referenced by `components.schemas`. Inline schemas inside `responses` are flagged as a spec smell.

## Helper

```ts
// tests/api/contract.ts
import { expect } from '@playwright/test';
import type { ZodSchema } from 'zod';

export function expectMatchesSchema<T>(value: unknown, schema: ZodSchema<T>): asserts value is T {
  const result = schema.safeParse(value);
  if (!result.success) {
    expect.soft(result.success, `Schema mismatch:\n${result.error.format()}`).toBe(true);
    throw result.error;
  }
}
```

## Usage in API spec

```ts
import { OrderSchema } from '@api/generated/zod';
import { expectMatchesSchema } from '@api/contract';

test('GET /orders/:id matches schema', async ({ ordersClient }) => {
  const { data, response } = await ordersClient.getById('order-1');
  expect(response.status).toBe(200);
  expectMatchesSchema(data, OrderSchema);
});
```

## Tools

- `openapi-zod-client` — most popular community generator.
- `ts-to-zod` — for cases where types are already TS first.
- Hand-written for hot paths — sometimes faster and more readable.
