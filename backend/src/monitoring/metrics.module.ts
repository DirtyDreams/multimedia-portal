import { Module } from '@nestjs/common';
import { PrometheusModule, makeCounterProvider, makeHistogramProvider, makeGaugeProvider } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'multimedia_portal_',
        },
      },
      defaultLabels: {
        app: 'multimedia-portal',
      },
    }),
  ],
  providers: [
    // HTTP Request metrics
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    }),

    // Database metrics
    makeCounterProvider({
      name: 'db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'table'],
    }),
    makeHistogramProvider({
      name: 'db_query_duration_seconds',
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
    }),

    // Cache metrics
    makeCounterProvider({
      name: 'cache_requests_total',
      help: 'Total number of cache requests',
      labelNames: ['operation', 'result'],
    }),
    makeGaugeProvider({
      name: 'cache_size',
      help: 'Current cache size in bytes',
    }),

    // Business metrics
    makeCounterProvider({
      name: 'content_views_total',
      help: 'Total number of content views',
      labelNames: ['content_type'],
    }),
    makeCounterProvider({
      name: 'user_registrations_total',
      help: 'Total number of user registrations',
    }),
    makeCounterProvider({
      name: 'comments_created_total',
      help: 'Total number of comments created',
      labelNames: ['content_type'],
    }),
    makeCounterProvider({
      name: 'ratings_created_total',
      help: 'Total number of ratings created',
      labelNames: ['content_type'],
    }),

    // Search metrics
    makeCounterProvider({
      name: 'searches_total',
      help: 'Total number of searches',
    }),
    makeCounterProvider({
      name: 'zero_result_searches_total',
      help: 'Total number of searches with zero results',
    }),

    // Upload metrics
    makeCounterProvider({
      name: 'file_uploads_total',
      help: 'Total number of file uploads',
      labelNames: ['file_type', 'status'],
    }),
    makeHistogramProvider({
      name: 'file_upload_size_bytes',
      help: 'File upload size in bytes',
      labelNames: ['file_type'],
      buckets: [1024, 10240, 102400, 1024000, 10240000, 104857600],
    }),

    // Authentication metrics
    makeCounterProvider({
      name: 'auth_attempts_total',
      help: 'Total number of authentication attempts',
      labelNames: ['result'],
    }),
    makeCounterProvider({
      name: 'token_refreshes_total',
      help: 'Total number of token refreshes',
      labelNames: ['result'],
    }),
  ],
  exports: [PrometheusModule],
})
export class MetricsModule {}
