import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { env } from '@infra/env';

/** Plan options observed on the /order/ page (data-test-id suffix). */
export type SignupPlan = '1_month' | '1_year' | '3_years';

/**
 * Sign-up + plan + payment-method selection page (env.BASE_URL_ACCOUNT + 'order/').
 * Two screens share this URL:
 *   1. email step (button "Next");
 *   2. plan + payment-method step (terms + button "Get your subscription").
 */
export class SignupPage extends BasePage {
  protected readonly url = new URL('order/', env.BASE_URL_ACCOUNT).toString();

  constructor(page: Page) {
    super(page);
  }

  // Step 1: email entry
  emailInput(): Locator {
    return this.page.getByLabel('Email');
  }

  /**
   * Fill the email field with full reactivity: PrimeVue's lazy validator only
   * enables the Next + payment-method buttons after `input`, `change`, AND
   * `blur` events fire. Playwright's native `.fill()` / `.pressSequentially()`
   * does not reliably dispatch `change` in headless mode, so we set the value
   * and fire the events programmatically.
   */
  async fillEmail(value: string): Promise<void> {
    await this.emailInput().evaluate((el: HTMLInputElement, v: string) => {
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
    }, value);
  }

  nextButton(): Locator {
    return this.page.getByRole('button', { name: 'Next' });
  }

  // Step 2: plan + payment method
  planSelectToggle(): Locator {
    return this.page.locator('[data-test-id="order-plan-select-current"]');
  }

  planOption(plan: SignupPlan): Locator {
    return this.page.locator(`[data-test-id="order-plan-select-option-${plan}"]`);
  }

  async selectPlan(plan: SignupPlan): Promise<void> {
    await this.planSelectToggle().click();
    await this.planOption(plan).click();
  }

  creditCardButton(): Locator {
    return this.page.getByRole('button', { name: 'Credit Card' });
  }

  cryptocurrencyButton(): Locator {
    return this.page.getByRole('button', { name: /cryptocurrency/i });
  }

  termsCheckbox(): Locator {
    return this.page.locator('#payment-checkbox');
  }

  /** Visually-hidden native checkbox; toggle via change event. */
  async acceptTerms(): Promise<void> {
    await this.termsCheckbox().evaluate((el: HTMLInputElement) => {
      el.checked = true;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  getSubscriptionButton(): Locator {
    return this.page.getByRole('button', { name: 'Get your subscription' });
  }
}
