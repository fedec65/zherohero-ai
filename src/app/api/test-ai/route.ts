/**
 * Test AI Integration Route
 * Simple test to verify AI providers are working
 */

import { NextRequest, NextResponse } from 'next/server'
import { aiClientAPI } from '../../../lib/api/client'

export async function GET() {
  try {
    // Test with a simple message
    const testMessage =
      'Hello! Please respond with just "AI integration is working" to confirm the connection.'

    const response = await aiClientAPI.createChatCompletion({
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: testMessage }],
      temperature: 0,
      maxTokens: 50,
    })

    return NextResponse.json({
      success: true,
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      response: response.choices[0]?.message?.content || 'No response',
      usage: response.usage,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('AI test error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Test streaming
export async function POST() {
  try {
    const testMessage = 'Count from 1 to 5, each number on a new line.'
    let fullResponse = ''

    await aiClientAPI.streamChatCompletion(
      {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: testMessage }],
        temperature: 0,
        maxTokens: 100,
      },
      {
        onContent: (content: string, isComplete: boolean) => {
          fullResponse = content
        },
        onError: (error: string) => {
          throw new Error(error)
        },
      }
    )

    return NextResponse.json({
      success: true,
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      streamingTest: 'completed',
      response: fullResponse,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('AI streaming test error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
