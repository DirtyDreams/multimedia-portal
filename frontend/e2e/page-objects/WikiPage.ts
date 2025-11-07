import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class WikiPage extends BasePage {
  readonly titleInput: Locator;
  readonly contentEditor: Locator;
  readonly parentSelect: Locator;
  readonly saveButton: Locator;
  readonly publishButton: Locator;
  readonly deleteButton: Locator;
  readonly wikiTitle: Locator;
  readonly wikiContent: Locator;
  readonly hierarchyNav: Locator;
  readonly childPages: Locator;
  readonly commentSection: Locator;

  constructor(page: Page) {
    super(page);
    this.titleInput = page.locator('input[name="title"]');
    this.contentEditor = page.locator('textarea[name="content"], [contenteditable="true"]');
    this.parentSelect = page.locator('select[name="parent"], [name="parentId"]');
    this.saveButton = page.locator('button', { hasText: /save|draft/i });
    this.publishButton = page.locator('button', { hasText: /publish/i });
    this.deleteButton = page.locator('button', { hasText: /delete/i });
    this.wikiTitle = page.locator('h1, .wiki-title');
    this.wikiContent = page.locator('.wiki-content, article');
    this.hierarchyNav = page.locator('.wiki-nav, .breadcrumb');
    this.childPages = page.locator('.child-pages, .subpages');
    this.commentSection = page.locator('[data-testid="comments"], .comments-section');
  }

  async goToWikiList() {
    await this.goto('/dashboard/wiki');
  }

  async goToCreateWiki() {
    await this.goto('/dashboard/wiki/new');
  }

  async goToEditWiki(id: string) {
    await this.goto(`/dashboard/wiki/${id}/edit`);
  }

  async goToViewWiki(slug: string) {
    await this.goto(`/wiki/${slug}`);
  }

  async createWikiPage(data: { title: string; content: string; parentId?: string }) {
    await this.titleInput.fill(data.title);
    await this.contentEditor.fill(data.content);

    if (data.parentId && (await this.parentSelect.isVisible())) {
      await this.parentSelect.selectOption(data.parentId);
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

  async editWikiPage(data: { title?: string; content?: string }) {
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

  async deleteWikiPage() {
    await this.deleteButton.click();
    // Confirm deletion if there's a dialog
    this.page.on('dialog', (dialog) => dialog.accept());
    await this.page.waitForLoadState('networkidle');
  }

  async expectWikiPageVisible(title: string) {
    await expect(this.wikiTitle).toContainText(title);
    await expect(this.wikiContent).toBeVisible();
  }

  async expectWikiPageInList(title: string) {
    const wikiCard = this.page.locator('.wiki-card, .wiki-item', {
      hasText: title,
    });
    await expect(wikiCard).toBeVisible();
  }

  async expectChildPageVisible(title: string) {
    const childPage = this.childPages.locator('a, li', { hasText: title });
    await expect(childPage).toBeVisible();
  }

  async expectInHierarchy(title: string) {
    const breadcrumb = this.hierarchyNav.locator('a, li', { hasText: title });
    await expect(breadcrumb).toBeVisible();
  }
}
