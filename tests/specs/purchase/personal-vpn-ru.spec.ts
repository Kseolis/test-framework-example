import { test, expect } from '@fixtures';
import { userFactory } from '@factories';
import type { Gateway } from '@pages/PaymentMethodsPage';

const PLANETCONFIG_ORIGIN = 'https://planetconfig.com';

/**
 * Site B (planetconfig.com) exposes these gateways on /payment/:
 * card_ru | 1Payment?i=4 | sber | yoomoney | stripe.
 *
 * The assignment requires testing crypto on this site, but no crypto
 * gateway was exposed at the time of inspection (see docs/ux-findings.md).
 * We exercise two distinct methods — RU bank cards + international Stripe —
 * and surface the crypto gap via Playwright's deferred-test mechanism below.
 */
const GATEWAYS_TO_TEST: readonly Gateway[] = ['card_ru', 'stripe'] as const;

test.describe('@ru Personal VPN purchase — RU (Scenario B)', () => {
  for (const gateway of GATEWAYS_TO_TEST) {
    test(`@smoke 1 month → ${gateway} reaches payment boundary`, async ({
      planetConfigPage,
      paymentMethodsPageFor,
      paymentRedirectPage,
      page,
    }) => {
      const user = userFactory.build();

      // Arrange + Act — landing form
      await planetConfigPage.goto();
      await planetConfigPage.selectOffer('1_month');
      await planetConfigPage.emailInput().fill(user.email);
      await planetConfigPage.submitButton().click();

      // Act — payment-method selection step
      await expect(page).toHaveURL(/planetconfig\.com\/payment\//);
      const paymentMethods = paymentMethodsPageFor('planetconfig');
      await paymentMethods.selectGateway(gateway);
      await paymentMethods.acceptTerms();
      await paymentMethods.submitButton().click();

      // Assert — STOP at payment-provider boundary; never enter card / wallet data
      await expect
        .poll(() => paymentRedirectPage.hasReachedPaymentBoundary([PLANETCONFIG_ORIGIN]), {
          timeout: 15_000,
        })
        .toBe(true);
    });
  }

  test.fixme('@ru crypto gateway not exposed on planetconfig.com /payment/ — see docs/ux-findings.md', async () => {
    // Intentionally empty — surfaced as a known gap against the assignment.
  });
});
