import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object class
 * Provides common functionality for all page objects
 */
export class BasePage {
  readonly page: Page;
  readonly url: string;

  constructor(page: Page, url: string = '/') {
    this.page = page;
    this.url = url;
  }

  /**
   * Navigate to the page
   */
  async goto() {
    await this.page.goto(this.url);
  }

  /**
   * Wait for page to be loaded
   */
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get element by test ID
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Get element by role
   */
  getByRole(role: 'button' | 'link' | 'textbox' | 'heading' | 'navigation', options?: { name?: string | RegExp }) {
    return this.page.getByRole(role, options);
  }

  /**
   * Get element by text
   */
  getByText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  /**
   * Fill form field
   */
  async fill(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  /**
   * Click element
   */
  async click(selector: string) {
    await this.page.click(selector);
  }

  /**
   * Wait for navigation after action
   */
  async clickAndWaitForNavigation(selector: string) {
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click(selector),
    ]);
  }

  /**
   * Take screenshot
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.waitForSelector('[data-testid="user-menu"]', { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }
}
