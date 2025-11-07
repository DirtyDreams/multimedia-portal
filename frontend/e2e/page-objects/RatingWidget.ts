import { Page, Locator, expect } from '@playwright/test';

/**
 * Rating widget component - can be used on any content type
 */
export class RatingWidget {
  readonly page: Page;
  readonly ratingSection: Locator;
  readonly stars: Locator;
  readonly averageRating: Locator;
  readonly ratingCount: Locator;
  readonly userRating: Locator;

  constructor(page: Page) {
    this.page = page;
    this.ratingSection = page.locator('[data-testid="rating"], .rating-widget');
    this.stars = page.locator('.star, [data-testid="star"]');
    this.averageRating = page.locator('.average-rating, [data-testid="average-rating"]');
    this.ratingCount = page.locator('.rating-count, [data-testid="rating-count"]');
    this.userRating = page.locator('.user-rating, [data-testid="user-rating"]');
  }

  async rate(stars: number) {
    if (stars < 1 || stars > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Click on the nth star (1-indexed)
    const star = this.stars.nth(stars - 1);
    await star.click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectAverageRating(rating: number, tolerance: number = 0.1) {
    const ratingText = await this.averageRating.textContent();
    const actualRating = parseFloat(ratingText?.match(/[\d.]+/)?.[0] || '0');
    expect(Math.abs(actualRating - rating)).toBeLessThanOrEqual(tolerance);
  }

  async expectRatingCount(count: number) {
    const countText = await this.ratingCount.textContent();
    const actualCount = parseInt(countText?.match(/\d+/)?.[0] || '0');
    expect(actualCount).toBe(count);
  }

  async expectUserRating(stars: number) {
    // Check that the correct number of stars are filled/highlighted
    const filledStars = this.stars.filter({ hasClass: /filled|active|selected/i });
    await expect(filledStars).toHaveCount(stars);
  }

  async expectNoUserRating() {
    const filledStars = this.stars.filter({ hasClass: /filled|active|selected/i });
    await expect(filledStars).toHaveCount(0);
  }

  async expectRatingVisible() {
    await expect(this.ratingSection).toBeVisible();
  }
}
