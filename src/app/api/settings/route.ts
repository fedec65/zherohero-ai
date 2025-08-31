/**
 * Settings API Route - Manage application settings
 * Handles API keys, preferences, and configuration
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock settings storage (in production, this would be encrypted and stored securely)
let mockSettings: Record<string, any> = {
  theme: 'system',
  sidebarWidth: 320,
  language: 'en',
  autoSave: true,
  streamingEnabled: true,
  showTooltips: true,
  defaultProvider: 'openai',
  defaultModel: 'gpt-4o',
  apiKeys: {}, // API keys should be encrypted in production
  mcpServers: [],
  modelConfigs: {}
}

interface UpdateSettingsRequest {
  theme?: 'light' | 'dark' | 'system'
  sidebarWidth?: number
  language?: string
  autoSave?: boolean
  streamingEnabled?: boolean
  showTooltips?: boolean
  defaultProvider?: string
  defaultModel?: string
  apiKeys?: Record<string, string>
  mcpServers?: Array<{
    id: string
    name: string
    url: string
    enabled: boolean
  }>
  modelConfigs?: Record<string, any>
}

// GET - Retrieve all settings or specific setting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // Get specific setting
    if (key) {
      if (!(key in mockSettings)) {
        return NextResponse.json(
          { error: 'Setting not found' },
          { status: 404, headers }
        )
      }
      
      return NextResponse.json(
        { key, value: mockSettings[key] },
        { headers }
      )
    }

    // Return all settings (excluding sensitive data like API keys in full form)
    const safeSettings = {
      ...mockSettings,
      apiKeys: Object.keys(mockSettings.apiKeys || {}).reduce((acc, provider) => {
        acc[provider] = mockSettings.apiKeys[provider] ? '••••••••' : null
        return acc
      }, {} as Record<string, string | null>)
    }

    return NextResponse.json(safeSettings, { headers })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Update settings (bulk update)
export async function POST(request: NextRequest) {
  try {
    const body: UpdateSettingsRequest = await request.json()
    
    // Validate settings before updating
    const validationErrors = validateSettings(body)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid settings',
          details: validationErrors
        },
        { status: 400 }
      )
    }

    // Update settings
    mockSettings = {
      ...mockSettings,
      ...body,
      updatedAt: new Date().toISOString()
    }

    // Return updated settings (with API keys masked)
    const safeSettings = {
      ...mockSettings,
      apiKeys: Object.keys(mockSettings.apiKeys || {}).reduce((acc, provider) => {
        acc[provider] = mockSettings.apiKeys[provider] ? '••••••••' : null
        return acc
      }, {} as Record<string, string | null>)
    }

    return NextResponse.json(
      {
        message: 'Settings updated successfully',
        settings: safeSettings
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    )
  } catch (error) {
    console.error('Settings POST error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    )
  }
}

// PUT - Update a specific setting
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    
    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      )
    }

    const { value } = await request.json()
    
    if (value === undefined) {
      return NextResponse.json(
        { error: 'Setting value is required' },
        { status: 400 }
      )
    }

    // Validate specific setting
    const validationError = validateSingleSetting(key, value)
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }

    mockSettings[key] = value
    mockSettings.updatedAt = new Date().toISOString()

    // Return masked value for API keys
    const returnValue = key === 'apiKeys' && value 
      ? Object.keys(value).reduce((acc: Record<string, string>, provider) => {
          acc[provider] = value[provider] ? '••••••••' : null
          return acc
        }, {})
      : value

    return NextResponse.json(
      {
        message: 'Setting updated successfully',
        key,
        value: returnValue
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    )
  } catch (error) {
    console.error('Settings PUT error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update setting',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    )
  }
}

// DELETE - Reset settings to defaults
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (key) {
      // Delete specific setting (reset to default)
      if (key in mockSettings) {
        delete mockSettings[key]
      }
    } else {
      // Reset all settings to defaults
      mockSettings = {
        theme: 'system',
        sidebarWidth: 320,
        language: 'en',
        autoSave: true,
        streamingEnabled: true,
        showTooltips: true,
        defaultProvider: 'openai',
        defaultModel: 'gpt-4o',
        apiKeys: {},
        mcpServers: [],
        modelConfigs: {}
      }
    }

    return NextResponse.json(
      { message: key ? `Setting ${key} reset successfully` : 'All settings reset successfully' },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    )
  } catch (error) {
    console.error('Settings DELETE error:', error)
    return NextResponse.json(
      {
        error: 'Failed to reset settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// OPTIONS - Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    }
  )
}

// Validation functions
function validateSettings(settings: UpdateSettingsRequest): string[] {
  const errors: string[] = []

  if (settings.theme && !['light', 'dark', 'system'].includes(settings.theme)) {
    errors.push('Invalid theme. Must be light, dark, or system')
  }

  if (settings.sidebarWidth && (settings.sidebarWidth < 200 || settings.sidebarWidth > 600)) {
    errors.push('Invalid sidebar width. Must be between 200 and 600')
  }

  if (settings.language && typeof settings.language !== 'string') {
    errors.push('Invalid language. Must be a string')
  }

  if (settings.autoSave !== undefined && typeof settings.autoSave !== 'boolean') {
    errors.push('Invalid autoSave. Must be a boolean')
  }

  if (settings.streamingEnabled !== undefined && typeof settings.streamingEnabled !== 'boolean') {
    errors.push('Invalid streamingEnabled. Must be a boolean')
  }

  if (settings.showTooltips !== undefined && typeof settings.showTooltips !== 'boolean') {
    errors.push('Invalid showTooltips. Must be a boolean')
  }

  if (settings.defaultProvider && !['openai', 'anthropic', 'gemini', 'xai', 'deepseek'].includes(settings.defaultProvider)) {
    errors.push('Invalid default provider')
  }

  if (settings.apiKeys && typeof settings.apiKeys !== 'object') {
    errors.push('Invalid apiKeys. Must be an object')
  }

  if (settings.mcpServers && !Array.isArray(settings.mcpServers)) {
    errors.push('Invalid mcpServers. Must be an array')
  }

  return errors
}

function validateSingleSetting(key: string, value: any): string | null {
  const validation = validateSettings({ [key]: value } as any)
  return validation.length > 0 ? validation[0] : null
}