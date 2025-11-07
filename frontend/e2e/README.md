# E2E Tests with Playwright

This directory contains end-to-end tests for the Multimedia Portal using Playwright.

## Structure

```
e2e/
├── fixtures/              # Test fixtures and custom test extensions
│   ├── base.ts           # Custom test fixtures (auth, users)
│   └── test-data.ts      # Test data constants
├── page-objects/         # Page Object Model implementations
│   ├── BasePage.ts       # Base page with common navigation
│   ├── LoginPage.ts      # Login page
│   ├── RegisterPage.ts   # Registration page
│   ├── ArticlePage.ts    # Article management
│   ├── BlogPage.ts       # Blog management
│   ├── WikiPage.ts       # Wiki management
│   ├── GalleryPage.ts    # Gallery management
│   ├── CommentWidget.ts  # Comment functionality
│   └── RatingWidget.ts   # Rating functionality
├── utils/                # Helper utilities
│   └── helpers.ts        # Common test helpers
├── test-fixtures/        # Test assets (images, files)
├── auth.spec.ts          # Authentication tests
├── articles.spec.ts      # Article CRUD tests
├── blog.spec.ts          # Blog CRUD tests
├── wiki.spec.ts          # Wiki CRUD + hierarchy tests
├── gallery.spec.ts       # Gallery upload/delete tests
├── comments.spec.ts      # Commenting functionality tests
├── ratings.spec.ts       # Rating functionality tests
└── README.md             # This file
```

## Running Tests

### Run all tests
```bash
npx playwright test
```

### Run specific test file
```bash
npx playwright test e2e/auth.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

### Run tests with UI mode
```bash
npx playwright test --ui
```

## Test Reports

### View HTML report
```bash
npx playwright show-report
```

### Generate report
```bash
npx playwright test --reporter=html
```

## Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000` (configurable via `PLAYWRIGHT_BASE_URL`)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Timeout**: 60 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Screenshots**: On failure
- **Videos**: Retained on failure
- **Traces**: On first retry

## Test Users

The tests use predefined test users (defined in `fixtures/base.ts`):

- **Regular User**: `test@example.com` / `Test123!@#`
- **Admin User**: `admin@example.com` / `Admin123!@#`
- **Moderator User**: `moderator@example.com` / `Mod123!@#`

**Important**: These users must exist in the database before running tests.

## Custom Fixtures

### authenticatedPage
Pre-authenticated page with regular user credentials.

```typescript
test('should access dashboard', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  // Already authenticated
});
```

### adminPage
Pre-authenticated page with admin user credentials.

```typescript
test('should manage users', async ({ adminPage }) => {
  await adminPage.goto('/dashboard/users');
  // Already authenticated as admin
});
```

### moderatorPage
Pre-authenticated page with moderator user credentials.

```typescript
test('should moderate content', async ({ moderatorPage }) => {
  await moderatorPage.goto('/dashboard/comments');
  // Already authenticated as moderator
});
```

## Page Objects Pattern

All pages follow the Page Object Model pattern:

```typescript
import { ArticlePage } from './page-objects/ArticlePage';

test('should create article', async ({ adminPage }) => {
  const articlePage = new ArticlePage(adminPage);

  await articlePage.goToCreateArticle();
  await articlePage.createArticle({
    title: 'Test Article',
    content: 'Test content',
    category: 'Technology',
    tags: ['test'],
  });

  await articlePage.expectArticleInList('Test Article');
});
```

## Gallery Tests Note

Gallery upload tests are currently skipped because they require actual image files in the `test-fixtures` directory. To enable these tests:

1. Add test images to `e2e/test-fixtures/`:
   - `test-image.jpg`
   - `test-image-1.jpg`
   - `test-image-2.jpg`

2. Remove `.skip` from the gallery tests in `gallery.spec.ts`

## Best Practices

1. **Use Page Objects**: Encapsulate page interactions in page object classes
2. **Use Custom Fixtures**: Leverage pre-authenticated pages for faster tests
3. **Unique Data**: Use `generateUniqueTitle()` for content that must be unique
4. **Wait Strategies**: Use `waitForLoadState('networkidle')` after navigation
5. **Assertions**: Use Playwright's expect assertions for auto-waiting
6. **Cleanup**: Tests should be independent and not rely on previous test data

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify network connectivity

### Authentication failing
- Ensure test users exist in database
- Check API endpoint URLs
- Verify JWT token handling

### Element not found
- Check selectors in page objects
- Verify UI implementation matches test expectations
- Use `page.pause()` to debug

## CI/CD Integration

Tests are configured to run in CI environments:

- Retries: 2 attempts on failure
- Workers: 1 (sequential execution)
- Screenshots and videos: Captured on failure
- Reports: JSON and HTML formats

## Further Reading

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
- [Best Practices](https://playwright.dev/docs/best-practices)
