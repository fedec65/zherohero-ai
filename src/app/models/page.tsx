'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ModelsLayout } from '../../components/layout'
import { LoadingSkeletons } from '../../components/ui/lazy-wrapper'
import { PerformanceProvider } from '../../components/performance/performance-provider'
import { Button } from '../../components/ui/button'
import { Activity } from 'lucide-react'
import { useRenderPerformance } from '../../lib/performance/monitoring'

// Lazy load components to reduce initial bundle size
const ModelTabs = dynamic(
  () => import('../../components/models').then(mod => ({ default: mod.ModelTabs })),
  {
    loading: () => <div className="h-10 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />,
    ssr: false,
  }
)

const ModelGrid = dynamic(
  () => import('../../components/models').then(mod => ({ default: mod.ModelGrid })),
  {
    loading: () => <LoadingSkeletons.Card count={6} />,
    ssr: false,
  }
)

const PerformanceReport = dynamic(
  () => import('../../components/dev/performance-report').then(mod => ({ default: mod.PerformanceReport })),
  {
    loading: () => <div>Loading performance report...</div>,
    ssr: false,
  }
)

export default function ModelsPage() {
  const [showPerformanceReport, setShowPerformanceReport] = useState(false)
  const getPerformanceStats = useRenderPerformance('ModelsPage')
  
  return (
    <PerformanceProvider>
      <ModelsLayout>
        <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Model Settings
              </h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Configure parameters for each AI model
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPerformanceReport(true)}
                leftIcon={<Activity className="h-4 w-4" />}
              >
                Performance
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <ModelTabs />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <ModelGrid />
          </div>
        </div>

        {/* Performance Report */}
        <PerformanceReport
          show={showPerformanceReport}
          onClose={() => setShowPerformanceReport(false)}
        />
        </div>
      </ModelsLayout>
    </PerformanceProvider>
  )
}
