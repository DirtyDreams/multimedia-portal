import { Page, Locator, expect } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly errorMessage: Locator;
  readonly loginLink: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('input[name="name"], input[name="username"]');
    this.emailInput = page.locator('input[name="email"], input[type="email"]');
    this.passwordInput = page.locator('input[name="password"]').first();
    this.confirmPasswordInput = page.locator(
      'input[name="confirmPassword"], input[name="password_confirmation"]'
    );
    this.registerButton = page.locator('button[type="submit"]', {
      hasText: /register|sign\s*up/i,
    });
    this.errorMessage = page.locator('[role="alert"], .error-message');
    this.successMessage = page.locator('.success-message, [role="status"]');
    this.loginLink = page.locator('a[href*="/login"]');
  }

  async goto() {
    await this.page.goto('/register');
    await this.page.waitForLoadState('networkidle');
  }

  async register(
    name: string,
    email: string,
    password: string,
    confirmPassword?: string
  ) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    if (await this.confirmPasswordInput.isVisible()) {
      await this.confirmPasswordInput.fill(confirmPassword || password);
    }

    await this.registerButton.click();
  }

  async registerAndWait(
    name: string,
    email: string,
    password: string,
    confirmPassword?: string
  ) {
    await this.register(name, email, password, confirmPassword);
    // Wait for redirect after successful registration
    await this.page.waitForURL((url) => !url.pathname.includes('/register'), {
      timeout: 10000,
    });
  }

  async expectRegistrationError(message?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  async expectRegistrationSuccess(message?: string) {
    await expect(this.successMessage).toBeVisible();
    if (message) {
      await expect(this.successMessage).toContainText(message);
    }
  }

  async expectToBeOnRegisterPage() {
    await expect(this.page).toHaveURL(/\/register/);
  }

  async goToLogin() {
    await this.loginLink.click();
  }
}
