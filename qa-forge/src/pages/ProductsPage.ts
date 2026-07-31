/**
 * ProductsPage.ts (T022)
 * Single responsibility: Page object for /products page interactions.
 */
import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductsPage extends BasePage {
  private cartBadge = '[data-testid="cart-badge"]';

  constructor(page: Page) {
    super(page);
  }

  public async goto(): Promise<void> {
    await this.navigate('/products');
  }

  public async filterCategory(category: 'all' | 'electronics' | 'clothing' | 'food'): Promise<void> {
    await this.page.click(`[data-testid="filter-${category}"]`);
  }

  public async addToCart(productId: string): Promise<void> {
    await this.page.click(`[data-testid="add-to-cart-${productId}"]`);
  }

  public async assertCartCount(count: number): Promise<void> {
    await expect(this.page.locator(this.cartBadge)).toContainText(`Cart Items: ${count}`);
  }

  public async assertProductVisible(productId: string): Promise<void> {
    await expect(this.page.locator(`[data-testid="product-card-${productId}"]`)).toBeVisible();
  }
}
