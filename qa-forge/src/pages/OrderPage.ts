/**
 * OrderPage.ts (T024)
 * Single responsibility: Page object for /orders/:id page interactions.
 */
import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class OrderPage extends BasePage {
  private orderIdText = '[data-testid="order-id"]';
  private orderStatusText = '[data-testid="order-status"]';
  private orderTotalText = '[data-testid="order-total"]';

  constructor(page: Page) {
    super(page);
  }

  public async assertOrderConfirmed(): Promise<void> {
    await expect(this.page.locator(this.orderStatusText)).toContainText('Status: confirmed');
  }

  public async assertOrderId(id: string): Promise<void> {
    await expect(this.page.locator(this.orderIdText)).toContainText(id);
  }
}
