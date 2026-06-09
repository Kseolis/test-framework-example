/**
 * Template for an API/contract spec.
 * Demonstrates the canonical structure: client + factory + schema validator.
 */
import { test, expect } from '@fixtures';
import { OrderSchema, OrderListSchema } from '@api/generated/zod';
import { expectMatchesSchema } from '@api/contract';
import { orderFactory } from '@factories/order.factory';

test.describe('POST /orders', () => {
  test('@smoke creates an order and returns it matching the schema', async ({
    ordersClient,
    seededUser,
  }) => {
    const draft = orderFactory.build({ userId: seededUser.id });

    const { data, response } = await ordersClient.create(draft);

    expect(response.status).toBe(201);
    expectMatchesSchema(data, OrderSchema);
    expect(data.userId).toBe(seededUser.id);
  });

  test('rejects request without required field with a 422 and structured error', async ({
    ordersClient,
    seededUser,
  }) => {
    const invalid = orderFactory.build({ userId: seededUser.id, items: [] });

    const { data, response } = await ordersClient.create(invalid);

    expect(response.status).toBe(422);
    expect(data).toMatchObject({
      code: 'validation_error',
      fields: expect.arrayContaining(['items']),
    });
  });

  test('returns 401 when called anonymously', async ({ anonClient }) => {
    const draft = orderFactory.build();
    const { response } = await anonClient.orders.create(draft);
    expect(response.status).toBe(401);
  });
});

test.describe('GET /orders', () => {
  test('paginates correctly with limit and cursor', async ({ ordersClient, seededUser }) => {
    // Arrange — seed 5 orders deterministically
    for (const draft of orderFactory.buildList(5, { userId: seededUser.id })) {
      await ordersClient.create(draft);
    }

    const page1 = await ordersClient.list({ userId: seededUser.id, limit: 2 });
    expect(page1.response.status).toBe(200);
    expectMatchesSchema(page1.data, OrderListSchema);
    expect(page1.data.items).toHaveLength(2);

    const page2 = await ordersClient.list({
      userId: seededUser.id,
      limit: 2,
      cursor: page1.data.nextCursor,
    });
    expect(page2.data.items).toHaveLength(2);
    expect(page2.data.items[0].id).not.toBe(page1.data.items[0].id);
  });
});
