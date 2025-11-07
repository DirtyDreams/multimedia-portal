import { test, expect } from '../fixtures/auth.fixture';
import { TestData } from '../fixtures/test-data';

test.describe('Blog Management', () => {
  test.beforeEach(async ({ loginPage, registerPage }) => {
    const userData = TestData.randomUser();
    await registerPage.register(userData.name, userData.email, userData.password);
    await loginPage.login(userData.email, userData.password);
  });

  test('should create a new blog post', async ({ blogPage }) => {
    const blogData = TestData.randomBlogPost();

    await blogPage.createBlogPost(blogData);
    await blogPage.verifyBlogPostCreated(blogData.title);
  });

  test('should create blog post with minimal data', async ({ blogPage }) => {
    const blogData = {
      title: `Minimal Blog ${Date.now()}`,
      content: 'Minimal blog post content.',
    };

    await blogPage.createBlogPost(blogData);
    await blogPage.verifyBlogPostCreated(blogData.title);
  });

  test('should show validation error for empty title', async ({ blogPage }) => {
    await blogPage.goToCreate();
    await blogPage.contentEditor.fill('Content without title');
    await blogPage.publishButton.click();

    await expect(blogPage.page).toHaveURL(/\/(new|create)/);
  });

  test('should display published blog posts', async ({ blogPage, page }) => {
    const blogData = TestData.randomBlogPost();

    await blogPage.createBlogPost(blogData);

    // Navigate to blog list
    await page.goto('/blog');
    await expect(page.getByText(blogData.title)).toBeVisible();
  });
});
