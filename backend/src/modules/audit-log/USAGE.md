# Audit Logging Usage Guide

The audit logging system automatically tracks administrative actions and important system events for security, compliance, and debugging purposes.

## Overview

The audit logging module provides:

- **Automatic logging** of admin actions via interceptor
- **Manual logging** capability for custom scenarios
- **Query API** for retrieving audit logs with filtering
- **Compliance features** like data retention and sanitization

## Architecture

```
┌─────────────────────────────────────────────────┐
│          AUDIT LOGGING SYSTEM                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  @Audit Decorator                               │
│  └─> AuditLogInterceptor                        │
│       └─> AuditLogService                       │
│            └─> Prisma (audit_logs table)        │
│                                                  │
│  Manual Logging                                 │
│  └─> AuditLogService.logAction()                │
│                                                  │
│  Query Logs                                     │
│  └─> AuditLogController                         │
│       └─> /audit-logs API endpoints             │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Quick Start

### 1. Automatic Logging with @Audit Decorator

Use the `@Audit` decorator on controller methods to automatically log actions:

```typescript
import { Controller, Post, Put, Delete, Body, Param, UseInterceptors } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { Audit, AuditLogInterceptor } from '../audit-log/audit-log.interceptor';

@Controller('articles')
@UseInterceptors(AuditLogInterceptor) // Apply interceptor to all routes
export class ArticlesController {

  @Post()
  @Audit(AuditAction.CREATE, 'Article')
  async create(@Body() createDto: CreateArticleDto) {
    // Your logic here
    return this.articlesService.create(createDto);
  }

  @Put(':id')
  @Audit(AuditAction.UPDATE, 'Article')
  async update(@Param('id') id: string, @Body() updateDto: UpdateArticleDto) {
    // Your logic here
    return this.articlesService.update(id, updateDto);
  }

  @Delete(':id')
  @Audit(AuditAction.DELETE, 'Article')
  async delete(@Param('id') id: string) {
    // Your logic here
    return this.articlesService.delete(id);
  }

  @Post(':id/publish')
  @Audit(AuditAction.PUBLISH, 'Article')
  async publish(@Param('id') id: string) {
    // Your logic here
    return this.articlesService.publish(id);
  }
}
```

**How it works:**
- The decorator marks the route for auditing
- The interceptor automatically logs:
  - User ID (from JWT token)
  - Action type (CREATE, UPDATE, DELETE, etc.)
  - Resource type ("Article")
  - Resource ID (from params or response)
  - IP address
  - User agent
  - Request/response data (sanitized)

**Important:** Only actions by users with ADMIN or MODERATOR roles are logged.

### 2. Manual Logging

For custom scenarios, inject `AuditLogService` and call `logAction()`:

```typescript
import { Injectable } from '@nestjs/common';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class CustomService {
  constructor(private readonly auditLog: AuditLogService) {}

  async performSensitiveOperation(userId: string, data: any) {
    // Before operation
    const oldData = await this.getExistingData();

    // Perform operation
    const result = await this.updateData(data);

    // Log the action
    await this.auditLog.logAction({
      action: AuditAction.UPDATE,
      resource: 'CustomResource',
      resourceId: result.id,
      oldValues: oldData,
      newValues: result,
      userId,
    });

    return result;
  }

  async trackLogin(userId: string, ipAddress: string, userAgent: string) {
    await this.auditLog.logAction({
      action: AuditAction.LOGIN,
      resource: 'User',
      resourceId: userId,
      ipAddress,
      userAgent,
      userId,
    });
  }

  async trackSystemEvent() {
    await this.auditLog.logAction({
      action: AuditAction.UPDATE,
      resource: 'System',
      newValues: { event: 'maintenance_completed' },
      // No userId for system events
    });
  }
}
```

## Available Audit Actions

```typescript
enum AuditAction {
  CREATE,      // Resource created
  UPDATE,      // Resource updated
  DELETE,      // Resource deleted
  LOGIN,       // User logged in
  LOGOUT,      // User logged out
  PUBLISH,     // Content published
  UNPUBLISH,   // Content unpublished
  APPROVE,     // Content/action approved
  REJECT,      // Content/action rejected
}
```

## Querying Audit Logs

### API Endpoints

**GET /audit-logs** (Admin only)
Query audit logs with filtering:

```bash
# All logs
GET /audit-logs

# Filter by user
GET /audit-logs?userId=user-123

# Filter by action
GET /audit-logs?action=DELETE

# Filter by resource
GET /audit-logs?resource=Article

# Filter by date range
GET /audit-logs?startDate=2025-01-01&endDate=2025-01-31

# Combined filters with pagination
GET /audit-logs?resource=Article&action=UPDATE&page=1&limit=50
```

**GET /audit-logs/resource/:resource/:resourceId** (Admin/Moderator)
Get audit trail for a specific resource:

```bash
GET /audit-logs/resource/Article/article-123
```

**GET /audit-logs/user/:userId** (Admin only)
Get all actions by a specific user:

```bash
GET /audit-logs/user/user-123
```

### Programmatic Access

```typescript
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class MyService {
  constructor(private readonly auditLog: AuditLogService) {}

  async getArticleHistory(articleId: string) {
    return this.auditLog.getResourceAuditLogs('Article', articleId, 100);
  }

  async getUserActions(userId: string) {
    return this.auditLog.getUserAuditLogs(userId, 50);
  }

  async searchLogs(query: QueryAuditLogsDto) {
    return this.auditLog.getAuditLogs(query);
  }
}
```

## Data Retention

Clean up old audit logs to comply with data retention policies:

```typescript
// Delete logs older than 365 days
await this.auditLog.cleanupOldLogs(365);

// Delete logs older than 90 days
await this.auditLog.cleanupOldLogs(90);
```

**Recommended schedule:**
- GDPR compliance: 90-365 days
- Financial data: 7 years (2555 days)
- Healthcare (HIPAA): 6 years (2190 days)

## Security Features

### 1. Automatic Data Sanitization

Sensitive fields are automatically redacted:

```typescript
// Input
{
  username: "admin",
  password: "secret123",
  email: "admin@example.com"
}

// Logged as
{
  username: "admin",
  password: "[REDACTED]",
  email: "admin@example.com"
}
```

Redacted fields: `password`, `token`, `refreshToken`, `secret`, `apiKey`

### 2. IP Address Tracking

Multiple sources are checked for accurate IP tracking:
- `X-Forwarded-For` header (load balancers)
- `X-Real-IP` header (proxies)
- Socket remote address
- Request IP

### 3. Role-Based Access

Only certain roles can:
- **Create logs**: ADMIN, MODERATOR (automatic via interceptor)
- **View all logs**: ADMIN only
- **View resource logs**: ADMIN, MODERATOR
- **View user logs**: ADMIN only

## Best Practices

### 1. What to Audit

✅ **DO audit:**
- User authentication (login, logout)
- Content creation, updates, deletions
- Permission changes
- Configuration changes
- Admin actions
- Payment transactions
- Data exports
- Failed authentication attempts

❌ **DON'T audit:**
- Read-only operations (GET requests)
- High-frequency operations (real-time updates)
- Non-sensitive actions
- Public content views

### 2. Performance Considerations

- Audit logging is **asynchronous** - won't block requests
- Failed audit logs are caught and logged to console
- Consider using a queue for high-traffic applications:

```typescript
// Instead of direct logging
await this.auditLog.logAction(data);

// Use a queue
await this.queueService.add('audit-log', data);
```

### 3. Monitoring

Set up alerts for suspicious patterns:

```typescript
// Example: Alert on mass deletions
const recentDeletes = await this.auditLog.getAuditLogs({
  action: AuditAction.DELETE,
  startDate: new Date(Date.now() - 3600000).toISOString(), // Last hour
});

if (recentDeletes.meta.total > 100) {
  await this.alertService.notify('Mass deletion detected!');
}
```

## Database Schema

```sql
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes for fast queries
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
```

## Testing

```typescript
import { Test } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import { AuditAction } from '@prisma/client';

describe('AuditLogService', () => {
  let service: AuditLogService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuditLogService, PrismaService],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
  });

  it('should log an action', async () => {
    const result = await service.logAction({
      action: AuditAction.CREATE,
      resource: 'TestResource',
      resourceId: 'test-123',
      userId: 'user-123',
    });

    expect(result.id).toBeDefined();
    expect(result.action).toBe(AuditAction.CREATE);
  });
});
```

## Compliance

### GDPR
- Right to access: Users can request their audit logs via API
- Right to erasure: Use `cleanupOldLogs()` or manual deletion
- Data minimization: Only essential data is logged
- Encryption: Use PostgreSQL encryption at rest

### SOC 2
- Access logs: All admin actions are tracked
- Change management: All config changes are audited
- User activity: Complete trail of user actions

### HIPAA
- Audit controls: Required audit logging implemented
- Access logs: Who accessed what and when
- Retention: Configurable retention period

## Troubleshooting

**Logs not appearing:**
1. Check user has ADMIN or MODERATOR role
2. Verify `@Audit` decorator is present
3. Ensure `AuditLogInterceptor` is applied
4. Check console for errors

**Performance issues:**
1. Reduce logged data size
2. Implement async queues
3. Archive old logs to cold storage
4. Add database indexes

**Missing data:**
1. Check data sanitization rules
2. Verify request headers for IP/User-Agent
3. Ensure user context is available

## Related Documentation

- [Security Best Practices](../../../docs/SECURITY.md)
- [Prisma Schema](../../../prisma/schema.prisma)
- [Authentication Guide](../auth/README.md)

---

**Last Updated**: 2025-11-07
**Version**: 1.0.0
**Maintainer**: Backend Team
