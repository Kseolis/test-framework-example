import { test, expect } from '@fixtures';
import { userFactory } from '@factories';
import { purchaseVpn, type PaymentMethod } from '@support/purchase-flow';
import { reachedPaymentProvider, PAYMENT_BOUNDARY_TIMEOUT } from '@support/payment-boundary';

const PLANETCONFIG_ORIGINS = ['https://planetconfig.com'];
const RU_METHODS: readonly PaymentMethod[] = ['card_ru', 'stripe'];

test.describe('@ru Personal VPN purchase — RU (Scenario B)', () => {
  for (const method of RU_METHODS) {
    test(`@smoke @ru reaches the payment boundary via ${method}`, async ({
      page,
      planetConfigPage,
      paymentMethodsPageFor,
    }) => {
      const user = userFactory.build();

      await purchaseVpn({
        page,
        landing: planetConfigPage,
        payment: paymentMethodsPageFor('planetconfig'),
        offer: '1_month',
        method,
        email: user.email,
      });

      await expect
        .poll(() => reachedPaymentProvider(page.url(), PLANETCONFIG_ORIGINS), {
          timeout: PAYMENT_BOUNDARY_TIMEOUT,
        })
        .toBe(true);
    });
  }

  test.fixme('@ru crypto gateway is not exposed on planetconfig.com — see docs/ux-findings.md', async () => {});
});
