import { test, expect } from './fixtures/base';
import { LoginPage } from './page-objects/LoginPage';
import { RegisterPage } from './page-objects/RegisterPage';
import { BasePage } from './page-objects/BasePage';
import { generateUniqueTitle } from './fixtures/test-data';

test.describe('Authentication Flow', () => {
  test.describe('Registration', () => {
    test('should successfully register a new user', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      const basePage = new BasePage(page);

      await registerPage.goto();

      const uniqueEmail = `test-${Date.now()}@example.com`;
      await registerPage.registerAndWait(
        'Test User',
        uniqueEmail,
        'Test123!@#',
        'Test123!@#'
      );

      // Should be redirected after registration
      await expect(page).not.toHaveURL(/\/register/);

      // Should be authenticated
      await basePage.expectToBeAuthenticated();
    });

    test('should show error for existing email', async ({ page }) => {
      const registerPage = new RegisterPage(page);

      await registerPage.goto();

      // Try to register with existing test user email
      await registerPage.register(
        'Test User',
        'test@example.com',
        'Test123!@#',
        'Test123!@#'
      );

      await registerPage.expectRegistrationError('already exists');
    });

    test('should show error for password mismatch', async ({ page }) => {
      const registerPage = new RegisterPage(page);

      await registerPage.goto();

      const uniqueEmail = `test-${Date.now()}@example.com`;
      await registerPage.register(
        'Test User',
        uniqueEmail,
        'Test123!@#',
        'DifferentPassword123'
      );

      await registerPage.expectRegistrationError();
    });

    test('should show error for weak password', async ({ page }) => {
      const registerPage = new RegisterPage(page);

      await registerPage.goto();

      const uniqueEmail = `test-${Date.now()}@example.com`;
      await registerPage.register('Test User', uniqueEmail, '123', '123');

      await registerPage.expectRegistrationError();
    });

    test('should navigate to login page from registration', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      const loginPage = new LoginPage(page);

      await registerPage.goto();
      await registerPage.goToLogin();

      await loginPage.expectToBeOnLoginPage();
    });
  });

  test.describe('Login', () => {
    test('should successfully login with valid credentials', async ({ page, testUser }) => {
      const loginPage = new LoginPage(page);
      const basePage = new BasePage(page);

      await loginPage.goto();
      await loginPage.loginAndWait(testUser.email, testUser.password);

      // Should be redirected after login
      await expect(page).not.toHaveURL(/\/login/);

      // Should be authenticated
      await basePage.expectToBeAuthenticated();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.login('invalid@example.com', 'wrongpassword');

      await loginPage.expectLoginError();
    });

    test('should show error for empty fields', async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.loginButton.click();

      await loginPage.expectLoginError();
    });

    test('should navigate to register page from login', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const registerPage = new RegisterPage(page);

      await loginPage.goto();
      await loginPage.goToRegister();

      await registerPage.expectToBeOnRegisterPage();
    });
  });

  test.describe('Logout', () => {
    test('should successfully logout', async ({ authenticatedPage }) => {
      const basePage = new BasePage(authenticatedPage);

      // Verify we're authenticated
      await basePage.expectToBeAuthenticated();

      // Logout
      await basePage.logout();

      // Should be unauthenticated
      await basePage.expectToBeUnauthenticated();

      // Should be on login page
      await expect(authenticatedPage).toHaveURL(/\/(login)?/);
    });

    test('should not access protected routes after logout', async ({
      authenticatedPage,
    }) => {
      const basePage = new BasePage(authenticatedPage);

      await basePage.logout();

      // Try to access dashboard
      await authenticatedPage.goto('/dashboard');

      // Should be redirected to login
      await expect(authenticatedPage).toHaveURL(/\/login/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route unauthenticated', async ({
      page,
    }) => {
      await page.goto('/dashboard');

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should access protected route when authenticated', async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto('/dashboard');

      // Should stay on dashboard
      await expect(authenticatedPage).toHaveURL(/\/dashboard/);
    });

    test('admin route should be accessible by admin user', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/users');

      // Should stay on admin route
      await expect(adminPage).toHaveURL(/\/dashboard\/users/);
    });
  });
});
