// Test data fixtures for E2E tests

export const TEST_ARTICLE = {
  title: 'Test Article Title',
  content: 'This is a test article content. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  category: 'Technology',
  tags: ['test', 'e2e', 'playwright'],
  slug: 'test-article-title',
};

export const TEST_BLOG_POST = {
  title: 'Test Blog Post',
  content: 'This is a test blog post content. Sed do eiusmod tempor incididunt ut labore.',
  category: 'Personal',
  tags: ['blog', 'test'],
  slug: 'test-blog-post',
};

export const TEST_WIKI_PAGE = {
  title: 'Test Wiki Page',
  content: 'This is a test wiki page. It contains structured information about a topic.',
  slug: 'test-wiki-page',
};

export const TEST_WIKI_CHILD_PAGE = {
  title: 'Test Child Wiki Page',
  content: 'This is a child page in the wiki hierarchy.',
  slug: 'test-child-wiki-page',
};

export const TEST_STORY = {
  title: 'Test Story',
  content: 'Once upon a time in a test environment...',
  category: 'Fiction',
  tags: ['story', 'test'],
  series: 'Test Series',
  slug: 'test-story',
};

export const TEST_COMMENT = {
  content: 'This is a test comment on the content.',
};

export const TEST_RATING = {
  rating: 4,
};

export const TEST_AUTHOR = {
  name: 'Test Author',
  bio: 'A test author for E2E testing',
  email: 'author@example.com',
};

// Helper to generate unique titles for parallel tests
export function generateUniqueTitle(base: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${base} ${timestamp}-${random}`;
}

// Helper to generate test content
export function generateTestContent(type: 'article' | 'blog' | 'wiki' | 'story') {
  const baseData = {
    article: TEST_ARTICLE,
    blog: TEST_BLOG_POST,
    wiki: TEST_WIKI_PAGE,
    story: TEST_STORY,
  }[type];

  return {
    ...baseData,
    title: generateUniqueTitle(baseData.title),
  };
}
