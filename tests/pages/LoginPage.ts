import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { env } from '@infra/env';

export class LoginPage extends BasePage {
  protected readonly url = new URL('login/', env.BASE_URL_ACCOUNT).toString();

  private get signUpLink(): Locator {
    return this.page.getByRole('link', { name: 'Sign Up' });
  }

  async clickSignUp(): Promise<void> {
    await this.signUpLink.click();
  }
}
