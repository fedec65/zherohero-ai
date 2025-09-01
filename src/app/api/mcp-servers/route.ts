/**
 * MCP Servers API Route - Manage Model Context Protocol servers
 * Handles CRUD operations for MCP server configurations
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock MCP servers storage (in production, this would be in a database)
let mockMCPServers: any[] = [
  {
    id: 'github-1',
    name: 'GitHub MCP Server',
    description: 'Connect to GitHub repositories and issues',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
    type: 'built-in',
    enabled: false,
    capabilities: ['repositories', 'issues', 'pull-requests'],
    category: 'development',
    icon: 'https://github.com/favicon.ico',
    config: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'filesystem-1',
    name: 'Filesystem MCP Server',
    description: 'Access local filesystem operations',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
    type: 'built-in',
    enabled: false,
    capabilities: ['read-files', 'write-files', 'list-directories'],
    category: 'system',
    icon: null,
    config: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

let nextMCPId = 3

interface MCPServer {
  id: string
  name: string
  description?: string
  url: string
  type: 'built-in' | 'custom'
  enabled: boolean
  capabilities?: string[]
  category?: string
  icon?: string | null
  config?: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface CreateMCPServerRequest {
  name: string
  description?: string
  url: string
  capabilities?: string[]
  category?: string
  icon?: string
  config?: Record<string, any>
}

interface UpdateMCPServerRequest {
  name?: string
  description?: string
  url?: string
  enabled?: boolean
  capabilities?: string[]
  category?: string
  icon?: string
  config?: Record<string, any>
}

// GET - Retrieve MCP servers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('id')
    const type = searchParams.get('type') // 'built-in' or 'custom'
    const enabled = searchParams.get('enabled')
    const category = searchParams.get('category')

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // Get specific server
    if (serverId) {
      const server = mockMCPServers.find((s) => s.id === serverId)
      if (!server) {
        return NextResponse.json(
          { error: 'MCP server not found' },
          { status: 404, headers }
        )
      }
      return NextResponse.json(server, { headers })
    }

    // Filter servers
    let filteredServers = mockMCPServers

    if (type) {
      filteredServers = filteredServers.filter((s) => s.type === type)
    }

    if (enabled !== null) {
      const isEnabled = enabled === 'true'
      filteredServers = filteredServers.filter((s) => s.enabled === isEnabled)
    }

    if (category) {
      filteredServers = filteredServers.filter((s) => s.category === category)
    }

    // Sort by name
    filteredServers.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json(
      {
        servers: filteredServers,
        total: filteredServers.length,
        categories: [
          ...new Set(mockMCPServers.map((s) => s.category).filter(Boolean)),
        ],
        enabledCount: filteredServers.filter((s) => s.enabled).length,
      },
      { headers }
    )
  } catch (error) {
    console.error('MCP servers GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve MCP servers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST - Create a new MCP server
export async function POST(request: NextRequest) {
  try {
    const body: CreateMCPServerRequest = await request.json()

    // Validate required fields
    if (!body.name || !body.url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      )
    }

    // Check for duplicate names
    const existingServer = mockMCPServers.find((s) => s.name === body.name)
    if (existingServer) {
      return NextResponse.json(
        { error: 'Server with this name already exists' },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()
    const newServer: MCPServer = {
      id: `custom-${nextMCPId++}`,
      name: body.name,
      description: body.description,
      url: body.url,
      type: 'custom',
      enabled: false,
      capabilities: body.capabilities || [],
      category: body.category || 'custom',
      icon: body.icon || null,
      config: body.config || {},
      createdAt: now,
      updatedAt: now,
    }

    mockMCPServers.push(newServer)

    return NextResponse.json(newServer, {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('MCP servers POST error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create MCP server',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    )
  }
}

// PUT - Update an existing MCP server
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('id')

    if (!serverId) {
      return NextResponse.json(
        { error: 'Server ID is required' },
        { status: 400 }
      )
    }

    const body: UpdateMCPServerRequest = await request.json()
    const serverIndex = mockMCPServers.findIndex((s) => s.id === serverId)

    if (serverIndex === -1) {
      return NextResponse.json(
        { error: 'MCP server not found' },
        { status: 404 }
      )
    }

    // Check if trying to rename to an existing name
    if (body.name && body.name !== mockMCPServers[serverIndex].name) {
      const existingServer = mockMCPServers.find(
        (s) => s.name === body.name && s.id !== serverId
      )
      if (existingServer) {
        return NextResponse.json(
          { error: 'Server with this name already exists' },
          { status: 409 }
        )
      }
    }

    // Update server
    const updatedServer = {
      ...mockMCPServers[serverIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    }

    mockMCPServers[serverIndex] = updatedServer

    return NextResponse.json(updatedServer, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('MCP servers PUT error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update MCP server',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    )
  }
}

// DELETE - Delete an MCP server
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('id')

    if (!serverId) {
      return NextResponse.json(
        { error: 'Server ID is required' },
        { status: 400 }
      )
    }

    const serverIndex = mockMCPServers.findIndex((s) => s.id === serverId)

    if (serverIndex === -1) {
      return NextResponse.json(
        { error: 'MCP server not found' },
        { status: 404 }
      )
    }

    const server = mockMCPServers[serverIndex]

    // Prevent deletion of built-in servers
    if (server.type === 'built-in') {
      return NextResponse.json(
        { error: 'Built-in servers cannot be deleted' },
        { status: 403 }
      )
    }

    // Remove server
    mockMCPServers.splice(serverIndex, 1)

    return NextResponse.json(
      { message: 'MCP server deleted successfully' },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    )
  } catch (error) {
    console.error('MCP servers DELETE error:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete MCP server',
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
