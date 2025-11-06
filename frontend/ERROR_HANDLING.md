# Error Handling & Error Boundaries

## Overview

This document describes the comprehensive error handling system implemented for the multimedia portal frontend. The system provides robust error detection, logging, recovery mechanisms, and user-friendly error messages.

## Architecture

### Components

1. **Error Logging Service** (`lib/error-logger.ts`)
2. **API Error Handling** (`lib/api-error-handler.ts`)
3. **Error Boundaries**:
   - Global Error Page (`app/error.tsx`)
   - Generic ErrorBoundary (`components/ui/error-boundary.tsx`)
   - DashboardErrorBoundary (`components/error/dashboard-error-boundary.tsx`)
   - ContentErrorBoundary (`components/error/content-error-boundary.tsx`)
4. **Error Message Component** (`components/ui/error-message.tsx`)
5. **404 Page** (`app/not-found.tsx`)

## Error Logging Service

### Features

- Centralized error logging with severity levels
- Automatic context capture (URL, user agent, timestamp)
- Support for external error tracking (Sentry)
- In-memory error log storage (last 100 errors)
- Different log types: Network, API, Authentication, Component

### Severity Levels

```typescript
enum ErrorSeverity {
  LOW = 'low',          // Informational errors
  MEDIUM = 'medium',    // Standard errors
  HIGH = 'high',        // Critical errors
  CRITICAL = 'critical', // System-breaking errors
}
```

### Usage

```typescript
import { errorLogger, ErrorSeverity } from '@/lib/error-logger';

// Log a general error
errorLogger.logError(error, ErrorSeverity.HIGH, {
  userId: user.id,
  action: 'submit_form',
});

// Log specific error types
errorLogger.logNetworkError(error, '/api/articles', 'GET', 500, 2);
errorLogger.logAPIError(error, '/api/users', 401, responseData);
errorLogger.logAuthError(error, 'login_failed');
errorLogger.logComponentError(error, 'ArticleForm', componentStack);
```

### Integration with External Services

The error logger supports integration with Sentry:

```typescript
// Sentry configuration (in app layout or _app.tsx)
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
    });

    // Attach to window for error logger
    (window as any).Sentry = Sentry;
  });
}
```

## API Error Handling

### Error Types

```typescript
// API Error (HTTP errors with status codes)
class APIError extends Error {
  statusCode: number;
  endpoint: string;
  responseData?: any;
}

// Network Error (connection issues)
class NetworkError extends Error {
  // No internet or network failure
}

// Authentication Error (401/403)
class AuthenticationError extends Error {
  // Session expired or unauthorized
}

// Validation Error (400 with validation details)
class ValidationError extends Error {
  errors: Record<string, string[]>;
}
```

### Automatic Retry with Exponential Backoff

```typescript
import { fetchWithRetry } from '@/lib/api-error-handler';

// Automatic retry for failed requests
const response = await fetchWithRetry('/api/articles', {
  method: 'GET',
}, {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
});
```

### Retry Logic

- **Retryable Status Codes**: 408 (Timeout), 429 (Too Many Requests), 500, 502, 503, 504
- **Exponential Backoff**: Delay doubles with each retry
- **Jitter**: Random 0-30% delay added to prevent thundering herd
- **Max Retries**: Configurable (default: 3)

### API Client

```typescript
import { createAPIClient } from '@/lib/api-error-handler';

const api = createAPIClient(process.env.NEXT_PUBLIC_API_URL);

// All methods include automatic retry and error handling
const articles = await api.get<Article[]>('/articles');
const article = await api.post<Article>('/articles', { title, content });
await api.put<Article>(`/articles/${id}`, { title });
await api.delete(`/articles/${id}`);
```

## Error Boundaries

### Global Error Page (`app/error.tsx`)

Next.js App Router global error handler for unhandled errors.

**Features**:
- Automatic error logging with error digest
- User-friendly error message
- Stack trace in development mode
- Retry and go home buttons
- Beautiful error UI with suggestions

**Usage**: Automatically catches all unhandled errors in the app.

### Generic ErrorBoundary

Class component that catches React errors in children components.

**Features**:
- Error logging with component stack
- Retry mechanism with counter
- Custom fallback UI support
- Development-only stack traces
- Reload page option

**Usage**:
```tsx
import { ErrorBoundary } from '@/components/ui/error-boundary';

<ErrorBoundary componentName="ArticleList">
  <ArticleList articles={articles} />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary
  fallback={<CustomErrorUI />}
  onError={(error, errorInfo) => {
    // Custom error handler
  }}
>
  <ComplexComponent />
</ErrorBoundary>
```

### DashboardErrorBoundary

Specialized error boundary for admin/dashboard sections.

**Features**:
- Context-aware error messages for admin users
- Links to dashboard home
- Compact error UI suitable for dashboard layouts

**Usage**:
```tsx
import { DashboardErrorBoundary } from '@/components/error';

// Wrap dashboard sections
<DashboardErrorBoundary>
  <DashboardContent />
</DashboardErrorBoundary>
```

### ContentErrorBoundary

Specialized error boundary for content pages (articles, blog, wiki).

**Features**:
- Content-type aware error messages
- Links back to home page
- User-friendly error display for content consumers

**Usage**:
```tsx
import { ContentErrorBoundary } from '@/components/error';

<ContentErrorBoundary contentType="article">
  <ArticleDetail article={article} />
</ContentErrorBoundary>
```

## Error Message Component

Reusable component for displaying inline error messages.

**Features**:
- Error and warning variants
- Icon-based visual indicators
- Consistent styling across the app

**Usage**:
```tsx
import { ErrorMessage } from '@/components/ui/error-message';

<ErrorMessage
  title="Submission Failed"
  message="Unable to save your changes. Please try again."
  variant="error"
/>

<ErrorMessage
  message="This action cannot be undone."
  variant="warning"
/>
```

## Best Practices

### 1. Always Wrap Risky Components

```tsx
// Good: Wrapped in error boundary
<ErrorBoundary componentName="CommentSection">
  <CommentSection contentId={id} />
</ErrorBoundary>

// Bad: No error boundary
<CommentSection contentId={id} />
```

### 2. Use Specialized Boundaries

```tsx
// For dashboard pages
<DashboardErrorBoundary>
  <DashboardAnalytics />
</DashboardErrorBoundary>

// For content pages
<ContentErrorBoundary contentType="blog">
  <BlogPostDetail />
</ContentErrorBoundary>
```

### 3. Handle API Errors Gracefully

```tsx
try {
  const data = await fetchWithRetry('/api/data');
  setData(data);
} catch (error) {
  if (isAuthError(error)) {
    handleAuthError(error); // Redirects to login
  } else {
    setError(getUserFriendlyErrorMessage(error));
  }
}
```

### 4. Provide User-Friendly Messages

```tsx
// Bad: Technical error message
<ErrorMessage message={error.message} />

// Good: User-friendly message
<ErrorMessage
  message={getUserFriendlyErrorMessage(error)}
/>
```

### 5. Log All Significant Errors

```tsx
try {
  await dangerousOperation();
} catch (error) {
  errorLogger.logError(
    createError(error),
    ErrorSeverity.HIGH,
    { operation: 'dangerous_operation', userId }
  );
  throw error;
}
```

## Error Handling Patterns

### Pattern 1: Form Submission

```tsx
const [error, setError] = useState<string | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (data: FormData) => {
  setError(null);
  setIsSubmitting(true);

  try {
    await api.post('/articles', data);
    router.push('/articles');
  } catch (err) {
    const errorMessage = getUserFriendlyErrorMessage(err);
    setError(errorMessage);

    errorLogger.logError(
      createError(err),
      ErrorSeverity.MEDIUM,
      { action: 'create_article' }
    );
  } finally {
    setIsSubmitting(false);
  }
};

return (
  <form onSubmit={handleSubmit}>
    {error && <ErrorMessage message={error} />}
    {/* form fields */}
    <Button disabled={isSubmitting}>Submit</Button>
  </form>
);
```

### Pattern 2: Data Fetching with SWR

```tsx
import useSWR from 'swr';
import { fetchWithRetry } from '@/lib/api-error-handler';

const fetcher = (url: string) => fetchWithRetry(url).then(r => r.json());

function ArticleList() {
  const { data, error, isLoading } = useSWR('/api/articles', fetcher);

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load articles"
        message={getUserFriendlyErrorMessage(error)}
      />
    );
  }

  if (isLoading) return <LoadingSpinner />;

  return <div>{/* render articles */}</div>;
}
```

### Pattern 3: Authentication Handling

```tsx
import { isAuthError, handleAuthError } from '@/lib/api-error-handler';

async function fetchProtectedResource() {
  try {
    return await fetchWithRetry('/api/protected');
  } catch (error) {
    if (isAuthError(error)) {
      // Automatically redirects to login with return URL
      handleAuthError(error);
    }
    throw error;
  }
}
```

### Pattern 4: Optimistic Updates with Rollback

```tsx
const handleLike = async (articleId: string) => {
  const previousLikes = likes;

  // Optimistic update
  setLikes(likes + 1);

  try {
    await api.post(`/articles/${articleId}/like`);
  } catch (error) {
    // Rollback on error
    setLikes(previousLikes);

    errorLogger.logError(
      createError(error),
      ErrorSeverity.LOW,
      { action: 'like_article', articleId }
    );

    setError('Failed to like article. Please try again.');
  }
};
```

## Testing Error Scenarios

### 1. Test Error Boundaries

```tsx
// In tests
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('ErrorBoundary catches and displays errors', () => {
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  expect(screen.getByText('Test error')).toBeInTheDocument();
});
```

### 2. Test API Error Handling

```tsx
import { fetchWithRetry, APIError } from '@/lib/api-error-handler';

test('retries failed requests', async () => {
  let attempts = 0;
  global.fetch = jest.fn(() => {
    attempts++;
    if (attempts < 3) {
      return Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: 'success' }),
    });
  });

  const response = await fetchWithRetry('/api/test', {}, { maxRetries: 3 });
  expect(attempts).toBe(3);
  expect(response.ok).toBe(true);
});
```

### 3. Manual Error Testing

```tsx
// Create a test component that throws errors
function ErrorTestButton() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Test error from button');
  }

  return (
    <button onClick={() => setShouldThrow(true)}>
      Trigger Error
    </button>
  );
}

// Use in development to test error boundaries
<ErrorBoundary>
  <ErrorTestButton />
</ErrorBoundary>
```

## Configuration

### Environment Variables

```env
# Sentry DSN for error tracking
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# API URL for error logging endpoint
NEXT_PUBLIC_API_URL=https://api.example.com

# Enable/disable error logging
NEXT_PUBLIC_ENABLE_ERROR_LOGGING=true
```

### Backend Error Logging Endpoint

Create an API endpoint to receive frontend errors:

```typescript
// backend/src/modules/logs/logs.controller.ts
@Post('errors')
async logError(@Body() errorLog: ErrorLogDto) {
  // Store error log in database
  await this.logsService.create(errorLog);

  // Optionally send to external service
  return { success: true };
}
```

## Monitoring & Debugging

### View Recent Errors (Development)

```tsx
import { errorLogger } from '@/lib/error-logger';

// In dev tools console
console.log(errorLogger.getRecentLogs(20));
```

### Sentry Dashboard

1. Configure Sentry DSN in environment variables
2. View errors at https://sentry.io/
3. Errors include:
   - Error message and stack trace
   - User context (if provided)
   - Breadcrumbs (user actions leading to error)
   - Device and browser information

### Error Metrics to Monitor

- **Error Rate**: Errors per user session
- **Top Errors**: Most frequent error messages
- **Error By Page**: Which pages have most errors
- **Recovery Rate**: How often users recover via retry
- **Authentication Errors**: Failed login/session issues

## Future Enhancements

1. **Error Analytics Dashboard**
   - Build admin panel to view error logs
   - Visualize error trends over time

2. **User Feedback on Errors**
   - Add "Report Problem" button to error pages
   - Collect user descriptions of what they were doing

3. **Automatic Error Recovery**
   - Implement service workers for offline support
   - Queue failed requests for retry when connection restored

4. **Performance Monitoring**
   - Integrate with Sentry Performance Monitoring
   - Track slow API calls and timeouts

5. **A/B Testing Error Messages**
   - Test different error message copy
   - Measure user recovery rates

## Related Documentation

- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [API Error Handling Best Practices](https://www.rfc-editor.org/rfc/rfc7807)

## Summary

✅ Comprehensive error logging with severity levels
✅ Automatic retry mechanism for API calls
✅ Global and specialized error boundaries
✅ User-friendly error messages
✅ Development-friendly debugging tools
✅ Sentry integration support
✅ Network error detection and handling
✅ Authentication error handling with redirects
✅ Retry mechanisms with exponential backoff
✅ Component-level error isolation

**Result**: Robust error handling system that improves user experience and simplifies debugging.
