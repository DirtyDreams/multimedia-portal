import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from './audit-log.service';
import { AuditAction, UserRole } from '@prisma/client';
import { Reflector } from '@nestjs/core';

/**
 * Decorator to mark routes that should be audited
 * @param action - The audit action type
 * @param resource - The resource type being modified
 */
export const Audit = (action: AuditAction, resource: string) =>
  Reflector.createDecorator<{ action: AuditAction; resource: string }>({ action, resource });

/**
 * Interceptor that automatically logs admin actions
 * Only logs actions performed by users with ADMIN or MODERATOR roles
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Only audit logged-in admin/moderator users
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR)) {
      return next.handle();
    }

    // Get audit metadata from decorator
    const auditMetadata = this.reflector.get(Audit, context.getHandler());

    if (!auditMetadata) {
      return next.handle();
    }

    const { action, resource } = auditMetadata;

    // Extract request details
    const ipAddress = this.getIpAddress(request);
    const userAgent = request.headers['user-agent'] || null;

    // Extract resource ID from params or body
    const resourceId = request.params.id || request.body?.id || null;

    // Store original data for UPDATE/DELETE actions
    let oldValues: any = null;

    return next.handle().pipe(
      tap({
        next: (response) => {
          // Prepare new values
          const newValues = this.sanitizeValues(response);

          // Log the action
          this.auditLogService
            .logAction({
              action,
              resource,
              resourceId,
              oldValues,
              newValues,
              ipAddress,
              userAgent,
              userId: user.id,
            })
            .catch((error) => {
              this.logger.error(`Failed to log audit action: ${error.message}`, error.stack);
            });
        },
        error: (error) => {
          // Still log failed attempts
          this.auditLogService
            .logAction({
              action,
              resource,
              resourceId,
              oldValues,
              newValues: { error: error.message },
              ipAddress,
              userAgent,
              userId: user.id,
            })
            .catch((err) => {
              this.logger.error(`Failed to log audit action error: ${err.message}`, err.stack);
            });
        },
      }),
    );
  }

  /**
   * Extract client IP address from request
   */
  private getIpAddress(request: any): string | null {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      null
    );
  }

  /**
   * Sanitize values to remove sensitive data
   */
  private sanitizeValues(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Clone the data
    const sanitized = { ...data };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'refreshToken', 'secret', 'apiKey'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
