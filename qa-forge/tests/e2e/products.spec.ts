/**
 * products.spec.ts (T029)
 * Single responsibility: Products catalog E2E tests.
 */
import { test, expect } from '../../fixtures/testFixtures';
import { TEST_PRODUCTS } from '../../fixtures/testData';

test.describe('Products Catalog', () => {
  test('lists all available products', async ({ productsPage }) => {
    await productsPage.goto();
    await productsPage.assertProductVisible(TEST_PRODUCTS.HEADPHONES);
    await productsPage.assertProductVisible(TEST_PRODUCTS.TSHIRT);
    await productsPage.assertProductVisible(TEST_PRODUCTS.COFFEE);
  });

  test('filters products by electronics category', async ({ productsPage }) => {
    await productsPage.goto();
    await productsPage.filterCategory('electronics');
    await productsPage.assertProductVisible(TEST_PRODUCTS.HEADPHONES);
  });

  test('filters products by clothing category', async ({ productsPage }) => {
    await productsPage.goto();
    await productsPage.filterCategory('clothing');
    await productsPage.assertProductVisible(TEST_PRODUCTS.TSHIRT);
  });

  test('add to cart updates cart badge count', async ({ productsPage }) => {
    await productsPage.goto();
    await productsPage.addToCart(TEST_PRODUCTS.HEADPHONES);
    await productsPage.assertCartCount(1);
  });
});
