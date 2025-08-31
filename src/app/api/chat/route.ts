/**
 * Chat Management API Route - CRUD operations for chat conversations
 * Handles chat creation, retrieval, updating, and deletion
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock in-memory storage for chats (in production, this would be a database)
let mockChats: any[] = []
let nextId = 1

// Types
interface Chat {
  id: string
  title: string
  messages: Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: string
  }>
  createdAt: string
  updatedAt: string
  provider?: string
  model?: string
  isIncognito?: boolean
}

interface CreateChatRequest {
  title?: string
  provider?: string
  model?: string
  isIncognito?: boolean
}

interface UpdateChatRequest {
  title?: string
  provider?: string
  model?: string
}

// GET - Retrieve all chats or a specific chat
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    // Add CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // Get specific chat
    if (chatId) {
      const chat = mockChats.find(c => c.id === chatId)
      if (!chat) {
        return NextResponse.json(
          { error: 'Chat not found' },
          { status: 404, headers }
        )
      }
      return NextResponse.json(chat, { headers })
    }

    // Get all chats with filtering and pagination
    let filteredChats = mockChats

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filteredChats = mockChats.filter(chat => 
        chat.title.toLowerCase().includes(searchLower) ||
        chat.messages.some((msg: any) => 
          msg.content.toLowerCase().includes(searchLower)
        )
      )
    }

    // Apply pagination
    const total = filteredChats.length
    const paginatedChats = filteredChats
      .slice(offset, offset + limit)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return NextResponse.json(
      {
        chats: paginatedChats,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      },
      { headers }
    )
  } catch (error) {
    console.error('Chat GET error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to retrieve chats',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Create a new chat
export async function POST(request: NextRequest) {
  try {
    const body: CreateChatRequest = await request.json()
    
    const now = new Date().toISOString()
    const newChat: Chat = {
      id: (nextId++).toString(),
      title: body.title || 'New Chat',
      messages: [],
      createdAt: now,
      updatedAt: now,
      provider: body.provider || 'openai',
      model: body.model || 'gpt-4o',
      isIncognito: body.isIncognito || false
    }

    mockChats.push(newChat)

    return NextResponse.json(newChat, { 
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  } catch (error) {
    console.error('Chat POST error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create chat',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    )
  }
}

// PUT - Update an existing chat
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('id')
    
    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      )
    }

    const body: UpdateChatRequest = await request.json()
    const chatIndex = mockChats.findIndex(c => c.id === chatId)
    
    if (chatIndex === -1) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      )
    }

    // Update chat
    const updatedChat = {
      ...mockChats[chatIndex],
      ...body,
      updatedAt: new Date().toISOString()
    }
    
    mockChats[chatIndex] = updatedChat

    return NextResponse.json(updatedChat, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  } catch (error) {
    console.error('Chat PUT error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update chat',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    )
  }
}

// DELETE - Delete a chat
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('id')
    
    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      )
    }

    const chatIndex = mockChats.findIndex(c => c.id === chatId)
    
    if (chatIndex === -1) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      )
    }

    // Remove chat
    mockChats.splice(chatIndex, 1)

    return NextResponse.json(
      { message: 'Chat deleted successfully' },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    )
  } catch (error) {
    console.error('Chat DELETE error:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete chat',
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