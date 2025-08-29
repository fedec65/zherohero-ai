"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-[200px] p-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
              <button
                onClick={() =>
                  this.setState({ hasError: false, error: undefined })
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// API Error Boundary for specific API-related errors
export class APIErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Only catch API-related errors
    if (
      error.message.includes("API") ||
      error.message.includes("fetch") ||
      error.message.includes("network")
    ) {
      return { hasError: true, error };
    }
    throw error; // Re-throw if not an API error
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("APIErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-[200px] p-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 text-red-500">
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Connection Error
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Unable to connect to AI services. Please check your internet
                connection and try again.
              </p>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
