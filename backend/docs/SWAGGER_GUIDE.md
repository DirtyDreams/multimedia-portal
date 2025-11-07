# Swagger API Documentation Guide

Comprehensive guide for using and maintaining Swagger/OpenAPI documentation in the Multimedia Portal.

---

## Table of Contents

1. [Overview](#overview)
2. [Accessing Documentation](#accessing-documentation)
3. [API Versioning](#api-versioning)
4. [Authentication](#authentication)
5. [Testing Endpoints](#testing-endpoints)
6. [Adding Documentation to New Endpoints](#adding-documentation-to-new-endpoints)
7. [DTO Documentation](#dto-documentation)
8. [Best Practices](#best-practices)
9. [Export Options](#export-options)

---

## Overview

The Multimedia Portal API uses **Swagger/OpenAPI 3.0** for comprehensive, interactive API documentation.

### Features

- **Interactive UI**: Test endpoints directly from the browser
- **Authentication**: Built-in JWT token management
- **Type Definitions**: Complete request/response schemas
- **Code Generation**: Export OpenAPI spec for client generation
- **Auto-Discovery**: Endpoints automatically appear in documentation

### Technology Stack

- **@nestjs/swagger**: NestJS Swagger module
- **swagger-ui-express**: Interactive UI rendering
- **OpenAPI 3.0**: Industry-standard spec format

---

## Accessing Documentation

### Development Environment

**Swagger UI**: http://localhost:4000/api-docs

- Interactive interface
- Try-it-out functionality
- Schema exploration

**OpenAPI JSON**: http://localhost:4000/api-docs-json

- Raw OpenAPI 3.0 specification
- For code generation tools
- For import into Postman/Insomnia

### Production Environment

**Swagger UI**: https://api.multimedia-portal.com/api-docs

**OpenAPI JSON**: https://api.multimedia-portal.com/api-docs-json

---

## API Versioning

### Current Version: v1

All API endpoints are prefixed with `/api/v1`:

```
http://localhost:4000/api/v1/articles
http://localhost:4000/api/v1/auth/login
http://localhost:4000/api/v1/comments
```

### Excluded Routes

The following routes do NOT have the `/api/v1` prefix:

- `/` - Root/health check
- `/health` - Health check endpoint
- `/api-docs` - Swagger UI
- `/api-docs-json` - OpenAPI JSON spec

### Configuration

API versioning is configured in `src/main.ts`:

```typescript
app.setGlobalPrefix('api/v1', {
  exclude: ['/', '/health', '/api-docs', '/api-docs-json'],
});
```

### Version Strategy

- **URL Versioning**: Major versions in URL (v1, v2, etc.)
- **Backward Compatibility**: 6 months minimum
- **Deprecation**: Headers indicate deprecated endpoints
- **Migration Period**: Overlap between versions

### Future Versions

When v2 is released:
- v1 will remain available at `/api/v1/*`
- v2 will be at `/api/v2/*`
- Swagger will show both versions
- Deprecation warnings added to v1

---

## Authentication

### JWT Bearer Authentication

Most endpoints require authentication using JWT tokens.

#### Step 1: Obtain Token

**Register**:
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "john@example.com",
    "username": "johndoe",
    "role": "USER"
  }
}
```

#### Step 2: Use Token in Swagger UI

1. Click the **"Authorize"** button (top right)
2. Enter your access token (without "Bearer" prefix)
3. Click **"Authorize"**
4. Close the dialog
5. All subsequent requests will include the token

#### Step 3: Use Token in API Calls

Include the token in the `Authorization` header:

```bash
curl -X GET http://localhost:4000/api/v1/articles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Token Expiration

- **Access Token**: 15 minutes
- **Refresh Token**: 7 days

Use `/api/v1/auth/refresh` to get new access token:

```bash
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

## Testing Endpoints

### Using Swagger UI

1. Navigate to http://localhost:4000/api-docs
2. Find the endpoint you want to test
3. Click to expand the endpoint
4. Click **"Try it out"**
5. Fill in required parameters
6. Click **"Execute"**
7. View response below

### Example: Creating an Article

1. **Authenticate** (click Authorize button)
2. Navigate to **articles** section
3. Find `POST /api/v1/articles`
4. Click **"Try it out"**
5. Modify the request body:
```json
{
  "title": "My First Article",
  "content": "Article content here...",
  "excerpt": "Short excerpt",
  "status": "DRAFT",
  "authorId": "author-123"
}
```
6. Click **"Execute"**
7. Check response:
   - **201**: Article created successfully
   - **400**: Validation error
   - **401**: Not authenticated
   - **403**: Insufficient permissions

### Common Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Server error |

---

## Adding Documentation to New Endpoints

### Controller-Level Documentation

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('my-resource') // Group in Swagger UI
@ApiBearerAuth('JWT') // If requires authentication
@Controller('my-resource')
export class MyResourceController {
  // ...
}
```

### Endpoint Documentation

```typescript
@Post()
@ApiOperation({
  summary: 'Create a new resource',
  description: 'Detailed description of what this endpoint does',
})
@ApiResponse({
  status: 201,
  description: 'Resource created successfully',
  type: MyResourceDto,
})
@ApiResponse({
  status: 400,
  description: 'Invalid input data',
})
@ApiResponse({
  status: 401,
  description: 'Authentication required',
})
@ApiResponse({
  status: 403,
  description: 'Insufficient permissions',
})
async create(@Body() createDto: CreateMyResourceDto) {
  return this.service.create(createDto);
}
```

### Query Parameters

```typescript
@Get()
@ApiOperation({ summary: 'Get all resources' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
@ApiQuery({ name: 'search', required: false, type: String })
async findAll(
  @Query('page') page?: number,
  @Query('limit') limit?: number,
  @Query('search') search?: string,
) {
  return this.service.findAll({ page, limit, search });
}
```

### Path Parameters

```typescript
@Get(':id')
@ApiOperation({ summary: 'Get resource by ID' })
@ApiParam({ name: 'id', description: 'Resource ID' })
@ApiResponse({ status: 200, type: MyResourceDto })
@ApiResponse({ status: 404, description: 'Resource not found' })
async findOne(@Param('id') id: string) {
  return this.service.findOne(id);
}
```

---

## DTO Documentation

### Basic DTO

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({
    description: 'Article title',
    example: 'Introduction to NestJS',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Full article content',
    example: 'NestJS is a progressive Node.js framework...',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Short excerpt or summary',
    example: 'Learn about NestJS',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  excerpt?: string;

  @ApiProperty({
    description: 'Content status',
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    example: 'DRAFT',
  })
  @IsString()
  status: string;
}
```

### Response DTO

```typescript
export class ArticleResponseDto {
  @ApiProperty({
    description: 'Unique article identifier',
    example: 'uuid-123-456',
  })
  id: string;

  @ApiProperty({
    description: 'Article title',
    example: 'Introduction to NestJS',
  })
  title: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'introduction-to-nestjs',
  })
  slug: string;

  @ApiProperty({
    description: 'Article author',
    type: () => AuthorDto,
  })
  author: AuthorDto;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-01-15T15:45:00Z',
  })
  updatedAt: Date;
}
```

### Enum Documentation

```typescript
import { ApiProperty } from '@nestjs/swagger';

export enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class UpdateStatusDto {
  @ApiProperty({
    description: 'New content status',
    enum: ContentStatus,
    enumName: 'ContentStatus',
    example: ContentStatus.PUBLISHED,
  })
  status: ContentStatus;
}
```

### Nested Objects

```typescript
export class CreateArticleDto {
  @ApiProperty()
  title: string;

  @ApiProperty({
    description: 'Article metadata',
    type: () => ArticleMetadataDto,
  })
  metadata: ArticleMetadataDto;

  @ApiProperty({
    description: 'Tags',
    type: [String],
    example: ['nestjs', 'typescript', 'backend'],
  })
  tags: string[];
}
```

---

## Best Practices

### 1. Always Document New Endpoints

```typescript
// ✅ Good
@Get()
@ApiOperation({ summary: 'Get all articles' })
@ApiResponse({ status: 200, type: [ArticleDto] })
async findAll() { }

// ❌ Bad
@Get()
async findAll() { } // No documentation
```

### 2. Include All Response Codes

```typescript
// ✅ Good
@Post()
@ApiResponse({ status: 201, description: 'Created' })
@ApiResponse({ status: 400, description: 'Bad Request' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 409, description: 'Conflict' })
async create() { }

// ❌ Bad
@Post()
@ApiResponse({ status: 201 }) // Missing error responses
async create() { }
```

### 3. Use Descriptive Examples

```typescript
// ✅ Good
@ApiProperty({
  description: 'User email address',
  example: 'john.doe@example.com',
  format: 'email',
})
email: string;

// ❌ Bad
@ApiProperty()
email: string; // No description or example
```

### 4. Group Related Endpoints

```typescript
// ✅ Good
@ApiTags('articles')
@Controller('articles')

// ❌ Bad
@Controller('articles') // No tag
```

### 5. Document Pagination

```typescript
export class PaginatedResponseDto<T> {
  @ApiProperty({ type: 'array' })
  data: T[];

  @ApiProperty({
    example: { total: 100, page: 1, limit: 20, totalPages: 5 },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

---

## Export Options

### OpenAPI JSON

Download the specification:

```bash
curl http://localhost:4000/api-docs-json > openapi.json
```

### Generate TypeScript Client

```bash
npx openapi-typescript http://localhost:4000/api-docs-json --output client.ts
```

### Generate Python Client

```bash
pip install openapi-python-client
openapi-python-client generate --url http://localhost:4000/api-docs-json
```

### Import to Postman

1. Open Postman
2. Click **Import**
3. Paste URL: `http://localhost:4000/api-docs-json`
4. Click **Import**
5. Collection created with all endpoints

### Import to Insomnia

1. Open Insomnia
2. Click **Import/Export**
3. Click **Import Data**
4. Select **From URL**
5. Paste: `http://localhost:4000/api-docs-json`
6. Click **Fetch and Import**

---

## Troubleshooting

### Swagger UI Not Loading

**Check:**
- Server is running: `http://localhost:4000`
- Route is correct: `http://localhost:4000/api-docs`
- No CORS errors in browser console

**Solution:**
```bash
# Restart server
npm run start:dev
```

### Endpoints Not Appearing

**Check:**
- Controller has `@ApiTags()` decorator
- Controller is imported in module
- Server was restarted after changes

### Authentication Not Working

**Check:**
- Token is valid (not expired)
- Token format: `Bearer <token>`
- Endpoint requires authentication

**Solution:**
1. Login again to get fresh token
2. Click "Authorize" button in Swagger
3. Enter token without "Bearer" prefix

### Examples Not Showing

**Check:**
- DTOs have `@ApiProperty()` decorators
- Examples are provided in decorator
- Server was restarted

---

## Related Documentation

- [API Documentation](./API_DOCUMENTATION.md)
- [Security Configuration](./SECURITY_CONFIGURATION.md)
- [NestJS Swagger Docs](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI Specification](https://swagger.io/specification/)

---

**Last Updated**: 2025-11-07
**Version**: 1.0.0
**Maintainer**: Backend Team
