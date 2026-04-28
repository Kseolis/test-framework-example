import { test, expect } from '@fixtures';
import { userFactory } from '@factories';

const SOURCE_ORIGINS = ['https://freevpnplanet.com', 'https://account.freevpnplanet.com'] as const;

test.describe('@en Sign Up flow (Scenario A)', () => {
  test('@smoke happy path: Home → Log In → Sign Up → 1 year → Credit Card → payment boundary', async ({
    homePage,
    loginPage,
    signupPage,
    paymentRedirectPage,
    page,
  }) => {
    const user = userFactory.build();

    // Arrange
    await homePage.goto();

    // Act — Home → Log In → Sign Up
    await homePage.clickLogIn();
    await expect(page).toHaveURL(/account\.freevpnplanet\.com\/login\/?/);
    await loginPage.clickSignUp();
    await expect(page).toHaveURL(/account\.freevpnplanet\.com\/order\/?/);
    await page.waitForLoadState('networkidle');

    // Act — fill order: email → Next → plan → payment method → terms → submit.
    // The form is debounce-validated; wait for Next to enable before clicking.
    await signupPage.fillEmail(user.email);
    await expect(signupPage.nextButton()).toBeEnabled({ timeout: 10_000 });
    await signupPage.nextButton().click();
    await signupPage.selectPlan('1_year');
    await expect(signupPage.creditCardButton()).toBeEnabled({ timeout: 10_000 });
    await signupPage.creditCardButton().click();
    await signupPage.acceptTerms();
    await expect(signupPage.getSubscriptionButton()).toBeEnabled({ timeout: 10_000 });
    await signupPage.getSubscriptionButton().click();

    // Assert — STOP at payment-provider boundary; never enter card data
    await expect
      .poll(() => paymentRedirectPage.hasReachedPaymentBoundary([...SOURCE_ORIGINS]), {
        timeout: 15_000,
      })
      .toBe(true);
  });

  test('terms unchecked blocks payment submission', async ({ signupPage, page }) => {
    const user = userFactory.build();

    await signupPage.goto();
    await signupPage.fillEmail(user.email);
    await expect(signupPage.nextButton()).toBeEnabled({ timeout: 10_000 });
    await signupPage.nextButton().click();
    await signupPage.selectPlan('1_month');
    await expect(signupPage.creditCardButton()).toBeEnabled({ timeout: 10_000 });
    await signupPage.creditCardButton().click();
    // intentionally skip terms checkbox
    await signupPage.getSubscriptionButton().click();

    // No redirect — we remain on /order/
    await expect(page).toHaveURL(/account\.freevpnplanet\.com\/order\/?/, { timeout: 5_000 });
    await expect(signupPage.getSubscriptionButton()).toBeVisible();
  });

  test('empty email keeps step-1 Next button disabled', async ({ signupPage }) => {
    await signupPage.goto();

    // No email entered. Next remains disabled — never advances.
    await expect(signupPage.nextButton()).toBeDisabled();
    await expect(signupPage.emailInput()).toBeVisible();
  });

  // NOTE: a deliberately invalid email like `not-an-email-X` (no `@`) currently
  // ENABLES the Next button on Site A's signup form — i.e. their validator is
  // permissive. See docs/ux-findings.md. We do not assert this as a passing
  // test because the behaviour is itself a defect.
});
