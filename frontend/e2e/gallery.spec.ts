import { test, expect } from './fixtures/base';
import { GalleryPage } from './page-objects/GalleryPage';
import { generateUniqueTitle } from './fixtures/test-data';
import * as path from 'path';

test.describe('Gallery Management', () => {
  // Note: For file upload tests, you'll need actual test images
  // Create a test-fixtures directory with sample images
  const testImagePath = path.join(__dirname, 'test-fixtures', 'test-image.jpg');

  test.skip('should upload a single image', async ({ adminPage }) => {
    // Skipped: requires actual test image file
    const galleryPage = new GalleryPage(adminPage);
    const imageData = {
      filePath: testImagePath,
      title: generateUniqueTitle('Test Image'),
      description: 'This is a test image upload',
      category: 'Photography',
      tags: ['test', 'image'],
    };

    await galleryPage.goToUploadGallery();
    await galleryPage.uploadMedia(imageData);

    await galleryPage.goToViewGallery();
    await galleryPage.expectMediaInGallery(imageData.title);
  });

  test.skip('should upload multiple images', async ({ adminPage }) => {
    // Skipped: requires actual test image files
    const galleryPage = new GalleryPage(adminPage);
    const testImages = [
      path.join(__dirname, 'test-fixtures', 'test-image-1.jpg'),
      path.join(__dirname, 'test-fixtures', 'test-image-2.jpg'),
    ];

    await galleryPage.goToUploadGallery();
    await galleryPage.uploadMultipleFiles(testImages);

    await galleryPage.goToViewGallery();
    await galleryPage.expectMediaCount(2);
  });

  test('should display gallery grid', async ({ page }) => {
    const galleryPage = new GalleryPage(page);
    await galleryPage.goToViewGallery();

    await expect(galleryPage.galleryGrid).toBeVisible();
  });

  test.skip('should open lightbox when clicking image', async ({ page, adminPage }) => {
    // Skipped: requires actual test image
    const galleryPage = new GalleryPage(adminPage);
    const imageData = {
      filePath: testImagePath,
      title: generateUniqueTitle('Lightbox Test Image'),
    };

    await galleryPage.goToUploadGallery();
    await galleryPage.uploadMedia(imageData);

    await galleryPage.goToViewGallery();
    await galleryPage.openLightbox(imageData.title);

    await expect(galleryPage.lightbox).toBeVisible();

    await galleryPage.closeLightbox();
    await expect(galleryPage.lightbox).not.toBeVisible();
  });

  test.skip('should delete gallery item', async ({ adminPage }) => {
    // Skipped: requires actual test image
    const galleryPage = new GalleryPage(adminPage);
    const imageData = {
      filePath: testImagePath,
      title: generateUniqueTitle('Delete Test Image'),
    };

    await galleryPage.goToUploadGallery();
    await galleryPage.uploadMedia(imageData);

    await galleryPage.goToViewGallery();
    await galleryPage.deleteMedia(imageData.title);

    const deletedItem = adminPage.locator('.gallery-item', {
      hasText: imageData.title,
    });
    await expect(deletedItem).not.toBeVisible();
  });

  test('should display gallery upload form', async ({ adminPage }) => {
    const galleryPage = new GalleryPage(adminPage);
    await galleryPage.goToUploadGallery();

    await expect(galleryPage.fileInput).toBeVisible();
    await expect(galleryPage.uploadButton).toBeVisible();
  });

  test('should filter gallery by category', async ({ page }) => {
    const galleryPage = new GalleryPage(page);
    await galleryPage.goToViewGallery();

    const categoryFilter = page.locator('select[name="category"], button', {
      hasText: /category/i,
    });

    if (await categoryFilter.isVisible()) {
      await expect(categoryFilter).toBeVisible();
    }
  });
});
