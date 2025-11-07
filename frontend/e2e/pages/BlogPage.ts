import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Blog Page Object - for creating and managing blog posts
 */
export class BlogPage extends BasePage {
  constructor(page: Page) {
    super(page, '/dashboard/blog');
  }

  // Locators
  get titleInput() {
    return this.page.locator('input[name="title"], #title');
  }

  get contentEditor() {
    return this.page.locator('textarea[name="content"], .editor, [contenteditable="true"]').first();
  }

  get excerptInput() {
    return this.page.locator('textarea[name="excerpt"], #excerpt');
  }

  get categorySelect() {
    return this.page.locator('select[name="category"], #category');
  }

  get tagsInput() {
    return this.page.locator('input[name="tags"], #tags');
  }

  get publishButton() {
    return this.page.getByRole('button', { name: /publish|save|zapisz|opublikuj/i });
  }

  get createButton() {
    return this.page.getByRole('button', { name: /create|new post|nowy post/i });
  }

  get successMessage() {
    return this.page.locator('[role="alert"].success, .success-message');
  }

  /**
   * Navigate to create blog post page
   */
  async goToCreate() {
    await this.goto();
    await this.createButton.click();
    await this.page.waitForURL(/\/blog\/(new|create)/);
  }

  /**
   * Create a new blog post
   */
  async createBlogPost(data: {
    title: string;
    content: string;
    excerpt?: string;
    category?: string;
    tags?: string[];
  }) {
    await this.goToCreate();

    await this.titleInput.fill(data.title);
    await this.contentEditor.fill(data.content);

    if (data.excerpt) {
      try {
        await this.excerptInput.waitFor({ timeout: 1000 });
        await this.excerptInput.fill(data.excerpt);
      } catch {
        // Excerpt might be optional
      }
    }

    if (data.category) {
      await this.categorySelect.selectOption(data.category);
    }

    if (data.tags && data.tags.length > 0) {
      await this.tagsInput.fill(data.tags.join(', '));
    }

    await this.publishButton.click();

    await Promise.race([
      this.page.waitForURL(/\/blog\/[^\/]+$/, { timeout: 10000 }),
      this.successMessage.waitFor({ timeout: 5000 }).catch(() => {}),
    ]);
  }

  /**
   * Verify blog post creation
   */
  async verifyBlogPostCreated(title: string) {
    await expect(this.page.getByRole('heading', { name: title })).toBeVisible();
  }
}
