import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security Middleware - Helmet (must be first)
  app.use(
    helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          connectSrc: ["'self'", process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'],
          frameSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
      },
      // HTTP Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      // X-Frame-Options
      frameguard: {
        action: 'deny',
      },
      // X-Content-Type-Options
      noSniff: true,
      // X-XSS-Protection (deprecated but still useful)
      xssFilter: true,
      // Referrer-Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      // Hide X-Powered-By header
      hidePoweredBy: true,
    }),
  );

  // Enhanced CORS Configuration with Whitelist
  const corsOrigins = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()) || ['http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);

      // Check if origin is in whitelist
      if (corsOrigins.includes('*') || corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS: Blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    maxAge: 3600, // Cache preflight requests for 1 hour
  });

  // Global API Prefix with Versioning
  app.setGlobalPrefix('api/v1', {
    exclude: ['/', '/health', '/api-docs', '/api-docs-json'], // Exclude root and documentation routes
  });

  // Global Validation Pipe with Enhanced Security
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted values exist
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production', // Hide detailed errors in production
      validateCustomDecorators: true,
      forbidUnknownValues: true, // Throw error on unknown objects
    }),
  );

  // Swagger API Documentation Configuration
  const config = new DocumentBuilder()
    .setTitle('Multimedia Portal API')
    .setDescription(
      `
# Multimedia Portal REST API Documentation

A comprehensive content management system supporting multiple content types including Articles, Blog Posts, Wiki Pages, Gallery Items, and Stories.

## Features

- **Multi-content support**: Articles, Blog Posts, Wiki Pages, Gallery Items, Stories
- **User authentication**: JWT-based authentication with role-based access control
- **Comments & Ratings**: Cross-content commenting and rating system
- **Search**: Advanced search with Meilisearch integration
- **Content versioning**: Auto-save and version history
- **File uploads**: Image and media file management
- **Real-time updates**: WebSocket support for notifications

## Authentication

Most endpoints require authentication using JWT tokens. To authenticate:

1. Register a new user via \`POST /auth/register\`
2. Login via \`POST /auth/login\` to receive access and refresh tokens
3. Include the access token in the Authorization header: \`Bearer <token>\`
4. Refresh tokens via \`POST /auth/refresh\` when access token expires

### Token Expiration

- **Access Token**: 15 minutes
- **Refresh Token**: 7 days

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Anonymous users**: 100 requests per 15 minutes
- **Authenticated users**: 1000 requests per 15 minutes
- **Admin users**: 5000 requests per 15 minutes

Rate limit headers are included in all responses:
- \`X-RateLimit-Limit\`: Maximum requests allowed
- \`X-RateLimit-Remaining\`: Requests remaining
- \`X-RateLimit-Reset\`: Time when limit resets (Unix timestamp)

## API Versioning

Current API version: **v1**

All endpoints are prefixed with \`/api/v1\` (except root endpoints).

### Version Strategy

- **URL Versioning**: Major versions in URL path (e.g., /api/v1/, /api/v2/)
- **Backward Compatibility**: Maintained for at least 6 months after new version release
- **Deprecation Headers**: Deprecated endpoints return \`Deprecation: true\` header

## Pagination

List endpoints support pagination via query parameters:

- \`page\`: Page number (default: 1)
- \`limit\`: Items per page (default: 20, max: 100)
- \`sortBy\`: Field to sort by (default: createdAt)
- \`sortOrder\`: Sort direction (asc/desc, default: desc)

**Response Format:**
\`\`\`json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
\`\`\`

## Error Responses

All errors follow a consistent format:

\`\`\`json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/api/v1/articles"
}
\`\`\`

### Common HTTP Status Codes

- \`200 OK\`: Request successful
- \`201 Created\`: Resource created successfully
- \`400 Bad Request\`: Invalid request data
- \`401 Unauthorized\`: Authentication required or invalid
- \`403 Forbidden\`: Insufficient permissions
- \`404 Not Found\`: Resource not found
- \`409 Conflict\`: Resource already exists
- \`422 Unprocessable Entity\`: Validation failed
- \`429 Too Many Requests\`: Rate limit exceeded
- \`500 Internal Server Error\`: Server error

## Content Types

All requests and responses use \`application/json\` unless otherwise specified.

For file uploads, use \`multipart/form-data\`.

## WebSocket Events

Real-time updates are available via WebSocket connection at \`/ws\`:

- \`comment:created\`: New comment added
- \`rating:updated\`: Rating changed
- \`content:published\`: New content published
- \`notification:new\`: User notification

## Support

For API support or questions:
- Email: api-support@multimedia-portal.com
- GitHub: https://github.com/multimedia-portal/api
      `,
    )
    .setVersion('1.0')
    .setContact(
      'API Support',
      'https://multimedia-portal.com/support',
      'api-support@multimedia-portal.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT',
    )
    .addServer('http://localhost:4000/api/v1', 'Local Development (v1)')
    .addServer('https://api.multimedia-portal.com/api/v1', 'Production (v1)')
    .addServer('https://staging-api.multimedia-portal.com/api/v1', 'Staging (v1)')
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('articles', 'Article content management')
    .addTag('blog-posts', 'Blog post content management')
    .addTag('wiki-pages', 'Wiki page management with hierarchical structure')
    .addTag('gallery-items', 'Media gallery management')
    .addTag('stories', 'Story content management')
    .addTag('authors', 'Author profile management')
    .addTag('comments', 'Cross-content commenting system')
    .addTag('ratings', 'Content rating system')
    .addTag('search', 'Advanced search functionality')
    .addTag('content-versions', 'Content versioning and auto-save')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Serve Swagger UI at /api-docs
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
      tryItOutEnabled: true,
    },
    customSiteTitle: 'Multimedia Portal API Documentation',
    customfavIcon: 'https://multimedia-portal.com/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6; }
    `,
  });

  // Export OpenAPI JSON at /api-docs-json
  app.getHttpAdapter().get('/api-docs-json', (req, res) => {
    res.json(document);
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
  console.log(`📄 OpenAPI JSON: http://localhost:${port}/api-docs-json`);
}

bootstrap();
