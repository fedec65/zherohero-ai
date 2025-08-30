'use client'

import React, { memo, useCallback, useMemo } from 'react'
import {
  Settings,
  Zap,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
} from 'lucide-react'
import Image from 'next/image'
import { clsx } from 'clsx'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import type { Model, CustomModel, AIProvider } from '../../lib/stores/types'
import { useModelTest, useModelTestResults } from '../../lib/stores/hooks'
import { withPerformanceMonitor } from '../dev/performance-monitor'

interface ModelCardProps {
  model: Model | CustomModel
  onConfigure?: (model: Model | CustomModel) => void
  onSelect?: (provider: AIProvider, modelId: string) => void
  onDelete?: (model: CustomModel) => void
  onEdit?: (model: CustomModel) => void
  selected?: boolean
}

// Provider logos mapping
const providerLogos: Record<AIProvider, string> = {
  openai: '/logos/openai.svg',
  anthropic: '/logos/anthropic.svg',
  gemini: '/logos/gemini.svg',
  xai: '/logos/xai.svg',
  deepseek: '/logos/deepseek.svg',
  openrouter: '/logos/openrouter.svg',
  custom: '/logos/custom.svg',
  tavily: '/logos/tavily.svg',
}

// Provider colors for fallback
const providerColors: Record<AIProvider, string> = {
  openai: 'bg-green-500',
  anthropic: 'bg-orange-500',
  gemini: 'bg-blue-500',
  xai: 'bg-black dark:bg-white',
  deepseek: 'bg-purple-500',
  openrouter: 'bg-indigo-500',
  custom: 'bg-gray-500',
  tavily: 'bg-teal-500',
}

const ProviderLogo = memo(({ provider }: { provider: AIProvider }) => {
  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      // Fallback to colored circle with letter if image fails to load
      const target = e.target as HTMLElement
      target.style.display = 'none'
      const fallback = target.nextElementSibling as HTMLElement
      if (fallback) fallback.style.display = 'flex'
    },
    []
  )

  return (
    <div className="relative h-8 w-8">
      <Image
        src={providerLogos[provider]}
        alt={`${provider} logo`}
        width={32}
        height={32}
        className="rounded-full"
        onError={handleImageError}
      />
      <div
        className={clsx(
          'hidden h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white',
          providerColors[provider]
        )}
      >
        {provider.charAt(0).toUpperCase()}
      </div>
    </div>
  )
})

ProviderLogo.displayName = 'ProviderLogo'

const capabilityIcons: Record<string, React.ReactNode> = {
  'text-generation': '💬',
  'code-generation': '💻',
  'image-understanding': '🖼️',
  'function-calling': '⚡',
  'json-mode': '📋',
  streaming: '🌊',
}

const ModelCapabilities = memo(
  ({ capabilities }: { capabilities: string[] }) => {
    const displayCapabilities = useMemo(
      () => capabilities.slice(0, 3),
      [capabilities]
    )

    return (
      <div className="mt-2 flex items-center gap-1">
        {displayCapabilities.map((capability) => (
          <span
            key={capability}
            className="text-xs"
            title={capability
              .replace('-', ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase())}
          >
            {capabilityIcons[capability] || '⚙️'}
          </span>
        ))}
        {capabilities.length > 3 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            +{capabilities.length - 3}
          </span>
        )}
      </div>
    )
  }
)

ModelCapabilities.displayName = 'ModelCapabilities'

const ModelCard = memo(
  ({
    model,
    onConfigure,
    onSelect,
    onDelete,
    onEdit,
    selected = false,
  }: ModelCardProps) => {
    // Use optimized hooks for better performance
    const { formatContextWindow } = useModelTestResults()
    const { testResult } = useModelTest(model.provider, model.id)

    const handleConfigure = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        onConfigure?.(model)
      },
      [onConfigure, model]
    )

    const handleDelete = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        if (model.provider === 'custom') {
          onDelete?.(model as CustomModel)
        }
      },
      [onDelete, model]
    )

    const handleEdit = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        if (model.provider === 'custom') {
          onEdit?.(model as CustomModel)
        }
      },
      [onEdit, model]
    )

    const handleSelect = useCallback(() => {
      onSelect?.(model.provider, model.id)
    }, [onSelect, model.provider, model.id])

    const contextWindowText = useMemo(
      () => formatContextWindow(model.contextWindow),
      [formatContextWindow, model.contextWindow]
    )

    const maxTokensText = useMemo(
      () =>
        model.maxTokens ? formatContextWindow(model.maxTokens) : 'Variable',
      [formatContextWindow, model.maxTokens]
    )

    const cardClassName = useMemo(
      () =>
        clsx(
          'bg-white dark:bg-gray-800 border rounded-lg p-5 transition-all duration-300 ease-out group relative overflow-hidden',
          'hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/30',
          'hover:-translate-y-1 hover:scale-[1.02]',
          selected
            ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20 dark:ring-blue-400/20 shadow-lg shadow-blue-100 dark:shadow-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
          'cursor-pointer'
        ),
      [selected]
    )

    return (
      <div className={cardClassName} onClick={handleSelect}>
        {/* Subtle background gradient on hover */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-50/0 to-purple-50/0 transition-all duration-300 group-hover:from-blue-50/30 group-hover:to-purple-50/30 dark:group-hover:from-blue-900/10 dark:group-hover:to-purple-900/10" />

        {/* Content wrapper for relative positioning */}
        <div className="relative z-10">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <ProviderLogo provider={model.provider} />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold leading-tight text-gray-900 transition-colors duration-200 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                    {model.name}
                  </h3>

                  <div className="flex flex-shrink-0 items-center gap-1">
                    {model.provider === 'custom' && (
                      <Badge variant="custom" size="sm">
                        Custom
                      </Badge>
                    )}
                    {model.isNew && (
                      <Badge variant="new" size="sm">
                        New
                      </Badge>
                    )}
                    {model.isDeprecated && (
                      <Badge variant="secondary" size="sm">
                        Legacy
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Context:{' '}
                    <span className="text-blue-600 dark:text-blue-400">
                      {contextWindowText}
                    </span>
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Max output:{' '}
                    <span className="text-gray-700 dark:text-gray-300">
                      {maxTokensText}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Test Status */}
          {testResult && (
            <div className="mb-3">
              {testResult.loading ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-transparent dark:border-gray-600" />
                  Testing...
                </div>
              ) : testResult.error ? (
                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  Test failed
                </div>
              ) : testResult.data ? (
                <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3 w-3" />
                  {testResult.data.latency}ms
                  {testResult.data.success && <Zap className="h-3 w-3" />}
                </div>
              ) : null}
            </div>
          )}

          {/* Capabilities */}
          {'capabilities' in model && (
            <ModelCapabilities capabilities={model.capabilities} />
          )}

          {/* Pricing */}
          {model.pricing && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              ${model.pricing.input.toFixed(3)}/$
              {model.pricing.output.toFixed(3)} per 1K tokens
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
            {model.provider === 'custom' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="h-8 px-2 text-xs"
                  leftIcon={<Edit className="h-3 w-3" />}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 px-2 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  leftIcon={<Trash2 className="h-3 w-3" />}
                >
                  Delete
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleConfigure}
              className="group/btn h-8 px-3 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
              leftIcon={
                <Settings className="h-3 w-3 transition-transform duration-200 group-hover/btn:rotate-45" />
              }
            >
              Configure
            </Button>
          </div>
        </div>
      </div>
    )
  }
)

ModelCard.displayName = 'ModelCard'

// Export with performance monitoring in development
const ModelCardWithMonitoring =
  process.env.NODE_ENV === 'development'
    ? withPerformanceMonitor(ModelCard, 'ModelCard')
    : ModelCard

export { ModelCardWithMonitoring as ModelCard }
