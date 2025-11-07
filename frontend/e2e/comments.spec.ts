import { test, expect } from './fixtures/base';
import { ArticlePage } from './page-objects/ArticlePage';
import { CommentWidget } from './page-objects/CommentWidget';
import { generateTestContent, TEST_COMMENT } from './fixtures/test-data';

test.describe('Comments Functionality', () => {
  test('should post a comment on article', async ({ authenticatedPage, adminPage }) => {
    const articlePage = new ArticlePage(adminPage);
    const commentWidget = new CommentWidget(authenticatedPage);
    const articleData = generateTestContent('article');

    // Create article as admin
    await articlePage.goToCreateArticle();
    await articlePage.createArticle(articleData);

    const slug = articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, '-');

    // View and comment as authenticated user
    await authenticatedPage.goto(`/articles/${slug}`);
    await commentWidget.postComment(TEST_COMMENT.content);

    await commentWidget.expectCommentVisible(TEST_COMMENT.content);
  });

  test('should reply to a comment', async ({ authenticatedPage, adminPage }) => {
    const articlePage = new ArticlePage(adminPage);
    const commentWidget = new CommentWidget(authenticatedPage);
    const articleData = generateTestContent('article');

    await articlePage.goToCreateArticle();
    await articlePage.createArticle(articleData);

    const slug = articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, '-');

    await authenticatedPage.goto(`/articles/${slug}`);

    // Post initial comment
    await commentWidget.postComment(TEST_COMMENT.content);

    // Reply to the comment
    const replyContent = 'This is a reply to the comment';
    await commentWidget.replyToComment(0, replyContent);

    await commentWidget.expectCommentVisible(replyContent);
  });

  test('should edit own comment', async ({ authenticatedPage, adminPage }) => {
    const articlePage = new ArticlePage(adminPage);
    const commentWidget = new CommentWidget(authenticatedPage);
    const articleData = generateTestContent('article');

    await articlePage.goToCreateArticle();
    await articlePage.createArticle(articleData);

    const slug = articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, '-');

    await authenticatedPage.goto(`/articles/${slug}`);

    await commentWidget.postComment(TEST_COMMENT.content);

    const editedContent = 'This comment has been edited';
    await commentWidget.editComment(0, editedContent);

    await commentWidget.expectCommentVisible(editedContent);
  });

  test('should delete own comment', async ({ authenticatedPage, adminPage }) => {
    const articlePage = new ArticlePage(adminPage);
    const commentWidget = new CommentWidget(authenticatedPage);
    const articleData = generateTestContent('article');

    await articlePage.goToCreateArticle();
    await articlePage.createArticle(articleData);

    const slug = articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, '-');

    await authenticatedPage.goto(`/articles/${slug}`);

    await commentWidget.postComment(TEST_COMMENT.content);
    await commentWidget.expectCommentCount(1);

    await commentWidget.deleteComment(0);

    // Should show no comments or reduced count
    await commentWidget.expectCommentCount(0);
  });

  test('should display empty state when no comments', async ({ page, adminPage }) => {
    const articlePage = new ArticlePage(adminPage);
    const commentWidget = new CommentWidget(page);
    const articleData = generateTestContent('article');

    await articlePage.goToCreateArticle();
    await articlePage.createArticle(articleData);

    const slug = articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, '-');

    await page.goto(`/articles/${slug}`);

    await commentWidget.expectNoComments();
  });

  test('should require authentication to comment', async ({ page, adminPage }) => {
    const articlePage = new ArticlePage(adminPage);
    const articleData = generateTestContent('article');

    await articlePage.goToCreateArticle();
    await articlePage.createArticle(articleData);

    const slug = articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, '-');

    // Try to view as unauthenticated user
    await page.goto(`/articles/${slug}`);

    const commentInput = page.locator('textarea[name="comment"]');

    // Comment input should be disabled or login prompt shown
    if (await commentInput.isVisible()) {
      await expect(commentInput).toBeDisabled();
    } else {
      const loginPrompt = page.locator('text=/login to comment|sign in/i');
      await expect(loginPrompt).toBeVisible();
    }
  });

  test('should display comment count', async ({ authenticatedPage, adminPage }) => {
    const articlePage = new ArticlePage(adminPage);
    const commentWidget = new CommentWidget(authenticatedPage);
    const articleData = generateTestContent('article');

    await articlePage.goToCreateArticle();
    await articlePage.createArticle(articleData);

    const slug = articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, '-');

    await authenticatedPage.goto(`/articles/${slug}`);

    await commentWidget.postComment('First comment');
    await commentWidget.postComment('Second comment');

    await commentWidget.expectCommentCount(2);
  });
});
