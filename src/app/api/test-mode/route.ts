/**
 * Test Mode API Route - Provides test environment detection and mock data
 * Used during E2E testing to return predictable mock responses
 */

import { NextRequest, NextResponse } from 'next/server'

// Check if we're in test environment
function isTestEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.PLAYWRIGHT_TEST === 'true' ||
    process.env.E2E_TEST === 'true'
  )
}

// Mock test data
const testData = {
  chats: [
    {
      id: 'test-chat-1',
      title: 'Test Chat 1',
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello, this is a test message',
          timestamp: '2024-01-01T12:00:00Z',
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hello! This is a mock response for testing.',
          timestamp: '2024-01-01T12:00:01Z',
        },
      ],
      createdAt: '2024-01-01T12:00:00Z',
      updatedAt: '2024-01-01T12:00:01Z',
    },
  ],
  users: [
    {
      id: 'test-user-1',
      name: 'Test User',
      email: 'test@example.com',
      avatar: null,
      preferences: {
        theme: 'dark',
        notifications: true,
      },
    },
  ],
  settings: {
    theme: 'system',
    sidebarWidth: 320,
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o',
  },
  providers: {
    openai: {
      initialized: true,
      hasApiKey: true,
      healthy: true,
      status: 'healthy',
    },
    anthropic: {
      initialized: true,
      hasApiKey: true,
      healthy: true,
      status: 'healthy',
    },
    gemini: {
      initialized: false,
      hasApiKey: false,
      healthy: false,
      status: 'no_api_key',
    },
  },
}

// GET - Check test mode status and get test data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dataType = searchParams.get('type')

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  const isTest = isTestEnvironment()

  if (!isTest) {
    return NextResponse.json(
      {
        testMode: false,
        message: 'Test mode is only available in test environment',
      },
      { status: 403, headers }
    )
  }

  // Return specific test data type if requested
  if (dataType && dataType in testData) {
    return NextResponse.json(
      {
        testMode: true,
        dataType,
        data: testData[dataType as keyof typeof testData],
      },
      { headers }
    )
  }

  // Return all test data
  return NextResponse.json(
    {
      testMode: true,
      environment: process.env.NODE_ENV,
      data: testData,
      timestamp: new Date().toISOString(),
    },
    { headers }
  )
}

// POST - Set test mode configuration
export async function POST(request: NextRequest) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  const isTest = isTestEnvironment()

  if (!isTest) {
    return NextResponse.json(
      {
        error: 'Test mode configuration is only available in test environment',
      },
      { status: 403, headers }
    )
  }

  try {
    const config = await request.json()

    // In a real implementation, you might store test configuration
    // For now, we just acknowledge the configuration

    return NextResponse.json(
      {
        message: 'Test mode configuration updated',
        config,
        timestamp: new Date().toISOString(),
      },
      { headers }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to update test mode configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400, headers }
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}
