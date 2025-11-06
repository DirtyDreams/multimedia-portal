"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { errorLogger } from "@/lib/error-logger";
import Link from "next/link";

interface Props {
  children: ReactNode;
  contentType?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Specialized error boundary for content pages (articles, blog, wiki, etc.)
 */
export class ContentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorLogger.logComponentError(
      error,
      `Content-${this.props.contentType || 'Unknown'}`,
      errorInfo.componentStack || undefined
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Unable to load content</h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                There was an error loading this {this.props.contentType || 'content'}.
              </p>
            </div>
            {this.state.error && (
              <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800 max-w-md mx-auto">
                <p className="text-sm font-mono text-zinc-600 dark:text-zinc-400">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
              <Button variant="outline" asChild>
                <Link href="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
