# Security Configuration Guide

Comprehensive security configuration and hardening guide for Multimedia Portal backend.

---

## Table of Contents

1. [Overview](#overview)
2. [Security Layers](#security-layers)
3. [Rate Limiting](#rate-limiting)
4. [Security Headers (Helmet)](#security-headers-helmet)
5. [CORS Configuration](#cors-configuration)
6. [Input Validation](#input-validation)
7. [Audit Logging](#audit-logging)
8. [Authentication & Authorization](#authentication--authorization)
9. [Testing](#testing)
10. [Deployment Checklist](#deployment-checklist)

---

## Overview

The Multimedia Portal backend implements multiple layers of security controls following industry best practices and OWASP guidelines.

### Security Architecture

```
┌───────────────────────────────────────────────────────┐
│           CLIENT REQUEST                               │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│  1. HELMET (Security Headers)                         │
│     • CSP, HSTS, X-Frame-Options, etc.                │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│  2. CORS (Origin Validation)                          │
│     • Whitelist validation                            │
│     • Credential handling                             │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│  3. RATE LIMITING (Throttler)                         │
│     • Short: 10 req/min                               │
│     • Medium: 100 req/15min                           │
│     • Long: 1000 req/day                              │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│  4. AUTHENTICATION (JWT)                              │
│     • Token validation                                │
│     • User identity                                   │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│  5. AUTHORIZATION (Roles)                             │
│     • RBAC (USER, MODERATOR, ADMIN)                   │
│     • Permission checks                               │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│  6. INPUT VALIDATION (ValidationPipe)                 │
│     • DTO validation                                  │
│     • Type transformation                             │
│     • Whitelist filtering                             │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│  7. AUDIT LOGGING (Interceptor)                       │
│     • Action tracking                                 │
│     • Admin actions                                   │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│  8. BUSINESS LOGIC                                    │
│     • Service layer                                   │
│     • Database access                                 │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│           RESPONSE                                    │
└───────────────────────────────────────────────────────┘
```

---

## Security Layers

### Layer 1: Network Security

**Configuration:**
- Load balancer with SSL termination
- Firewall rules restricting access
- DDoS protection
- IP whitelisting (optional)

### Layer 2: Application Security

**Configuration:**
- Security headers (Helmet)
- CORS validation
- Rate limiting
- Input validation

### Layer 3: Authentication Security

**Configuration:**
- JWT tokens (15-minute expiry)
- Refresh tokens (7-day expiry)
- Secure password hashing (bcrypt)
- Session management

### Layer 4: Authorization Security

**Configuration:**
- Role-Based Access Control (RBAC)
- Resource-level permissions
- Guard-based protection

### Layer 5: Data Security

**Configuration:**
- Database encryption at rest
- SQL injection prevention (Prisma ORM)
- Data sanitization
- Audit logging

---

## Rate Limiting

### Configuration

**Implementation:** `@nestjs/throttler`

**File:** `backend/src/app.module.ts`

```typescript
ThrottlerModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    throttlers: [
      {
        name: 'short',
        ttl: 60000,      // 60 seconds
        limit: 10,       // 10 requests
      },
      {
        name: 'medium',
        ttl: 900000,     // 15 minutes
        limit: 100,      // 100 requests
      },
      {
        name: 'long',
        ttl: 86400000,   // 24 hours
        limit: 1000,     // 1000 requests
      },
    ],
  }),
})
```

### Usage Tiers

| Tier | Window | Limit | Use Case |
|------|--------|-------|----------|
| Short | 60s | 10 | Burst protection |
| Medium | 15min | 100 | Normal usage |
| Long | 24h | 1000 | Daily limits |

### Environment Variables

```bash
# .env
THROTTLE_TTL=60000                    # Short TTL (60s)
THROTTLE_LIMIT=10                     # Short limit
THROTTLE_TTL_MEDIUM=900000            # Medium TTL (15min)
THROTTLE_LIMIT_MEDIUM=100             # Medium limit
THROTTLE_TTL_LONG=86400000            # Long TTL (24h)
THROTTLE_LIMIT_LONG=1000              # Long limit
```

### Custom Rate Limits

Per-endpoint rate limiting:

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('articles')
export class ArticlesController {
  @Post()
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // Stricter for POST
  async create(@Body() dto: CreateArticleDto) {
    return this.service.create(dto);
  }
}
```

### Response Headers

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1704067200
```

Rate limit exceeded:

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704067200
Retry-After: 300
```

---

## Security Headers (Helmet)

### Configuration

**Implementation:** `helmet` middleware

**File:** `backend/src/main.ts`

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      connectSrc: ["'self'", process.env.NEXT_PUBLIC_API_URL],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  hsts: {
    maxAge: 31536000,      // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  hidePoweredBy: true,
}));
```

### Enabled Security Headers

#### Content Security Policy (CSP)

Prevents XSS attacks by controlling resource loading:

```http
Content-Security-Policy: default-src 'self'; img-src 'self' data: https:; ...
```

**Configuration:**
- `defaultSrc`: Only same-origin resources
- `scriptSrc`: Allow inline scripts (for Swagger)
- `imgSrc`: Allow images from any HTTPS source
- `connectSrc`: API endpoints only

#### HTTP Strict Transport Security (HSTS)

Forces HTTPS connections:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Configuration:**
- Max age: 1 year (31536000 seconds)
- Include subdomains
- Preload eligible

#### X-Frame-Options

Prevents clickjacking attacks:

```http
X-Frame-Options: DENY
```

**Configuration:**
- `DENY`: No framing allowed
- Prevents embedding in iframes

#### X-Content-Type-Options

Prevents MIME-type sniffing:

```http
X-Content-Type-Options: nosniff
```

#### X-XSS-Protection

Legacy XSS protection (browser-level):

```http
X-XSS-Protection: 1; mode=block
```

#### Referrer-Policy

Controls referrer information:

```http
Referrer-Policy: strict-origin-when-cross-origin
```

**Configuration:**
- Send origin on cross-origin requests
- Full URL on same-origin requests

#### X-Powered-By

Removed to hide technology stack:

```http
# Header removed
```

---

## CORS Configuration

### Configuration

**Implementation:** NestJS built-in CORS

**File:** `backend/src/main.ts`

```typescript
const corsOrigins = process.env.CORS_ORIGIN
  ?.split(',')
  .map(origin => origin.trim()) || ['http://localhost:3000'];

app.enableCors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow no-origin requests

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
  maxAge: 3600, // Cache preflight for 1 hour
});
```

### Environment Variables

```bash
# Development
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Production
CORS_ORIGIN=https://multimedia-portal.com,https://www.multimedia-portal.com

# Allow all (NOT RECOMMENDED)
CORS_ORIGIN=*
```

### Preflight Requests

CORS preflight (OPTIONS) requests are handled automatically:

```http
OPTIONS /api/articles HTTP/1.1
Origin: https://frontend.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type, Authorization

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://frontend.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 3600
```

---

## Input Validation

### Configuration

**Implementation:** `class-validator` + `class-transformer`

**File:** `backend/src/main.ts`

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,                    // Strip non-whitelisted properties
  forbidNonWhitelisted: true,         // Throw error on extra properties
  transform: true,                    // Auto-transform to DTO types
  transformOptions: {
    enableImplicitConversion: true,
  },
  disableErrorMessages: process.env.NODE_ENV === 'production',
  validateCustomDecorators: true,
  forbidUnknownValues: true,
}));
```

### Features

#### 1. Whitelist Filtering

Strips properties not defined in DTO:

```typescript
// DTO
class CreateArticleDto {
  @IsString()
  title: string;

  @IsString()
  content: string;
}

// Request body
{
  "title": "Test",
  "content": "Content",
  "malicious": "ignored"  // ← Stripped automatically
}
```

#### 2. Type Transformation

Converts query/path params to correct types:

```typescript
class QueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;
}

// Query: ?page=5
// Transformed to: page: 5 (number)
```

#### 3. Forbidden Non-Whitelisted

Throws error on extra properties:

```http
POST /api/articles
{
  "title": "Test",
  "extraField": "not allowed"
}

HTTP/1.1 400 Bad Request
{
  "statusCode": 400,
  "message": ["property extraField should not exist"],
  "error": "Bad Request"
}
```

#### 4. Validation Rules

```typescript
import { IsString, IsEmail, MinLength, MaxLength, IsInt, Min, Max } from 'class-validator';

class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}
```

---

## Audit Logging

See [Audit Log Usage Guide](../src/modules/audit-log/USAGE.md) for detailed information.

### Quick Overview

**Features:**
- Automatic logging of admin actions
- Manual logging capability
- Query API with filtering
- Role-based access
- Data sanitization
- IP/User-Agent tracking

**Usage:**

```typescript
// Automatic
@Post()
@UseInterceptors(AuditLogInterceptor)
@Audit(AuditAction.CREATE, 'Article')
async create(@Body() dto: CreateArticleDto) {
  return this.service.create(dto);
}

// Manual
await this.auditLog.logAction({
  action: AuditAction.UPDATE,
  resource: 'User',
  resourceId: user.id,
  oldValues: { role: 'USER' },
  newValues: { role: 'ADMIN' },
  userId: adminId,
  ipAddress: request.ip,
});
```

---

## Authentication & Authorization

### JWT Authentication

**Implementation:** `@nestjs/jwt` + `@nestjs/passport`

**Token Configuration:**

```typescript
// Access Token
{
  expiresIn: '15m',
  secret: process.env.JWT_SECRET,
}

// Refresh Token
{
  expiresIn: '7d',
  secret: process.env.JWT_REFRESH_SECRET,
}
```

### Role-Based Access Control

**Roles:**
```typescript
enum UserRole {
  USER,       // Regular users
  MODERATOR,  // Content moderators
  ADMIN,      // System administrators
}
```

**Usage:**

```typescript
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Get('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async listUsers() {
  return this.usersService.findAll();
}
```

---

## Testing

### Security Tests

**Unit Tests:**
```bash
npm test -- audit-log.service.spec.ts
```

**E2E Tests:**
```bash
npm test:e2e -- security.e2e-spec.ts
```

### Test Coverage

Security tests cover:
- Helmet security headers
- CORS validation
- Rate limiting
- Input validation
- Audit logging
- Error handling

---

## Deployment Checklist

### Pre-Deployment

- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Set strong `JWT_REFRESH_SECRET`
- [ ] Configure production `CORS_ORIGIN` (no wildcards)
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Configure database encryption at rest
- [ ] Review and adjust rate limits
- [ ] Set up monitoring and alerts
- [ ] Enable audit log cleanup cron job
- [ ] Test all security features

### Environment Variables

```bash
# Required
NODE_ENV=production
JWT_SECRET=<strong-secret-32-chars>
JWT_REFRESH_SECRET=<strong-secret-32-chars>
DATABASE_URL=<encrypted-connection>

# CORS
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=10
THROTTLE_TTL_MEDIUM=900000
THROTTLE_LIMIT_MEDIUM=100
THROTTLE_TTL_LONG=86400000
THROTTLE_LIMIT_LONG=1000

# API URL (for CSP)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Post-Deployment

- [ ] Verify HTTPS is enforced
- [ ] Test CORS from frontend
- [ ] Verify rate limiting works
- [ ] Check audit logs are being created
- [ ] Monitor for blocked requests
- [ ] Set up security alerts
- [ ] Run security audit (npm audit)
- [ ] Review access logs regularly

---

## Security Best Practices

### 1. Passwords

- ✅ Use bcrypt for hashing (10+ rounds)
- ✅ Enforce minimum length (8+ characters)
- ✅ Never log passwords
- ✅ Use password strength validator

### 2. Tokens

- ✅ Short-lived access tokens (15 minutes)
- ✅ Secure refresh token storage
- ✅ Rotate tokens regularly
- ✅ Revoke compromised tokens

### 3. Input

- ✅ Validate all input
- ✅ Sanitize user-generated content
- ✅ Use parameterized queries (Prisma)
- ✅ Limit payload size

### 4. Errors

- ✅ Don't expose stack traces in production
- ✅ Log errors securely
- ✅ Return generic error messages
- ✅ Monitor error patterns

### 5. Monitoring

- ✅ Set up security alerts
- ✅ Monitor failed authentication attempts
- ✅ Track suspicious patterns
- ✅ Regular security audits

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [Helmet Documentation](https://helmetjs.github.io/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Last Updated**: 2025-11-07
**Version**: 1.0.0
**Maintainer**: Security Team
