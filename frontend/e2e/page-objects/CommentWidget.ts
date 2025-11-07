import { Page, Locator, expect } from '@playwright/test';

/**
 * Comment widget component - can be used on any content type
 */
export class CommentWidget {
  readonly page: Page;
  readonly commentSection: Locator;
  readonly commentInput: Locator;
  readonly submitButton: Locator;
  readonly comments: Locator;
  readonly replyButton: Locator;
  readonly deleteButton: Locator;
  readonly editButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.commentSection = page.locator('[data-testid="comments"], .comments-section');
    this.commentInput = page.locator('textarea[name="comment"], [placeholder*="comment" i]');
    this.submitButton = page.locator('button', { hasText: /submit|post|add\s*comment/i });
    this.comments = page.locator('.comment, [data-testid="comment"]');
    this.replyButton = page.locator('button', { hasText: /reply/i });
    this.deleteButton = page.locator('button', { hasText: /delete/i });
    this.editButton = page.locator('button', { hasText: /edit/i });
  }

  async postComment(content: string) {
    await this.commentInput.fill(content);
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async replyToComment(commentIndex: number, content: string) {
    const comment = this.comments.nth(commentIndex);
    await comment.locator(this.replyButton).click();
    await this.commentInput.fill(content);
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async editComment(commentIndex: number, newContent: string) {
    const comment = this.comments.nth(commentIndex);
    await comment.locator(this.editButton).click();
    await this.commentInput.clear();
    await this.commentInput.fill(newContent);
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async deleteComment(commentIndex: number) {
    const comment = this.comments.nth(commentIndex);
    await comment.locator(this.deleteButton).click();
    // Confirm deletion if there's a dialog
    this.page.on('dialog', (dialog) => dialog.accept());
    await this.page.waitForLoadState('networkidle');
  }

  async expectCommentVisible(content: string) {
    const comment = this.comments.filter({ hasText: content });
    await expect(comment).toBeVisible();
  }

  async expectCommentCount(count: number) {
    await expect(this.comments).toHaveCount(count);
  }

  async expectNoComments() {
    const noCommentsText = this.commentSection.locator('text=/no comments|be the first/i');
    await expect(noCommentsText).toBeVisible();
  }
}
