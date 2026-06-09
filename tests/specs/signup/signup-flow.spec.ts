import { test, expect } from '@fixtures';
import { userFactory } from '@factories';
import { reachedPaymentProvider, PAYMENT_BOUNDARY_TIMEOUT } from '@support/payment-boundary';

const SIGNUP_ORIGINS = ['https://freevpnplanet.com', 'https://account.freevpnplanet.com'];

test.describe('@en Sign Up flow (Scenario A)', () => {
  test('@smoke reaches the payment boundary via credit card', async ({
    homePage,
    loginPage,
    signupPage,
    page,
  }) => {
    const user = userFactory.build();

    await homePage.goto();
    await homePage.clickLogIn();
    await expect(page).toHaveURL(/account\.freevpnplanet\.com\/login\/?/);
    await loginPage.clickSignUp();
    await expect(page).toHaveURL(/account\.freevpnplanet\.com\/order\/?/);

    await signupPage.fillEmail(user.email);
    await signupPage.proceedToPlan();
    await signupPage.selectPlan('1_year');
    await signupPage.chooseCreditCard();
    await signupPage.acceptTerms();
    await signupPage.submitSubscription();

    await expect
      .poll(() => reachedPaymentProvider(page.url(), SIGNUP_ORIGINS), {
        timeout: PAYMENT_BOUNDARY_TIMEOUT,
      })
      .toBe(true);
  });

  test('blocks submission when terms are not accepted', async ({ signupPage, page }) => {
    const user = userFactory.build();

    await signupPage.goto();
    await signupPage.fillEmail(user.email);
    await signupPage.proceedToPlan();
    await signupPage.selectPlan('1_month');
    await signupPage.chooseCreditCard();
    await signupPage.submitSubscription();

    await expect(page).toHaveURL(/account\.freevpnplanet\.com\/order\/?/);
  });

  test('keeps the Next button disabled for an empty email', async ({ signupPage }) => {
    await signupPage.goto();

    await expect(signupPage.nextButton).toBeDisabled();
    await expect(signupPage.emailField).toBeVisible();
  });
});
