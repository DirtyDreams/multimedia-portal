import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"], input[type="email"]');
    this.passwordInput = page.locator('input[name="password"], input[type="password"]');
    this.loginButton = page.locator('button[type="submit"]', { hasText: /log\s*in/i });
    this.errorMessage = page.locator('[role="alert"], .error-message');
    this.registerLink = page.locator('a[href*="/register"]');
    this.forgotPasswordLink = page.locator('a[href*="/forgot-password"]');
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginAndWait(email: string, password: string) {
    await this.login(email, password);
    // Wait for redirect after successful login
    await this.page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 10000,
    });
  }

  async expectLoginError(message?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  async expectToBeOnLoginPage() {
    await expect(this.page).toHaveURL(/\/login/);
  }

  async goToRegister() {
    await this.registerLink.click();
  }

  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
  }
}
