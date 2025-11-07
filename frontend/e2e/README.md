# E2E Tests with Playwright

Comprehensive end-to-end tests for the Multimedia Portal application using Playwright.

## Overview

This test suite covers:

- **Authentication**: User registration, login, logout, session management
- **Articles**: Create, edit, delete, and list articles
- **Blog**: Create and manage blog posts
- **Wiki**: Create wiki pages with hierarchical structure
- **Gallery**: Upload and manage media files
- **Comments**: Add, view, and delete comments on content
- **Ratings**: Rate content with 1-5 stars

## Directory Structure

```
e2e/
├── pages/           # Page Object Model classes
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── RegisterPage.ts
│   ├── ArticlePage.ts
│   ├── BlogPage.ts
│   ├── WikiPage.ts
│   ├── GalleryPage.ts
│   ├── CommentPage.ts
│   └── RatingPage.ts
├── fixtures/        # Test fixtures and data
│   ├── auth.fixture.ts
│   ├── test-data.ts
│   └── README.md
├── utils/           # Helper utilities
│   └── helpers.ts
└── tests/           # Test suites
    ├── auth.spec.ts
    ├── articles.spec.ts
    ├── blog.spec.ts
    ├── wiki.spec.ts
    ├── gallery.spec.ts
    └── comments-and-ratings.spec.ts
```

## Prerequisites

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install Playwright browsers**:
   ```bash
   npx playwright install
   ```

3. **Ensure backend is running**:
   ```bash
   # In backend directory
   npm run start:dev
   ```

4. **Ensure frontend is running** (or let Playwright start it):
   ```bash
   # In frontend directory
   npm run dev
   ```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npx playwright test auth.spec.ts
npx playwright test articles.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests in parallel
```bash
npx playwright test --workers=4
```

## Test Configuration

Configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000` (configurable via `PLAYWRIGHT_BASE_URL`)
- **Browsers**: Chromium, Firefox, WebKit (Safari), Mobile Chrome, Mobile Safari
- **Retries**: 2 retries on CI, 0 locally
- **Timeout**: 60 seconds per test
- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure
- **Traces**: Captured on first retry

## Page Object Model

Tests use the Page Object Model pattern for maintainability:

```typescript
// Example: Using page objects in tests
test('should create article', async ({ articlePage }) => {
  const articleData = TestData.randomArticle();
  await articlePage.createArticle(articleData);
  await articlePage.verifyArticleCreated();
});
```

## Test Fixtures

Custom fixtures provide page objects and authentication:

```typescript
import { test, expect } from '../fixtures/auth.fixture';

// All page objects are available as fixtures
test('my test', async ({
  loginPage,
  articlePage,
  commentPage
}) => {
  // Use page objects directly
});
```

## Test Data

Test data generators in `fixtures/test-data.ts`:

```typescript
import { TestData } from '../fixtures/test-data';

const user = TestData.randomUser();
const article = TestData.randomArticle();
const comment = TestData.randomComment();
```

## Viewing Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## Debugging Failed Tests

1. **View trace**: Playwright captures traces on failure
   ```bash
   npx playwright show-trace test-results/trace.zip
   ```

2. **Screenshots**: Automatically saved in `test-results/screenshots/`

3. **Videos**: Automatically saved in `test-results/` (on failure)

## CI/CD Integration

The tests are configured for CI environments:

- Retries enabled (2 retries)
- Single worker for stability
- No web server auto-start (assumes services are running)

### GitHub Actions Example

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true
    PLAYWRIGHT_BASE_URL: http://localhost:3000
```

## Best Practices

1. **Use Page Objects**: All page interactions should go through page objects
2. **Use Test Data Generators**: Use `TestData` helpers for dynamic data
3. **Wait for Elements**: Page objects handle waits, avoid manual `waitForTimeout`
4. **Independent Tests**: Each test should be independent and not rely on others
5. **Clean State**: Tests create their own users and data
6. **Descriptive Names**: Test names clearly describe what they test
7. **Error Handling**: Tests gracefully handle missing features with `test.skip()`

## Common Issues

### Tests failing with "element not found"

- Check if the frontend is running
- Verify selectors match your actual UI
- Use Playwright inspector: `npx playwright test --debug`

### Authentication not working

- Verify backend is running
- Check API endpoints are accessible
- Review network tab in browser

### Gallery tests skipped

- Add test image files to `e2e/fixtures/` (see fixtures/README.md)

## Environment Variables

- `PLAYWRIGHT_BASE_URL`: Base URL for tests (default: `http://localhost:3000`)
- `CI`: Set to `true` for CI environments (enables retries, single worker)

## Writing New Tests

1. Create page object in `pages/` if needed
2. Add test data generator in `fixtures/test-data.ts` if needed
3. Create test file in `tests/`
4. Use fixtures and page objects
5. Follow naming conventions: `*.spec.ts`

Example:

```typescript
import { test, expect } from '../fixtures/auth.fixture';
import { TestData } from '../fixtures/test-data';

test.describe('My Feature', () => {
  test.beforeEach(async ({ loginPage, registerPage }) => {
    // Setup authentication
    const user = TestData.randomUser();
    await registerPage.register(user.name, user.email, user.password);
    await loginPage.login(user.email, user.password);
  });

  test('should do something', async ({ myPage }) => {
    // Test implementation
  });
});
```

## Test Coverage

Current test coverage:

- ✅ User registration and login
- ✅ Session management
- ✅ Article CRUD operations
- ✅ Blog post creation
- ✅ Wiki page creation
- ✅ Gallery uploads
- ✅ Comments (add, view, delete)
- ✅ Ratings (1-5 stars)
- ✅ Cross-browser testing (Chrome, Firefox, Safari)
- ✅ Mobile viewport testing

## Support

For issues or questions:

1. Check Playwright documentation: https://playwright.dev
2. Review test output and traces
3. Use `--debug` flag for step-by-step debugging
4. Check console logs in test results
