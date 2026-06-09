import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { env } from '@infra/env';

export type SignupPlan = '1_month' | '1_year' | '3_years';

export class SignupPage extends BasePage {
  protected readonly url = new URL('order/', env.BASE_URL_ACCOUNT).toString();

  get emailField(): Locator {
    return this.page.getByLabel('Email');
  }

  get nextButton(): Locator {
    return this.page.getByRole('button', { name: 'Next' });
  }

  get subscribeButton(): Locator {
    return this.page.getByRole('button', { name: 'Get your subscription' });
  }

  private get planToggle(): Locator {
    return this.page.locator('[data-test-id="order-plan-select-current"]');
  }

  private planOption(plan: SignupPlan): Locator {
    return this.page.locator(`[data-test-id="order-plan-select-option-${plan}"]`);
  }

  private get creditCardButton(): Locator {
    return this.page.getByRole('button', { name: 'Credit Card' });
  }

  private get termsCheckbox(): Locator {
    return this.page.locator('#payment-checkbox');
  }

  async fillEmail(email: string): Promise<void> {
    await this.planToggle.waitFor({ state: 'visible' });
    await this.fillReactively(this.emailField, email);
  }

  async proceedToPlan(): Promise<void> {
    await this.nextButton.click();
  }

  async selectPlan(plan: SignupPlan): Promise<void> {
    await this.planToggle.click();
    await this.planOption(plan).click();
  }

  async chooseCreditCard(): Promise<void> {
    await this.creditCardButton.click();
  }

  async acceptTerms(): Promise<void> {
    await this.toggleHiddenControl(this.termsCheckbox);
  }

  async submitSubscription(): Promise<void> {
    await this.subscribeButton.click();
  }
}
