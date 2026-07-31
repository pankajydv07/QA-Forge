/**
 * cart.spec.ts (T030)
 * Single responsibility: Shopping cart E2E tests.
 */
import { test, expect } from '../../fixtures/testFixtures';
import { TEST_PRODUCTS } from '../../fixtures/testData';

test.describe('Cart Operations', () => {
  test('empty cart displays message', async ({ cartPage }) => {
    await cartPage.goto();
    await cartPage.assertEmpty();
  });

  test('add and remove item from cart', async ({ productsPage, cartPage }) => {
    await productsPage.goto();
    await productsPage.addToCart(TEST_PRODUCTS.HEADPHONES);
    await cartPage.goto();
    await cartPage.assertTotal(79.99);
    await cartPage.removeItem(TEST_PRODUCTS.HEADPHONES);
    await cartPage.assertEmpty();
  });

  test('checkout button initiates checkout flow', async ({ productsPage, cartPage }) => {
    await productsPage.goto();
    await productsPage.addToCart(TEST_PRODUCTS.HEADPHONES);
    await cartPage.goto();
    await cartPage.checkout();
    await expect(cartPage['page']).toHaveURL(/\/orders\/ord-/);
  });
});
