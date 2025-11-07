# API Documentation Guide

## Overview

The Multimedia Portal API provides comprehensive endpoints for managing multimedia content including articles, blog posts, wiki pages, galleries, stories, and user interactions. This document provides detailed information about accessing and using the API.

## Table of Contents

- [Interactive Documentation](#interactive-documentation)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Pagination](#pagination)
- [Filtering and Search](#filtering-and-search)
- [Postman Collection](#postman-collection)
- [Code Examples](#code-examples)

## Interactive Documentation

### Swagger UI

The API provides interactive Swagger documentation where you can explore endpoints, view request/response schemas, and test API calls directly in your browser.

**Access:**
- **Development**: http://localhost:3000/api/docs
- **Docker**: http://localhost:3001/api/docs
- **Production**: https://api.multimedia-portal.dev/api/docs

**Features:**
- Browse all available endpoints organized by tags
- View detailed request/response schemas
- Test endpoints with the "Try it out" feature
- Authenticate with JWT tokens
- View example requests and responses

### OpenAPI Specification

Download the OpenAPI specification in JSON or YAML format:

- **JSON**: http://localhost:3000/api/docs-json
- **YAML**: http://localhost:3000/api/docs-yaml

Use these files to:
- Generate client libraries in your preferred language
- Import into API testing tools (Postman, Insomnia, etc.)
- Generate documentation in other formats
- Create mock servers

## Authentication

### Overview

The API uses **JWT (JSON Web Tokens)** for authentication. Most endpoints require authentication, while some public endpoints (like viewing published content) are accessible without authentication.

### Getting Started

#### 1. Register a New Account

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "username": "johndoe"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "role": "USER",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### 2. Login to Get JWT Token

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

#### 3. Use Token in Requests

Include the JWT token in the `Authorization` header:

```bash
GET /api/v1/articles
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Refresh

Tokens expire after 24 hours (86400 seconds). Use the refresh token to get a new access token:

```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Roles and Permissions

The API implements role-based access control with three roles:

| Role | Permissions |
|------|-------------|
| **USER** | View published content, post comments, rate content |
| **MODERATOR** | USER permissions + moderate comments, view analytics |
| **ADMIN** | MODERATOR permissions + manage all content, manage users |

## Rate Limiting

To protect the API from abuse, rate limiting is enforced per IP address and per user.

### Limits

- **Public endpoints**: 100 requests per 15 minutes per IP
- **Authenticated endpoints**: 1000 requests per 15 minutes per user
- **Admin endpoints**: 500 requests per 15 minutes per admin

### Headers

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642252800
```

### 429 Too Many Requests

When rate limit is exceeded:

```json
{
  "statusCode": 429,
  "message": "Too many requests, please try again later.",
  "error": "Too Many Requests"
}
```

## Error Handling

### Standard Error Response

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    "email must be an email",
    "password must be longer than 8 characters"
  ]
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| **200** | OK | Request successful |
| **201** | Created | Resource created successfully |
| **204** | No Content | Request successful, no content to return |
| **400** | Bad Request | Invalid request data or validation error |
| **401** | Unauthorized | Missing or invalid authentication token |
| **403** | Forbidden | Insufficient permissions |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Resource already exists (duplicate) |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Server error |

### Common Error Scenarios

#### Authentication Errors

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Solution**: Include valid JWT token in Authorization header

#### Validation Errors

```json
{
  "statusCode": 400,
  "message": ["title must be a string", "content is required"],
  "error": "Bad Request"
}
```

**Solution**: Fix the request body according to validation errors

#### Permission Errors

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

**Solution**: User doesn't have required role/permissions

## Pagination

### Query Parameters

List endpoints support pagination:

```bash
GET /api/v1/articles?page=1&limit=10&sortBy=createdAt&order=desc
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (starts at 1) |
| `limit` | number | 10 | Items per page (max: 100) |
| `sortBy` | string | createdAt | Field to sort by |
| `order` | asc\|desc | desc | Sort order |

### Response Format

```json
{
  "data": [
    { "id": "1", "title": "Article 1" },
    { "id": "2", "title": "Article 2" }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## Filtering and Search

### Filter by Category

```bash
GET /api/v1/articles?category=technology
```

### Filter by Tag

```bash
GET /api/v1/articles?tag=javascript
```

### Full-Text Search

```bash
GET /api/v1/search?q=tutorial&type=article
```

### Combined Filters

```bash
GET /api/v1/articles?category=tech&tag=javascript&search=react&status=PUBLISHED
```

### Date Range Filtering

```bash
GET /api/v1/articles?dateFrom=2024-01-01&dateTo=2024-12-31
```

## Postman Collection

### Generate Collection

Generate a Postman collection from the OpenAPI spec:

```bash
cd backend
npm run docs:postman
```

This creates `postman-collection.json` that can be imported into Postman.

### Import into Postman

1. Open Postman
2. Click **Import** button
3. Select `postman-collection.json` file
4. Collection will be imported with all endpoints

### Environment Variables

Configure these variables in Postman:

| Variable | Value | Description |
|----------|-------|-------------|
| `base_url` | http://localhost:3000 | API base URL |
| `jwt_token` | (empty initially) | JWT access token |

### Workflow in Postman

1. **Register** a new account using `POST /auth/register`
2. **Login** using `POST /auth/login`
3. **Copy** the `accessToken` from response
4. **Set** `jwt_token` variable to the access token
5. **Use** authenticated endpoints

Most endpoints automatically use `{{jwt_token}}` for authorization.

## Code Examples

### JavaScript/TypeScript

```typescript
// Using fetch API
const API_URL = 'http://localhost:3000/api/v1';
let token = '';

// Login
async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  token = data.accessToken;
  return data;
}

// Get articles
async function getArticles() {
  const response = await fetch(`${API_URL}/articles`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return await response.json();
}

// Create article (admin only)
async function createArticle(article: any) {
  const response = await fetch(`${API_URL}/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(article),
  });

  return await response.json();
}
```

### Python

```python
import requests

API_URL = 'http://localhost:3000/api/v1'

# Login
def login(email, password):
    response = requests.post(f'{API_URL}/auth/login', json={
        'email': email,
        'password': password
    })
    data = response.json()
    return data['accessToken']

# Get articles
def get_articles(token):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'{API_URL}/articles', headers=headers)
    return response.json()

# Create article
def create_article(token, article_data):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    response = requests.post(
        f'{API_URL}/articles',
        headers=headers,
        json=article_data
    )
    return response.json()
```

### cURL

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@portal.com",
    "password": "admin123"
  }'

# Get articles (with token)
TOKEN="your-jwt-token-here"
curl -X GET http://localhost:3000/api/v1/articles \
  -H "Authorization: Bearer $TOKEN"

# Create article (admin)
curl -X POST http://localhost:3000/api/v1/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "My Article",
    "content": "Article content here...",
    "excerpt": "Short excerpt",
    "categories": ["tech"],
    "tags": ["javascript", "tutorial"]
  }'
```

## API Versioning

### Current Version

Current API version: **v1**

All endpoints are prefixed with `/api/v1`:
- `http://localhost:3000/api/v1/articles`
- `http://localhost:3000/api/v1/auth/login`

### Version Strategy

- **URL Versioning**: Version is part of the URL path
- **Backward Compatibility**: Minor updates maintain compatibility
- **Deprecation Notice**: 6 months notice before breaking changes
- **Multiple Versions**: Old versions supported during transition

### Future Versions

Future API versions (v2, v3) will be accessible at:
- `/api/v2/articles`
- `/api/v3/articles`

Clients can upgrade at their own pace during the deprecation period.

## Best Practices

### 1. Store Tokens Securely

- Never expose JWT tokens in client-side code
- Store tokens in secure storage (e.g., HTTP-only cookies, secure storage)
- Use HTTPS in production

### 2. Handle Errors Gracefully

```typescript
try {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json();
    // Handle specific error codes
    if (error.statusCode === 401) {
      // Refresh token or redirect to login
    }
  }

  return await response.json();
} catch (error) {
  // Handle network errors
  console.error('Network error:', error);
}
```

### 3. Implement Retry Logic

For transient errors (500, 503), implement exponential backoff:

```typescript
async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status < 500) {
        return response;
      }
    } catch (error) {
      if (i === retries - 1) throw error;
    }

    await new Promise(resolve =>
      setTimeout(resolve, Math.pow(2, i) * 1000)
    );
  }
}
```

### 4. Cache Responses

Cache GET requests for better performance:

```typescript
const cache = new Map();

async function cachedFetch(url) {
  if (cache.has(url)) {
    return cache.get(url);
  }

  const data = await fetch(url).then(r => r.json());
  cache.set(url, data);

  // Expire cache after 5 minutes
  setTimeout(() => cache.delete(url), 5 * 60 * 1000);

  return data;
}
```

### 5. Use Pagination

Always use pagination for list endpoints to avoid performance issues:

```typescript
async function getAllArticles() {
  const allArticles = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${API_URL}/articles?page=${page}&limit=50`
    );
    const { data, meta } = await response.json();

    allArticles.push(...data);
    hasMore = meta.hasNextPage;
    page++;
  }

  return allArticles;
}
```

## Support

For issues, questions, or feature requests:

- 📧 **Email**: api-support@multimedia-portal.dev
- 🐛 **Issues**: [GitHub Issues](https://github.com/DirtyDreams/multimedia-portal/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/DirtyDreams/multimedia-portal/discussions)
- 📖 **Documentation**: http://localhost:3000/api/docs

## Related Documentation

- [README.md](../README.md) - Project overview and setup
- [SEED_README.md](prisma/SEED_README.md) - Database seeding guide
- [SECURITY.md](../SECURITY.md) - Security best practices
- [Swagger UI](http://localhost:3000/api/docs) - Interactive API documentation
