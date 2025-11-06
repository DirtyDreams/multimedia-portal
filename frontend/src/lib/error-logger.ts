/**
 * Error Logging Service
 *
 * Provides centralized error logging with support for different environments
 * and external error tracking services like Sentry
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  [key: string]: any;
  userId?: string;
  userEmail?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
}

export interface ErrorLog {
  message: string;
  error: Error;
  severity: ErrorSeverity;
  context?: ErrorContext;
  stack?: string;
  componentStack?: string;
}

class ErrorLoggerService {
  private isDevelopment: boolean;
  private logs: ErrorLog[] = [];

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Log an error with context and severity
   */
  logError(
    error: Error,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: ErrorContext
  ): void {
    const errorLog: ErrorLog = {
      message: error.message,
      error,
      severity,
      context: {
        ...context,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        timestamp: new Date().toISOString(),
      },
      stack: error.stack,
    };

    // Store in memory (limited to last 100 errors)
    this.logs.push(errorLog);
    if (this.logs.length > 100) {
      this.logs.shift();
    }

    // Console logging in development
    if (this.isDevelopment) {
      console.error(`[${severity.toUpperCase()}] ${error.message}`, {
        error,
        context: errorLog.context,
        stack: error.stack,
      });
    }

    // Send to external error tracking service (Sentry, etc.)
    this.sendToExternalService(errorLog);
  }

  /**
   * Log a network error with retry information
   */
  logNetworkError(
    error: Error,
    url: string,
    method: string,
    statusCode?: number,
    retryCount?: number
  ): void {
    this.logError(error, ErrorSeverity.MEDIUM, {
      type: 'network',
      url,
      method,
      statusCode,
      retryCount,
    });
  }

  /**
   * Log an API error with response details
   */
  logAPIError(
    error: Error,
    endpoint: string,
    statusCode: number,
    responseData?: any
  ): void {
    this.logError(error, ErrorSeverity.HIGH, {
      type: 'api',
      endpoint,
      statusCode,
      responseData,
    });
  }

  /**
   * Log an authentication error
   */
  logAuthError(error: Error, action: string): void {
    this.logError(error, ErrorSeverity.HIGH, {
      type: 'authentication',
      action,
    });
  }

  /**
   * Log a component render error
   */
  logComponentError(
    error: Error,
    componentName: string,
    componentStack?: string
  ): void {
    this.logError(error, ErrorSeverity.HIGH, {
      type: 'component',
      componentName,
      componentStack,
    });
  }

  /**
   * Get recent error logs
   */
  getRecentLogs(count: number = 10): ErrorLog[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear all stored logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Send error to external tracking service
   * This can be extended to integrate with Sentry, LogRocket, etc.
   */
  private sendToExternalService(errorLog: ErrorLog): void {
    // Check if Sentry is configured
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      try {
        const Sentry = (window as any).Sentry;

        Sentry.captureException(errorLog.error, {
          level: this.mapSeverityToSentryLevel(errorLog.severity),
          tags: {
            severity: errorLog.severity,
            type: errorLog.context?.type,
          },
          contexts: {
            custom: errorLog.context,
          },
        });
      } catch (sentryError) {
        console.error('Failed to send error to Sentry:', sentryError);
      }
    }

    // In production, you could also send to your own logging endpoint
    if (!this.isDevelopment && typeof window !== 'undefined') {
      this.sendToBackend(errorLog);
    }
  }

  /**
   * Send error log to backend API
   */
  private async sendToBackend(errorLog: ErrorLog): Promise<void> {
    try {
      const response = await fetch('/api/logs/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: errorLog.message,
          severity: errorLog.severity,
          context: errorLog.context,
          stack: errorLog.stack,
          componentStack: errorLog.componentStack,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send error log to backend');
      }
    } catch (error) {
      // Silently fail - we don't want error logging to cause more errors
      console.error('Error sending log to backend:', error);
    }
  }

  /**
   * Map our severity levels to Sentry levels
   */
  private mapSeverityToSentryLevel(severity: ErrorSeverity): string {
    const mapping: Record<ErrorSeverity, string> = {
      [ErrorSeverity.LOW]: 'info',
      [ErrorSeverity.MEDIUM]: 'warning',
      [ErrorSeverity.HIGH]: 'error',
      [ErrorSeverity.CRITICAL]: 'fatal',
    };
    return mapping[severity];
  }
}

// Export singleton instance
export const errorLogger = new ErrorLoggerService();

/**
 * Utility function for easy error logging
 */
export function logError(
  error: Error,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  context?: ErrorContext
): void {
  errorLogger.logError(error, severity, context);
}

/**
 * Create error from unknown type
 */
export function createError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  return new Error('An unknown error occurred');
}
