/**
 * auth.spec.ts (T028)
 * Single responsibility: Authentication E2E tests.
 */
import { test, expect } from '../../fixtures/testFixtures';
import { TEST_USER } from '../../fixtures/testData';

test.describe('Authentication', () => {
  test('happy-path login redirects to products page', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.assertRedirectedToProducts();
  });

  test('invalid credentials displays 401 error', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('invalid@test.com', 'wrongpassword');
    await loginPage.assertErrorMessage('Invalid credentials');
  });
});
