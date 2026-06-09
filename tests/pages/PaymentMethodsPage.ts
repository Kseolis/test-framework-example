import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { env } from '@infra/env';
import type { PaymentMethod, PaymentStep } from '@support/purchase-flow';

export type PaymentMethodsOrigin = 'planetconfig' | 'personal';

const ORIGIN_BASE_URL: Record<PaymentMethodsOrigin, string> = {
  planetconfig: env.BASE_URL_PLANETCONFIG,
  personal: env.BASE_URL_PERSONAL,
};

export class PaymentMethodsPage extends BasePage implements PaymentStep {
  protected readonly url: string;

  constructor(page: Page, origin: PaymentMethodsOrigin) {
    super(page);
    this.url = new URL('payment/', ORIGIN_BASE_URL[origin]).toString();
  }

  private gatewayRadio(gateway: 'card_ru' | 'stripe'): Locator {
    return this.page.locator(`input[type="radio"][name="gateway"][value="${gateway}"]`);
  }

  private get cryptoPicker(): Locator {
    return this.page.locator('.js-select-payment-btn');
  }

  private cryptoOption(coin: string): Locator {
    return this.page.locator(`.js-payment-item[data-id="${coin}"]`);
  }

  private get consentCheckboxes(): Locator {
    return this.page.locator('form input[type="checkbox"]');
  }

  private get submitButton(): Locator {
    return this.page.locator('button[type="submit"][data-step="2"]');
  }

  async choosePaymentMethod(method: PaymentMethod): Promise<void> {
    if (method === 'crypto') {
      await this.cryptoPicker.click();
      await this.cryptoOption('BTC').click();
      return;
    }
    await this.toggleHiddenControl(this.gatewayRadio(method));
  }

  async acceptTerms(): Promise<void> {
    const total = await this.consentCheckboxes.count();
    for (let index = 0; index < total; index++) {
      await this.toggleHiddenControl(this.consentCheckboxes.nth(index));
    }
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
