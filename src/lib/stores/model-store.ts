/**
 * Model Store - Manages AI models, configurations, and provider settings
 */

import { createWithEqualityFn } from 'zustand/traditional'
import { subscribeWithSelector } from 'zustand/middleware'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import {
  Model,
  ModelConfig,
  CustomModel,
  OpenRouterModel,
  AIProvider,
  AsyncState,
  Patch,
} from './types'
import {
  createStorage,
  createAutoPartializer,
  PersistOptions,
} from './middleware/persistence'
import { nanoid } from 'nanoid'
import OpenRouterClient, {
  convertOpenRouterModel,
  type OpenRouterModel as OpenRouterAPIModel,
} from '../api/openrouter'

// Default model configurations
const DEFAULT_MODEL_CONFIG: ModelConfig = {
  temperature: 0.7,
  topP: 1.0,
  frequencyPenalty: 0,
  presencePenalty: 0,
  maxTokens: undefined,
  systemPrompt: '',
  stopSequences: [],
}

// Built-in models data - Complete list of 44 models from MindDeck
const BUILT_IN_MODELS: Record<AIProvider, Model[]> = {
  openai: [
    // GPT-5 Series (New)
    {
      id: 'gpt-5-large',
      name: 'GPT-5 Large',
      provider: 'openai',
      contextWindow: 512000,
      maxTokens: 16384,
      capabilities: [
        'text-generation',
        'code-generation',
        'function-calling',
        'json-mode',
      ],
      isNew: true,
    },
    {
      id: 'gpt-5-medium',
      name: 'GPT-5 Medium',
      provider: 'openai',
      contextWindow: 256000,
      maxTokens: 16384,
      capabilities: [
        'text-generation',
        'code-generation',
        'function-calling',
        'json-mode',
      ],
      isNew: true,
    },
    {
      id: 'gpt-5-small',
      name: 'GPT-5 Small',
      provider: 'openai',
      contextWindow: 128000,
      maxTokens: 8192,
      capabilities: ['text-generation', 'code-generation', 'function-calling'],
      isNew: true,
    },
    // O-Series Models
    {
      id: 'o1-preview',
      name: 'o1-preview',
      provider: 'openai',
      contextWindow: 128000,
      maxTokens: 32768,
      capabilities: ['text-generation', 'code-generation'],
    },
    {
      id: 'o1-mini',
      name: 'o1-mini',
      provider: 'openai',
      contextWindow: 128000,
      maxTokens: 65536,
      capabilities: ['text-generation', 'code-generation'],
    },
    {
      id: 'o3-mini',
      name: 'o3-mini',
      provider: 'openai',
      contextWindow: 128000,
      maxTokens: 65536,
      capabilities: ['text-generation', 'code-generation'],
    },
    // GPT-4.1 Series
    {
      id: 'gpt-4.1-turbo',
      name: 'GPT-4.1 Turbo',
      provider: 'openai',
      contextWindow: 128000,
      maxTokens: 4096,
      capabilities: [
        'text-generation',
        'code-generation',
        'function-calling',
        'json-mode',
      ],
    },
    {
      id: 'gpt-4.1',
      name: 'GPT-4.1',
      provider: 'openai',
      contextWindow: 128000,
      maxTokens: 8192,
      capabilities: [
        'text-generation',
        'code-generation',
        'function-calling',
        'json-mode',
      ],
    },
    // GPT-4o Series
    {
      id: 'gpt-4o-2024-11-20',
      name: 'GPT-4o (Nov 2024)',
      provider: 'openai',
      contextWindow: 128000,
      maxTokens: 16384,
      capabilities: [
        'text-generation',
        'image-understanding',
        'function-calling',
        'json-mode',
      ],
    },
    {
      id: 'gpt-4o-2024-08-06',
      name: 'GPT-4o (Aug 2024)',
      provider: 'openai',
      contextWindow: 128000,
      maxTokens: 16384,
      capabilities: [
        'text-generation',
        'image-understanding',
        'function-calling',
        'json-mode',
      ],
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o mini',
      provider: 'openai',
      contextWindow: 128000,
      maxTokens: 16384,
      capabilities: [
        'text-generation',
        'image-understanding',
        'function-calling',
        'json-mode',
      ],
    },
    {
      id: 'gpt-4o-audio-preview',
      name: 'GPT-4o Audio Preview',
      provider: 'openai',
      contextWindow: 128000,
      maxTokens: 16384,
      capabilities: [
        'text-generation',
        'image-understanding',
        'function-calling',
      ],
    },
    // Legacy GPT-4
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      contextWindow: 128000,
      maxTokens: 4096,
      capabilities: [
        'text-generation',
        'image-understanding',
        'function-calling',
      ],
      isDeprecated: true,
    },
    {
      id: 'gpt-4-turbo-preview',
      name: 'GPT-4 Turbo Preview',
      provider: 'openai',
      contextWindow: 128000,
      maxTokens: 4096,
      capabilities: ['text-generation', 'function-calling'],
      isDeprecated: true,
    },
    {
      id: 'gpt-4-vision-preview',
      name: 'GPT-4 Vision Preview',
      provider: 'openai',
      contextWindow: 128000,
      maxTokens: 4096,
      capabilities: ['text-generation', 'image-understanding'],
      isDeprecated: true,
    },
    {
      id: 'gpt-4-1106-preview',
      name: 'GPT-4 (Nov 2023)',
      provider: 'openai',
      contextWindow: 128000,
      maxTokens: 4096,
      capabilities: ['text-generation', 'function-calling'],
      isDeprecated: true,
    },
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      contextWindow: 8192,
      maxTokens: 4096,
      capabilities: ['text-generation', 'function-calling'],
      isDeprecated: true,
    },
    {
      id: 'gpt-4-32k',
      name: 'GPT-4 32K',
      provider: 'openai',
      contextWindow: 32768,
      maxTokens: 4096,
      capabilities: ['text-generation', 'function-calling'],
      isDeprecated: true,
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      contextWindow: 16385,
      maxTokens: 4096,
      capabilities: ['text-generation', 'function-calling'],
      isDeprecated: true,
    },
    // Codex Mini
    {
      id: 'codex-mini',
      name: 'Codex Mini',
      provider: 'openai',
      contextWindow: 8192,
      maxTokens: 1024,
      capabilities: ['code-generation'],
      isDeprecated: true,
    },
    // GPT-3.5 variants
    {
      id: 'gpt-3.5-turbo-16k',
      name: 'GPT-3.5 Turbo 16K',
      provider: 'openai',
      contextWindow: 16385,
      maxTokens: 4096,
      capabilities: ['text-generation', 'function-calling'],
      isDeprecated: true,
    },
    {
      id: 'gpt-3.5-turbo-instruct',
      name: 'GPT-3.5 Turbo Instruct',
      provider: 'openai',
      contextWindow: 4097,
      maxTokens: 4096,
      capabilities: ['text-generation'],
      isDeprecated: true,
    },
  ],
  anthropic: [
    // Claude Opus 4.1 (New)
    {
      id: 'claude-4.1-opus',
      name: 'Claude Opus 4.1',
      provider: 'anthropic',
      contextWindow: 200000,
      maxTokens: 8192,
      capabilities: [
        'text-generation',
        'code-generation',
        'image-understanding',
      ],
      isNew: true,
    },
    // Claude 4 Series
    {
      id: 'claude-4-sonnet',
      name: 'Claude 4 Sonnet',
      provider: 'anthropic',
      contextWindow: 200000,
      maxTokens: 8192,
      capabilities: [
        'text-generation',
        'code-generation',
        'image-understanding',
      ],
    },
    {
      id: 'claude-4-haiku',
      name: 'Claude 4 Haiku',
      provider: 'anthropic',
      contextWindow: 200000,
      maxTokens: 8192,
      capabilities: ['text-generation', 'code-generation'],
    },
    // Claude 3.7/3.5 Sonnet
    {
      id: 'claude-3-7-sonnet',
      name: 'Claude 3.7 Sonnet',
      provider: 'anthropic',
      contextWindow: 200000,
      maxTokens: 8192,
      capabilities: [
        'text-generation',
        'code-generation',
        'image-understanding',
      ],
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet (Oct 2024)',
      provider: 'anthropic',
      contextWindow: 200000,
      maxTokens: 8192,
      capabilities: [
        'text-generation',
        'code-generation',
        'image-understanding',
      ],
    },
    {
      id: 'claude-3-5-sonnet-20240620',
      name: 'Claude 3.5 Sonnet (Jun 2024)',
      provider: 'anthropic',
      contextWindow: 200000,
      maxTokens: 8192,
      capabilities: [
        'text-generation',
        'code-generation',
        'image-understanding',
      ],
    },
    // Claude 3 Series
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      contextWindow: 200000,
      maxTokens: 4096,
      capabilities: [
        'text-generation',
        'code-generation',
        'image-understanding',
      ],
    },
    {
      id: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet',
      provider: 'anthropic',
      contextWindow: 200000,
      maxTokens: 4096,
      capabilities: [
        'text-generation',
        'code-generation',
        'image-understanding',
      ],
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      provider: 'anthropic',
      contextWindow: 200000,
      maxTokens: 4096,
      capabilities: [
        'text-generation',
        'code-generation',
        'image-understanding',
      ],
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      provider: 'anthropic',
      contextWindow: 200000,
      maxTokens: 8192,
      capabilities: ['text-generation', 'code-generation'],
    },
  ],
  gemini: [
    // Gemini 2.5 Series
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: 'gemini',
      contextWindow: 1000000,
      maxTokens: 8192,
      capabilities: [
        'text-generation',
        'code-generation',
        'image-understanding',
      ],
      isNew: true,
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'gemini',
      contextWindow: 2000000,
      maxTokens: 8192,
      capabilities: [
        'text-generation',
        'code-generation',
        'image-understanding',
      ],
      isNew: true,
    },
    // Gemini 2.0 Series
    {
      id: 'gemini-2.0-flash-exp',
      name: 'Gemini 2.0 Flash (Experimental)',
      provider: 'gemini',
      contextWindow: 1000000,
      maxTokens: 8192,
      capabilities: [
        'text-generation',
        'code-generation',
        'image-understanding',
      ],
    },
    {
      id: 'gemini-2.0-flash-thinking-exp',
      name: 'Gemini 2.0 Flash Thinking (Experimental)',
      provider: 'gemini',
      contextWindow: 1000000,
      maxTokens: 8192,
      capabilities: ['text-generation', 'code-generation'],
    },
    // Gemini 1.5 Series
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: 'gemini',
      contextWindow: 2000000,
      maxTokens: 8192,
      capabilities: [
        'text-generation',
        'code-generation',
        'image-understanding',
      ],
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'gemini',
      contextWindow: 1000000,
      maxTokens: 8192,
      capabilities: [
        'text-generation',
        'code-generation',
        'image-understanding',
      ],
    },
    {
      id: 'gemini-1.5-flash-8b',
      name: 'Gemini 1.5 Flash-8B',
      provider: 'gemini',
      contextWindow: 1000000,
      maxTokens: 8192,
      capabilities: ['text-generation', 'code-generation'],
    },
    {
      id: 'gemini-1.5-pro-exp',
      name: 'Gemini 1.5 Pro (Experimental)',
      provider: 'gemini',
      contextWindow: 2000000,
      maxTokens: 8192,
      capabilities: [
        'text-generation',
        'code-generation',
        'image-understanding',
      ],
    },
    {
      id: 'gemini-exp-1206',
      name: 'Gemini Exp 1206',
      provider: 'gemini',
      contextWindow: 2000000,
      maxTokens: 8192,
      capabilities: [
        'text-generation',
        'code-generation',
        'image-understanding',
      ],
    },
  ],
  xai: [
    // Grok 4 (New)
    {
      id: 'grok-4',
      name: 'Grok 4',
      provider: 'xai',
      contextWindow: 131072,
      maxTokens: 4096,
      capabilities: ['text-generation', 'code-generation'],
      isNew: true,
    },
    // Grok 3 Series
    {
      id: 'grok-3-beta',
      name: 'Grok 3 Beta',
      provider: 'xai',
      contextWindow: 131072,
      maxTokens: 4096,
      capabilities: ['text-generation', 'code-generation'],
    },
    {
      id: 'grok-3-mini',
      name: 'Grok 3 Mini',
      provider: 'xai',
      contextWindow: 131072,
      maxTokens: 4096,
      capabilities: ['text-generation', 'code-generation'],
    },
  ],
  deepseek: [
    // DeepSeek Chat (New)
    {
      id: 'deepseek-chat',
      name: 'DeepSeek Chat',
      provider: 'deepseek',
      contextWindow: 64000,
      maxTokens: 4096,
      capabilities: ['text-generation', 'code-generation'],
      isNew: true,
    },
    // DeepSeek Reasoner (New)
    {
      id: 'deepseek-reasoner',
      name: 'DeepSeek Reasoner',
      provider: 'deepseek',
      contextWindow: 64000,
      maxTokens: 4096,
      capabilities: ['text-generation', 'code-generation'],
      isNew: true,
    },
  ],
  openrouter: [], // OpenRouter models are fetched dynamically
  custom: [],
  tavily: [], // Tavily models are handled through MCP integration
}

// Model store state interface
interface ModelState {
  // Models data
  models: Record<AIProvider, Model[]>
  customModels: CustomModel[]
  openRouterModels: OpenRouterModel[]

  // Selected model
  selectedModel: {
    provider: AIProvider
    modelId: string
  } | null

  // Model configurations
  modelConfigs: Record<string, ModelConfig>

  // UI state
  activeTab: 'builtin' | 'custom' | 'openrouter'
  searchQuery: string
  selectedProvider: AIProvider | 'all'

  // Loading states
  loading: {
    fetchModels: boolean
    fetchOpenRouterModels: boolean
    testModel: boolean
    addCustomModel: boolean
  }

  // OpenRouter-specific state
  openRouterProviders: Record<string, any>[]
  openRouterLastFetched: Date | null

  // Model testing
  testResults: Record<string, AsyncState<{ latency: number; success: boolean }>>
}

// Model store actions interface
interface ModelActions {
  // Model management
  setSelectedModel: (provider: AIProvider, modelId: string) => void
  getModel: (
    provider: AIProvider,
    modelId: string
  ) => Model | CustomModel | null
  addCustomModel: (model: Omit<CustomModel, 'id'>) => Promise<string>
  updateCustomModel: (modelId: string, updates: Patch<CustomModel>) => void
  deleteCustomModel: (modelId: string) => void
  duplicateCustomModel: (modelId: string) => string

  // Model configuration
  getModelConfig: (provider: AIProvider, modelId: string) => ModelConfig
  updateModelConfig: (
    provider: AIProvider,
    modelId: string,
    config: Partial<ModelConfig>
  ) => void
  resetModelConfig: (provider: AIProvider, modelId: string) => void
  importModelConfig: (
    provider: AIProvider,
    modelId: string,
    config: ModelConfig
  ) => void
  exportModelConfig: (provider: AIProvider, modelId: string) => ModelConfig

  // Model testing and validation
  testModel: (
    provider: AIProvider,
    modelId: string,
    testPrompt?: string
  ) => Promise<{ latency: number; success: boolean }>
  validateModelConfig: (config: ModelConfig) => {
    isValid: boolean
    errors: string[]
  }

  // Search and filtering
  setSearchQuery: (query: string) => void
  setSelectedProvider: (provider: AIProvider | 'all') => void
  setActiveTab: (tab: 'builtin' | 'custom' | 'openrouter') => void
  getFilteredModels: () => Record<AIProvider, Model[]>
  searchModels: (query: string, provider?: AIProvider) => Model[]

  // Bulk operations
  exportAllConfigs: () => Record<string, ModelConfig>
  importAllConfigs: (configs: Record<string, ModelConfig>) => void
  resetAllConfigs: () => void

  // Model recommendations
  getRecommendedModels: (
    task: 'chat' | 'code' | 'analysis' | 'creative'
  ) => Model[]
  getFastestModels: () => Model[]
  getMostCapableModels: () => Model[]

  // Model comparison
  compareModels: (modelIds: string[]) => Array<{
    model: Model | CustomModel
    config: ModelConfig
    testResult?: AsyncState<{ latency: number; success: boolean }>
  }>

  // Provider management
  getAvailableProviders: () => AIProvider[]
  getProviderModels: (provider: AIProvider) => Model[]
  getProviderStatus: (
    provider: AIProvider
  ) => 'available' | 'unauthorized' | 'error'

  // Utility functions
  getModelKey: (provider: AIProvider, modelId: string) => string
  formatContextWindow: (tokens: number) => string
  estimateTokens: (text: string) => number

  // OpenRouter-specific actions
  fetchOpenRouterModels: () => Promise<void>
  refreshOpenRouterModels: () => Promise<void>
  getOpenRouterModel: (modelId: string) => OpenRouterModel | null
  checkOpenRouterModelAvailability: (
    modelId: string
  ) => Promise<{ available: boolean; queued?: number }>
  getFilteredOpenRouterModels: () => OpenRouterModel[]
  searchOpenRouterModels: (query: string) => OpenRouterModel[]
}

type ModelStore = ModelState & ModelActions

// Create the model store
export const useModelStore = createWithEqualityFn<ModelStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // Initial state
        models: BUILT_IN_MODELS,
        customModels: [],
        openRouterModels: [],
        selectedModel: {
          provider: 'openai',
          modelId: 'gpt-4o-2024-11-20',
        },
        modelConfigs: {},
        activeTab: 'builtin',
        searchQuery: '',
        selectedProvider: 'all',
        loading: {
          fetchModels: false,
          fetchOpenRouterModels: false,
          testModel: false,
          addCustomModel: false,
        },
        openRouterProviders: [],
        openRouterLastFetched: null,
        testResults: {},

        // Actions
        setSelectedModel: (provider: AIProvider, modelId: string) => {
          set((state) => {
            state.selectedModel = { provider, modelId }
          })
        },

        getModel: (provider: AIProvider, modelId: string) => {
          const state = get()

          // Check built-in models
          const builtInModel = state.models[provider]?.find(
            (m) => m.id === modelId
          )
          if (builtInModel) return builtInModel

          // Check OpenRouter models
          if (provider === 'openrouter') {
            const openRouterModel = state.openRouterModels.find(
              (m) => m.id === modelId
            )
            if (openRouterModel) return openRouterModel
          }

          // Check custom models
          const customModel = state.customModels.find((m) => m.id === modelId)
          if (customModel) return customModel

          return null
        },

        addCustomModel: async (modelData: Omit<CustomModel, 'id'>) => {
          const modelId = nanoid()

          set((state) => {
            state.loading.addCustomModel = true
          })

          try {
            const customModel: CustomModel = {
              ...modelData,
              id: modelId,
            }

            set((state) => {
              state.customModels.push(customModel)
              state.loading.addCustomModel = false
            })

            return modelId
          } catch (error) {
            set((state) => {
              state.loading.addCustomModel = false
            })
            throw error
          }
        },

        updateCustomModel: (modelId: string, updates: Patch<CustomModel>) => {
          set((state) => {
            const modelIndex = state.customModels.findIndex(
              (m) => m.id === modelId
            )
            if (modelIndex >= 0) {
              Object.assign(state.customModels[modelIndex], updates)
            }
          })
        },

        deleteCustomModel: (modelId: string) => {
          set((state) => {
            state.customModels = state.customModels.filter(
              (m) => m.id !== modelId
            )

            // Clear selected model if it was the deleted one
            if (state.selectedModel?.modelId === modelId) {
              state.selectedModel = {
                provider: 'openai',
                modelId: 'gpt-4o-2024-11-20',
              }
            }

            // Clean up config
            const configKey = get().getModelKey('custom', modelId)
            delete state.modelConfigs[configKey]
          })
        },

        duplicateCustomModel: (modelId: string) => {
          const originalModel = get().customModels.find((m) => m.id === modelId)
          if (!originalModel) return ''

          const newModelId = nanoid()
          const duplicatedModel: CustomModel = {
            ...originalModel,
            id: newModelId,
            name: `${originalModel.name} (Copy)`,
          }

          set((state) => {
            state.customModels.push(duplicatedModel)
          })

          return newModelId
        },

        // Model configuration methods
        getModelConfig: (provider: AIProvider, modelId: string) => {
          const state = get()
          const configKey = state.getModelKey(provider, modelId)
          return state.modelConfigs[configKey] || DEFAULT_MODEL_CONFIG
        },

        updateModelConfig: (
          provider: AIProvider,
          modelId: string,
          config: Partial<ModelConfig>
        ) => {
          set((state) => {
            const configKey = state.getModelKey(provider, modelId)
            const currentConfig =
              state.modelConfigs[configKey] || DEFAULT_MODEL_CONFIG
            state.modelConfigs[configKey] = { ...currentConfig, ...config }
          })
        },

        resetModelConfig: (provider: AIProvider, modelId: string) => {
          set((state) => {
            const configKey = state.getModelKey(provider, modelId)
            state.modelConfigs[configKey] = { ...DEFAULT_MODEL_CONFIG }
          })
        },

        importModelConfig: (
          provider: AIProvider,
          modelId: string,
          config: ModelConfig
        ) => {
          set((state) => {
            const configKey = state.getModelKey(provider, modelId)
            state.modelConfigs[configKey] = { ...config }
          })
        },

        exportModelConfig: (provider: AIProvider, modelId: string) => {
          const state = get()
          return state.getModelConfig(provider, modelId)
        },

        // Model testing
        testModel: async (
          provider: AIProvider,
          modelId: string,
          testPrompt = 'Hello, world!'
        ) => {
          const configKey = get().getModelKey(provider, modelId)

          set((state) => {
            state.loading.testModel = true
            state.testResults[configKey] = {
              data: null,
              loading: true,
              error: null,
            }
          })

          try {
            const startTime = Date.now()

            // TODO: Implement actual model testing based on provider
            // This would make a real API call to test the model
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 + Math.random() * 2000)
            )

            const latency = Date.now() - startTime
            const success = Math.random() > 0.1 // 90% success rate for demo

            const result = { latency, success }

            set((state) => {
              state.loading.testModel = false
              state.testResults[configKey] = {
                data: result,
                loading: false,
                error: success ? null : 'Model test failed',
                lastUpdated: new Date(),
              }
            })

            return result
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error'

            set((state) => {
              state.loading.testModel = false
              state.testResults[configKey] = {
                data: null,
                loading: false,
                error: errorMessage,
              }
            })

            throw error
          }
        },

        validateModelConfig: (config: ModelConfig) => {
          const errors: string[] = []

          if (config.temperature < 0 || config.temperature > 2) {
            errors.push('Temperature must be between 0 and 2')
          }

          if (config.topP < 0 || config.topP > 1) {
            errors.push('Top P must be between 0 and 1')
          }

          if (config.frequencyPenalty < -2 || config.frequencyPenalty > 2) {
            errors.push('Frequency penalty must be between -2 and 2')
          }

          if (config.presencePenalty < -2 || config.presencePenalty > 2) {
            errors.push('Presence penalty must be between -2 and 2')
          }

          if (config.maxTokens !== undefined && config.maxTokens < 1) {
            errors.push('Max tokens must be at least 1')
          }

          return {
            isValid: errors.length === 0,
            errors,
          }
        },

        // Search and filtering
        setSearchQuery: (query: string) => {
          set((state) => {
            state.searchQuery = query
          })
        },

        setSelectedProvider: (provider: AIProvider | 'all') => {
          set((state) => {
            state.selectedProvider = provider
          })
        },

        setActiveTab: (tab: 'builtin' | 'custom' | 'openrouter') => {
          set((state) => {
            state.activeTab = tab
          })
        },

        getFilteredModels: () => {
          const state = get()
          const { searchQuery, selectedProvider } = state
          const lowerQuery = searchQuery.toLowerCase()

          const filtered: Record<AIProvider, Model[]> = {} as Record<
            AIProvider,
            Model[]
          >

          Object.entries(state.models).forEach(([provider, models]) => {
            const providerKey = provider as AIProvider

            if (
              selectedProvider !== 'all' &&
              selectedProvider !== providerKey
            ) {
              filtered[providerKey] = []
              return
            }

            filtered[providerKey] = models.filter(
              (model) =>
                model.name.toLowerCase().includes(lowerQuery) ||
                model.id.toLowerCase().includes(lowerQuery)
            )
          })

          return filtered
        },

        searchModels: (query: string, provider?: AIProvider) => {
          const state = get()
          const lowerQuery = query.toLowerCase()
          const allModels: Model[] = []

          const providersToSearch = provider
            ? [provider]
            : (Object.keys(state.models) as AIProvider[])

          providersToSearch.forEach((p) => {
            const models = state.models[p] || []
            allModels.push(...models)
          })

          // Include custom models
          if (!provider || provider === 'custom') {
            allModels.push(...state.customModels)
          }

          return allModels.filter(
            (model) =>
              model.name.toLowerCase().includes(lowerQuery) ||
              model.id.toLowerCase().includes(lowerQuery)
          )
        },

        // Bulk operations
        exportAllConfigs: () => {
          return { ...get().modelConfigs }
        },

        importAllConfigs: (configs: Record<string, ModelConfig>) => {
          set((state) => {
            Object.assign(state.modelConfigs, configs)
          })
        },

        resetAllConfigs: () => {
          set((state) => {
            state.modelConfigs = {}
          })
        },

        // Model recommendations
        getRecommendedModels: (
          task: 'chat' | 'code' | 'analysis' | 'creative'
        ) => {
          const state = get()
          const allModels: Model[] = []

          Object.values(state.models).forEach((models) => {
            allModels.push(...models)
          })

          switch (task) {
            case 'chat':
              return allModels
                .filter((m) => m.capabilities.includes('text-generation'))
                .sort((a, b) => b.contextWindow - a.contextWindow)
                .slice(0, 5)

            case 'code':
              return allModels
                .filter((m) => m.capabilities.includes('code-generation'))
                .sort((a, b) => (b.maxTokens || 0) - (a.maxTokens || 0))
                .slice(0, 5)

            case 'analysis':
              return allModels
                .filter((m) => m.contextWindow >= 100000)
                .sort((a, b) => b.contextWindow - a.contextWindow)
                .slice(0, 5)

            case 'creative':
              return allModels
                .filter((m) => m.capabilities.includes('text-generation'))
                .slice(0, 5)

            default:
              return []
          }
        },

        getFastestModels: () => {
          const state = get()
          const modelsWithResults = Object.entries(state.testResults)
            .map(([key, result]) => ({ key, result }))
            .filter((item) => item.result.data?.success)
            .sort(
              (a, b) =>
                (a.result.data?.latency || 0) - (b.result.data?.latency || 0)
            )

          return modelsWithResults
            .slice(0, 5)
            .map((item) => {
              const [provider, modelId] = item.key.split(':')
              return state.getModel(provider as AIProvider, modelId)
            })
            .filter(Boolean) as Model[]
        },

        getMostCapableModels: () => {
          const state = get()
          const allModels: Model[] = []

          Object.values(state.models).forEach((models) => {
            allModels.push(...models)
          })

          return allModels
            .sort((a, b) => {
              const aScore = a.capabilities.length * (a.contextWindow / 1000)
              const bScore = b.capabilities.length * (b.contextWindow / 1000)
              return bScore - aScore
            })
            .slice(0, 5)
        },

        // Model comparison
        compareModels: (modelIds: string[]) => {
          const state = get()

          return modelIds
            .map((modelId) => {
              // Parse provider:modelId format
              const [provider, actualModelId] = modelId.includes(':')
                ? modelId.split(':')
                : ['openai', modelId]

              const model = state.getModel(
                provider as AIProvider,
                actualModelId
              )
              if (!model) return null

              const config = state.getModelConfig(
                provider as AIProvider,
                actualModelId
              )
              const testResult =
                state.testResults[
                  state.getModelKey(provider as AIProvider, actualModelId)
                ]

              return { model, config, testResult }
            })
            .filter(Boolean) as Array<{
            model: Model | CustomModel
            config: ModelConfig
            testResult?: AsyncState<{ latency: number; success: boolean }>
          }>
        },

        // Provider management
        getAvailableProviders: () => {
          return Object.keys(BUILT_IN_MODELS) as AIProvider[]
        },

        getProviderModels: (provider: AIProvider) => {
          const state = get()
          return state.models[provider] || []
        },

        getProviderStatus: (provider: AIProvider) => {
          // TODO: Implement actual provider status checking
          // This would check API keys and connectivity
          return 'available'
        },

        // Utility functions
        getModelKey: (provider: AIProvider, modelId: string) => {
          return `${provider}:${modelId}`
        },

        formatContextWindow: (tokens: number) => {
          if (tokens >= 1000000) {
            return `${(tokens / 1000000).toFixed(1)}M tokens`
          } else if (tokens >= 1000) {
            return `${(tokens / 1000).toFixed(0)}K tokens`
          } else {
            return `${tokens} tokens`
          }
        },

        estimateTokens: (text: string) => {
          // Rough estimation: ~4 characters per token for English
          return Math.ceil(text.length / 4)
        },

        // OpenRouter-specific implementations
        fetchOpenRouterModels: async () => {
          const state = get()

          // Check if we have cached models that are still fresh (less than 1 hour old)
          if (
            state.openRouterModels.length > 0 &&
            state.openRouterLastFetched
          ) {
            const cacheAge = Date.now() - state.openRouterLastFetched.getTime()
            const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

            if (cacheAge < CACHE_DURATION) {
              console.log('Using cached OpenRouter models')
              return
            }
          }

          set((state) => {
            state.loading.fetchOpenRouterModels = true
          })

          try {
            // Get API key from settings with proper error handling
            let apiKey = null
            try {
              const settingsData = localStorage.getItem(
                'minddeck-settings-store'
              )
              if (settingsData) {
                const parsed = JSON.parse(settingsData)
                apiKey = parsed.state?.settings?.apiKeys?.openrouter
              }
            } catch (parseError) {
              console.warn(
                'Failed to parse settings from localStorage:',
                parseError
              )
            }

            if (!apiKey) {
              set((state) => {
                state.loading.fetchOpenRouterModels = false
                // Add error state for no API key
                state.testResults['openrouter:error'] = {
                  data: null,
                  loading: false,
                  error:
                    'OpenRouter API key not found. Please add your API key in Settings.',
                  lastUpdated: new Date(),
                }
              })
              throw new Error(
                'OpenRouter API key not found. Please add your API key in Settings.'
              )
            }

            const client = new OpenRouterClient({
              apiKey,
              appName: 'MindDeck',
              appUrl: 'https://minddeck.ai',
              timeout: 30000, // 30 second timeout for model fetching
              retryAttempts: 2,
              retryDelay: 1000,
            })

            console.log('Fetching OpenRouter models...')
            const openRouterModels = await client.fetchModels()
            console.log(`Fetched ${openRouterModels.length} OpenRouter models`)

            // Convert OpenRouter models to our format and add them to state
            const convertedModels: OpenRouterModel[] = openRouterModels
              .filter((model: OpenRouterAPIModel) => {
                // Filter out models that don't have proper pricing info
                return (
                  model.pricing &&
                  (parseFloat(model.pricing.prompt) > 0 ||
                    parseFloat(model.pricing.completion) > 0 ||
                    (parseFloat(model.pricing.prompt) === 0 &&
                      parseFloat(model.pricing.completion) === 0))
                )
              })
              .map((model: OpenRouterAPIModel) => {
                const converted = convertOpenRouterModel(model)
                return {
                  ...converted,
                  provider: 'openrouter' as const,
                  originalProvider: converted.provider,
                } as OpenRouterModel
              })
              // Sort by pricing (cheapest first) and then by name
              .sort((a, b) => {
                const aPrice = a.pricing
                  ? (a.pricing.input + a.pricing.output) / 2
                  : Infinity
                const bPrice = b.pricing
                  ? (b.pricing.input + b.pricing.output) / 2
                  : Infinity

                if (aPrice !== bPrice) {
                  return aPrice - bPrice
                }
                return a.name.localeCompare(b.name)
              })

            console.log(
              `Processed ${convertedModels.length} models for display`
            )

            set((state) => {
              state.openRouterModels = convertedModels
              state.openRouterLastFetched = new Date()
              state.loading.fetchOpenRouterModels = false
              // Clear error state on success
              delete state.testResults['openrouter:error']
            })
          } catch (error) {
            console.error('Failed to fetch OpenRouter models:', error)
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Failed to fetch OpenRouter models'

            set((state) => {
              state.loading.fetchOpenRouterModels = false
              // Set error state for failed fetch
              state.testResults['openrouter:error'] = {
                data: null,
                loading: false,
                error: errorMessage,
                lastUpdated: new Date(),
              }
            })
            throw error
          }
        },

        refreshOpenRouterModels: async () => {
          // Clear cache and fetch fresh models
          set((state) => {
            state.openRouterModels = []
            state.openRouterLastFetched = null
          })
          await get().fetchOpenRouterModels()
        },

        getOpenRouterModel: (modelId: string) => {
          const state = get()
          return state.openRouterModels.find((m) => m.id === modelId) || null
        },

        checkOpenRouterModelAvailability: async (modelId: string) => {
          try {
            let apiKey = null
            try {
              const settingsData = localStorage.getItem(
                'minddeck-settings-store'
              )
              if (settingsData) {
                const parsed = JSON.parse(settingsData)
                apiKey = parsed.state?.settings?.apiKeys?.openrouter
              }
            } catch (parseError) {
              console.warn(
                'Failed to parse settings from localStorage:',
                parseError
              )
              return { available: false }
            }

            if (!apiKey) {
              return { available: false }
            }

            const client = new OpenRouterClient({
              apiKey,
              appName: 'MindDeck',
              appUrl: 'https://minddeck.ai',
            })

            return await client.checkModelAvailability(modelId)
          } catch (error) {
            console.warn(
              'Failed to check OpenRouter model availability:',
              error
            )
            return { available: false }
          }
        },

        getFilteredOpenRouterModels: () => {
          const state = get()
          const { searchQuery, selectedProvider } = state
          const lowerQuery = searchQuery.toLowerCase()

          let filteredModels = state.openRouterModels

          // Apply search filter
          if (searchQuery) {
            filteredModels = filteredModels.filter(
              (model) =>
                model.name.toLowerCase().includes(lowerQuery) ||
                model.id.toLowerCase().includes(lowerQuery) ||
                model.originalProvider.toLowerCase().includes(lowerQuery) ||
                model.description?.toLowerCase().includes(lowerQuery)
            )
          }

          // Apply provider filter
          if (selectedProvider !== 'all') {
            filteredModels = filteredModels.filter(
              (model) => model.originalProvider === selectedProvider
            )
          }

          return filteredModels
        },

        searchOpenRouterModels: (query: string) => {
          const state = get()
          const lowerQuery = query.toLowerCase()

          return state.openRouterModels.filter(
            (model) =>
              model.name.toLowerCase().includes(lowerQuery) ||
              model.id.toLowerCase().includes(lowerQuery) ||
              model.originalProvider.toLowerCase().includes(lowerQuery) ||
              model.description?.toLowerCase().includes(lowerQuery)
          )
        },
      })),
      {
        name: 'minddeck-model-store',
        storage: createStorage('localStorage'),
        version: 1,
        partialize: createAutoPartializer(['loading', 'testResults']),
        onRehydrateStorage: () => (state) => {
          // Reset transient state after rehydration
          if (state) {
            state.loading = {
              fetchModels: false,
              fetchOpenRouterModels: false,
              testModel: false,
              addCustomModel: false,
            }
            state.testResults = {}

            // Clear any OpenRouter error states
            if (state.testResults && state.testResults['openrouter:error']) {
              delete state.testResults['openrouter:error']
            }
          }
        },
      } as any
    )
  )
)
