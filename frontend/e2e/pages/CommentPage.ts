import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Comment Page Object - for adding and managing comments
 */
export class CommentPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Locators
  get commentInput() {
    return this.page.locator('textarea[name="comment"], #comment-input, [placeholder*="comment" i]');
  }

  get submitCommentButton() {
    return this.page.getByRole('button', { name: /submit|post|add comment|dodaj komentarz/i });
  }

  get commentsSection() {
    return this.page.locator('[data-testid="comments-section"], .comments-section');
  }

  get commentsList() {
    return this.page.locator('[data-testid="comments-list"], .comments-list');
  }

  get firstComment() {
    return this.commentsList.locator('.comment-item, [data-testid="comment-item"]').first();
  }

  get deleteCommentButton() {
    return this.page.getByRole('button', { name: /delete|usuń/i }).first();
  }

  /**
   * Add a comment to current page
   */
  async addComment(text: string) {
    await this.commentInput.waitFor({ timeout: 5000 });
    await this.commentInput.fill(text);
    await this.submitCommentButton.click();

    // Wait for comment to appear
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify comment exists
   */
  async verifyCommentExists(text: string) {
    await expect(this.commentsSection.getByText(text)).toBeVisible();
  }

  /**
   * Delete first comment
   */
  async deleteFirstComment() {
    await this.firstComment.hover();
    await this.deleteCommentButton.click();

    // Confirm deletion if modal appears
    try {
      await this.page.getByRole('button', { name: /confirm|yes|tak/i }).click({ timeout: 2000 });
    } catch {
      // No confirmation needed
    }
  }

  /**
   * Get comment count
   */
  async getCommentCount(): Promise<number> {
    const comments = await this.commentsList.locator('.comment-item, [data-testid="comment-item"]').count();
    return comments;
  }
}
