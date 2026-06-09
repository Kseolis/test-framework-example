import type { Page } from '@playwright/test';

/**
 * BasePage — abstract anchor for all page objects.
 * Hard rules (enforced by lint-page-object.ts):
 *  - NO `expect` imports here. Assertions belong to specs.
 *  - NO navigation logic. Each subclass declares its own `path` and a public `goto()`.
 *  - NO shared mutable state.
 *  - Only locator builders and stateless helpers.
 */
export abstract class BasePage {
  protected constructor(protected readonly page: Page) {}

  /** Sub-classes declare a relative path; goto() composes with the configured baseURL. */
  protected abstract readonly path: string;

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  /** Returns the human-readable URL for diagnostics; never used for assertions. */
  url(): string {
    return this.page.url();
  }
}
