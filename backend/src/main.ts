import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // CORS Configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global Validation Pipe with input sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix for all routes with versioning
  app.setGlobalPrefix('api/v1');

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Multimedia Portal API')
    .setDescription(
      `# Multimedia Portal API Documentation

## Overview
Comprehensive RESTful API for managing multimedia content including articles, blog posts, wiki pages, galleries, stories, and user interactions.

## Authentication
This API uses **JWT (JSON Web Tokens)** for authentication. To access protected endpoints:

1. **Register** a new account via \`POST /api/v1/auth/register\`
2. **Login** to get your JWT token via \`POST /api/v1/auth/login\`
3. Include the token in the **Authorization** header: \`Bearer <your-token>\`

## Rate Limiting
- **Public endpoints**: 100 requests per 15 minutes per IP
- **Authenticated endpoints**: 1000 requests per 15 minutes per user
- **Admin endpoints**: 500 requests per 15 minutes per admin

## Error Responses
All endpoints return standard HTTP status codes:

- **200** - Success
- **201** - Created successfully
- **204** - Success with no content
- **400** - Bad request (validation error)
- **401** - Unauthorized (missing or invalid token)
- **403** - Forbidden (insufficient permissions)
- **404** - Resource not found
- **409** - Conflict (duplicate resource)
- **429** - Too many requests (rate limit exceeded)
- **500** - Internal server error

Error response format:
\`\`\`json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
\`\`\`

## Versioning
Current API version: **v1**
All endpoints are prefixed with \`/api/v1\`

## Pagination
List endpoints support pagination with these query parameters:
- \`page\` - Page number (default: 1)
- \`limit\` - Items per page (default: 10, max: 100)
- \`sortBy\` - Sort field (e.g., createdAt, title)
- \`order\` - Sort order (asc, desc)

Response includes metadata:
\`\`\`json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
\`\`\`
      `,
    )
    .setVersion('1.0.0')
    .setContact(
      'Multimedia Portal Support',
      'https://github.com/DirtyDreams/multimedia-portal',
      'support@multimedia-portal.dev',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Articles', 'Article management endpoints')
    .addTag('Blog Posts', 'Blog post management endpoints')
    .addTag('Wiki Pages', 'Wiki page management with hierarchical structure')
    .addTag('Gallery Items', 'Gallery and media management endpoints')
    .addTag('Stories', 'Story management endpoints')
    .addTag('Authors', 'Author management endpoints')
    .addTag('Comments', 'Comment management across all content types')
    .addTag('Ratings', 'Rating and review system endpoints')
    .addTag('Notifications', 'User notification system')
    .addTag('Search', 'Content search and filtering')
    .addTag('Analytics', 'Privacy-friendly analytics and tracking system')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Authorization token obtained from /auth/login endpoint',
        in: 'header',
      },
      'JWT-auth', // This name will be used with @ApiBearerAuth()
    )
    .addServer('http://localhost:3000', 'Local Development Server')
    .addServer('http://localhost:3001', 'Docker Development Server')
    .addServer('https://api.multimedia-portal.dev', 'Production Server')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Setup Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Persist authentication across page refreshes
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      filter: true, // Enable filtering
      displayRequestDuration: true, // Show request duration
    },
    customSiteTitle: 'Multimedia Portal API Documentation',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 30px 0 }
      .swagger-ui .scheme-container { margin: 0 0 20px 0 }
    `,
  });

  // Export OpenAPI spec as JSON (accessible at /api/docs-json)
  SwaggerModule.setup('api/docs-json', app, document, {
    jsonDocumentUrl: '/api/docs-json',
    yamlDocumentUrl: '/api/docs-yaml',
  });

  await app.listen(process.env.PORT ?? 3000);

  console.log(`🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}/api/v1`);
  console.log(`📚 API Documentation available at: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
  console.log(`📄 OpenAPI Spec (JSON): http://localhost:${process.env.PORT ?? 3000}/api/docs-json`);
  console.log(`📄 OpenAPI Spec (YAML): http://localhost:${process.env.PORT ?? 3000}/api/docs-yaml`);
}
bootstrap();
