import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Register Page Object
 */
export class RegisterPage extends BasePage {
  constructor(page: Page) {
    super(page, '/register');
  }

  // Locators
  get nameInput() {
    return this.page.locator('input[name="name"], input[name="username"]');
  }

  get emailInput() {
    return this.page.locator('input[name="email"], input[type="email"]');
  }

  get passwordInput() {
    return this.page.locator('input[name="password"]').first();
  }

  get confirmPasswordInput() {
    return this.page.locator('input[name="confirmPassword"], input[name="password_confirmation"]');
  }

  get registerButton() {
    return this.page.getByRole('button', { name: /register|sign up|create account|zarejestruj/i });
  }

  get loginLink() {
    return this.page.getByRole('link', { name: /login|sign in|zaloguj/i });
  }

  get successMessage() {
    return this.page.locator('[role="alert"].success, .success-message, .alert-success');
  }

  get errorMessage() {
    return this.page.locator('[role="alert"].error, .error-message, .alert-error');
  }

  /**
   * Perform registration
   */
  async register(name: string, email: string, password: string, confirmPassword?: string) {
    await this.goto();
    await this.waitForLoad();

    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    // Fill confirm password if field exists
    try {
      await this.confirmPasswordInput.waitFor({ timeout: 1000 });
      await this.confirmPasswordInput.fill(confirmPassword || password);
    } catch {
      // Confirm password field might not exist
    }

    await this.registerButton.click();

    // Wait for navigation or error
    await Promise.race([
      this.page.waitForURL(/\/(login|dashboard|home)/, { timeout: 10000 }),
      this.successMessage.waitFor({ timeout: 5000 }).catch(() => {}),
      this.errorMessage.waitFor({ timeout: 5000 }).catch(() => {}),
    ]);
  }

  /**
   * Register with random user data
   */
  async registerRandomUser() {
    const timestamp = Date.now();
    const name = `TestUser${timestamp}`;
    const email = `test${timestamp}@example.com`;
    const password = 'TestPassword123!';

    await this.register(name, email, password);

    return { name, email, password };
  }

  /**
   * Navigate to login page
   */
  async goToLogin() {
    await this.loginLink.click();
    await expect(this.page).toHaveURL(/login/);
  }

  /**
   * Verify registration success
   */
  async verifySuccessfulRegistration() {
    // Either shows success message or redirects to login
    const isRedirected = await this.page.url().includes('/login') || this.page.url().includes('/dashboard');
    const hasSuccessMessage = await this.successMessage.isVisible().catch(() => false);

    expect(isRedirected || hasSuccessMessage).toBeTruthy();
  }

  /**
   * Verify registration error
   */
  async verifyRegistrationError(errorText?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (errorText) {
      await expect(this.errorMessage).toContainText(errorText);
    }
  }
}
