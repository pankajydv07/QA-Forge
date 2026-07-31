/**
 * BrowserManager.ts (T016)
 * Single responsibility: Browser lifecycle management.
 */
import { chromium, Browser, BrowserContext, Page } from '@playwright/test';

export class BrowserManager {
  private static instance: BrowserManager;
  private browser: Browser | null = null;

  private constructor() {}

  public static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  public async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await chromium.launch({ headless: true });
    }
    return this.browser;
  }

  public async newContext(): Promise<BrowserContext> {
    const browser = await this.getBrowser();
    return await browser.newContext();
  }

  public async newPage(): Promise<Page> {
    const context = await this.newContext();
    return await context.newPage();
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
