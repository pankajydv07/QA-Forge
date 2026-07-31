/**
 * visual.spec.ts (T032)
 * Single responsibility: Visual regression snapshot tests.
 */
import { test, expect } from '../../fixtures/testFixtures';

test.describe('Visual Regression', () => {
  test('login page visual snapshot', async ({ loginPage, page }) => {
    await loginPage.goto();
    await expect(page).toHaveScreenshot('login-page.png');
  });

  test('products page visual snapshot', async ({ productsPage, page }) => {
    await productsPage.goto();
    await expect(page).toHaveScreenshot('products-page.png');
  });
});
