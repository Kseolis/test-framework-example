import { test, expect } from '@fixtures';
import { userFactory } from '@factories';
import { purchaseVpn, type Offer, type PaymentMethod } from '@support/purchase-flow';
import { reachedPaymentProvider, PAYMENT_BOUNDARY_TIMEOUT } from '@support/payment-boundary';

const PERSONAL_ORIGINS = ['https://personal.freevpnplanet.com'];
const EN_OFFERS: readonly Offer[] = ['1_month', '1_year'];
const EN_METHODS: readonly PaymentMethod[] = ['stripe', 'crypto'];

test.describe('@en Personal VPN purchase — EN (Scenario C)', () => {
  for (const offer of EN_OFFERS) {
    for (const method of EN_METHODS) {
      test(`@en reaches the payment boundary for ${offer} via ${method}`, async ({
        page,
        personalFreeVpnPage,
        paymentMethodsPageFor,
      }) => {
        const user = userFactory.build();

        await purchaseVpn({
          page,
          landing: personalFreeVpnPage,
          payment: paymentMethodsPageFor('personal'),
          offer,
          method,
          email: user.email,
        });

        await expect
          .poll(() => reachedPaymentProvider(page.url(), PERSONAL_ORIGINS), {
            timeout: PAYMENT_BOUNDARY_TIMEOUT,
          })
          .toBe(true);
      });
    }
  }
});
