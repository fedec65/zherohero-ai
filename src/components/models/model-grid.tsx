'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Search, Grid3X3, List } from 'lucide-react';
import { clsx } from 'clsx';
import { ModelCard } from './model-card';
import { ModelConfigDialog } from './model-config-dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dropdown } from '../ui/dropdown';
import type { Model, CustomModel, AIProvider } from '../../../lib/stores/types';
import { 
  useOptimizedModelGrid, 
  useModelGridActions, 
  useModelSelection 
} from '../../../lib/stores/hooks';
import { PerformanceMonitor } from '../dev/performance-monitor';

interface ModelGridProps {
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'provider' | 'context' | 'newest';

const providerLabels: Record<AIProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  xai: 'xAI',
  deepseek: 'DeepSeek',
  custom: 'Custom Models',
};

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'provider', label: 'Provider' },
  { value: 'context', label: 'Context Window' },
  { value: 'newest', label: 'Newest First' },
];

export function ModelGrid({ className }: ModelGridProps) {
  // Use optimized hooks for better performance
  const {
    models,
    customModels,
    activeTab,
    searchQuery,
    selectedProvider,
  } = useOptimizedModelGrid();

  const { selectedModel } = useModelSelection();
  
  const {
    setSearchQuery,
    setSelectedProvider,
    setSelectedModel,
    getFilteredModels,
    getAvailableProviders,
  } = useModelGridActions();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('provider');
  const [configDialogModel, setConfigDialogModel] = useState<Model | CustomModel | null>(null);

  // Memoize filtered models computation
  const allModels = useMemo(() => {
    const result: Array<Model | CustomModel> = [];
    
    if (activeTab === 'builtin') {
      const filteredModels = getFilteredModels();
      Object.values(filteredModels).forEach((models) => {
        result.push(...models);
      });
    } else if (activeTab === 'custom') {
      const searchLower = searchQuery.toLowerCase();
      const filtered = customModels.filter(model =>
        model.name.toLowerCase().includes(searchLower) ||
        model.id.toLowerCase().includes(searchLower)
      );
      result.push(...filtered);
    }
    
    return result;
  }, [activeTab, getFilteredModels, customModels, searchQuery]);

  // Memoize sorted models
  const sortedModels = useMemo(() => {
    return [...allModels].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'provider':
          return a.provider.localeCompare(b.provider);
        case 'context':
          return b.contextWindow - a.contextWindow;
        case 'newest':
          return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        default:
          return 0;
      }
    });
  }, [allModels, sortBy]);

  // Memoize grouped models by provider
  const modelsByProvider = useMemo(() => {
    return sortedModels.reduce((acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    }, {} as Record<AIProvider, Array<Model | CustomModel>>);
  }, [sortedModels]);

  // Memoize provider options
  const providerOptions = useMemo(() => {
    const availableProviders = getAvailableProviders();
    return [
      { value: 'all', label: 'All Providers' },
      ...availableProviders.map(provider => ({
        value: provider,
        label: providerLabels[provider] || provider,
      })),
    ];
  }, [getAvailableProviders]);

  // Memoize event handlers to prevent child re-renders
  const handleModelSelect = useCallback((provider: AIProvider, modelId: string) => {
    setSelectedModel(provider, modelId);
  }, [setSelectedModel]);

  const handleModelConfigure = useCallback((model: Model | CustomModel) => {
    setConfigDialogModel(model);
  }, []);

  const handleCloseConfigDialog = useCallback(() => {
    setConfigDialogModel(null);
  }, []);

  // Memoize selection check to prevent recalculation on every render
  const isModelSelected = useCallback((provider: AIProvider, modelId: string) => {
    return selectedModel?.provider === provider && selectedModel?.modelId === modelId;
  }, [selectedModel]);

  // Memoize search input handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, [setSearchQuery]);

  // Memoize provider filter change
  const handleProviderChange = useCallback((value: string) => {
    setSelectedProvider(value as AIProvider | 'all');
  }, [setSelectedProvider]);

  // Memoize sort change
  const handleSortChange = useCallback((value: string) => {
    setSortBy(value as SortOption);
  }, []);

  // Memoize view mode toggles
  const handleGridView = useCallback(() => setViewMode('grid'), []);
  const handleListView = useCallback(() => setViewMode('list'), []);

  if (activeTab === 'openrouter') {
    return (
      <div className={clsx('flex flex-col items-center justify-center py-16', className)}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Grid3X3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            OpenRouter Integration
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect with OpenRouter to access hundreds of additional AI models from various providers.
          </p>
          <Button variant="primary">
            Connect OpenRouter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-6', className)}>
      <PerformanceMonitor 
        componentName="ModelGrid" 
        showDetails={process.env.NODE_ENV === 'development'}
      />
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
          
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg">
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
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No models found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {searchQuery 
              ? `No models match "${searchQuery}". Try adjusting your search or filters.`
              : activeTab === 'custom'
                ? 'No custom models added yet. Click "Add Custom Model" to get started.'
                : 'No models available.'
            }
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        activeTab === 'builtin' ? (
          // Group by provider for built-in models
          <div className="space-y-8">
            {Object.entries(modelsByProvider).map(([provider, providerModels]) => {
              if (providerModels.length === 0) return null;
              
              return (
                <div key={provider}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {providerLabels[provider as AIProvider]} 
                      <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                        ({providerModels.length} models)
                      </span>
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {providerModels.map((model) => (
                      <ModelCard
                        key={`${model.provider}-${model.id}`}
                        model={model}
                        selected={isModelSelected(model.provider, model.id)}
                        onSelect={handleModelSelect}
                        onConfigure={handleModelConfigure}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Simple grid for custom models
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedModels.map((model) => (
              <ModelCard
                key={`${model.provider}-${model.id}`}
                model={model}
                selected={isModelSelected(model.provider, model.id)}
                onSelect={handleModelSelect}
                onConfigure={handleModelConfigure}
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
        />
      )}
    </div>
  );
}