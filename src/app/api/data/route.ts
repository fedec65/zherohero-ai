/**
 * Generic Data API Route - Mock data endpoint for demo purposes
 * Referenced in demo code for testing fetch operations
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock data collections
const mockDataCollections = {
  users: [
    { id: 1, name: 'John Doe', status: 'active' },
    { id: 2, name: 'Jane Smith', status: 'inactive' },
    { id: 3, name: 'Bob Johnson', status: 'active' },
  ],
  products: [
    { id: 1, name: 'Widget A', price: 19.99, category: 'widgets' },
    { id: 2, name: 'Gadget B', price: 29.99, category: 'gadgets' },
    { id: 3, name: 'Tool C', price: 39.99, category: 'tools' },
  ],
  analytics: {
    pageViews: 12543,
    uniqueVisitors: 3421,
    bounceRate: 0.23,
    avgSessionDuration: 245,
    topPages: [
      { path: '/', views: 5432 },
      { path: '/models', views: 3210 },
      { path: '/chat', views: 2901 },
    ],
    traffic: {
      organic: 45,
      direct: 32,
      referral: 15,
      social: 8,
    },
  },
  performance: {
    serverResponseTime: 120,
    firstContentfulPaint: 1.2,
    largestContentfulPaint: 2.1,
    cumulativeLayoutShift: 0.05,
    timeToInteractive: 3.4,
  },
}

// GET - Retrieve data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'users'
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Add artificial delay to simulate real API
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 300 + 50)
    )

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // Return specific data type
    if (type in mockDataCollections) {
      const data = mockDataCollections[type as keyof typeof mockDataCollections]

      // Handle pagination for array data
      if (Array.isArray(data)) {
        const total = data.length
        const paginatedData = data.slice(offset, offset + limit)

        return NextResponse.json(
          {
            data: paginatedData,
            pagination: {
              total,
              limit,
              offset,
              hasMore: offset + limit < total,
            },
            type,
            timestamp: new Date().toISOString(),
          },
          { headers }
        )
      }

      // Return non-paginated data as-is
      return NextResponse.json(
        {
          data,
          type,
          timestamp: new Date().toISOString(),
        },
        { headers }
      )
    }

    // Return all available data types if invalid type requested
    return NextResponse.json(
      {
        error: `Data type '${type}' not found`,
        availableTypes: Object.keys(mockDataCollections),
        data: null,
      },
      { status: 404, headers }
    )
  } catch (error) {
    console.error('Data GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST - Submit/create data (for testing purposes)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type = 'generic', data } = body

    // Simulate processing time
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 200 + 100)
    )

    // Simulate success/failure based on data completeness
    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        {
          error: 'Data is required',
          received: body,
        },
        { status: 400 }
      )
    }

    // Mock successful creation
    const response = {
      success: true,
      message: 'Data processed successfully',
      id: Math.random().toString(36).substr(2, 9),
      type,
      processedAt: new Date().toISOString(),
      data: {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
      },
    }

    return NextResponse.json(response, {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Data POST error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    )
  }
}

// PUT - Update data
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, type = 'generic', data } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required for updates' },
        { status: 400 }
      )
    }

    // Simulate processing
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 150 + 75)
    )

    const response = {
      success: true,
      message: 'Data updated successfully',
      id,
      type,
      updatedAt: new Date().toISOString(),
      data: {
        ...data,
        id,
        updatedAt: new Date().toISOString(),
      },
    }

    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Data PUT error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    )
  }
}

// DELETE - Delete data
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type') || 'generic'

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required for deletion' },
        { status: 400 }
      )
    }

    // Simulate processing
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 100 + 50)
    )

    return NextResponse.json(
      {
        success: true,
        message: 'Data deleted successfully',
        id,
        type,
        deletedAt: new Date().toISOString(),
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
    console.error('Data DELETE error:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete data',
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
