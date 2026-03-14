"use client";

import { Component, ReactNode } from "react";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/sentry-client";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** A human-readable label for the section (shown in fallback UI) */
  section?: string;
  /** Compact mode renders inline instead of full-page */
  compact?: boolean;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const section = this.props.section || "unknown";
    // Log error to monitoring service with structured data
    logger.error("Error boundary caught an error", {
      type: "error_boundary",
      section,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Report to Sentry on the client side
    captureException(error, {
      section,
      componentStack: errorInfo.componentStack,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI or default
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Compact mode for dashboard sections
      if (this.props.compact) {
        return (
          <SectionErrorFallback
            section={this.props.section}
            error={this.state.error ?? undefined}
            onRetry={this.handleRetry}
          />
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 text-center mb-6">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 p-4 bg-gray-100 rounded text-sm">
                <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs text-red-600 overflow-auto">
                  {this.state.error.message}
                  {"\n\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full mt-4 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback Component
 */
export function ErrorFallback({ error, reset }: { error?: Error; reset?: () => void }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Oops! Something went wrong
        </h3>
        <p className="text-gray-600 mb-4">
          {error?.message || "An unexpected error occurred"}
        </p>
        {reset && (
          <button
            onClick={reset}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Compact error fallback for dashboard sections.
 * Renders inline (not full-page) with a retry button that resets the boundary.
 */
export function SectionErrorFallback({
  section,
  error,
  onRetry,
}: {
  section?: string;
  error?: Error;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <div className="flex items-center justify-center w-10 h-10 mx-auto bg-red-100 rounded-full mb-3">
        <svg
          className="w-5 h-5 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-red-800 mb-1">
        {section ? `Failed to load ${section}` : "Something went wrong"}
      </h3>
      <p className="text-xs text-red-600 mb-3">
        This section encountered an error. Other parts of the page are unaffected.
      </p>
      {process.env.NODE_ENV === "development" && error && (
        <p className="text-xs font-mono text-red-500 mb-3 break-all">
          {error.message}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm bg-red-600 text-white px-4 py-1.5 rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Convenience wrapper for wrapping dashboard sections with error isolation.
 * Uses compact mode by default so failures don't take over the whole page.
 *
 * @example
 * ```tsx
 * <DashboardErrorBoundary section="Schedule">
 *   <SchedulePanel />
 * </DashboardErrorBoundary>
 *
 * <DashboardErrorBoundary section="Analytics">
 *   <AnalyticsWidget />
 * </DashboardErrorBoundary>
 * ```
 */
export function DashboardErrorBoundary({
  section,
  children,
}: {
  section: string;
  children: ReactNode;
}) {
  return (
    <ErrorBoundary section={section} compact>
      {children}
    </ErrorBoundary>
  );
}
