import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class GalleryPage extends BasePage {
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly fileInput: Locator;
  readonly categorySelect: Locator;
  readonly tagsInput: Locator;
  readonly uploadButton: Locator;
  readonly deleteButton: Locator;
  readonly galleryGrid: Locator;
  readonly galleryItem: Locator;
  readonly lightbox: Locator;
  readonly commentSection: Locator;
  readonly ratingWidget: Locator;

  constructor(page: Page) {
    super(page);
    this.titleInput = page.locator('input[name="title"]');
    this.descriptionInput = page.locator('textarea[name="description"]');
    this.fileInput = page.locator('input[type="file"]');
    this.categorySelect = page.locator('select[name="category"], [name="categoryId"]');
    this.tagsInput = page.locator('input[name="tags"]');
    this.uploadButton = page.locator('button', { hasText: /upload|submit/i });
    this.deleteButton = page.locator('button', { hasText: /delete/i });
    this.galleryGrid = page.locator('.gallery-grid, .gallery-container');
    this.galleryItem = page.locator('.gallery-item, .media-item');
    this.lightbox = page.locator('.lightbox, .modal');
    this.commentSection = page.locator('[data-testid="comments"], .comments-section');
    this.ratingWidget = page.locator('[data-testid="rating"], .rating-widget');
  }

  async goToGalleryList() {
    await this.goto('/dashboard/gallery');
  }

  async goToUploadGallery() {
    await this.goto('/dashboard/gallery/upload');
  }

  async goToViewGallery(id?: string) {
    if (id) {
      await this.goto(`/gallery/${id}`);
    } else {
      await this.goto('/gallery');
    }
  }

  async uploadMedia(data: {
    filePath: string;
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
  }) {
    // Upload file
    await this.fileInput.setInputFiles(data.filePath);

    if (data.title) {
      await this.titleInput.fill(data.title);
    }

    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }

    if (data.category) {
      await this.categorySelect.selectOption({ label: data.category });
    }

    if (data.tags && data.tags.length > 0) {
      await this.tagsInput.fill(data.tags.join(', '));
    }

    await this.uploadButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async uploadMultipleFiles(filePaths: string[]) {
    await this.fileInput.setInputFiles(filePaths);
    await this.uploadButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async deleteMedia(title: string) {
    const item = this.galleryItem.filter({ hasText: title }).first();
    await item.hover();
    await item.locator(this.deleteButton).click();
    // Confirm deletion if there's a dialog
    this.page.on('dialog', (dialog) => dialog.accept());
    await this.page.waitForLoadState('networkidle');
  }

  async openLightbox(title: string) {
    const item = this.galleryItem.filter({ hasText: title }).first();
    await item.click();
    await expect(this.lightbox).toBeVisible();
  }

  async closeLightbox() {
    const closeButton = this.lightbox.locator('button', { hasText: /close|×/i });
    await closeButton.click();
    await expect(this.lightbox).not.toBeVisible();
  }

  async expectMediaInGallery(title: string) {
    const item = this.galleryItem.filter({ hasText: title });
    await expect(item).toBeVisible();
  }

  async expectMediaCount(count: number) {
    await expect(this.galleryItem).toHaveCount(count);
  }
}
