/**
 * AAA / Given-When-Then template for a Playwright UI spec.
 *
 *  - Arrange: data + auth + navigation, all via fixtures.
 *  - Act:     a single user-meaningful action.
 *  - Assert:  outcome the user observes; web-first matchers.
 */
import { test, expect } from '@fixtures';
import { orderFactory } from '@factories/order.factory';

test.describe('Order cancellation', () => {
  test('user can cancel their own pending order', async ({
    seededUser,
    ordersClient,
    dashboardPage,
  }) => {
    // Arrange
    const order = await ordersClient.create(orderFactory.build({ userId: seededUser.id }));
    await dashboardPage.goto();

    // Act
    await dashboardPage.orders.cancelByReference(order.reference);

    // Assert
    await expect(dashboardPage.orders.statusOf(order.reference)).toHaveText(/cancelled/i);
    const refreshed = await ordersClient.getById(order.id);
    expect(refreshed.data?.status).toBe('cancelled');
  });
});
