"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import { errorLogger, ErrorSeverity } from "@/lib/error-logger";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error tracking service
    errorLogger.logError(error, ErrorSeverity.CRITICAL, {
      type: 'global',
      digest: error.digest,
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
    });
  }, [error]);

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-500" />
            </div>
            <div>
              <CardTitle className="text-2xl">Something went wrong!</CardTitle>
              <CardDescription className="text-base mt-1">
                We encountered an unexpected error. Don't worry, our team has been notified.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error details (development only) */}
          {isDevelopment && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Error Details (Development Only):
              </p>
              <div className="rounded-lg bg-zinc-900 dark:bg-zinc-800 p-4 overflow-x-auto">
                <pre className="text-xs text-zinc-100 dark:text-zinc-300 font-mono">
                  <code>{error.message}</code>
                </pre>
                {error.stack && (
                  <pre className="text-xs text-zinc-400 dark:text-zinc-500 font-mono mt-2">
                    <code>{error.stack.split('\n').slice(0, 5).join('\n')}</code>
                  </pre>
                )}
              </div>
              {error.digest && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* User-friendly message */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>What can you do?</strong>
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 list-disc list-inside">
              <li>Try refreshing the page</li>
              <li>Clear your browser cache and cookies</li>
              <li>Check your internet connection</li>
              <li>Try again in a few minutes</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2"
              size="lg"
            >
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              asChild
              className="flex-1 flex items-center justify-center gap-2"
              size="lg"
            >
              <Link href="/">
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>

          {/* Support link */}
          <div className="text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              If the problem persists, please{' '}
              <Link
                href="/contact"
                className="text-primary hover:underline font-medium"
              >
                contact our support team
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
