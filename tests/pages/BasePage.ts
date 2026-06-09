import type { Locator, Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  protected abstract readonly url: string;

  async goto(): Promise<void> {
    await this.page.goto(this.url);
  }

  protected async fillReactively(field: Locator, value: string): Promise<void> {
    await field.evaluate((node, text) => {
      const input = node as HTMLInputElement;
      input.value = text;
      for (const eventType of ['input', 'change', 'blur']) {
        input.dispatchEvent(new Event(eventType, { bubbles: true }));
      }
    }, value);
  }

  protected async toggleHiddenControl(control: Locator): Promise<void> {
    await control.evaluate((node) => {
      const input = node as HTMLInputElement;
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
}
