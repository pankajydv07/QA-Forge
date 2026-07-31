/**
 * LoginPage.ts (T021)
 * Single responsibility: Page object for /login page interactions.
 */
import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private emailInput = '[data-testid="login-email"]';
  private passwordInput = '[data-testid="login-password"]';
  private submitButton = '[data-testid="login-submit"]';
  private errorMessage = '[data-testid="error-message"]';

  constructor(page: Page) {
    super(page);
  }

  public async goto(): Promise<void> {
    await this.navigate('/login');
  }

  public async fillEmail(email: string): Promise<void> {
    await this.page.fill(this.emailInput, email);
  }

  public async fillPassword(password: string): Promise<void> {
    await this.page.fill(this.passwordInput, password);
  }

  public async submit(): Promise<void> {
    await this.page.click(this.submitButton);
  }

  public async login(email: string, password: str): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  public async assertRedirectedToProducts(): Promise<void> {
    await expect(this.page).toHaveURL(/\/products/);
  }

  public async assertErrorMessage(expected: string): Promise<void> {
    await expect(this.page.locator(this.errorMessage)).toHaveText(expected);
  }
}
