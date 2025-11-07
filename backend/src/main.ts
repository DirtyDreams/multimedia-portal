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
    .setDescription('Comprehensive API documentation for the Multimedia Portal - Articles, Blog, Wiki, Gallery & Stories')
    .setVersion('1.0')
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
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name will be used with @ApiBearerAuth()
    )
    .addServer('http://localhost:3000', 'Local Development Server')
    .addServer('https://api.example.com', 'Production Server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Persist authentication across page refreshes
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Multimedia Portal API Documentation',
  });

  await app.listen(process.env.PORT ?? 3000);

  console.log(`🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}/api/v1`);
  console.log(`📚 API Documentation available at: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
bootstrap();
