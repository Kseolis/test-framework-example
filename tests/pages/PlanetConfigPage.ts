import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { env } from '@infra/env';
import type { Offer, OfferLandingPage } from '@support/purchase-flow';

export class PlanetConfigPage extends BasePage implements OfferLandingPage {
  protected readonly url = env.BASE_URL_PLANETCONFIG;

  private offerRadio(offer: Offer): Locator {
    const radioIds: Record<Offer, string> = {
      '2_days': '#qa-radio-offer-2-days',
      '1_month': '#qa-radio-offer-1-month',
      '1_year': '#qa-radio-offer-1-year',
    };
    return this.page.locator(radioIds[offer]);
  }

  private get emailField(): Locator {
    return this.page.locator('#qa-input-email');
  }

  private get submitButton(): Locator {
    return this.page.locator('#qa-btn-submit-step1');
  }

  async selectOffer(offer: Offer): Promise<void> {
    await this.toggleHiddenControl(this.offerRadio(offer));
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailField.fill(email);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
