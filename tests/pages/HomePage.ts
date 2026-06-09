import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { env } from '@infra/env';

export class HomePage extends BasePage {
  protected readonly url = env.BASE_URL_FREEVPN;

  private get logInLink(): Locator {
    return this.page.getByRole('link', { name: 'Log In' }).first();
  }

  async clickLogIn(): Promise<void> {
    await this.logInLink.click();
  }
}
