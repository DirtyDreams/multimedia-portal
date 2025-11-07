import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login Page Object
 */
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page, '/login');
  }

  // Locators
  get emailInput() {
    return this.page.locator('input[name="email"], input[type="email"]');
  }

  get passwordInput() {
    return this.page.locator('input[name="password"], input[type="password"]');
  }

  get loginButton() {
    return this.page.getByRole('button', { name: /login|sign in|zaloguj/i });
  }

  get registerLink() {
    return this.page.getByRole('link', { name: /register|sign up|zarejestruj/i });
  }

  get errorMessage() {
    return this.page.locator('[role="alert"], .error-message, .alert-error');
  }

  /**
   * Perform login
   */
  async login(email: string, password: string) {
    await this.goto();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();

    // Wait for navigation or error
    await Promise.race([
      this.page.waitForURL(/\/(dashboard|home|$)/, { timeout: 10000 }),
      this.errorMessage.waitFor({ timeout: 5000 }).catch(() => {}),
    ]);
  }

  /**
   * Quick login for authenticated tests
   */
  async quickLogin(email: string = 'test@example.com', password: string = 'password123') {
    await this.login(email, password);
    await expect(this.page).not.toHaveURL(/login/);
  }

  /**
   * Navigate to registration page
   */
  async goToRegister() {
    await this.registerLink.click();
    await expect(this.page).toHaveURL(/register/);
  }

  /**
   * Verify login error is displayed
   */
  async verifyLoginError() {
    await expect(this.errorMessage).toBeVisible();
  }

  /**
   * Verify successful login
   */
  async verifySuccessfulLogin() {
    await expect(this.page).not.toHaveURL(/login/);
    // Should redirect to home or dashboard
    await expect(this.page).toHaveURL(/\/(dashboard|home|$)/);
  }
}
