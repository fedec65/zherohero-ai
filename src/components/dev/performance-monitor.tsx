'use client'

import React, { useEffect, useState, memo } from 'react'
import { Activity, Clock, Eye, Zap } from 'lucide-react'

interface PerformanceMetrics {
  renderCount: number
  lastRenderTime: number
  totalRenderTime: number
  averageRenderTime: number
  componentName: string
}

interface PerformanceMonitorProps {
  componentName: string
  enabled?: boolean
  showDetails?: boolean
}

const formatTime = (ms: number) => {
  if (ms < 1) return `${(ms * 1000).toFixed(1)}μs`
  if (ms < 1000) return `${ms.toFixed(1)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export const PerformanceMonitor = memo(
  ({
    componentName,
    enabled = process.env.NODE_ENV === 'development',
    showDetails = false,
  }: PerformanceMonitorProps) => {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
      renderCount: 0,
      lastRenderTime: 0,
      totalRenderTime: 0,
      averageRenderTime: 0,
      componentName,
    })

    useEffect(() => {
      if (!enabled) return

      const startTime = performance.now()

      return () => {
        const endTime = performance.now()
        const renderTime = endTime - startTime

        setMetrics((prev) => {
          const newRenderCount = prev.renderCount + 1
          const newTotalTime = prev.totalRenderTime + renderTime

          return {
            ...prev,
            renderCount: newRenderCount,
            lastRenderTime: renderTime,
            totalRenderTime: newTotalTime,
            averageRenderTime: newTotalTime / newRenderCount,
          }
        })
      }
    })

    if (!enabled || !showDetails) return null

    return (
      <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-black/80 p-3 font-mono text-xs text-white">
        <div className="mb-2 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span className="font-semibold">{componentName}</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Eye className="h-3 w-3" />
            <span>Renders: {metrics.renderCount}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>Last: {formatTime(metrics.lastRenderTime)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3" />
            <span>Avg: {formatTime(metrics.averageRenderTime)}</span>
          </div>
        </div>
      </div>
    )
  }
)

PerformanceMonitor.displayName = 'PerformanceMonitor'

// Hook to use performance monitoring in any component
export const usePerformanceMonitor = (componentName: string) => {
  const [renderCount, setRenderCount] = useState(0)
  const [renderTime, setRenderTime] = useState(0)

  useEffect(() => {
    const startTime = performance.now()
    setRenderCount((prev) => prev + 1)

    return () => {
      const endTime = performance.now()
      setRenderTime(endTime - startTime)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Note: Intentionally runs on every render for performance monitoring

  return { renderCount, renderTime }
}

// HOC for wrapping components with performance monitoring
export const withPerformanceMonitor = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const ComponentWithMonitoring = memo((props: P) => {
    const { renderCount, renderTime } = usePerformanceMonitor(
      componentName ||
        WrappedComponent.displayName ||
        WrappedComponent.name ||
        'Component'
    )

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${componentName} rendered ${renderCount} times, last render: ${formatTime(renderTime)}`
      )
    }

    return <WrappedComponent {...props} />
  })

  ComponentWithMonitoring.displayName = `withPerformanceMonitor(${componentName || WrappedComponent.displayName || WrappedComponent.name})`

  return ComponentWithMonitoring
}
