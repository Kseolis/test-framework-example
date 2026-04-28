import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { env } from '@infra/env';

/**
 * Gateway values observed on the `/payment/` step of Sites B and C.
 * Site B (planetconfig.com, RU): card_ru | 1Payment?i=4 | sber | yoomoney | stripe.
 * Site C (personal.freevpnplanet.com, EN): stripe | crypto (value set dynamically by JS).
 *
 * Note: assignment requires crypto on Site B, but the gateway list above did not
 * include a crypto option at the time of inspection — see docs/ux-findings.md.
 */
export type Gateway = 'card_ru' | '1Payment?i=4' | 'sber' | 'yoomoney' | 'stripe' | 'crypto';

export type PaymentMethodsOrigin = 'planetconfig' | 'personal';

const ORIGIN_TO_BASE_URL: Record<PaymentMethodsOrigin, string> = {
  planetconfig: env.BASE_URL_PLANETCONFIG,
  personal: env.BASE_URL_PERSONAL,
};

/**
 * `/payment/` page on Sites B and C — method-selection screen.
 * Final submit button shares `data-step="2"` across both origins.
 */
export class PaymentMethodsPage extends BasePage {
  protected readonly url: string;

  constructor(page: Page, origin: PaymentMethodsOrigin) {
    super(page);
    this.url = new URL('payment/', ORIGIN_TO_BASE_URL[origin]).toString();
  }

  gatewayRadio(value: Gateway): Locator {
    return this.page.locator(`input[type="radio"][name="gateway"][value="${value}"]`);
  }

  async selectGateway(value: Gateway): Promise<void> {
    // Native radio is visually hidden behind a custom label; set checked + change event programmatically.
    await this.gatewayRadio(value).evaluate((el: HTMLInputElement) => {
      el.checked = true;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  /** EN-only: button that opens the cryptocurrency picker (Site C). */
  cryptoPickerButton(): Locator {
    return this.page.locator('.js-select-payment-btn');
  }

  /** EN-only: a specific cryptocurrency option inside the picker dropdown. */
  cryptoOption(coinId: string): Locator {
    return this.page.locator(`.js-payment-item[data-id="${coinId}"]`);
  }

  /** EN-only: open the picker and select the given crypto by data-id (e.g. 'BTC'). */
  async selectCrypto(coinId: string): Promise<void> {
    await this.cryptoPickerButton().click();
    await this.cryptoOption(coinId).click();
  }

  /** Both Sites B and C show a "By clicking this button you agree..." checkbox. */
  termsCheckbox(): Locator {
    return this.page
      .getByRole('checkbox', { name: /agree to the (terms|политики)|terms of use|refund/i })
      .first();
  }

  /** Idempotently accept any payment-page terms checkbox; safe to call when none is present. */
  async acceptTerms(): Promise<void> {
    await this.page.evaluate(() => {
      document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((cb) => {
        if (!cb.checked) {
          cb.checked = true;
          cb.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
  }

  submitButton(): Locator {
    return this.page.locator('button[type="submit"][data-step="2"]');
  }
}
