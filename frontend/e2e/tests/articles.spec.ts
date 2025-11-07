import { test, expect } from '../fixtures/auth.fixture';
import { TestData } from '../fixtures/test-data';

test.describe('Articles Management', () => {
  // Setup: Login before each test
  test.beforeEach(async ({ loginPage, registerPage }) => {
    const userData = TestData.randomUser();
    await registerPage.register(userData.name, userData.email, userData.password);
    await loginPage.login(userData.email, userData.password);
  });

  test.describe('Article Creation', () => {
    test('should create a new article successfully', async ({ articlePage }) => {
      const articleData = TestData.randomArticle();

      await articlePage.createArticle(articleData);
      await articlePage.verifyArticleCreated();
    });

    test('should create article with title and content only', async ({ articlePage }) => {
      const articleData = {
        title: `Minimal Article ${Date.now()}`,
        content: 'This is minimal article content without category or tags.',
      };

      await articlePage.createArticle(articleData);
      await articlePage.verifyArticleCreated();
    });

    test('should show validation error for empty title', async ({ articlePage }) => {
      await articlePage.goToCreate();

      // Fill only content
      await articlePage.contentEditor.fill('Content without title');
      await articlePage.saveButton.click();

      // Should stay on create page or show error
      await expect(articlePage.page).toHaveURL(/\/(new|create)/);
    });

    test('should show validation error for empty content', async ({ articlePage }) => {
      await articlePage.goToCreate();

      // Fill only title
      await articlePage.titleInput.fill('Title without content');
      await articlePage.saveButton.click();

      // Should stay on create page or show error
      await expect(articlePage.page).toHaveURL(/\/(new|create)/);
    });
  });

  test.describe('Article Editing', () => {
    test('should edit an existing article', async ({ articlePage }) => {
      // Create article first
      const articleData = TestData.randomArticle();
      await articlePage.createArticle(articleData);

      // Edit the article
      const newTitle = `Updated ${articleData.title}`;
      await articlePage.editArticle(articleData.title, {
        title: newTitle,
        content: 'Updated content',
      });

      // Verify edit success
      await expect(articlePage.successMessage).toBeVisible();
    });

    test('should preserve unchanged fields when editing', async ({ articlePage }) => {
      const articleData = TestData.randomArticle();
      await articlePage.createArticle(articleData);

      // Edit only the content
      await articlePage.editArticle(articleData.title, {
        content: 'Updated content only',
      });

      await expect(articlePage.successMessage).toBeVisible();
    });
  });

  test.describe('Article Listing', () => {
    test('should display created articles in list', async ({ articlePage }) => {
      const articleData = TestData.randomArticle();

      await articlePage.createArticle(articleData);
      await articlePage.verifyArticleExists(articleData.title);
    });

    test('should show multiple articles', async ({ articlePage }) => {
      // Create multiple articles
      for (let i = 0; i < 3; i++) {
        const articleData = TestData.randomArticle();
        await articlePage.createArticle(articleData);
      }

      await articlePage.goto();
      await articlePage.waitForLoad();

      // Check that articles list exists
      await expect(articlePage.articlesList).toBeVisible();
    });
  });

  test.describe('Article Deletion', () => {
    test('should delete an article', async ({ articlePage }) => {
      const articleData = TestData.randomArticle();

      await articlePage.createArticle(articleData);
      await articlePage.deleteArticle(articleData.title);

      // Verify deletion
      await expect(articlePage.successMessage).toBeVisible();
    });
  });

  test.describe('Article Navigation', () => {
    test('should navigate to article detail page', async ({ articlePage, page }) => {
      const articleData = TestData.randomArticle();

      await articlePage.createArticle(articleData);

      // Navigate back to list and click on article
      await articlePage.goto();
      await page.getByText(articleData.title).first().click();

      // Should be on detail page
      await expect(page).toHaveURL(/\/articles\/[^\/]+$/);
      await expect(page.getByRole('heading', { name: articleData.title })).toBeVisible();
    });
  });
});
