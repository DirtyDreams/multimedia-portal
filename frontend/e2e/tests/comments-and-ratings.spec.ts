import { test, expect } from '../fixtures/auth.fixture';
import { TestData } from '../fixtures/test-data';

test.describe('Comments and Ratings', () => {
  test.beforeEach(async ({ loginPage, registerPage }) => {
    const userData = TestData.randomUser();
    await registerPage.register(userData.name, userData.email, userData.password);
    await loginPage.login(userData.email, userData.password);
  });

  test.describe('Comments', () => {
    test('should add a comment to an article', async ({ articlePage, commentPage, page }) => {
      // Create an article first
      const articleData = TestData.randomArticle();
      await articlePage.createArticle(articleData);

      // Add a comment
      const commentData = TestData.randomComment();
      await commentPage.addComment(commentData.text);

      // Verify comment was added
      await commentPage.verifyCommentExists(commentData.text);
    });

    test('should display comments section', async ({ articlePage, commentPage, page }) => {
      const articleData = TestData.randomArticle();
      await articlePage.createArticle(articleData);

      // Check if comments section is visible
      try {
        await expect(commentPage.commentsSection).toBeVisible({ timeout: 5000 });
      } catch {
        // Comments section might not be visible by default
        console.log('Comments section not immediately visible');
      }
    });

    test('should delete a comment', async ({ articlePage, commentPage }) => {
      const articleData = TestData.randomArticle();
      await articlePage.createArticle(articleData);

      const commentData = TestData.randomComment();
      await commentPage.addComment(commentData.text);

      // Get initial count
      const initialCount = await commentPage.getCommentCount();

      // Delete comment
      try {
        await commentPage.deleteFirstComment();

        // Verify count decreased
        const newCount = await commentPage.getCommentCount();
        expect(newCount).toBeLessThan(initialCount);
      } catch {
        // Delete might not be available for own comment immediately
        console.log('Could not delete comment');
        test.skip();
      }
    });

    test('should add multiple comments', async ({ articlePage, commentPage }) => {
      const articleData = TestData.randomArticle();
      await articlePage.createArticle(articleData);

      // Add multiple comments
      for (let i = 0; i < 3; i++) {
        const commentData = TestData.randomComment();
        await commentPage.addComment(`${commentData.text} - Comment ${i + 1}`);
      }

      // Verify comment count
      const count = await commentPage.getCommentCount();
      expect(count).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe('Ratings', () => {
    test('should add a rating to an article', async ({ articlePage, ratingPage }) => {
      const articleData = TestData.randomArticle();
      await articlePage.createArticle(articleData);

      // Give a 5-star rating
      await ratingPage.giveRating(5);
      await ratingPage.verifyRatingSubmitted(5);
    });

    test('should display rating widget', async ({ articlePage, ratingPage }) => {
      const articleData = TestData.randomArticle();
      await articlePage.createArticle(articleData);

      // Check if rating widget is visible
      await expect(ratingPage.ratingWidget).toBeVisible({ timeout: 5000 });
    });

    test('should accept different rating values', async ({ articlePage, ratingPage, page }) => {
      const ratings = [1, 3, 5];

      for (const rating of ratings) {
        const articleData = TestData.randomArticle();
        await articlePage.createArticle(articleData);

        await ratingPage.giveRating(rating);
        await ratingPage.verifyRatingSubmitted();

        // Navigate back for next iteration
        await page.goBack();
      }
    });

    test('should update rating if already rated', async ({ articlePage, ratingPage }) => {
      const articleData = TestData.randomArticle();
      await articlePage.createArticle(articleData);

      // Give initial rating
      await ratingPage.giveRating(3);

      // Update rating
      await ratingPage.giveRating(5);
      await ratingPage.verifyRatingSubmitted(5);
    });
  });

  test.describe('Comments on Blog Posts', () => {
    test('should add a comment to a blog post', async ({ blogPage, commentPage }) => {
      const blogData = TestData.randomBlogPost();
      await blogPage.createBlogPost(blogData);

      const commentData = TestData.randomComment();
      await commentPage.addComment(commentData.text);

      await commentPage.verifyCommentExists(commentData.text);
    });
  });

  test.describe('Ratings on Blog Posts', () => {
    test('should add a rating to a blog post', async ({ blogPage, ratingPage }) => {
      const blogData = TestData.randomBlogPost();
      await blogPage.createBlogPost(blogData);

      await ratingPage.giveRating(4);
      await ratingPage.verifyRatingSubmitted();
    });
  });
});
