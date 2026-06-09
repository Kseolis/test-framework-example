# Contract test patterns

## 1. Schema integrity (every successful response)

```ts
expect(response.status).toBe(200);
expectMatchesSchema(data, OrderSchema);
```

Catches: drift, accidental field renames, type widening, removed fields. If the spec is the source of truth and the live API drifts, this assertion fires before any business logic test.

## 2. Required-field validation (per AC)

For each required field declared in the OpenAPI schema, assert that omitting it yields a 4xx with a structured error. Generate these tests programmatically when feasible:

```ts
for (const required of ['userId', 'items']) {
  test(`returns 422 when ${required} is missing`, async ({ ordersClient }) => {
    const { [required]: _, ...partial } = orderFactory.build();
    const { data, response } = await ordersClient.create(partial as never);
    expect(response.status).toBe(422);
    expect(data.fields).toContain(required);
  });
}
```

## 3. Auth boundary

Always include 401 (anonymous) and 403 (wrong role) tests. Do NOT collapse them into a single parameterised case — they exercise different code paths in the backend.

## 4. Idempotency

For POST endpoints declaring `Idempotency-Key`:

```ts
const key = crypto.randomUUID();
const r1 = await ordersClient.create(draft, { idempotencyKey: key });
const r2 = await ordersClient.create(draft, { idempotencyKey: key });
expect(r1.data.id).toBe(r2.data.id);
expect(r2.response.status).toBe(200); // not 201 on the second call
```

## 5. Pagination boundaries

- limit = 0 (if allowed) or limit = 1.
- limit = max-1, max, max+1 (spec must say what max is).
- cursor pointing past the end → empty list, valid schema.
- cursor that has been deleted → graceful behaviour per AC.

## 6. Long polling / async

If an endpoint kicks off async work, the test polls a status endpoint with `expect.poll`, never `setInterval`.

## 7. Pact-style consumer tests

For services consumed by other services, contract tests are bi-directional. We integrate via Pact files in CI; this is out of scope for skill-driven authoring but the spec format we produce is compatible.
