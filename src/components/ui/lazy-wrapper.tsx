/**
 * Lazy Wrapper Component - Enables code splitting with loading states and error boundaries
 */

'use client'

import React, { Suspense } from 'react'
import { ErrorBoundary } from './error-boundary'
import { Loader2 } from 'lucide-react'

interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  errorFallback?: React.ComponentType<{ error?: Error; retry: () => void }>
  className?: string
}

/**
 * Default loading fallback
 */
function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  )
}

/**
 * Wrapper component that provides code splitting capabilities with proper loading and error states
 */
export function LazyWrapper({
  children,
  fallback = <DefaultLoadingFallback />,
  errorFallback,
  className,
}: LazyWrapperProps) {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        <div className={className}>{children}</div>
      </Suspense>
    </ErrorBoundary>
  )
}

/**
 * Creates a lazy-loaded component with error boundary
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  options?: {
    fallback?: React.ReactNode
    errorFallback?: React.ComponentType<{ error?: Error; retry: () => void }>
    displayName?: string
  }
) {
  const LazyComponent = React.lazy(importFn)
  
  const WrappedComponent = (props: P) => (
    <LazyWrapper
      fallback={options?.fallback}
      errorFallback={options?.errorFallback}
    >
      <LazyComponent {...(props as any)} />
    </LazyWrapper>
  )
  
  if (options?.displayName) {
    WrappedComponent.displayName = options.displayName
  }
  
  return WrappedComponent
}

/**
 * Loading skeleton components for different UI elements
 */
export const LoadingSkeletons = {
  /**
   * Sidebar loading skeleton
   */
  Sidebar: () => (
    <div className="w-80 border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="mb-3 h-9 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-9 w-full animate-pulse rounded bg-blue-100 dark:bg-blue-900" />
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-8 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      </div>
    </div>
  ),

  /**
   * Chat interface loading skeleton
   */
  Chat: () => (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="flex-1 p-4">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1">
                <div className="mb-2 h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  ),

  /**
   * Settings modal loading skeleton
   */
  Settings: () => (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-lg bg-white dark:bg-gray-900">
            <div className="border-b border-gray-200 p-6 dark:border-gray-700">
              <div className="h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="flex">
              <div className="w-48 border-r border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800">
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-8 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"
                    />
                  ))}
                </div>
              </div>
              <div className="flex-1 p-6">
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-10 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),

  /**
   * Generic card loading skeleton
   */
  Card: ({ count = 1 }: { count?: number }) => (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  ),
}