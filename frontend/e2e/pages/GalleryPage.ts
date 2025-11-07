import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import path from 'path';

/**
 * Gallery Page Object - for uploading and managing gallery items
 */
export class GalleryPage extends BasePage {
  constructor(page: Page) {
    super(page, '/dashboard/gallery');
  }

  // Locators
  get uploadButton() {
    return this.page.getByRole('button', { name: /upload|add|dodaj|prześlij/i });
  }

  get fileInput() {
    return this.page.locator('input[type="file"]');
  }

  get titleInput() {
    return this.page.locator('input[name="title"], #title');
  }

  get descriptionInput() {
    return this.page.locator('textarea[name="description"], #description');
  }

  get saveButton() {
    return this.page.getByRole('button', { name: /save|upload|zapisz/i });
  }

  get successMessage() {
    return this.page.locator('[role="alert"].success, .success-message');
  }

  get galleryGrid() {
    return this.page.locator('[data-testid="gallery-grid"], .gallery-grid');
  }

  /**
   * Upload a file to gallery
   */
  async uploadFile(data: {
    filePath: string;
    title?: string;
    description?: string;
  }) {
    await this.goto();
    await this.uploadButton.click();

    // Upload file
    await this.fileInput.setInputFiles(data.filePath);

    // Fill metadata if fields are present
    if (data.title) {
      try {
        await this.titleInput.waitFor({ timeout: 2000 });
        await this.titleInput.fill(data.title);
      } catch {
        // Title might be auto-generated
      }
    }

    if (data.description) {
      try {
        await this.descriptionInput.waitFor({ timeout: 2000 });
        await this.descriptionInput.fill(data.description);
      } catch {
        // Description might be optional
      }
    }

    await this.saveButton.click();
    await this.successMessage.waitFor({ timeout: 10000 });
  }

  /**
   * Create a test image file for upload
   */
  async createTestImage(): Promise<string> {
    // This would need to be implemented based on your setup
    // For now, return a placeholder path
    return path.join(process.cwd(), 'e2e/fixtures/test-image.jpg');
  }

  /**
   * Verify file upload
   */
  async verifyFileUploaded(title: string) {
    await this.goto();
    await this.waitForLoad();
    await expect(this.page.getByText(title)).toBeVisible();
  }
}
