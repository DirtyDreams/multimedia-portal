import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ArticlePage extends BasePage {
  readonly titleInput: Locator;
  readonly contentEditor: Locator;
  readonly categorySelect: Locator;
  readonly tagsInput: Locator;
  readonly saveButton: Locator;
  readonly publishButton: Locator;
  readonly deleteButton: Locator;
  readonly articleTitle: Locator;
  readonly articleContent: Locator;
  readonly commentSection: Locator;
  readonly ratingWidget: Locator;

  constructor(page: Page) {
    super(page);
    this.titleInput = page.locator('input[name="title"]');
    this.contentEditor = page.locator('textarea[name="content"], [contenteditable="true"]');
    this.categorySelect = page.locator('select[name="category"], [name="categoryId"]');
    this.tagsInput = page.locator('input[name="tags"]');
    this.saveButton = page.locator('button', { hasText: /save|draft/i });
    this.publishButton = page.locator('button', { hasText: /publish/i });
    this.deleteButton = page.locator('button', { hasText: /delete/i });
    this.articleTitle = page.locator('h1, .article-title');
    this.articleContent = page.locator('.article-content, article');
    this.commentSection = page.locator('[data-testid="comments"], .comments-section');
    this.ratingWidget = page.locator('[data-testid="rating"], .rating-widget');
  }

  async goToArticlesList() {
    await this.goto('/dashboard/articles');
  }

  async goToCreateArticle() {
    await this.goto('/dashboard/articles/new');
  }

  async goToEditArticle(id: string) {
    await this.goto(`/dashboard/articles/${id}/edit`);
  }

  async goToViewArticle(slug: string) {
    await this.goto(`/articles/${slug}`);
  }

  async createArticle(data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }) {
    await this.titleInput.fill(data.title);
    await this.contentEditor.fill(data.content);

    if (data.category) {
      await this.categorySelect.selectOption({ label: data.category });
    }

    if (data.tags && data.tags.length > 0) {
      await this.tagsInput.fill(data.tags.join(', '));
    }

    await this.publishButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async saveAsDraft(data: { title: string; content: string }) {
    await this.titleInput.fill(data.title);
    await this.contentEditor.fill(data.content);
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async editArticle(data: { title?: string; content?: string }) {
    if (data.title) {
      await this.titleInput.clear();
      await this.titleInput.fill(data.title);
    }

    if (data.content) {
      await this.contentEditor.clear();
      await this.contentEditor.fill(data.content);
    }

    await this.publishButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async deleteArticle() {
    await this.deleteButton.click();
    // Confirm deletion if there's a dialog
    this.page.on('dialog', (dialog) => dialog.accept());
    await this.page.waitForLoadState('networkidle');
  }

  async expectArticleVisible(title: string) {
    await expect(this.articleTitle).toContainText(title);
    await expect(this.articleContent).toBeVisible();
  }

  async expectArticleInList(title: string) {
    const articleCard = this.page.locator('.article-card, .article-item', {
      hasText: title,
    });
    await expect(articleCard).toBeVisible();
  }
}
