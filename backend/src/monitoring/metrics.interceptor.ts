import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

/**
 * Interceptor to automatically track HTTP request metrics
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly httpRequestsCounter: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const route = request.route?.path || request.url;

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const status = response.statusCode;
          const duration = (Date.now() - startTime) / 1000;

          // Increment counter
          this.httpRequestsCounter.inc({
            method,
            route,
            status: String(status),
          });

          // Record duration
          this.httpRequestDuration.observe(
            {
              method,
              route,
              status: String(status),
            },
            duration,
          );
        },
        error: (error) => {
          const status = error.status || 500;
          const duration = (Date.now() - startTime) / 1000;

          // Increment counter for errors
          this.httpRequestsCounter.inc({
            method,
            route,
            status: String(status),
          });

          // Record duration for errors
          this.httpRequestDuration.observe(
            {
              method,
              route,
              status: String(status),
            },
            duration,
          );
        },
      }),
    );
  }
}
