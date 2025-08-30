'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Search, Grid3X3, List, Plus, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import { ModelCard } from './model-card'
import { ModelConfigDialog } from './model-config-dialog'
import { OpenRouterModelCard } from './openrouter-model-card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Dropdown } from '../ui/dropdown'
import { ModelGridSkeleton } from '../ui/skeleton'
import type {
  Model,
  CustomModel,
  OpenRouterModel,
  AIProvider,
} from '../../lib/stores/types'
import {
  useOptimizedModelGrid,
  useModelGridActions,
  useModelSelection,
} from '../../lib/stores/hooks'
import { useModelStore } from '../../lib/stores/model-store'
import { PerformanceMonitor } from '../dev/performance-monitor'

interface ModelGridProps {
  className?: string
}

type ViewMode = 'grid' | 'list'
type SortOption = 'name' | 'provider' | 'context' | 'newest'

const providerLabels: Record<AIProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  xai: 'xAI',
  deepseek: 'DeepSeek',
  openrouter: 'OpenRouter',
  custom: 'Custom Models',
  tavily: 'Tavily Search',
}

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'provider', label: 'Provider' },
  { value: 'context', label: 'Context Window' },
  { value: 'newest', label: 'Newest First' },
]

export function ModelGrid({ className }: ModelGridProps) {
  // Use optimized hooks for better performance
  const { models, customModels, activeTab, searchQuery, selectedProvider } =
    useOptimizedModelGrid()

  const { selectedModel } = useModelSelection()

  const {
    setSearchQuery,
    setSelectedProvider,
    setSelectedModel,
    getFilteredModels,
    getAvailableProviders,
  } = useModelGridActions()

  // Model configuration management
  const {
    updateModelConfig,
    deleteCustomModel,
    // OpenRouter-specific functions
    openRouterModels,
    fetchOpenRouterModels,
    refreshOpenRouterModels,
    getFilteredOpenRouterModels,
    loading,
    testResults,
  } = useModelStore((state) => ({
    updateModelConfig: state.updateModelConfig,
    deleteCustomModel: state.deleteCustomModel,
    openRouterModels: state.openRouterModels,
    fetchOpenRouterModels: state.fetchOpenRouterModels,
    refreshOpenRouterModels: state.refreshOpenRouterModels,
    getFilteredOpenRouterModels: state.getFilteredOpenRouterModels,
    loading: state.loading,
    testResults: state.testResults,
  }))

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('provider')
  const [configDialogModel, setConfigDialogModel] = useState<
    Model | CustomModel | OpenRouterModel | null
  >(null)
  const [editingModel, setEditingModel] = useState<CustomModel | null>(null)

  // Memoize filtered models computation
  const allModels = useMemo(() => {
    const result: Array<Model | CustomModel | OpenRouterModel> = []

    if (activeTab === 'builtin') {
      const filteredModels = getFilteredModels()
      Object.values(filteredModels).forEach((models) => {
        result.push(...models)
      })
    } else if (activeTab === 'custom') {
      const searchLower = searchQuery.toLowerCase()
      const filtered = customModels.filter(
        (model) =>
          model.name.toLowerCase().includes(searchLower) ||
          model.id.toLowerCase().includes(searchLower)
      )
      result.push(...filtered)
    } else if (activeTab === 'openrouter') {
      const filteredOpenRouterModels = getFilteredOpenRouterModels()
      result.push(...filteredOpenRouterModels)
    }

    return result
  }, [
    activeTab,
    getFilteredModels,
    customModels,
    searchQuery,
    getFilteredOpenRouterModels,
  ])

  // Memoize sorted models
  const sortedModels = useMemo(() => {
    return [...allModels].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'provider':
          return a.provider.localeCompare(b.provider)
        case 'context':
          return b.contextWindow - a.contextWindow
        case 'newest':
          return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)
        default:
          return 0
      }
    })
  }, [allModels, sortBy])

  // Memoize grouped models by provider
  const modelsByProvider = useMemo(() => {
    return sortedModels.reduce(
      (acc, model) => {
        if (!acc[model.provider]) {
          acc[model.provider] = []
        }
        acc[model.provider].push(model)
        return acc
      },
      {} as Record<AIProvider, Array<Model | CustomModel>>
    )
  }, [sortedModels])

  // Memoize provider options
  const providerOptions = useMemo(() => {
    const availableProviders = getAvailableProviders()
    return [
      { value: 'all', label: 'All Providers' },
      ...availableProviders.map((provider) => ({
        value: provider,
        label: providerLabels[provider] || provider,
      })),
    ]
  }, [getAvailableProviders])

  // Memoize event handlers to prevent child re-renders
  const handleModelSelect = useCallback(
    (provider: AIProvider, modelId: string) => {
      setSelectedModel(provider, modelId)
    },
    [setSelectedModel]
  )

  const handleModelConfigure = useCallback(
    (model: Model | CustomModel | OpenRouterModel) => {
      setConfigDialogModel(model)
    },
    []
  )

  const handleCloseConfigDialog = useCallback(() => {
    setConfigDialogModel(null)
  }, [])

  const handleDeleteCustomModel = useCallback(
    (model: CustomModel) => {
      if (
        confirm(
          `Are you sure you want to delete "${model.name}"? This action cannot be undone.`
        )
      ) {
        deleteCustomModel(model.id)
      }
    },
    [deleteCustomModel]
  )

  const handleEditCustomModel = useCallback((model: CustomModel) => {
    setEditingModel(model)
    // TODO: Open edit dialog - for now just show configure dialog
    setConfigDialogModel(model)
  }, [])

  const handleConfigSave = useCallback(
    (modelId: string, config: any) => {
      if (!configDialogModel) return
      updateModelConfig(configDialogModel.provider, modelId, config)
    },
    [configDialogModel, updateModelConfig]
  )

  // Memoize selection check to prevent recalculation on every render
  const isModelSelected = useCallback(
    (provider: AIProvider, modelId: string) => {
      return (
        selectedModel?.provider === provider &&
        selectedModel?.modelId === modelId
      )
    },
    [selectedModel]
  )

  // Memoize search input handler
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value)
    },
    [setSearchQuery]
  )

  // Memoize provider filter change
  const handleProviderChange = useCallback(
    (value: string) => {
      setSelectedProvider(value as AIProvider | 'all')
    },
    [setSelectedProvider]
  )

  // Memoize sort change
  const handleSortChange = useCallback((value: string) => {
    setSortBy(value as SortOption)
  }, [])

  // Memoize view mode toggles
  const handleGridView = useCallback(() => setViewMode('grid'), [])
  const handleListView = useCallback(() => setViewMode('list'), [])

  // Effect to fetch OpenRouter models when activeTab changes to 'openrouter'
  React.useEffect(() => {
    if (
      activeTab === 'openrouter' &&
      openRouterModels.length === 0 &&
      !loading.fetchOpenRouterModels
    ) {
      fetchOpenRouterModels().catch((error) => {
        console.error('Failed to fetch OpenRouter models:', error)
        // Error is already handled in the store
      })
    }
  }, [
    activeTab,
    openRouterModels.length,
    loading.fetchOpenRouterModels,
    fetchOpenRouterModels,
  ])

  // Memoize OpenRouter refresh handler
  const handleRefreshOpenRouter = useCallback(async () => {
    try {
      await refreshOpenRouterModels()
    } catch (error) {
      console.error('Failed to refresh OpenRouter models:', error)
      // Error is already handled in the store and will show in UI
    }
  }, [refreshOpenRouterModels])

  // OpenRouter tab rendering
  if (activeTab === 'openrouter') {
    const openRouterError = testResults['openrouter:error']

    // Professional loading state with skeleton
    if (loading.fetchOpenRouterModels) {
      return (
        <div className={clsx('space-y-6', className)}>
          {/* Grid skeleton with staggered animation */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="space-y-4 rounded-xl bg-gray-200 p-5 dark:bg-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-1 items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-600" />
                        <div className="h-3 w-1/2 rounded bg-gray-300 dark:bg-gray-600" />
                      </div>
                    </div>
                    <div className="h-5 w-12 rounded-full bg-gray-300 dark:bg-gray-600" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-gray-300 dark:bg-gray-600" />
                    <div className="h-3 w-2/3 rounded bg-gray-300 dark:bg-gray-600" />
                  </div>
                  <div className="flex justify-end border-t border-gray-300 pt-3 dark:border-gray-600">
                    <div className="h-8 w-20 rounded bg-gray-300 dark:bg-gray-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Professional loading toast */}
          <div className="fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center space-x-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Loading OpenRouter Models
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Discovering hundreds of AI models...
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Error state - show specific error message
    if (openRouterError && openRouterError.error) {
      return (
        <div className={clsx('space-y-6', className)}>
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <ExternalLink className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              OpenRouter Connection Failed
            </h3>
            <p className="mb-6 max-w-md text-center text-gray-600 dark:text-gray-400">
              {openRouterError.error}
            </p>
            <div className="flex gap-3">
              {openRouterError.error.includes('API key') && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => {
                      window.open('https://openrouter.ai/keys', '_blank')
                    }}
                  >
                    Get API Key
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // TODO: Open Settings modal to API Keys tab
                      console.log('Open Settings modal to API Keys tab')
                    }}
                  >
                    Add in Settings
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={handleRefreshOpenRouter}
                disabled={loading.fetchOpenRouterModels}
              >
                {loading.fetchOpenRouterModels ? 'Retrying...' : 'Retry'}
              </Button>
            </div>
          </div>
        </div>
      )
    }

    // No models loaded but no specific error - assume API key missing
    if (
      openRouterModels.length === 0 &&
      !loading.fetchOpenRouterModels &&
      !openRouterError
    ) {
      return (
        <div className={clsx('space-y-6', className)}>
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
              <ExternalLink className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              Connect OpenRouter
            </h3>
            <p className="mb-6 max-w-md text-center text-gray-600 dark:text-gray-400">
              Add your OpenRouter API key in Settings to access hundreds of AI
              models from various providers with competitive pricing.
            </p>
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => {
                  window.open('https://openrouter.ai/keys', '_blank')
                }}
              >
                Get API Key
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // TODO: Open Settings modal to API Keys tab
                  console.log('Open Settings modal to API Keys tab')
                }}
              >
                Add in Settings
              </Button>
              <Button
                variant="outline"
                onClick={handleRefreshOpenRouter}
                disabled={loading.fetchOpenRouterModels}
              >
                {loading.fetchOpenRouterModels ? 'Retrying...' : 'Retry'}
              </Button>
            </div>
          </div>
        </div>
      )
    }

    // Models loaded - render the OpenRouter grid
    return (
      <div className={clsx('space-y-6', className)}>
        <PerformanceMonitor
          componentName="OpenRouterModelGrid"
          showDetails={process.env.NODE_ENV === 'development'}
        />

        {/* Header with refresh */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              OpenRouter Models
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({sortedModels.length} models)
              </span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Access hundreds of AI models with transparent pricing
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshOpenRouter}
            disabled={loading.fetchOpenRouterModels}
          >
            Refresh
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              type="text"
              placeholder="Search OpenRouter models..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Dropdown
              options={providerOptions}
              value={selectedProvider}
              onChange={handleProviderChange}
              triggerClassName="min-w-0"
            />

            <Dropdown
              options={sortOptions}
              value={sortBy}
              onChange={handleSortChange}
              triggerClassName="min-w-0"
            />

            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="iconSm"
                onClick={handleGridView}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="iconSm"
                onClick={handleListView}
                className="rounded-l-none border-l"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Models Grid */}
        {sortedModels.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              No models found
            </h3>
            <p className="mx-auto max-w-md text-gray-600 dark:text-gray-400">
              {searchQuery
                ? `No models match "${searchQuery}". Try adjusting your search or filters.`
                : 'No models available.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedModels.map((model) => (
              <OpenRouterModelCard
                key={model.id}
                model={model as OpenRouterModel}
                selected={isModelSelected('openrouter', model.id)}
                onSelect={handleModelSelect}
                onConfigure={handleModelConfigure}
                showAvailability={true}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedModels.map((model) => (
              <OpenRouterModelCard
                key={model.id}
                model={model as OpenRouterModel}
                selected={isModelSelected('openrouter', model.id)}
                onSelect={handleModelSelect}
                onConfigure={handleModelConfigure}
                showAvailability={true}
                className="w-full"
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={clsx('space-y-6', className)}>
      <PerformanceMonitor
        componentName="ModelGrid"
        showDetails={process.env.NODE_ENV === 'development'}
      />
      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            type="text"
            placeholder="Search models..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'builtin' && (
            <Dropdown
              options={providerOptions}
              value={selectedProvider}
              onChange={handleProviderChange}
              triggerClassName="min-w-0"
            />
          )}

          <Dropdown
            options={sortOptions}
            value={sortBy}
            onChange={handleSortChange}
            triggerClassName="min-w-0"
          />

          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="iconSm"
              onClick={handleGridView}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="iconSm"
              onClick={handleListView}
              className="rounded-l-none border-l"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Models Display */}
      {sortedModels.length === 0 ? (
        activeTab === 'custom' && !searchQuery ? (
          // Custom Models Empty State
          <div className="py-20 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Grid3X3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
              No Custom Models Yet
            </h3>
            <p className="mx-auto mb-8 max-w-lg leading-relaxed text-gray-600 dark:text-gray-400">
              Add custom models to use local LLMs or other AI providers with
              MindDeck.
            </p>
            <button
              onClick={() => {
                // Trigger the Add Custom Model dialog
                const addButton = document.querySelector(
                  '[data-add-custom-model]'
                ) as HTMLButtonElement
                if (addButton) addButton.click()
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Add Your First Model
            </button>
          </div>
        ) : (
          // Default Empty State
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              No models found
            </h3>
            <p className="mx-auto max-w-md text-gray-600 dark:text-gray-400">
              {searchQuery
                ? `No models match "${searchQuery}". Try adjusting your search or filters.`
                : 'No models available.'}
            </p>
          </div>
        )
      ) : viewMode === 'grid' ? (
        activeTab === 'builtin' ? (
          // Group by provider for built-in models
          <div className="space-y-8">
            {Object.entries(modelsByProvider).map(
              ([provider, providerModels]) => {
                if (providerModels.length === 0) return null

                return (
                  <div key={provider}>
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {providerLabels[provider as AIProvider]}
                        <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                          ({providerModels.length} models)
                        </span>
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {providerModels.map((model) => (
                        <ModelCard
                          key={`${model.provider}-${model.id}`}
                          model={model}
                          selected={isModelSelected(model.provider, model.id)}
                          onSelect={handleModelSelect}
                          onConfigure={handleModelConfigure}
                          onDelete={
                            model.provider === 'custom'
                              ? handleDeleteCustomModel
                              : undefined
                          }
                          onEdit={
                            model.provider === 'custom'
                              ? handleEditCustomModel
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  </div>
                )
              }
            )}
          </div>
        ) : (
          // Simple grid for custom models
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedModels.map((model) => (
              <ModelCard
                key={`${model.provider}-${model.id}`}
                model={model}
                selected={isModelSelected(model.provider, model.id)}
                onSelect={handleModelSelect}
                onConfigure={handleModelConfigure}
                onDelete={
                  model.provider === 'custom'
                    ? handleDeleteCustomModel
                    : undefined
                }
                onEdit={
                  model.provider === 'custom'
                    ? handleEditCustomModel
                    : undefined
                }
              />
            ))}
          </div>
        )
      ) : (
        // List view
        <div className="space-y-2">
          {sortedModels.map((model) => (
            <ModelCard
              key={`${model.provider}-${model.id}`}
              model={model}
              selected={isModelSelected(model.provider, model.id)}
              onSelect={handleModelSelect}
              onConfigure={handleModelConfigure}
              onDelete={
                model.provider === 'custom'
                  ? handleDeleteCustomModel
                  : undefined
              }
              onEdit={
                model.provider === 'custom' ? handleEditCustomModel : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Configuration Dialog */}
      {configDialogModel && (
        <ModelConfigDialog
          model={configDialogModel}
          open={!!configDialogModel}
          onOpenChange={handleCloseConfigDialog}
          onConfigSave={handleConfigSave}
        />
      )}
    </div>
  )
}
