import { Page, expect } from '@playwright/test';

/**
 * Wait for API response with specific endpoint
 */
export async function waitForApiResponse(
  page: Page,
  endpoint: string,
  method: string = 'GET'
): Promise<any> {
  const response = await page.waitForResponse(
    (response) =>
      response.url().includes(endpoint) && response.request().method() === method,
    { timeout: 10000 }
  );
  return response.json();
}

/**
 * Fill form fields from data object
 */
export async function fillForm(
  page: Page,
  formData: Record<string, string>
): Promise<void> {
  for (const [field, value] of Object.entries(formData)) {
    await page.fill(`[name="${field}"]`, value);
  }
}

/**
 * Upload file to file input
 */
export async function uploadFile(
  page: Page,
  selector: string,
  filePath: string
): Promise<void> {
  const fileInput = await page.locator(selector);
  await fileInput.setInputFiles(filePath);
}

/**
 * Wait for toast/notification message
 */
export async function waitForNotification(
  page: Page,
  message?: string
): Promise<void> {
  const notification = page.locator('[role="alert"], .toast, .notification');
  await expect(notification).toBeVisible({ timeout: 5000 });

  if (message) {
    await expect(notification).toContainText(message);
  }
}

/**
 * Navigate to dashboard section
 */
export async function navigateToDashboard(
  page: Page,
  section?: string
): Promise<void> {
  if (section) {
    await page.goto(`/dashboard/${section}`);
  } else {
    await page.goto('/dashboard');
  }
  await page.waitForLoadState('networkidle');
}

/**
 * Clear all cookies and local storage
 */
export async function clearAuth(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('authToken'));
  return !!token;
}

/**
 * Wait for element and scroll into view
 */
export async function scrollToElement(
  page: Page,
  selector: string
): Promise<void> {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  await expect(element).toBeVisible();
}

/**
 * Take screenshot with custom name
 */
export async function takeScreenshot(
  page: Page,
  name: string
): Promise<void> {
  await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage: true,
  });
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

/**
 * Retry action with exponential backoff
 */
export async function retryAction<T>(
  action: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError;
}
