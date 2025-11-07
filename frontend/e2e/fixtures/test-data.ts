/**
 * Test data generators
 */

export const TestData = {
  /**
   * Generate random user data
   */
  randomUser: () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return {
      name: `TestUser${timestamp}${random}`,
      email: `test${timestamp}${random}@example.com`,
      password: 'TestPassword123!',
    };
  },

  /**
   * Generate random article data
   */
  randomArticle: () => {
    const timestamp = Date.now();
    return {
      title: `Test Article ${timestamp}`,
      content: `This is test article content created at ${new Date().toISOString()}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      category: 'Technology',
      tags: ['test', 'automation', 'playwright'],
    };
  },

  /**
   * Generate random blog post data
   */
  randomBlogPost: () => {
    const timestamp = Date.now();
    return {
      title: `Test Blog Post ${timestamp}`,
      content: `This is test blog post content created at ${new Date().toISOString()}. Lorem ipsum dolor sit amet.`,
      excerpt: `Test blog post ${timestamp} excerpt`,
      category: 'General',
      tags: ['blog', 'test'],
    };
  },

  /**
   * Generate random wiki page data
   */
  randomWikiPage: () => {
    const timestamp = Date.now();
    return {
      title: `Test Wiki Page ${timestamp}`,
      content: `This is test wiki page content created at ${new Date().toISOString()}.`,
    };
  },

  /**
   * Generate random comment data
   */
  randomComment: () => {
    const timestamp = Date.now();
    return {
      text: `Test comment created at ${timestamp}. This is a test comment for E2E testing.`,
    };
  },

  /**
   * Default test user credentials
   */
  defaultUser: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
  },

  /**
   * Admin user credentials
   */
  adminUser: {
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
  },
};

/**
 * Test file paths for uploads
 */
export const TestFiles = {
  testImage: 'e2e/fixtures/test-image.jpg',
  testPdf: 'e2e/fixtures/test-document.pdf',
  testVideo: 'e2e/fixtures/test-video.mp4',
};
