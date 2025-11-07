"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const helmet_1 = __importDefault(require("helmet"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)({
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
    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.setGlobalPrefix('api/v1');
    const config = new swagger_1.DocumentBuilder()
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
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
    }, 'JWT-auth')
        .addServer('http://localhost:3000', 'Local Development Server')
        .addServer('https://api.example.com', 'Production Server')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
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
//# sourceMappingURL=main.js.map