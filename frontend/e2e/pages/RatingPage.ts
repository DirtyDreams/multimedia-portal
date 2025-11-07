import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Rating Page Object - for rating content
 */
export class RatingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Locators
  get ratingWidget() {
    return this.page.locator('[data-testid="rating-widget"], .rating-widget');
  }

  get stars() {
    return this.ratingWidget.locator('.star, [data-rating]');
  }

  get currentRating() {
    return this.page.locator('[data-testid="current-rating"], .current-rating');
  }

  get submitRatingButton() {
    return this.page.getByRole('button', { name: /submit rating|rate|oceń/i });
  }

  /**
   * Give a rating (1-5 stars)
   */
  async giveRating(stars: number) {
    if (stars < 1 || stars > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    await this.ratingWidget.waitFor({ timeout: 5000 });

    // Click on the star
    const star = this.stars.nth(stars - 1);
    await star.click();

    // Submit if button exists
    try {
      await this.submitRatingButton.click({ timeout: 2000 });
    } catch {
      // Rating might submit automatically
    }

    // Wait for rating to be registered
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify rating was submitted
   */
  async verifyRatingSubmitted(expectedStars?: number) {
    await expect(this.ratingWidget).toBeVisible();

    if (expectedStars) {
      // Check if the correct number of stars is highlighted
      const activeStars = await this.stars.filter({ hasText: /★|filled/ }).count();
      expect(activeStars).toBeGreaterThanOrEqual(expectedStars);
    }
  }

  /**
   * Get current average rating
   */
  async getCurrentRating(): Promise<number> {
    try {
      const ratingText = await this.currentRating.textContent();
      if (ratingText) {
        const match = ratingText.match(/(\d+\.?\d*)/);
        return match ? parseFloat(match[1]) : 0;
      }
    } catch {
      return 0;
    }
    return 0;
  }
}
