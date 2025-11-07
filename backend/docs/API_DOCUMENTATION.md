# API Documentation Guide

Complete guide for the Multimedia Portal API documentation system.

## Table of Contents

1. [Overview](#overview)
2. [Accessing Documentation](#accessing-documentation)
3. [Authentication](#authentication)
4. [Rate Limiting](#rate-limiting)
5. [API Versioning](#api-versioning)
6. [Postman Collection](#postman-collection)
7. [API Endpoints](#api-endpoints)
8. [Error Handling](#error-handling)
9. [Deployment](#deployment)

## Overview

The Multimedia Portal API uses **OpenAPI 3.0** (Swagger) for comprehensive API documentation. The documentation is:

- **Interactive**: Try API calls directly from the browser
- **Auto-generated**: Automatically updated from code decorators
- **Comprehensive**: Includes examples, schemas, and error codes
- **Multi-environment**: Supports local, staging, and production

### Technology Stack

- **Swagger UI**: Interactive API documentation interface
- **NestJS Swagger Module**: OpenAPI document generation
- **Postman**: Collection for API testing

## Accessing Documentation

### Local Development

1. Start the backend server:
   ```bash
   cd backend
   npm run start:dev
   ```

2. Open documentation in browser:
   - **Swagger UI**: http://localhost:4000/api-docs
   - **OpenAPI JSON**: http://localhost:4000/api-docs-json

### Production

- **Swagger UI**: https://api.multimedia-portal.com/api-docs
- **OpenAPI JSON**: https://api.multimedia-portal.com/api-docs-json

### Features

The Swagger UI includes:

- **Try It Out**: Execute API calls directly from browser
- **Authentication**: Save JWT tokens for authenticated requests
- **Request/Response Examples**: See sample data for all endpoints
- **Schema Documentation**: Detailed data structure information
- **Search & Filter**: Find endpoints quickly
- **Multi-server Support**: Switch between environments

## Authentication

### JWT Token Authentication

The API uses JWT (JSON Web Tokens) for authentication.

#### 1. Register a New User

**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response**:
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "role": "USER"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Login

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response**: Same as registration

#### 3. Using JWT Tokens

Include the access token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 4. Refreshing Tokens

**Endpoint**: `POST /auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**: New access and refresh tokens

### Token Expiration

- **Access Token**: 15 minutes
- **Refresh Token**: 7 days

### Role-Based Access Control

Three user roles with different permissions:

| Role | Permissions |
|------|------------|
| **USER** | View public content, add comments/ratings |
| **MODERATOR** | Create/edit content, moderate comments |
| **ADMIN** | Full access, user management, system settings |

## Rate Limiting

The API implements rate limiting to prevent abuse:

### Rate Limits

| User Type | Limit | Window |
|-----------|-------|--------|
| Anonymous | 100 requests | 15 minutes |
| Authenticated | 1,000 requests | 15 minutes |
| Admin | 5,000 requests | 15 minutes |

### Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1705320000
```

### Handling Rate Limits

When limit is exceeded, you'll receive:

**Status Code**: `429 Too Many Requests`

**Response Body**:
```json
{
  "statusCode": 429,
  "message": "Too many requests, please try again later",
  "error": "Too Many Requests",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/api/v1/articles"
}
```

**Retry Strategy**:
1. Check `X-RateLimit-Reset` header for reset time
2. Implement exponential backoff
3. Cache responses when possible

## API Versioning

### Current Version

**v1** (Active)

All endpoints are prefixed with version:
```
/api/v1/articles
/api/v1/blog-posts
/api/v1/auth/login
```

### Versioning Strategy

- **URL Versioning**: Version in path (e.g., `/api/v1/`, `/api/v2/`)
- **Major Changes Only**: Breaking changes trigger new version
- **Backward Compatibility**: Old versions supported for 6 months
- **Deprecation Warnings**: Deprecated endpoints return special headers

### Deprecation Headers

```http
Deprecation: true
Sunset: Sat, 15 Jul 2025 00:00:00 GMT
Link: </api/v2/articles>; rel="successor-version"
```

### Migration Guide

When new version is released:

1. Review changelog for breaking changes
2. Test your integration against new version
3. Update API calls to new version
4. Monitor deprecation warnings
5. Complete migration before sunset date

## Postman Collection

### Generating Collection

Generate a Postman collection from the OpenAPI spec:

```bash
cd backend

# Start the backend server first
npm run start:dev

# In another terminal, generate collection
npx ts-node scripts/generate-postman-collection.ts
```

Output: `backend/postman-collection.json`

### Importing to Postman

1. Open Postman
2. Click **Import** button
3. Select `postman-collection.json`
4. Collection appears in sidebar

### Setting Up Environment

Create a Postman environment with these variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `base_url` | `http://localhost:4000` | API base URL |
| `access_token` | (empty) | JWT access token |
| `refresh_token` | (empty) | JWT refresh token |

### Authentication Workflow

1. Send `POST /auth/login` request
2. Copy `accessToken` from response
3. Set Postman environment variable `access_token`
4. All authenticated requests will automatically use the token

### Pre-request Scripts

The collection includes pre-request scripts that:
- Automatically refresh expired tokens
- Set authorization headers
- Handle authentication flow

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/refresh` | Refresh access token | No |
| GET | `/auth/me` | Get current user | Yes |
| POST | `/auth/logout` | Logout user | Yes |

### Articles

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/articles` | List all articles | No | - |
| GET | `/articles/:id` | Get article by ID/slug | No | - |
| POST | `/articles` | Create article | Yes | Moderator/Admin |
| PUT | `/articles/:id` | Update article | Yes | Moderator/Admin |
| DELETE | `/articles/:id` | Delete article | Yes | Admin |
| GET | `/articles/:id/preview` | Preview draft | Yes | Moderator/Admin |
| POST | `/articles/:id/autosave` | Auto-save draft | Yes | Moderator/Admin |

### Blog Posts

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/blog-posts` | List all blog posts | No | - |
| GET | `/blog-posts/:id` | Get blog post | No | - |
| POST | `/blog-posts` | Create blog post | Yes | Moderator/Admin |
| PUT | `/blog-posts/:id` | Update blog post | Yes | Moderator/Admin |
| DELETE | `/blog-posts/:id` | Delete blog post | Yes | Admin |

### Wiki Pages

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/wiki-pages` | List all wiki pages | No | - |
| GET | `/wiki-pages/:id` | Get wiki page | No | - |
| GET | `/wiki-pages/:id/children` | Get child pages | No | - |
| POST | `/wiki-pages` | Create wiki page | Yes | Moderator/Admin |
| PUT | `/wiki-pages/:id` | Update wiki page | Yes | Moderator/Admin |
| DELETE | `/wiki-pages/:id` | Delete wiki page | Yes | Admin |

### Gallery Items

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/gallery-items` | List all items | No | - |
| GET | `/gallery-items/:id` | Get item | No | - |
| POST | `/gallery-items` | Upload media | Yes | Moderator/Admin |
| PUT | `/gallery-items/:id` | Update item | Yes | Moderator/Admin |
| DELETE | `/gallery-items/:id` | Delete item | Yes | Admin |

### Stories

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/stories` | List all stories | No | - |
| GET | `/stories/:id` | Get story | No | - |
| POST | `/stories` | Create story | Yes | Moderator/Admin |
| PUT | `/stories/:id` | Update story | Yes | Moderator/Admin |
| DELETE | `/stories/:id` | Delete story | Yes | Admin |

### Comments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/comments` | List comments | No |
| POST | `/comments` | Create comment | Yes |
| PUT | `/comments/:id` | Update comment | Yes (own) |
| DELETE | `/comments/:id` | Delete comment | Yes (own/mod) |

### Ratings

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/ratings` | List ratings | No |
| POST | `/ratings` | Create rating | Yes |
| PUT | `/ratings/:id` | Update rating | Yes (own) |
| DELETE | `/ratings/:id` | Delete rating | Yes (own) |

### Search

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/search` | Search content | No |
| GET | `/search/suggest` | Get suggestions | No |

## Error Handling

### Error Response Format

All errors follow a consistent structure:

```json
{
  "statusCode": 400,
  "message": "Validation failed: title must be longer than or equal to 3 characters",
  "error": "Bad Request",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/api/v1/articles"
}
```

### HTTP Status Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Validation Errors

Validation errors include detailed field information:

```json
{
  "statusCode": 400,
  "message": [
    "title must be longer than or equal to 3 characters",
    "email must be an email"
  ],
  "error": "Bad Request"
}
```

## Deployment

### Hosting Swagger Documentation

#### Option 1: Same Server (Default)

Documentation is served from the same server as the API:

```
https://api.multimedia-portal.com/api-docs
```

**Pros**: Simple, no extra setup
**Cons**: Increases API server load

#### Option 2: Static Hosting (Recommended)

Host documentation separately using static hosting:

1. **Generate Static Documentation**:
   ```bash
   npm install -g redoc-cli
   redoc-cli bundle api-docs-json -o api-docs.html
   ```

2. **Deploy to CDN**:
   - Upload `api-docs.html` to S3/CloudFront
   - Set up custom domain: `docs.multimedia-portal.com`

**Pros**: Better performance, CDN caching
**Cons**: Requires separate deployment

#### Option 3: Dedicated Documentation Platform

Use platforms like:
- **Readme.io**: https://readme.com
- **SwaggerHub**: https://swaggerhub.com
- **Stoplight**: https://stoplight.io

### CI/CD Integration

Update documentation automatically on deployment:

```yaml
# .github/workflows/deploy-docs.yml
name: Deploy API Documentation

on:
  push:
    branches: [main]

jobs:
  deploy-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd backend && npm install

      - name: Start server
        run: cd backend && npm run start:prod &

      - name: Wait for server
        run: sleep 10

      - name: Generate Postman collection
        run: cd backend && npx ts-node scripts/generate-postman-collection.ts

      - name: Upload to S3
        run: |
          aws s3 cp backend/postman-collection.json s3://api-docs-bucket/
          aws s3 cp api-docs.html s3://api-docs-bucket/
```

### Environment Variables

Configure documentation per environment:

```env
# Development
SWAGGER_ENABLED=true
SWAGGER_PATH=api-docs

# Production
SWAGGER_ENABLED=true
SWAGGER_PATH=api-docs
API_TITLE="Multimedia Portal API - Production"
API_DESCRIPTION="Production API for Multimedia Portal"
```

### Security Considerations

For production:

1. **Disable in Production** (optional):
   ```typescript
   if (process.env.NODE_ENV !== 'production') {
     SwaggerModule.setup('api-docs', app, document);
   }
   ```

2. **Authentication Protection**:
   ```typescript
   app.use('/api-docs', basicAuth({
     users: { 'admin': 'secretpassword' },
     challenge: true,
   }));
   ```

3. **IP Whitelisting**:
   ```typescript
   app.use('/api-docs', ipfilter(['192.168.1.1'], { mode: 'allow' }));
   ```

## Best Practices

### For API Consumers

1. **Always check API version** in documentation
2. **Use Postman collection** for quick testing
3. **Implement token refresh** logic for long-running apps
4. **Handle rate limits** with exponential backoff
5. **Cache responses** when appropriate
6. **Monitor deprecation headers** for future changes

### For API Developers

1. **Keep Swagger decorators updated** in all controllers/DTOs
2. **Provide realistic examples** in decorators
3. **Document all error responses** with @ApiResponse
4. **Version breaking changes** properly
5. **Update Postman collection** after API changes
6. **Test documentation** regularly

## Support

For API documentation issues or questions:

- **Email**: api-support@multimedia-portal.com
- **GitHub**: https://github.com/multimedia-portal/api/issues
- **Documentation**: https://docs.multimedia-portal.com

## Changelog

### v1.0.0 (2025-01-15)

- Initial API documentation release
- Complete Swagger/OpenAPI 3.0 setup
- Postman collection generation
- Multi-environment support
- Rate limiting documentation
- Versioning strategy defined
