/**
 * User API Route - Mock user data for demo purposes
 * Referenced in demo code for testing and examples
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock user data
const mockUsers: Record<string, any> = {
  '1': {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
    role: 'user',
    preferences: {
      theme: 'dark',
      notifications: true
    },
    createdAt: '2024-01-15T10:30:00Z',
    lastActive: new Date().toISOString()
  },
  '2': {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
    role: 'user',
    preferences: {
      theme: 'light',
      notifications: false
    },
    createdAt: '2024-01-20T14:15:00Z',
    lastActive: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  '3': {
    id: '3',
    name: 'Test User',
    email: 'test@example.com',
    avatar: null,
    role: 'tester',
    preferences: {
      theme: 'system',
      notifications: true
    },
    createdAt: '2024-02-01T09:00:00Z',
    lastActive: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  }
}

// GET - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    
    // Add delay to simulate real API
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100))

    const user = mockUsers[userId]
    
    if (!user) {
      return NextResponse.json(
        { 
          error: 'User not found',
          userId 
        },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      )
    }

    return NextResponse.json(user, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  } catch (error) {
    console.error('User GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT - Update user (for demo purposes)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const updates = await request.json()
    
    if (!mockUsers[userId]) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user data
    mockUsers[userId] = {
      ...mockUsers[userId],
      ...updates,
      lastActive: new Date().toISOString()
    }

    return NextResponse.json(mockUsers[userId], {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  } catch (error) {
    console.error('User PUT error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
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