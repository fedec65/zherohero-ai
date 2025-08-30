/**
 * Next.js API Route - AI Models Information
 * Provides information about available models and their capabilities
 */

import { NextRequest, NextResponse } from 'next/server'
import { aiAPI } from '../../../../lib/api'
import { AIProvider } from '../../../../lib/stores/types/index'

// Model information from the store (could be imported from model store)
const MODEL_INFORMATION = {
  openai: [
    {
      id: 'gpt-5-large',
      name: 'GPT-5 Large',
      contextWindow: 512000,
      maxTokens: 16384,
      isNew: true,
    },
    {
      id: 'gpt-5-medium',
      name: 'GPT-5 Medium',
      contextWindow: 256000,
      maxTokens: 16384,
      isNew: true,
    },
    {
      id: 'gpt-5-small',
      name: 'GPT-5 Small',
      contextWindow: 128000,
      maxTokens: 8192,
      isNew: true,
    },
    {
      id: 'gpt-4o-2024-11-20',
      name: 'GPT-4o (Nov 2024)',
      contextWindow: 128000,
      maxTokens: 16384,
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o mini',
      contextWindow: 128000,
      maxTokens: 16384,
    },
    {
      id: 'o1-preview',
      name: 'o1-preview',
      contextWindow: 128000,
      maxTokens: 32768,
    },
    { id: 'o1-mini', name: 'o1-mini', contextWindow: 128000, maxTokens: 65536 },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      contextWindow: 128000,
      maxTokens: 4096,
      isDeprecated: true,
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      contextWindow: 16385,
      maxTokens: 4096,
      isDeprecated: true,
    },
  ],
  anthropic: [
    {
      id: 'claude-4.1-opus',
      name: 'Claude Opus 4.1',
      contextWindow: 200000,
      maxTokens: 8192,
      isNew: true,
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet (Oct 2024)',
      contextWindow: 200000,
      maxTokens: 8192,
    },
    {
      id: 'claude-3-5-sonnet-20240620',
      name: 'Claude 3.5 Sonnet (Jun 2024)',
      contextWindow: 200000,
      maxTokens: 8192,
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      contextWindow: 200000,
      maxTokens: 4096,
    },
    {
      id: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet',
      contextWindow: 200000,
      maxTokens: 4096,
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      contextWindow: 200000,
      maxTokens: 4096,
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      contextWindow: 200000,
      maxTokens: 8192,
    },
  ],
  gemini: [
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      contextWindow: 1000000,
      maxTokens: 8192,
      isNew: true,
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      contextWindow: 2000000,
      maxTokens: 8192,
      isNew: true,
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      contextWindow: 2000000,
      maxTokens: 8192,
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      contextWindow: 1000000,
      maxTokens: 8192,
    },
    {
      id: 'gemini-1.5-flash-8b',
      name: 'Gemini 1.5 Flash-8B',
      contextWindow: 1000000,
      maxTokens: 8192,
    },
  ],
  xai: [
    {
      id: 'grok-4',
      name: 'Grok 4',
      contextWindow: 131072,
      maxTokens: 4096,
      isNew: true,
    },
    {
      id: 'grok-3-beta',
      name: 'Grok 3 Beta',
      contextWindow: 131072,
      maxTokens: 4096,
    },
    {
      id: 'grok-3-mini',
      name: 'Grok 3 Mini',
      contextWindow: 131072,
      maxTokens: 4096,
    },
  ],
  deepseek: [
    {
      id: 'deepseek-chat',
      name: 'DeepSeek Chat',
      contextWindow: 64000,
      maxTokens: 4096,
      isNew: true,
    },
    {
      id: 'deepseek-reasoner',
      name: 'DeepSeek Reasoner',
      contextWindow: 64000,
      maxTokens: 4096,
      isNew: true,
    },
  ],
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider') as AIProvider | null
    const includeStatus = searchParams.get('includeStatus') === 'true'

    // Get provider statuses if requested
    let providerStatuses = {}
    if (includeStatus) {
      providerStatuses = aiAPI.getAllProviderStatuses()
    }

    // Filter by provider if specified
    if (provider) {
      const validProviders: AIProvider[] = [
        'openai',
        'anthropic',
        'gemini',
        'xai',
        'deepseek',
      ]
      if (!validProviders.includes(provider)) {
        return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
      }

      const models = MODEL_INFORMATION[provider] || []
      const response: any = {
        provider,
        models,
        count: models.length,
      }

      if (includeStatus) {
        response.status = (providerStatuses as any)[provider]
      }

      return NextResponse.json(response)
    }

    // Return all models
    const allModels = Object.entries(MODEL_INFORMATION).reduce(
      (acc, [providerKey, models]) => {
        acc[providerKey] = {
          models,
          count: models.length,
        }

        if (includeStatus) {
          acc[providerKey].status = (providerStatuses as any)[providerKey]
        }

        return acc
      },
      {} as any
    )

    // Calculate totals
    const totalModels = Object.values(MODEL_INFORMATION).reduce(
      (sum, models) => sum + models.length,
      0
    )
    const newModels = Object.values(MODEL_INFORMATION)
      .flat()
      .filter((model) => model.isNew).length

    return NextResponse.json({
      providers: allModels,
      summary: {
        totalProviders: Object.keys(MODEL_INFORMATION).length,
        totalModels,
        newModels,
        deprecatedModels: Object.values(MODEL_INFORMATION)
          .flat()
          .filter((model) => 'isDeprecated' in model && model.isDeprecated)
          .length,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Models API error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Get model recommendations
export async function POST(request: NextRequest) {
  try {
    const { task, providers } = await request.json()

    if (!task) {
      return NextResponse.json({ error: 'Task is required' }, { status: 400 })
    }

    const validTasks = ['chat', 'code', 'analysis', 'creative']
    if (!validTasks.includes(task)) {
      return NextResponse.json(
        { error: 'Invalid task. Must be one of: ' + validTasks.join(', ') },
        { status: 400 }
      )
    }

    // Get recommended provider
    const recommendedProvider = aiAPI.getRecommendedProvider(task, providers)

    if (!recommendedProvider) {
      return NextResponse.json({
        task,
        recommendation: null,
        message: 'No suitable providers available',
        timestamp: new Date().toISOString(),
      })
    }

    // Get models for recommended provider
    const providerModels = MODEL_INFORMATION[recommendedProvider] || []

    // Get provider status
    const providerStatus = aiAPI.getProviderStatus(recommendedProvider)

    return NextResponse.json({
      task,
      recommendation: {
        provider: recommendedProvider,
        models: providerModels,
        status: providerStatus,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Model recommendation error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
