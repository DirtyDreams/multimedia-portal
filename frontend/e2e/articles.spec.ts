import { test, expect } from './fixtures/base';
import { ArticlePage } from './page-objects/ArticlePage';
import { generateTestContent } from './fixtures/test-data';

test.describe('Articles Management', () => {
  test.describe('Create Article', () => {
    test('should create a new article', async ({ adminPage }) => {
      const articlePage = new ArticlePage(adminPage);
      const articleData = generateTestContent('article');

      await articlePage.goToCreateArticle();
      await articlePage.createArticle(articleData);

      // Should see success message or be redirected
      await expect(adminPage).toHaveURL(/\/articles/);
    });

    test('should save article as draft', async ({ adminPage }) => {
      const articlePage = new ArticlePage(adminPage);
      const articleData = generateTestContent('article');

      await articlePage.goToCreateArticle();
      await articlePage.saveAsDraft({
        title: articleData.title,
        content: articleData.content,
      });

      // Should be saved as draft
      await articlePage.goToArticlesList();
      await articlePage.expectArticleInList(articleData.title);
    });

    test('should show validation error for empty title', async ({ adminPage }) => {
      const articlePage = new ArticlePage(adminPage);

      await articlePage.goToCreateArticle();
      await articlePage.publishButton.click();

      // Should show validation error
      const errorMessage = adminPage.locator('[role="alert"], .error');
      await expect(errorMessage).toBeVisible();
    });

    test('should create article with categories and tags', async ({ adminPage }) => {
      const articlePage = new ArticlePage(adminPage);
      const articleData = generateTestContent('article');

      await articlePage.goToCreateArticle();
      await articlePage.createArticle({
        ...articleData,
        category: 'Technology',
        tags: ['test', 'e2e', 'playwright'],
      });

      await expect(adminPage).toHaveURL(/\/articles/);
    });
  });

  test.describe('View Article', () => {
    test('should view published article', async ({ page, adminPage }) => {
      const articlePage = new ArticlePage(adminPage);
      const articleData = generateTestContent('article');

      // Create article as admin
      await articlePage.goToCreateArticle();
      await articlePage.createArticle(articleData);

      // Extract slug from URL or use generated slug
      const slug = articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, '-');

      // View as regular user
      const viewPage = new ArticlePage(page);
      await viewPage.goToViewArticle(slug);

      // Should display article content
      await viewPage.expectArticleVisible(articleData.title);
    });

    test('should display article metadata', async ({ page, adminPage }) => {
      const articlePage = new ArticlePage(adminPage);
      const articleData = generateTestContent('article');

      await articlePage.goToCreateArticle();
      await articlePage.createArticle({
        ...articleData,
        category: 'Technology',
        tags: ['test'],
      });

      const slug = articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, '-');

      await articlePage.goToViewArticle(slug);

      // Check metadata is visible
      const metadata = adminPage.locator('.article-meta, .metadata');
      await expect(metadata).toBeVisible();
    });
  });

  test.describe('Edit Article', () => {
    test('should edit existing article', async ({ adminPage }) => {
      const articlePage = new ArticlePage(adminPage);
      const articleData = generateTestContent('article');

      // Create article first
      await articlePage.goToCreateArticle();
      await articlePage.createArticle(articleData);

      // Get article ID from URL or list
      await articlePage.goToArticlesList();
      const articleLink = adminPage
        .locator('.article-card, .article-item', { hasText: articleData.title })
        .locator('a[href*="/edit"]')
        .first();

      await articleLink.click();

      // Edit the article
      const updatedTitle = `${articleData.title} - Updated`;
      await articlePage.editArticle({
        title: updatedTitle,
      });

      // Should see updated article
      await articlePage.goToArticlesList();
      await articlePage.expectArticleInList(updatedTitle);
    });

    test('should update article content', async ({ adminPage }) => {
      const articlePage = new ArticlePage(adminPage);
      const articleData = generateTestContent('article');

      await articlePage.goToCreateArticle();
      await articlePage.createArticle(articleData);

      await articlePage.goToArticlesList();
      const editButton = adminPage
        .locator('.article-card, .article-item', { hasText: articleData.title })
        .locator('a[href*="/edit"], button', { hasText: /edit/i })
        .first();

      await editButton.click();

      const updatedContent = 'This is the updated article content.';
      await articlePage.editArticle({
        content: updatedContent,
      });

      // Verify update
      await expect(adminPage).toHaveURL(/\/articles/);
    });
  });

  test.describe('Delete Article', () => {
    test('should delete article', async ({ adminPage }) => {
      const articlePage = new ArticlePage(adminPage);
      const articleData = generateTestContent('article');

      // Create article
      await articlePage.goToCreateArticle();
      await articlePage.createArticle(articleData);

      // Delete the article
      await articlePage.goToArticlesList();
      const articleCard = adminPage.locator('.article-card, .article-item', {
        hasText: articleData.title,
      });

      await articleCard.hover();
      const deleteButton = articleCard.locator('button', { hasText: /delete/i });
      await deleteButton.click();

      // Confirm deletion
      adminPage.on('dialog', (dialog) => dialog.accept());
      await adminPage.waitForLoadState('networkidle');

      // Should not see article in list
      await expect(
        adminPage.locator('.article-card, .article-item', { hasText: articleData.title })
      ).not.toBeVisible();
    });
  });

  test.describe('Articles List', () => {
    test('should display articles list', async ({ page }) => {
      const articlePage = new ArticlePage(page);
      await articlePage.goto('/articles');

      const articlesList = page.locator('.articles-list, .articles-grid');
      await expect(articlesList).toBeVisible();
    });

    test('should filter articles by category', async ({ page, adminPage }) => {
      const articlePage = new ArticlePage(adminPage);
      const articleData = generateTestContent('article');

      await articlePage.goToCreateArticle();
      await articlePage.createArticle({
        ...articleData,
        category: 'Technology',
      });

      await articlePage.goto('/articles');
      const categoryFilter = page.locator('select[name="category"], button', {
        hasText: /category/i,
      });

      if (await categoryFilter.isVisible()) {
        await categoryFilter.click();
        await page.locator('option, a', { hasText: 'Technology' }).click();

        await articlePage.expectArticleInList(articleData.title);
      }
    });
  });
});
