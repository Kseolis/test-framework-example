import { test, expect } from '@fixtures';
import { userFactory } from '@factories';
import type { PaymentMethodsPage } from '@pages/PaymentMethodsPage';
import type { PersonalOffer } from '@pages/PersonalFreeVpnPage';

const PERSONAL_ORIGIN = 'https://personal.freevpnplanet.com';

const PLANS: readonly PersonalOffer[] = ['1_month', '1_year'] as const;
const METHODS = ['stripe', 'crypto'] as const;
type Method = (typeof METHODS)[number];

test.describe('@en Personal VPN purchase — EN (Scenario C)', () => {
  for (const offer of PLANS) {
    for (const method of METHODS) {
      test(`${offer} × ${method} reaches payment boundary`, async ({
        personalFreeVpnPage,
        paymentMethodsPageFor,
        paymentRedirectPage,
        page,
      }) => {
        const user = userFactory.build();

        // Arrange + Act — landing form
        await personalFreeVpnPage.goto();
        await personalFreeVpnPage.selectOffer(offer);
        await personalFreeVpnPage.emailInput().fill(user.email);
        await personalFreeVpnPage.submitButton().click();

        // Act — payment-method selection step
        await expect(page).toHaveURL(/personal\.freevpnplanet\.com\/payment\//);
        const paymentMethods = paymentMethodsPageFor('personal');
        await selectMethod(paymentMethods, method);
        await paymentMethods.acceptTerms();
        await paymentMethods.submitButton().click();

        // Assert — STOP at payment-provider boundary; never enter card / wallet data
        await expect
          .poll(() => paymentRedirectPage.hasReachedPaymentBoundary([PERSONAL_ORIGIN]), {
            timeout: 15_000,
          })
          .toBe(true);
      });
    }
  }
});

async function selectMethod(paymentMethods: PaymentMethodsPage, method: Method): Promise<void> {
  if (method === 'crypto') {
    await paymentMethods.selectCrypto('BTC');
  } else {
    await paymentMethods.selectGateway('stripe');
  }
}
