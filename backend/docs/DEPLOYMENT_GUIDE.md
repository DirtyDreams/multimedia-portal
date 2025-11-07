# API Documentation Deployment Guide

This guide explains how to deploy and host the Multimedia Portal API documentation.

## Prerequisites

- Node.js 18+
- Backend server deployed and running
- Access to hosting platform (S3, Netlify, Vercel, etc.)

## Deployment Options

### Option 1: Same Server Deployment (Default)

Documentation is automatically served from the same server as the API.

**Pros:**
- No additional setup required
- Always in sync with API
- Single deployment process

**Cons:**
- Increases API server load
- Not optimized for documentation traffic

**Setup:**

1. Ensure Swagger is enabled in `.env`:
   ```env
   SWAGGER_ENABLED=true
   SWAGGER_PATH=api-docs
   ```

2. Deploy backend normally:
   ```bash
   npm run build
   npm run start:prod
   ```

3. Access documentation:
   - Local: http://localhost:4000/api-docs
   - Production: https://api.multimedia-portal.com/api-docs

### Option 2: Static Site Deployment (Recommended)

Host documentation as a static site for better performance and scalability.

#### Using Redoc

1. **Install Redoc CLI:**
   ```bash
   npm install -g redoc-cli
   ```

2. **Generate Static HTML:**
   ```bash
   # Ensure backend is running
   npm run start:prod

   # Generate documentation
   redoc-cli bundle http://localhost:4000/api-docs-json -o docs/api-docs.html
   ```

3. **Deploy to hosting platform:**

   **AWS S3 + CloudFront:**
   ```bash
   # Upload to S3
   aws s3 cp docs/api-docs.html s3://api-docs-bucket/index.html

   # Invalidate CloudFront cache
   aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
   ```

   **Netlify:**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli

   # Deploy
   netlify deploy --prod --dir=docs
   ```

   **Vercel:**
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Deploy
   vercel --prod docs
   ```

4. **Set up custom domain:**
   - Configure DNS to point to hosting platform
   - Example: `docs.multimedia-portal.com`

### Option 3: Documentation Platform

Use dedicated documentation platforms:

#### SwaggerHub

1. **Export OpenAPI Spec:**
   ```bash
   curl http://localhost:4000/api-docs-json > openapi.json
   ```

2. **Import to SwaggerHub:**
   - Go to https://swaggerhub.com
   - Create new API
   - Import `openapi.json`

3. **Configure:**
   - Set visibility (public/private)
   - Add custom domain
   - Enable versioning

#### Readme.io

1. **Create account** at https://readme.com

2. **Import OpenAPI:**
   - Go to API Reference section
   - Upload `openapi.json`

3. **Customize:**
   - Add guides and tutorials
   - Configure themes
   - Set up search

#### Stoplight

1. **Create project** at https://stoplight.io

2. **Import API:**
   ```bash
   # Install Stoplight CLI
   npm install -g @stoplight/cli

   # Import
   stoplight import openapi.json
   ```

3. **Publish:**
   - Configure custom domain
   - Set up versioning
   - Add mock server

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy-docs.yml`:

```yaml
name: Deploy API Documentation

on:
  push:
    branches: [main, develop]
  workflow_dispatch:

jobs:
  deploy-docs:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Build backend
        working-directory: backend
        run: npm run build

      - name: Start backend server
        working-directory: backend
        run: |
          npm run start:prod &
          sleep 10

      - name: Generate Postman collection
        working-directory: backend
        run: npm run docs:generate

      - name: Install Redoc CLI
        run: npm install -g redoc-cli

      - name: Generate static documentation
        run: |
          mkdir -p docs
          redoc-cli bundle http://localhost:4000/api-docs-json -o docs/index.html

      - name: Deploy to AWS S3
        if: github.ref == 'refs/heads/main'
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
        run: |
          aws s3 sync docs/ s3://api-docs-bucket/ --delete
          aws s3 cp backend/postman-collection.json s3://api-docs-bucket/postman-collection.json

      - name: Invalidate CloudFront cache
        if: github.ref == 'refs/heads/main'
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"

      - name: Create GitHub Release
        if: github.ref == 'refs/heads/main'
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: docs-${{ github.run_number }}
          release_name: API Documentation v${{ github.run_number }}
          body: |
            Updated API documentation
            - OpenAPI Spec: https://api-docs.multimedia-portal.com/api-docs-json
            - Swagger UI: https://api-docs.multimedia-portal.com
            - Postman Collection: https://api-docs.multimedia-portal.com/postman-collection.json
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - deploy

build-docs:
  stage: build
  image: node:18
  script:
    - cd backend
    - npm ci
    - npm run build
    - npm run start:prod &
    - sleep 10
    - npm run docs:generate
    - npm install -g redoc-cli
    - mkdir -p ../docs
    - redoc-cli bundle http://localhost:4000/api-docs-json -o ../docs/index.html
  artifacts:
    paths:
      - docs/
      - backend/postman-collection.json
    expire_in: 1 week

deploy-docs:
  stage: deploy
  image: alpine:latest
  dependencies:
    - build-docs
  before_script:
    - apk add --no-cache aws-cli
  script:
    - aws s3 sync docs/ s3://api-docs-bucket/ --delete
    - aws s3 cp backend/postman-collection.json s3://api-docs-bucket/
    - aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DIST_ID --paths "/*"
  only:
    - main
```

## Environment-Specific Configuration

### Development

```env
# .env.development
SWAGGER_ENABLED=true
SWAGGER_PATH=api-docs
API_TITLE="Multimedia Portal API - Development"
CORS_ORIGIN=http://localhost:3000
```

### Staging

```env
# .env.staging
SWAGGER_ENABLED=true
SWAGGER_PATH=api-docs
API_TITLE="Multimedia Portal API - Staging"
CORS_ORIGIN=https://staging.multimedia-portal.com
```

### Production

```env
# .env.production
SWAGGER_ENABLED=true  # or false if you want to disable in production
SWAGGER_PATH=api-docs
API_TITLE="Multimedia Portal API"
CORS_ORIGIN=https://multimedia-portal.com
```

## Security Considerations

### Authentication for Documentation

Protect documentation in production:

```typescript
// src/main.ts
import * as basicAuth from 'express-basic-auth';

if (process.env.NODE_ENV === 'production') {
  app.use(
    '/api-docs',
    basicAuth({
      challenge: true,
      users: {
        [process.env.DOCS_USERNAME]: process.env.DOCS_PASSWORD,
      },
    }),
  );
}
```

### IP Whitelisting

Restrict access to specific IPs:

```typescript
import * as ipfilter from 'express-ipfilter';

if (process.env.NODE_ENV === 'production') {
  const allowedIps = process.env.ALLOWED_IPS.split(',');
  app.use('/api-docs', ipfilter(allowedIps, { mode: 'allow' }));
}
```

### Disable in Production (Optional)

Completely disable in production:

```typescript
if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true') {
  SwaggerModule.setup('api-docs', app, document);
}
```

## Custom Domain Setup

### AWS CloudFront + S3

1. **Create S3 bucket:**
   ```bash
   aws s3 mb s3://api-docs-bucket
   aws s3 website s3://api-docs-bucket --index-document index.html
   ```

2. **Create CloudFront distribution:**
   ```bash
   aws cloudfront create-distribution \
     --origin-domain-name api-docs-bucket.s3.amazonaws.com \
     --default-root-object index.html
   ```

3. **Configure DNS:**
   - Create CNAME: `docs.multimedia-portal.com` → CloudFront URL

4. **Add SSL certificate:**
   - Request certificate in ACM
   - Attach to CloudFront distribution

### Netlify

1. **Deploy site:**
   ```bash
   netlify deploy --prod --dir=docs
   ```

2. **Add custom domain:**
   ```bash
   netlify domains:add docs.multimedia-portal.com
   ```

3. **Enable HTTPS:**
   - Automatically provisioned by Netlify

### Vercel

1. **Deploy:**
   ```bash
   vercel --prod docs
   ```

2. **Add domain:**
   ```bash
   vercel domains add docs.multimedia-portal.com
   ```

## Monitoring

### Track Documentation Usage

Add analytics to Swagger UI:

```typescript
// src/main.ts
SwaggerModule.setup('api-docs', app, document, {
  customJs: [
    'https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js',
    '/analytics.js',  // Your analytics script
  ],
});
```

### Monitor API Calls

Track documentation API calls:

```typescript
app.use('/api-docs', (req, res, next) => {
  console.log(`Documentation accessed: ${req.ip} at ${new Date()}`);
  next();
});
```

## Versioning

### Multi-version Documentation

Host multiple API versions:

```
docs.multimedia-portal.com/
  ├── v1/
  │   └── index.html
  ├── v2/
  │   └── index.html
  └── latest/
      └── index.html -> v2/
```

### Version Selector

Add version dropdown to documentation:

```typescript
SwaggerModule.setup('api-docs', app, document, {
  customSiteTitle: 'API Docs - v1.0',
  customCss: `
    .topbar { background-color: #3b82f6; }
    .topbar::after {
      content: "Version 1.0";
      float: right;
      padding: 10px;
    }
  `,
});
```

## Troubleshooting

### Documentation Not Loading

1. Check server is running:
   ```bash
   curl http://localhost:4000/api-docs-json
   ```

2. Verify Swagger is enabled:
   ```bash
   echo $SWAGGER_ENABLED
   ```

3. Check CORS configuration:
   ```typescript
   app.enableCors({ origin: '*' });
   ```

### Missing Endpoints

1. Ensure controllers have decorators:
   ```typescript
   @ApiTags('articles')
   @Controller('articles')
   ```

2. Check modules are imported:
   ```typescript
   @Module({
     imports: [ArticlesModule, ...],
   })
   ```

### Postman Collection Not Generated

1. Ensure backend is running
2. Check port configuration
3. Verify script has network access

## Best Practices

1. **Automate deployment** with CI/CD
2. **Version documentation** alongside API
3. **Monitor access** and usage patterns
4. **Keep examples updated** with realistic data
5. **Use custom domain** for professional appearance
6. **Enable HTTPS** for security
7. **Add analytics** to track usage
8. **Regular updates** when API changes

## Resources

- [Swagger Documentation](https://swagger.io/docs/)
- [NestJS Swagger Module](https://docs.nestjs.com/openapi/introduction)
- [Redoc Documentation](https://redocly.com/docs/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)

## Support

For deployment issues:
- Email: devops@multimedia-portal.com
- Slack: #api-docs
- GitHub Issues: https://github.com/multimedia-portal/api/issues
