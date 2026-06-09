import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { env } from '@infra/env';
import type { Offer, OfferLandingPage } from '@support/purchase-flow';

export class PersonalFreeVpnPage extends BasePage implements OfferLandingPage {
  protected readonly url = env.BASE_URL_PERSONAL;

  private offerRadio(offer: Offer): Locator {
    return this.page.locator(`input[type="radio"][name="offer_id"][value="${offer}"]`);
  }

  private get emailField(): Locator {
    return this.page.getByPlaceholder('name@example.com');
  }

  private get submitButton(): Locator {
    return this.page.locator('form#PPG button[type="submit"]');
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
