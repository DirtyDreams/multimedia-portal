import { test as base, Page } from '@playwright/test';

// Test user types
export interface TestUser {
  email: string;
  password: string;
  name: string;
  role?: 'user' | 'moderator' | 'admin';
}

// Custom fixtures type
export interface CustomFixtures {
  authenticatedPage: Page;
  adminPage: Page;
  moderatorPage: Page;
  testUser: TestUser;
  adminUser: TestUser;
  moderatorUser: TestUser;
}

// Default test users
export const TEST_USERS = {
  regular: {
    email: 'test@example.com',
    password: 'Test123!@#',
    name: 'Test User',
    role: 'user' as const,
  },
  admin: {
    email: 'admin@example.com',
    password: 'Admin123!@#',
    name: 'Admin User',
    role: 'admin' as const,
  },
  moderator: {
    email: 'moderator@example.com',
    password: 'Mod123!@#',
    name: 'Moderator User',
    role: 'moderator' as const,
  },
};

// Helper function to login
async function login(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');

  // Wait for navigation after login
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 10000,
  });
}

// Extend base test with custom fixtures
export const test = base.extend<CustomFixtures>({
  // Regular test user
  testUser: async ({}, use) => {
    await use(TEST_USERS.regular);
  },

  // Admin user
  adminUser: async ({}, use) => {
    await use(TEST_USERS.admin);
  },

  // Moderator user
  moderatorUser: async ({}, use) => {
    await use(TEST_USERS.moderator);
  },

  // Authenticated page with regular user
  authenticatedPage: async ({ page, testUser }, use) => {
    await login(page, testUser);
    await use(page);
  },

  // Authenticated page with admin user
  adminPage: async ({ page, adminUser }, use) => {
    await login(page, adminUser);
    await use(page);
  },

  // Authenticated page with moderator user
  moderatorPage: async ({ page, moderatorUser }, use) => {
    await login(page, moderatorUser);
    await use(page);
  },
});

export { expect } from '@playwright/test';
