/**
 * CartPage.ts (T023)
 * Single responsibility: Page object for /cart page interactions.
 */
import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  private checkoutBtn = '[data-testid="checkout-btn"]';
  private emptyMsg = '[data-testid="empty-cart-msg"]';
  private totalText = '[data-testid="cart-total"]';

  constructor(page: Page) {
    super(page);
  }

  public async goto(): Promise<void> {
    await this.navigate('/cart');
  }

  public async removeItem(productId: string): Promise<void> {
    await this.page.click(`[data-testid="remove-${productId}"]`);
  }

  public async checkout(): Promise<void> {
    await this.page.click(this.checkoutBtn);
  }

  public async assertEmpty(): Promise<void> {
    await expect(this.page.locator(this.emptyMsg)).toBeVisible();
  }

  public async assertTotal(total: number): Promise<void> {
    await expect(this.page.locator(this.totalText)).toContainText(`Total: $${total}`);
  }
}
