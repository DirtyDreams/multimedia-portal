"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { errorLogger, ErrorSeverity } from "@/lib/error-logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    errorLogger.logComponentError(
      error,
      this.props.componentName || 'UnknownComponent',
      errorInfo.componentStack || undefined
    );

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Store error info in state
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
                </div>
                <div>
                  <CardTitle>Something went wrong</CardTitle>
                  <CardDescription>
                    An unexpected error occurred in this component.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error message */}
              {this.state.error && (
                <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800 space-y-2">
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Error Message:
                  </p>
                  <p className="text-sm font-mono text-zinc-600 dark:text-zinc-400 break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {/* Stack trace (development only) */}
              {isDevelopment && this.state.error?.stack && (
                <details className="rounded-lg bg-zinc-900 dark:bg-zinc-800 p-4">
                  <summary className="text-sm font-semibold text-zinc-100 cursor-pointer hover:text-zinc-300">
                    Stack Trace (Development)
                  </summary>
                  <pre className="text-xs text-zinc-400 font-mono mt-2 overflow-x-auto">
                    <code>{this.state.error.stack}</code>
                  </pre>
                </details>
              )}

              {/* Component stack (development only) */}
              {isDevelopment && this.state.errorInfo?.componentStack && (
                <details className="rounded-lg bg-zinc-900 dark:bg-zinc-800 p-4">
                  <summary className="text-sm font-semibold text-zinc-100 cursor-pointer hover:text-zinc-300">
                    Component Stack (Development)
                  </summary>
                  <pre className="text-xs text-zinc-400 font-mono mt-2 overflow-x-auto">
                    <code>{this.state.errorInfo.componentStack}</code>
                  </pre>
                </details>
              )}

              {/* Retry information */}
              {this.state.retryCount > 0 && (
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 p-3">
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">
                    Retry attempt: {this.state.retryCount}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Reload Page
                </Button>
              </div>

              <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
                If the problem persists, please contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
