import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class BlogPage extends BasePage {
  readonly titleInput: Locator;
  readonly contentEditor: Locator;
  readonly categorySelect: Locator;
  readonly tagsInput: Locator;
  readonly saveButton: Locator;
  readonly publishButton: Locator;
  readonly deleteButton: Locator;
  readonly blogTitle: Locator;
  readonly blogContent: Locator;
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
    this.blogTitle = page.locator('h1, .blog-title');
    this.blogContent = page.locator('.blog-content, article');
    this.commentSection = page.locator('[data-testid="comments"], .comments-section');
    this.ratingWidget = page.locator('[data-testid="rating"], .rating-widget');
  }

  async goToBlogList() {
    await this.goto('/dashboard/blog');
  }

  async goToCreateBlog() {
    await this.goto('/dashboard/blog/new');
  }

  async goToEditBlog(id: string) {
    await this.goto(`/dashboard/blog/${id}/edit`);
  }

  async goToViewBlog(slug: string) {
    await this.goto(`/blog/${slug}`);
  }

  async createBlogPost(data: {
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

  async editBlogPost(data: { title?: string; content?: string }) {
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

  async deleteBlogPost() {
    await this.deleteButton.click();
    // Confirm deletion if there's a dialog
    this.page.on('dialog', (dialog) => dialog.accept());
    await this.page.waitForLoadState('networkidle');
  }

  async expectBlogPostVisible(title: string) {
    await expect(this.blogTitle).toContainText(title);
    await expect(this.blogContent).toBeVisible();
  }

  async expectBlogPostInList(title: string) {
    const blogCard = this.page.locator('.blog-card, .blog-item', {
      hasText: title,
    });
    await expect(blogCard).toBeVisible();
  }
}
