/**
 * MCP Server List Component
 * Main component that integrates all MCP server management functionality
 */
'use client'

import React, { useState, useMemo } from 'react'
import { Globe, Search, Plus, Settings, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { MCPInfoBanner } from './mcp-info-banner'
import { MCPTabs, MCPTab } from './mcp-tabs'
import { MCPServerCard } from './mcp-server-card'
import { AddMCPServerDialog } from './mcp-add-server-dialog'
import { useMCPStore } from '../../lib/stores/mcp-store'
import { MCPServer } from '../../lib/stores/types/index'

interface MCPServerListProps {
  className?: string
}

export function MCPServerList({ className = '' }: MCPServerListProps) {
  const [activeTab, setActiveTab] = useState<MCPTab>('builtin')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set())

  const {
    builtInServers,
    customServers,
    connectionStates,
    getFilteredServers,
    duplicateServer,
    deleteServer,
    deleteMultipleServers,
    getConnectionStatus,
  } = useMCPStore()

  // Handle tab changes - open dialog for 'add' tab
  const handleTabChange = (tab: MCPTab) => {
    if (tab === 'add') {
      setIsAddDialogOpen(true)
      return
    }
    setActiveTab(tab)
  }

  // Filter servers based on search query
  const filteredServers = useMemo(() => {
    const filtered = getFilteredServers()

    if (!searchQuery.trim()) {
      return filtered
    }

    const query = searchQuery.toLowerCase()
    return {
      builtin: filtered.builtin.filter(
        (server) =>
          server.name.toLowerCase().includes(query) ||
          server.description.toLowerCase().includes(query) ||
          server.url.toLowerCase().includes(query)
      ),
      custom: filtered.custom.filter(
        (server) =>
          server.name.toLowerCase().includes(query) ||
          server.description.toLowerCase().includes(query) ||
          server.url.toLowerCase().includes(query)
      ),
    }
  }, [searchQuery, getFilteredServers])

  const currentServers =
    activeTab === 'builtin' ? filteredServers.builtin : filteredServers.custom

  // Server actions
  const handleEditServer = (server: MCPServer) => {
    console.log('Edit server:', server.name)
    // TODO: Implement edit functionality
  }

  const handleDuplicateServer = (server: MCPServer) => {
    duplicateServer(server.id)
  }

  const handleDeleteServer = (server: MCPServer) => {
    if (window.confirm(`Are you sure you want to delete "${server.name}"?`)) {
      deleteServer(server.id)
    }
  }

  const handleBulkDelete = () => {
    if (selectedServers.size === 0) return

    const serverNames = Array.from(selectedServers)
      .map((id) => {
        const server = [...builtInServers, ...customServers].find(
          (s) => s.id === id
        )
        return server?.name
      })
      .filter(Boolean)

    if (
      window.confirm(
        `Are you sure you want to delete ${selectedServers.size} server(s)?\n\n${serverNames.join(', ')}`
      )
    ) {
      deleteMultipleServers(Array.from(selectedServers))
      setSelectedServers(new Set())
    }
  }

  const toggleServerSelection = (serverId: string) => {
    const newSelection = new Set(selectedServers)
    if (newSelection.has(serverId)) {
      newSelection.delete(serverId)
    } else {
      newSelection.add(serverId)
    }
    setSelectedServers(newSelection)
  }

  const EmptyState = ({
    title,
    description,
    icon: Icon,
  }: {
    title: string
    description: string
    icon: React.ComponentType<any>
  }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-inner dark:from-gray-800 dark:to-gray-700">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50">
          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="mx-auto mb-6 max-w-md leading-relaxed text-gray-600 dark:text-gray-400">
        {description}
      </p>
      {activeTab === 'custom' && (
        <div className="space-y-4">
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="transform rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Your First Server
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Start with built-in servers or create custom integrations
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Information Banner */}
      <MCPInfoBanner />

      {/* Search and Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search servers..."
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {selectedServers.size > 0 && (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedServers.size} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                leftIcon={<Trash2 className="h-4 w-4" />}
              >
                Delete Selected
              </Button>
            </>
          )}

          <Button
            onClick={() => setIsAddDialogOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Server
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <MCPTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        builtinCount={builtInServers.length}
        customCount={customServers.length}
      />

      {/* Content */}
      <div className="min-h-[400px]">
        {currentServers.length === 0 ? (
          searchQuery ? (
            <EmptyState
              title="No servers found"
              description={`No servers match your search for "${searchQuery}". Try adjusting your search terms or browse all available servers.`}
              icon={Search}
            />
          ) : activeTab === 'builtin' ? (
            <EmptyState
              title="No Built-in Servers Available"
              description="Built-in MCP servers will appear here when they become available. These are pre-configured, ready-to-use servers that extend AI capabilities with specialized tools and resources."
              icon={Globe}
            />
          ) : (
            <EmptyState
              title="Create Your First MCP Server"
              description="Add custom MCP servers to extend AI capabilities with your own tools, databases, APIs, and specialized resources. Connect to local services or third-party integrations."
              icon={Settings}
            />
          )
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {currentServers.map((server) => (
              <div key={server.id} className="relative">
                {/* Selection checkbox for custom servers */}
                {activeTab === 'custom' && (
                  <div className="absolute left-3 top-3 z-10">
                    <label className="relative inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedServers.has(server.id)}
                        onChange={() => toggleServerSelection(server.id)}
                        className="peer sr-only"
                      />
                      <div className="flex h-5 w-5 items-center justify-center rounded border-2 border-gray-300 bg-white transition-all duration-200 peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700">
                        <svg
                          className="h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </label>
                  </div>
                )}

                <MCPServerCard
                  server={server}
                  connectionStatus={getConnectionStatus(server.id)}
                  onEdit={handleEditServer}
                  onDuplicate={handleDuplicateServer}
                  onDelete={handleDeleteServer}
                  isBuiltin={activeTab === 'builtin'}
                  className={
                    selectedServers.has(server.id) ? 'ring-2 ring-blue-500' : ''
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Server Dialog */}
      <AddMCPServerDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />
    </div>
  )
}
