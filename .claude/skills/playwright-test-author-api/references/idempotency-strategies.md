# Idempotency strategies

## Why we test it

POST endpoints that mutate state must be idempotent under retries. Otherwise a network blip duplicates orders, charges, or messages.

## Strategies

| Strategy                 | Where applicable                              | Test approach                                                                 |
| ------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------- |
| `Idempotency-Key` header | Stripe-style APIs, payment / order creation   | Send same key twice; assert same id, second response 200 not 201.             |
| Natural unique key       | Resource has a unique constraint (email, sku) | Send same payload twice; second returns 409 Conflict OR 200 with existing id. |
| Server-side dedup window | Messaging / events                            | Send same payload twice within window; assert one record.                     |
| At-most-once via locking | Cron-triggered jobs                           | Out of scope for API tests.                                                   |

## Test template

```ts
test('retrying with the same Idempotency-Key returns the same resource', async ({
  ordersClient,
  seededUser,
}) => {
  const draft = orderFactory.build({ userId: seededUser.id });
  const key = crypto.randomUUID();

  const first = await ordersClient.create(draft, { idempotencyKey: key });
  expect(first.response.status).toBe(201);

  const retry = await ordersClient.create(draft, { idempotencyKey: key });
  expect(retry.response.status).toBe(200); // not a new resource
  expect(retry.data.id).toBe(first.data.id);
});
```

## Negative case

Different payload + same key → must NOT silently overwrite.

```ts
test('different payload with same key fails', async ({ ordersClient, seededUser }) => {
  const key = crypto.randomUUID();
  const a = orderFactory.build({ userId: seededUser.id });
  const b = orderFactory.build({ userId: seededUser.id });

  await ordersClient.create(a, { idempotencyKey: key });
  const conflict = await ordersClient.create(b, { idempotencyKey: key });

  expect(conflict.response.status).toBeGreaterThanOrEqual(400);
});
```
