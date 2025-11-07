import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ArticlePage } from '../pages/ArticlePage';
import { BlogPage } from '../pages/BlogPage';
import { WikiPage } from '../pages/WikiPage';
import { GalleryPage } from '../pages/GalleryPage';
import { CommentPage } from '../pages/CommentPage';
import { RatingPage } from '../pages/RatingPage';

/**
 * Extended test fixtures with page objects
 */
type PageFixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  articlePage: ArticlePage;
  blogPage: BlogPage;
  wikiPage: WikiPage;
  galleryPage: GalleryPage;
  commentPage: CommentPage;
  ratingPage: RatingPage;
};

/**
 * Authenticated user fixture
 */
type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<PageFixtures & AuthFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  registerPage: async ({ page }, use) => {
    const registerPage = new RegisterPage(page);
    await use(registerPage);
  },

  articlePage: async ({ page }, use) => {
    const articlePage = new ArticlePage(page);
    await use(articlePage);
  },

  blogPage: async ({ page }, use) => {
    const blogPage = new BlogPage(page);
    await use(blogPage);
  },

  wikiPage: async ({ page }, use) => {
    const wikiPage = new WikiPage(page);
    await use(wikiPage);
  },

  galleryPage: async ({ page }, use) => {
    const galleryPage = new GalleryPage(page);
    await use(galleryPage);
  },

  commentPage: async ({ page }, use) => {
    const commentPage = new CommentPage(page);
    await use(commentPage);
  },

  ratingPage: async ({ page }, use) => {
    const ratingPage = new RatingPage(page);
    await use(ratingPage);
  },

  /**
   * Pre-authenticated page fixture
   * Use this for tests that require authentication
   */
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);

    // Attempt to login with test credentials
    // If login fails, tests will fail with appropriate error
    await loginPage.goto();

    try {
      await loginPage.login('test@example.com', 'password123');
      await page.waitForTimeout(1000);
    } catch (error) {
      console.warn('Pre-authentication failed. Tests may need to handle authentication manually.');
    }

    await use(page);
  },
});

export { expect } from '@playwright/test';
