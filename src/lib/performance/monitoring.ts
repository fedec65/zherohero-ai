/**
 * Performance Monitoring - Track React performance metrics and optimize render cycles
 */

import React, { useEffect, useRef, useCallback } from 'react'

// Performance metrics interface
interface PerformanceMetrics {
  componentName: string
  renderTime: number
  renderCount: number
  timestamp: number
}

// Global performance store
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics[]> = new Map()
  private observers: Array<(metrics: PerformanceMetrics) => void> = []

  record(componentName: string, renderTime: number) {
    const metric: PerformanceMetrics = {
      componentName,
      renderTime,
      renderCount: this.getMetrics(componentName).length + 1,
      timestamp: Date.now(),
    }

    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, [])
    }

    this.metrics.get(componentName)!.push(metric)

    // Keep only last 100 measurements per component
    const componentMetrics = this.metrics.get(componentName)!
    if (componentMetrics.length > 100) {
      componentMetrics.shift()
    }

    // Notify observers
    this.observers.forEach((observer) => observer(metric))
  }

  getMetrics(componentName: string): PerformanceMetrics[] {
    return this.metrics.get(componentName) || []
  }

  getAverageRenderTime(componentName: string): number {
    const metrics = this.getMetrics(componentName)
    if (metrics.length === 0) return 0

    const total = metrics.reduce((sum, metric) => sum + metric.renderTime, 0)
    return total / metrics.length
  }

  getSlowComponents(threshold = 16): Array<{ name: string; avgTime: number }> {
    const slowComponents: Array<{ name: string; avgTime: number }> = []

    this.metrics.forEach((metrics, componentName) => {
      const avgTime = this.getAverageRenderTime(componentName)
      if (avgTime > threshold) {
        slowComponents.push({ name: componentName, avgTime })
      }
    })

    return slowComponents.sort((a, b) => b.avgTime - a.avgTime)
  }

  subscribe(observer: (metrics: PerformanceMetrics) => void) {
    this.observers.push(observer)
    return () => {
      const index = this.observers.indexOf(observer)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  clear() {
    this.metrics.clear()
  }

  export() {
    const data: Record<string, any> = {}
    this.metrics.forEach((metrics, componentName) => {
      data[componentName] = {
        metrics,
        averageRenderTime: this.getAverageRenderTime(componentName),
        totalRenders: metrics.length,
      }
    })
    return data
  }
}

export const performanceMonitor = new PerformanceMonitor()

/**
 * Hook to measure component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderStartRef = useRef<number>(0)
  const isInitialRender = useRef(true)

  // Start timing before render
  if (process.env.NODE_ENV === 'development') {
    renderStartRef.current = performance.now()
  }

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const renderTime = performance.now() - renderStartRef.current
      
      // Skip initial render timing as it includes mounting time
      if (!isInitialRender.current) {
        performanceMonitor.record(componentName, renderTime)
      } else {
        isInitialRender.current = false
      }
    }
  })

  return useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      const metrics = performanceMonitor.getMetrics(componentName)
      const avgTime = performanceMonitor.getAverageRenderTime(componentName)
      
      return {
        totalRenders: metrics.length,
        averageRenderTime: avgTime,
        lastRenderTime: metrics[metrics.length - 1]?.renderTime || 0,
        metrics,
      }
    }
    return null
  }, [componentName])
}

/**
 * Hook to detect unnecessary re-renders
 */
export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any>>({})

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (previousProps.current) {
        const allKeys = Object.keys({ ...previousProps.current, ...props })
        const changedProps: Record<string, { from: any; to: any }> = {}

        allKeys.forEach((key) => {
          if (previousProps.current[key] !== props[key]) {
            changedProps[key] = {
              from: previousProps.current[key],
              to: props[key],
            }
          }
        })

        if (Object.keys(changedProps).length > 0) {
          console.log('[WhyDidYouUpdate]', name, changedProps)
        }
      }

      previousProps.current = props
    }
  })
}

/**
 * Hook to track component mount/unmount cycles
 */
export function useComponentLifecycle(componentName: string) {
  const mountTimeRef = useRef<number>(0)

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      mountTimeRef.current = performance.now()
      console.log(`[Lifecycle] ${componentName} mounted`)

      return () => {
        const lifetime = performance.now() - mountTimeRef.current
        console.log(`[Lifecycle] ${componentName} unmounted (lifetime: ${lifetime.toFixed(2)}ms)`)
      }
    }
  }, [componentName])
}

/**
 * Performance debugging component
 */
export function PerformanceDebugger() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const unsubscribe = performanceMonitor.subscribe((metrics) => {
      if (metrics.renderTime > 16) {
        console.warn(
          `[Performance] Slow render detected: ${metrics.componentName} took ${metrics.renderTime.toFixed(2)}ms`
        )
      }
    })

    // Log performance summary every 30 seconds
    const interval = setInterval(() => {
      const slowComponents = performanceMonitor.getSlowComponents()
      if (slowComponents.length > 0) {
        console.group('[Performance Summary] Slow components detected:')
        slowComponents.forEach(({ name, avgTime }) => {
          console.log(`${name}: ${avgTime.toFixed(2)}ms average`)
        })
        console.groupEnd()
      }
    }, 30000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  return null
}

/**
 * Optimized component wrapper that prevents unnecessary re-renders
 */
export const memo = React.memo

/**
 * Bundle size analyzer (development only)
 */
export function analyzeBundleSize() {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
    return
  }

  // Estimate component bundle impact
  const scripts = Array.from(document.querySelectorAll('script'))
  const totalSize = scripts.reduce((size, script) => {
    if (script.src && script.src.includes('_next/static')) {
      // Rough estimation - in practice you'd want to use a proper bundle analyzer
      return size + (script.innerHTML?.length || 0)
    }
    return size
  }, 0)

  console.log(`[Bundle Analysis] Estimated total bundle size: ${(totalSize / 1024).toFixed(2)}KB`)
}

/**
 * Memory usage tracker hook
 */
export function useTrackMemoryUsage(componentName: string) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
      return
    }

    if ('memory' in performance) {
      const memory = (performance as any).memory
      console.log(`[Memory] ${componentName} - Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`)
    }
  }, [componentName])
}

/**
 * Memory usage tracker (non-hook version)
 */
export function trackMemoryUsage(componentName: string) {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
    return
  }

  if ('memory' in performance) {
    const memory = (performance as any).memory
    console.log(`[Memory] ${componentName} - Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`)
  }
}