import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

/**
 * Audit Log Interceptor
 * Logs admin actions for security auditing
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, user } = request;

    // Check if this route should be audited
    const shouldAudit = this.reflector.get<boolean>(
      'audit',
      context.getHandler(),
    );

    if (!shouldAudit) {
      return next.handle();
    }

    const now = Date.now();
    const userInfo = user
      ? `${user.email || user.username} (ID: ${user.id})`
      : 'Anonymous';

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;

          // Log successful admin action
          this.logger.log({
            type: 'ADMIN_ACTION',
            method,
            url,
            user: userInfo,
            userId: user?.id,
            ip,
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString(),
            status: 'SUCCESS',
          });

          // In production, this should be stored in database
          // Example: await this.auditService.create({ ... });
        },
        error: (error) => {
          const responseTime = Date.now() - now;

          // Log failed admin action
          this.logger.error({
            type: 'ADMIN_ACTION_FAILED',
            method,
            url,
            user: userInfo,
            userId: user?.id,
            ip,
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString(),
            status: 'FAILED',
            error: error.message,
          });
        },
      }),
    );
  }
}
