import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Wiki Page Object - for creating and managing wiki pages
 */
export class WikiPage extends BasePage {
  constructor(page: Page) {
    super(page, '/dashboard/wiki');
  }

  // Locators
  get titleInput() {
    return this.page.locator('input[name="title"], #title');
  }

  get contentEditor() {
    return this.page.locator('textarea[name="content"], .editor, [contenteditable="true"]').first();
  }

  get parentPageSelect() {
    return this.page.locator('select[name="parent"], #parent-page');
  }

  get saveButton() {
    return this.page.getByRole('button', { name: /save|publish|zapisz/i });
  }

  get createButton() {
    return this.page.getByRole('button', { name: /create|new page|nowa strona/i });
  }

  get successMessage() {
    return this.page.locator('[role="alert"].success, .success-message');
  }

  /**
   * Navigate to create wiki page
   */
  async goToCreate() {
    await this.goto();
    await this.createButton.click();
    await this.page.waitForURL(/\/wiki\/(new|create)/);
  }

  /**
   * Create a new wiki page
   */
  async createWikiPage(data: {
    title: string;
    content: string;
    parentPage?: string;
  }) {
    await this.goToCreate();

    await this.titleInput.fill(data.title);
    await this.contentEditor.fill(data.content);

    if (data.parentPage) {
      try {
        await this.parentPageSelect.waitFor({ timeout: 1000 });
        await this.parentPageSelect.selectOption(data.parentPage);
      } catch {
        // Parent page might be optional
      }
    }

    await this.saveButton.click();

    await Promise.race([
      this.page.waitForURL(/\/wiki\/[^\/]+$/, { timeout: 10000 }),
      this.successMessage.waitFor({ timeout: 5000 }).catch(() => {}),
    ]);
  }

  /**
   * Verify wiki page creation
   */
  async verifyWikiPageCreated(title: string) {
    await expect(this.page.getByRole('heading', { name: title })).toBeVisible();
  }
}
