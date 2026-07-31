/**
 * BasePage.ts (T020)
 * Single responsibility: Base Page Object providing navigation and action helpers.
 */
import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  constructor(protected page: Page) {}

  public async navigate(path: string): Promise<void> {
    await this.page.goto(path);
  }

  public async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  public async screenshot(): Promise<Buffer> {
    return await this.page.screenshot();
  }

  protected getLocator(selector: string): Locator {
    return this.page.locator(selector);
  }
}
