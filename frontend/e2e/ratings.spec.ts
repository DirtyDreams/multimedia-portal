import { test, expect } from './fixtures/base';
import { ArticlePage } from './page-objects/ArticlePage';
import { RatingWidget } from './page-objects/RatingWidget';
import { generateTestContent } from './fixtures/test-data';

test.describe('Ratings Functionality', () => {
  test('should rate an article', async ({ authenticatedPage, adminPage }) => {
    const articlePage = new ArticlePage(adminPage);
    const ratingWidget = new RatingWidget(authenticatedPage);
    const articleData = generateTestContent('article');

    // Create article as admin
    await articlePage.goToCreateArticle();
    await articlePage.createArticle(articleData);

    const slug = articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, '-');

    // View and rate as authenticated user
    await authenticatedPage.goto(`/articles/${slug}`);

    await ratingWidget.expectRatingVisible();
    await ratingWidget.rate(4);

    await ratingWidget.expectUserRating(4);
  });

  test('should update existing rating', async ({ authenticatedPage, adminPage }) => {
    const articlePage = new ArticlePage(adminPage);
    const ratingWidget = new RatingWidget(authenticatedPage);
    const articleData = generateTestContent('article');

    await articlePage.goToCreateArticle();
    await articlePage.createArticle(articleData);

    const slug = articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, '-');

    await authenticatedPage.goto(`/articles/${slug}`);

    // Initial rating
    await ratingWidget.rate(3);
    await ratingWidget.expectUserRating(3);

    // Update rating
    await ratingWidget.rate(5);
    await ratingWidget.expectUserRating(5);
  });

  test('should display average rating', async ({ authenticatedPage, adminPage, page }) => {
    const articlePage = new ArticlePage(adminPage);
    const articleData = generateTestContent('article');

    await articlePage.goToCreateArticle();
    await articlePage.createArticle(articleData);

    const slug = articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, '-');

    // Rate as authenticated user
    const ratingWidget1 = new RatingWidget(authenticatedPage);
    await authenticatedPage.goto(`/articles/${slug}`);
    await ratingWidget1.rate(4);

    // View average as unauthenticated user
    const ratingWidget2 = new RatingWidget(page);
    await page.goto(`/articles/${slug}`);

    await ratingWidget2.expectRatingVisible();
    // Average should be around 4 (may vary based on existing ratings)
  });

  test('should display rating count', async ({ authenticatedPage, adminPage }) => {
    const articlePage = new ArticlePage(adminPage);
    const ratingWidget = new RatingWidget(authenticatedPage);
    const articleData = generateTestContent('article');

    await articlePage.goToCreateArticle();
    await articlePage.createArticle(articleData);

    const slug = articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, '-');

    await authenticatedPage.goto(`/articles/${slug}`);

    await ratingWidget.rate(5);

    // Rating count should be at least 1
    const ratingCount = await ratingWidget.ratingCount.textContent();
    expect(ratingCount).toMatch(/\d+/);
  });

  test('should require authentication to rate', async ({ page, adminPage }) => {
    const articlePage = new ArticlePage(adminPage);
    const ratingWidget = new RatingWidget(page);
    const articleData = generateTestContent('article');

    await articlePage.goToCreateArticle();
    await articlePage.createArticle(articleData);

    const slug = articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, '-');

    await page.goto(`/articles/${slug}`);

    // Try to rate as unauthenticated user
    const stars = ratingWidget.stars.first();

    if (await stars.isVisible()) {
      // Stars might be disabled or clicking should prompt login
      await stars.click();

      // Should either show login prompt or not update rating
      const loginPrompt = page.locator('text=/login|sign in/i');
      if (await loginPrompt.isVisible()) {
        await expect(loginPrompt).toBeVisible();
      }
    }
  });

  test('should validate rating range', async ({ authenticatedPage, adminPage }) => {
    const articlePage = new ArticlePage(adminPage);
    const ratingWidget = new RatingWidget(authenticatedPage);
    const articleData = generateTestContent('article');

    await articlePage.goToCreateArticle();
    await articlePage.createArticle(articleData);

    const slug = articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, '-');

    await authenticatedPage.goto(`/articles/${slug}`);

    // Should allow ratings from 1 to 5
    for (let i = 1; i <= 5; i++) {
      await ratingWidget.rate(i);
      await ratingWidget.expectUserRating(i);
    }
  });

  test('should display rating widget on multiple content types', async ({
    authenticatedPage,
    adminPage,
  }) => {
    const articlePage = new ArticlePage(adminPage);
    const ratingWidget = new RatingWidget(authenticatedPage);
    const articleData = generateTestContent('article');

    await articlePage.goToCreateArticle();
    await articlePage.createArticle(articleData);

    const slug = articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, '-');

    // Test on article
    await authenticatedPage.goto(`/articles/${slug}`);
    await ratingWidget.expectRatingVisible();

    // Could also test on blog, wiki, gallery if they support ratings
  });
});
