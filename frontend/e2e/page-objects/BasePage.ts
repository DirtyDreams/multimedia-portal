import { Page, Locator, expect } from '@playwright/test';

/**
 * Base page object with common navigation and utilities
 */
export class BasePage {
  readonly page: Page;
  readonly navigationMenu: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly homeLink: Locator;
  readonly dashboardLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navigationMenu = page.locator('nav, [role="navigation"]');
    this.userMenu = page.locator('[data-testid="user-menu"], .user-menu');
    this.logoutButton = page.locator('button, a', { hasText: /logout|sign\s*out/i });
    this.homeLink = page.locator('a[href="/"]');
    this.dashboardLink = page.locator('a[href*="/dashboard"]');
  }

  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async logout() {
    // Open user menu if it exists
    if (await this.userMenu.isVisible()) {
      await this.userMenu.click();
    }
    await this.logoutButton.click();
    await this.page.waitForURL(/\/(login)?/, { timeout: 10000 });
  }

  async navigateTo(section: string) {
    const link = this.navigationMenu.locator(`a[href*="/${section}"]`).first();
    await link.click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToDashboard() {
    await this.dashboardLink.click();
    await this.page.waitForURL(/\/dashboard/);
  }

  async goHome() {
    await this.homeLink.click();
    await this.page.waitForURL('/');
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async expectToBeAuthenticated() {
    const token = await this.page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeTruthy();
  }

  async expectToBeUnauthenticated() {
    const token = await this.page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeFalsy();
  }
}
