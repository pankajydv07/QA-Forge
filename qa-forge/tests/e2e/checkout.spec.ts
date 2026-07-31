/**
 * checkout.spec.ts (T031)
 * Single responsibility: Checkout & Order confirmation E2E tests.
 */
import { test, expect } from '../../fixtures/testFixtures';
import { TEST_PRODUCTS } from '../../fixtures/testData';

test.describe('Checkout Flow', () => {
  test('successful checkout creates pending order and transitions to confirmed', async ({ productsPage, cartPage, orderPage }) => {
    await productsPage.goto();
    await productsPage.addToCart(TEST_PRODUCTS.HEADPHONES);
    await cartPage.goto();
    await cartPage.checkout();
    await orderPage.assertOrderConfirmed();
  });

  test('order confirmation displays correct total', async ({ productsPage, cartPage, orderPage }) => {
    await productsPage.goto();
    await productsPage.addToCart(TEST_PRODUCTS.TSHIRT);
    await cartPage.goto();
    await cartPage.checkout();
    await orderPage.assertOrderConfirmed();
  });

  test('empty cart checkout is prevented', async ({ cartPage }) => {
    await cartPage.goto();
    await cartPage.assertEmpty();
  });
});
