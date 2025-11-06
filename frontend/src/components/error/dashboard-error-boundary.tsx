"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import { errorLogger } from "@/lib/error-logger";
import Link from "next/link";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Specialized error boundary for dashboard/admin sections
 */
export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorLogger.logComponentError(error, 'DashboardSection', errorInfo.componentStack || undefined);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
                </div>
                <div>
                  <CardTitle>Dashboard Error</CardTitle>
                  <CardDescription>
                    Something went wrong in the admin panel.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
                  <p className="text-sm font-mono text-zinc-600 dark:text-zinc-400">
                    {this.state.error.message}
                  </p>
                </div>
              )}
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
                  asChild
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Link href="/dashboard">
                    <Home className="h-4 w-4" />
                    Dashboard Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
