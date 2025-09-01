/**
 * Error Boundary Component - Prevents error propagation and provides fallback UI
 */

'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './button'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Built-in error reporting for production
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Send to error reporting service in production
      console.error('Application error:', error, errorInfo)
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback

      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} retry={this.retry} />
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="p-8 text-center">
            <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              Application Error
            </h1>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Something went wrong. Please try refreshing the page.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={this.retry}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.reload()
                  }
                }}
                className="rounded bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Refresh Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer font-mono text-sm text-red-600 dark:text-red-400">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-red-600 dark:text-red-400">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({
  error,
  retry,
}: {
  error?: Error
  retry: () => void
}) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/20">
      <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
      <h3 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-200">
        Something went wrong
      </h3>
      <p className="mb-4 text-sm text-red-600 dark:text-red-300">
        An error occurred while rendering this component.
      </p>
      {error && process.env.NODE_ENV === 'development' && (
        <details className="mb-4 max-w-md">
          <summary className="cursor-pointer text-sm font-medium text-red-700 dark:text-red-200">
            Error Details
          </summary>
          <pre className="mt-2 whitespace-pre-wrap text-xs text-red-600 dark:text-red-300">
            {error.message}
          </pre>
        </details>
      )}
      <Button
        onClick={retry}
        variant="outline"
        size="sm"
        className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/20"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  )
}

/**
 * React Error Boundary wrapper with better TypeScript support
 */
export function ErrorBoundary({
  children,
  fallback,
  onError,
}: ErrorBoundaryProps) {
  return (
    <ErrorBoundaryClass fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundaryClass>
  )
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ErrorBoundaryProps['fallback']
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}
