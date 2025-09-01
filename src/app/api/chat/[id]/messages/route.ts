/**
 * Chat Messages API Route - Manage messages within specific chats
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock storage - in production, this would be in a database
let mockMessages: Record<string, any[]> = {}
let nextMessageId = 1

interface Message {
  id: string
  chatId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    provider?: string
    model?: string
    tokens?: number
    latency?: number
  }
}

interface CreateMessageRequest {
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: Message['metadata']
}

// GET - Get messages for a specific chat
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const chatMessages = mockMessages[chatId] || []
    const total = chatMessages.length
    const paginatedMessages = chatMessages.slice(offset, offset + limit)

    return NextResponse.json(
      {
        messages: paginatedMessages,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    )
  } catch (error) {
    console.error('Messages GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve messages',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST - Add a new message to a chat
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id
    const body: CreateMessageRequest = await request.json()

    // Validate required fields
    if (!body.role || !body.content) {
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['user', 'assistant', 'system'].includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be user, assistant, or system' },
        { status: 400 }
      )
    }

    const newMessage: Message = {
      id: (nextMessageId++).toString(),
      chatId,
      role: body.role,
      content: body.content,
      timestamp: new Date().toISOString(),
      metadata: body.metadata,
    }

    // Initialize chat messages array if it doesn't exist
    if (!mockMessages[chatId]) {
      mockMessages[chatId] = []
    }

    mockMessages[chatId].push(newMessage)

    return NextResponse.json(newMessage, {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Messages POST error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create message',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    )
  }
}

// DELETE - Clear all messages from a chat
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id

    if (mockMessages[chatId]) {
      mockMessages[chatId] = []
    }

    return NextResponse.json(
      { message: 'Messages cleared successfully' },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    )
  } catch (error) {
    console.error('Messages DELETE error:', error)
    return NextResponse.json(
      {
        error: 'Failed to clear messages',
        message: error instanceof Error ? error.message : 'Unknown error',
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
      },
    }
  )
}
