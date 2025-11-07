import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Article Page Object - for creating and managing articles
 */
export class ArticlePage extends BasePage {
  constructor(page: Page) {
    super(page, '/dashboard/articles');
  }

  // Locators - Create/Edit Form
  get titleInput() {
    return this.page.locator('input[name="title"], #title');
  }

  get contentEditor() {
    return this.page.locator('textarea[name="content"], .editor, [contenteditable="true"]').first();
  }

  get categorySelect() {
    return this.page.locator('select[name="category"], #category');
  }

  get tagsInput() {
    return this.page.locator('input[name="tags"], #tags');
  }

  get saveButton() {
    return this.page.getByRole('button', { name: /save|publish|zapisz|opublikuj/i });
  }

  get createButton() {
    return this.page.getByRole('button', { name: /create|new article|nowy artykuł/i });
  }

  get editButton() {
    return this.page.getByRole('button', { name: /edit|edytuj/i }).first();
  }

  get deleteButton() {
    return this.page.getByRole('button', { name: /delete|usuń/i }).first();
  }

  get confirmDeleteButton() {
    return this.page.getByRole('button', { name: /confirm|yes|tak/i });
  }

  get successMessage() {
    return this.page.locator('[role="alert"].success, .success-message');
  }

  // Locators - Article List
  get articlesList() {
    return this.page.locator('[data-testid="articles-list"], .articles-list');
  }

  get firstArticle() {
    return this.articlesList.locator('.article-item, [data-testid="article-item"]').first();
  }

  /**
   * Navigate to create article page
   */
  async goToCreate() {
    await this.goto();
    await this.createButton.click();
    await this.page.waitForURL(/\/articles\/(new|create)/);
  }

  /**
   * Create a new article
   */
  async createArticle(data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }) {
    await this.goToCreate();

    await this.titleInput.fill(data.title);
    await this.contentEditor.fill(data.content);

    if (data.category) {
      await this.categorySelect.selectOption(data.category);
    }

    if (data.tags && data.tags.length > 0) {
      await this.tagsInput.fill(data.tags.join(', '));
    }

    await this.saveButton.click();

    // Wait for success or redirect
    await Promise.race([
      this.page.waitForURL(/\/articles\/[^\/]+$/, { timeout: 10000 }),
      this.successMessage.waitFor({ timeout: 5000 }).catch(() => {}),
    ]);
  }

  /**
   * Edit an existing article
   */
  async editArticle(title: string, newData: {
    title?: string;
    content?: string;
  }) {
    await this.goto();
    await this.waitForLoad();

    // Find and click edit button for specific article
    await this.page.getByText(title).click();
    await this.editButton.click();

    await this.page.waitForURL(/\/articles\/.*\/edit/);

    if (newData.title) {
      await this.titleInput.fill(newData.title);
    }

    if (newData.content) {
      await this.contentEditor.clear();
      await this.contentEditor.fill(newData.content);
    }

    await this.saveButton.click();
    await this.successMessage.waitFor({ timeout: 5000 });
  }

  /**
   * Delete an article
   */
  async deleteArticle(title: string) {
    await this.goto();
    await this.waitForLoad();

    await this.page.getByText(title).click();
    await this.deleteButton.click();
    await this.confirmDeleteButton.click();

    await this.successMessage.waitFor({ timeout: 5000 });
  }

  /**
   * Verify article exists in list
   */
  async verifyArticleExists(title: string) {
    await this.goto();
    await this.waitForLoad();
    await expect(this.page.getByText(title)).toBeVisible();
  }

  /**
   * Verify article creation success
   */
  async verifyArticleCreated() {
    const url = this.page.url();
    expect(url).toMatch(/\/articles\/[^\/]+$/);
  }
}
