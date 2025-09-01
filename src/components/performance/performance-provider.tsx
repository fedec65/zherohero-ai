/**
 * Performance Provider - Wraps the app with performance monitoring capabilities
 */

'use client'

import React, { useEffect } from 'react'
import { PerformanceDebugger } from '../../lib/performance/monitoring'

interface PerformanceProviderProps {
  children: React.ReactNode
  enableDebugging?: boolean
}

export function PerformanceProvider({
  children,
  enableDebugging = process.env.NODE_ENV === 'development',
}: PerformanceProviderProps) {
  useEffect(() => {
    if (!enableDebugging) return

    // Log initial performance metrics
    console.log('[Performance] Performance monitoring enabled')

    // Set up performance observers
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Observe long tasks (> 50ms)
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          console.warn(
            `[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`,
            entry
          )
        })
      })

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] })
      } catch (error) {
        // Long task API might not be supported
        console.warn('[Performance] Long task observer not supported:', error)
      }

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          console.log(
            `[Performance] LCP: ${entry.startTime.toFixed(2)}ms`,
            entry
          )
        })
      })

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (error) {
        console.warn('[Performance] LCP observer not supported:', error)
      }

      // Cleanup on unmount
      return () => {
        longTaskObserver.disconnect()
        lcpObserver.disconnect()
      }
    }
  }, [enableDebugging])

  return (
    <>
      {children}
      {enableDebugging && <PerformanceDebugger />}
    </>
  )
}
