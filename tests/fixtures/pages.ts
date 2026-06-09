import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { PlanetConfigPage } from '../pages/PlanetConfigPage';
import { PersonalFreeVpnPage } from '../pages/PersonalFreeVpnPage';
import { PaymentMethodsPage, type PaymentMethodsOrigin } from '../pages/PaymentMethodsPage';

type PageFixtures = {
  homePage: HomePage;
  loginPage: LoginPage;
  signupPage: SignupPage;
  planetConfigPage: PlanetConfigPage;
  personalFreeVpnPage: PersonalFreeVpnPage;
  paymentMethodsPageFor: (origin: PaymentMethodsOrigin) => PaymentMethodsPage;
};

export const pagesTest = base.extend<PageFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  signupPage: async ({ page }, use) => {
    await use(new SignupPage(page));
  },
  planetConfigPage: async ({ page }, use) => {
    await use(new PlanetConfigPage(page));
  },
  personalFreeVpnPage: async ({ page }, use) => {
    await use(new PersonalFreeVpnPage(page));
  },
  paymentMethodsPageFor: async ({ page }, use) => {
    await use((origin: PaymentMethodsOrigin) => new PaymentMethodsPage(page, origin));
  },
});
