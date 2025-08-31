/**
 * MCP Store - Manages Model Context Protocol servers and integrations
 */

import { createWithEqualityFn } from 'zustand/traditional'
import { subscribeWithSelector } from 'zustand/middleware'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { MCPServer, MCPCapability, AsyncState, Patch } from './types/index'
import {
  createStorage,
  createAutoPartializer,
  PersistOptions,
} from './middleware/persistence'
import { nanoid } from 'nanoid'
import { TavilyMCPServer } from '../mcp/servers/tavily'
import { autoInjectionManager } from '../mcp/auto-injection'
import { useSettingsStore } from './settings-store'

// Built-in MCP servers (these would be provided by the platform)
const BUILT_IN_SERVERS: MCPServer[] = [
  {
    id: 'tavily-search',
    name: 'Tavily Search',
    description:
      'Real-time web search powered by Tavily API. Provides access to current information, news, and web content to enhance AI responses with up-to-date data.',
    url: 'https://api.tavily.com/mcp',
    enabled: false,
    autoInject: true,
    capabilities: ['tools', 'resources'],
    config: {
      apiKey: '',
      searchDepth: 'basic',
      maxResults: 5,
      includeImages: false,
      includeAnswer: true,
    },
    status: 'disconnected',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
]

// MCP server instances (not persisted)
interface MCPServerInstances {
  tavilyServers: Map<string, TavilyMCPServer>
}

// MCP store state interface
interface MCPState {
  // Servers
  builtInServers: MCPServer[]
  customServers: MCPServer[]

  // Global MCP settings
  globalSettings: {
    autoInjectEnabled: boolean
    maxConcurrentConnections: number
    connectionTimeout: number
    retryAttempts: number
    retryDelay: number
    logLevel: 'error' | 'warn' | 'info' | 'debug'
  }

  // UI state
  selectedTab: 'builtin' | 'custom'
  searchQuery: string

  // Connection states
  connectionStates: Record<
    string,
    {
      status: 'connecting' | 'connected' | 'disconnected' | 'error'
      lastConnected?: Date
      lastError?: string
      capabilities?: MCPCapability[]
    }
  >

  // Loading states
  loading: {
    addServer: boolean
    testConnection: boolean
    healthCheck: boolean
  }

  // Statistics
  stats: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageResponseTime: number
  }
}

// MCP store actions interface
interface MCPActions {
  // Server management
  addCustomServer: (
    server: Omit<MCPServer, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ) => Promise<string>
  updateServer: (serverId: string, updates: Patch<MCPServer>) => void
  deleteServer: (serverId: string) => void
  duplicateServer: (serverId: string) => string

  // Server operations
  connectServer: (serverId: string) => Promise<void>
  disconnectServer: (serverId: string) => Promise<void>
  testConnection: (serverId: string) => Promise<boolean>
  performHealthCheck: (serverId: string) => Promise<{
    healthy: boolean
    latency: number
    capabilities: MCPCapability[]
  }>

  // Server configuration
  toggleServerEnabled: (serverId: string, enabled: boolean) => void
  toggleAutoInject: (serverId: string, autoInject: boolean) => void
  updateServerConfig: (
    serverId: string,
    config: Record<string, unknown>
  ) => void

  // Bulk operations
  connectAllServers: () => Promise<void>
  disconnectAllServers: () => Promise<void>
  enableAllServers: (enabled: boolean) => void
  deleteMultipleServers: (serverIds: string[]) => void

  // Search and filtering
  setSearchQuery: (query: string) => void
  setSelectedTab: (tab: 'builtin' | 'custom') => void
  getFilteredServers: () => { builtin: MCPServer[]; custom: MCPServer[] }
  searchServers: (query: string) => MCPServer[]
  getServersByCapability: (capability: MCPCapability) => MCPServer[]

  // Global settings
  updateGlobalSettings: (settings: Partial<MCPState['globalSettings']>) => void
  resetGlobalSettings: () => void

  // Integration helpers
  getEnabledServers: () => MCPServer[]
  getAutoInjectServers: () => MCPServer[]
  getServerCapabilities: (serverId: string) => MCPCapability[]
  isServerHealthy: (serverId: string) => boolean

  // Server instance management
  initializeTavilyServer: (serverId: string) => Promise<void>
  getTavilyServer: (serverId: string) => TavilyMCPServer | null
  updateServerInstance: (serverId: string) => Promise<void>
  cleanupServerInstances: () => void

  // Request handling
  executeServerRequest: (
    serverId: string,
    request: MCPRequest
  ) => Promise<MCPResponse>
  broadcastRequest: (
    request: MCPRequest,
    capability: MCPCapability
  ) => Promise<MCPResponse[]>

  // Statistics and monitoring
  updateStats: (success: boolean, responseTime: number) => void
  getServerStats: (serverId: string) => {
    requests: number
    successes: number
    failures: number
    avgResponseTime: number
  }
  resetStats: () => void

  // Import/Export
  exportServers: () => Promise<Blob>
  importServers: (file: File) => Promise<void>

  // Utilities
  validateServerConfig: (server: Partial<MCPServer>) => {
    isValid: boolean
    errors: string[]
  }
  getConnectionStatus: (
    serverId: string
  ) => 'connecting' | 'connected' | 'disconnected' | 'error'
  formatServerUrl: (url: string) => string
}

// MCP Request/Response types
interface MCPRequest {
  method: string
  params?: Record<string, unknown>
  id?: string
}

interface MCPResponse {
  result?: unknown
  error?: {
    code: number
    message: string
  }
  id?: string
}

type MCPStore = MCPState & MCPActions

// Default global settings
const DEFAULT_GLOBAL_SETTINGS: MCPState['globalSettings'] = {
  autoInjectEnabled: true,
  maxConcurrentConnections: 10,
  connectionTimeout: 5000,
  retryAttempts: 3,
  retryDelay: 1000,
  logLevel: 'info',
}

// Global server instances (not persisted)
const serverInstances: MCPServerInstances = {
  tavilyServers: new Map(),
}

// Create the MCP store
export const useMCPStore = createWithEqualityFn<MCPStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // Initial state
        builtInServers: BUILT_IN_SERVERS,
        customServers: [],
        globalSettings: DEFAULT_GLOBAL_SETTINGS,
        selectedTab: 'builtin',
        searchQuery: '',
        connectionStates: {},
        loading: {
          addServer: false,
          testConnection: false,
          healthCheck: false,
        },
        stats: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
        },

        // Actions
        addCustomServer: async (serverData) => {
          const serverId = nanoid()
          const now = new Date()

          set((state) => {
            state.loading.addServer = true
          })

          try {
            // Validate server configuration
            const validation = get().validateServerConfig(serverData)
            if (!validation.isValid) {
              throw new Error(
                `Invalid server configuration: ${validation.errors.join(', ')}`
              )
            }

            const server: MCPServer = {
              ...serverData,
              id: serverId,
              status: 'disconnected',
              createdAt: now,
              updatedAt: now,
            }

            set((state) => {
              state.customServers.push(server)
              state.connectionStates[serverId] = {
                status: 'disconnected',
              }
              state.loading.addServer = false
            })

            // Auto-connect if enabled
            if (serverData.enabled) {
              await get().connectServer(serverId)
            }

            return serverId
          } catch (error) {
            set((state) => {
              state.loading.addServer = false
            })
            throw error
          }
        },

        updateServer: (serverId: string, updates: Patch<MCPServer>) => {
          set((state) => {
            // Check built-in servers
            const builtInIndex = state.builtInServers.findIndex(
              (s) => s.id === serverId
            )
            if (builtInIndex >= 0) {
              Object.assign(state.builtInServers[builtInIndex], updates, {
                updatedAt: new Date(),
              })
              return
            }

            // Check custom servers
            const customIndex = state.customServers.findIndex(
              (s) => s.id === serverId
            )
            if (customIndex >= 0) {
              Object.assign(state.customServers[customIndex], updates, {
                updatedAt: new Date(),
              })
            }
          })
        },

        deleteServer: (serverId: string) => {
          set((state) => {
            // Remove from custom servers (built-in servers can't be deleted)
            state.customServers = state.customServers.filter(
              (s) => s.id !== serverId
            )

            // Clean up connection state
            delete state.connectionStates[serverId]
          })
        },

        duplicateServer: (serverId: string) => {
          const servers = [...get().builtInServers, ...get().customServers]
          const originalServer = servers.find((s) => s.id === serverId)

          if (!originalServer) return ''

          const newServerId = nanoid()
          const now = new Date()

          const duplicatedServer: MCPServer = {
            ...originalServer,
            id: newServerId,
            name: `${originalServer.name} (Copy)`,
            enabled: false, // Start disabled to avoid conflicts
            createdAt: now,
            updatedAt: now,
          }

          set((state) => {
            state.customServers.push(duplicatedServer)
            state.connectionStates[newServerId] = {
              status: 'disconnected',
            }
          })

          return newServerId
        },

        // Server operations
        connectServer: async (serverId: string) => {
          set((state) => {
            state.connectionStates[serverId] = {
              ...state.connectionStates[serverId],
              status: 'connecting',
            }
          })

          try {
            const servers = [...get().builtInServers, ...get().customServers]
            const server = servers.find((s) => s.id === serverId)

            if (!server) {
              throw new Error('Server not found')
            }

            // Handle Tavily server connection
            if (serverId === 'tavily-search') {
              await get().initializeTavilyServer(serverId)

              const tavilyServer = get().getTavilyServer(serverId)
              if (tavilyServer) {
                const health = await tavilyServer.healthCheck()

                set((state) => {
                  state.connectionStates[serverId] = {
                    status: 'connected',
                    lastConnected: new Date(),
                    capabilities: health.capabilities,
                  }
                })

                get().updateServer(serverId, {
                  ...server,
                  status: 'connected',
                })
              }
            } else {
              // Handle other server types (future implementation)
              throw new Error(`Server type not supported: ${serverId}`)
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error'

            set((state) => {
              state.connectionStates[serverId] = {
                status: 'error',
                lastError: errorMessage,
              }
            })

            const state = get()
            const currentServer =
              state.builtInServers.find((s) => s.id === serverId) ||
              state.customServers.find((s) => s.id === serverId)
            if (currentServer) {
              get().updateServer(serverId, {
                ...currentServer,
                status: 'error',
              })
            }
            throw error
          }
        },

        disconnectServer: async (serverId: string) => {
          try {
            // Handle Tavily server disconnection
            if (serverId === 'tavily-search') {
              const tavilyServer = serverInstances.tavilyServers.get(serverId)
              if (tavilyServer) {
                await tavilyServer.disconnect()
                serverInstances.tavilyServers.delete(serverId)
                autoInjectionManager.unregisterServer(serverId)
              }
            }

            set((state) => {
              state.connectionStates[serverId] = {
                ...state.connectionStates[serverId],
                status: 'disconnected',
              }
            })

            const state = get()
            const currentServer =
              state.builtInServers.find((s) => s.id === serverId) ||
              state.customServers.find((s) => s.id === serverId)
            if (currentServer) {
              get().updateServer(serverId, {
                ...currentServer,
                status: 'disconnected',
              })
            }
          } catch (error) {
            console.error('Failed to disconnect server:', error)
          }
        },

        testConnection: async (serverId: string) => {
          set((state) => {
            state.loading.testConnection = true
          })

          try {
            const servers = [...get().builtInServers, ...get().customServers]
            const server = servers.find((s) => s.id === serverId)

            if (!server) {
              throw new Error('Server not found')
            }

            // TODO: Implement actual connection testing
            await new Promise((resolve) => setTimeout(resolve, 1000))

            const success = Math.random() > 0.3 // 70% success rate for demo

            set((state) => {
              state.loading.testConnection = false
            })

            return success
          } catch (error) {
            set((state) => {
              state.loading.testConnection = false
            })
            return false
          }
        },

        performHealthCheck: async (serverId: string) => {
          set((state) => {
            state.loading.healthCheck = true
          })

          try {
            let result: {
              healthy: boolean
              latency: number
              capabilities: MCPCapability[]
            }

            // Handle Tavily server health check
            if (serverId === 'tavily-search') {
              const tavilyServer = serverInstances.tavilyServers.get(serverId)
              if (tavilyServer) {
                result = await tavilyServer.healthCheck()
              } else {
                throw new Error('Tavily server not initialized')
              }
            } else {
              // Handle other server types or fallback
              throw new Error(
                `Health check not implemented for server: ${serverId}`
              )
            }

            set((state) => {
              state.loading.healthCheck = false
              if (state.connectionStates[serverId]) {
                state.connectionStates[serverId].capabilities =
                  result.capabilities
              }
            })

            const state = get()
            const currentServer =
              state.builtInServers.find((s) => s.id === serverId) ||
              state.customServers.find((s) => s.id === serverId)
            if (currentServer) {
              get().updateServer(serverId, {
                ...currentServer,
                lastHealthCheck: new Date(),
                status: result.healthy ? 'connected' : 'error',
              })
            }

            return result
          } catch (error) {
            set((state) => {
              state.loading.healthCheck = false
            })

            // Return failed health check result
            return {
              healthy: false,
              latency: 0,
              capabilities: [],
            }
          }
        },

        // Server configuration
        toggleServerEnabled: (serverId: string, enabled: boolean) => {
          const state = get()
          const currentServer =
            state.builtInServers.find((s) => s.id === serverId) ||
            state.customServers.find((s) => s.id === serverId)
          if (currentServer) {
            get().updateServer(serverId, { ...currentServer, enabled })
          }

          if (enabled) {
            // Auto-connect when enabling
            get().connectServer(serverId).catch(console.error)
          } else {
            // Disconnect when disabling
            get().disconnectServer(serverId)
          }
        },

        toggleAutoInject: (serverId: string, autoInject: boolean) => {
          const state = get()
          const currentServer =
            state.builtInServers.find((s) => s.id === serverId) ||
            state.customServers.find((s) => s.id === serverId)
          if (currentServer) {
            get().updateServer(serverId, { ...currentServer, autoInject })
          }
        },

        updateServerConfig: (
          serverId: string,
          config: Record<string, unknown>
        ) => {
          const state = get()
          const currentServer =
            state.builtInServers.find((s) => s.id === serverId) ||
            state.customServers.find((s) => s.id === serverId)
          if (currentServer) {
            get().updateServer(serverId, { ...currentServer, config })
            // Update server instance if it exists
            get().updateServerInstance(serverId).catch(console.error)
          }
        },

        // Bulk operations
        connectAllServers: async () => {
          const enabledServers = get().getEnabledServers()

          const connectionPromises = enabledServers.map((server) =>
            get().connectServer(server.id).catch(console.error)
          )

          await Promise.all(connectionPromises)
        },

        disconnectAllServers: async () => {
          const allServers = [...get().builtInServers, ...get().customServers]

          const disconnectionPromises = allServers.map((server) =>
            get().disconnectServer(server.id)
          )

          await Promise.all(disconnectionPromises)
        },

        enableAllServers: (enabled: boolean) => {
          set((state) => {
            state.builtInServers.forEach((server) => {
              server.enabled = enabled
            })
            state.customServers.forEach((server) => {
              server.enabled = enabled
            })
          })
        },

        deleteMultipleServers: (serverIds: string[]) => {
          set((state) => {
            // Only delete custom servers
            state.customServers = state.customServers.filter(
              (server) => !serverIds.includes(server.id)
            )

            // Clean up connection states
            serverIds.forEach((id) => {
              delete state.connectionStates[id]
            })
          })
        },

        // Search and filtering
        setSearchQuery: (query: string) => {
          set((state) => {
            state.searchQuery = query
          })
        },

        setSelectedTab: (tab: 'builtin' | 'custom') => {
          set((state) => {
            state.selectedTab = tab
          })
        },

        getFilteredServers: () => {
          const state = get()
          const { searchQuery } = state
          const lowerQuery = searchQuery.toLowerCase()

          const filterServers = (servers: MCPServer[]) =>
            servers.filter(
              (server) =>
                server.name.toLowerCase().includes(lowerQuery) ||
                server.description.toLowerCase().includes(lowerQuery) ||
                server.url.toLowerCase().includes(lowerQuery)
            )

          return {
            builtin: filterServers(state.builtInServers),
            custom: filterServers(state.customServers),
          }
        },

        searchServers: (query: string) => {
          const allServers = [...get().builtInServers, ...get().customServers]
          const lowerQuery = query.toLowerCase()

          return allServers.filter(
            (server) =>
              server.name.toLowerCase().includes(lowerQuery) ||
              server.description.toLowerCase().includes(lowerQuery) ||
              server.url.toLowerCase().includes(lowerQuery)
          )
        },

        getServersByCapability: (capability: MCPCapability) => {
          const allServers = [...get().builtInServers, ...get().customServers]
          return allServers.filter((server) =>
            server.capabilities.includes(capability)
          )
        },

        // Global settings
        updateGlobalSettings: (
          settings: Partial<MCPState['globalSettings']>
        ) => {
          set((state) => {
            Object.assign(state.globalSettings, settings)
          })
        },

        resetGlobalSettings: () => {
          set((state) => {
            state.globalSettings = { ...DEFAULT_GLOBAL_SETTINGS }
          })
        },

        // Integration helpers
        getEnabledServers: () => {
          const allServers = [...get().builtInServers, ...get().customServers]
          return allServers.filter((server) => server.enabled)
        },

        getAutoInjectServers: () => {
          const enabledServers = get().getEnabledServers()
          return enabledServers.filter((server) => server.autoInject)
        },

        getServerCapabilities: (serverId: string) => {
          const connectionState = get().connectionStates[serverId]
          const servers = [...get().builtInServers, ...get().customServers]
          const server = servers.find((s) => s.id === serverId)

          return connectionState?.capabilities || server?.capabilities || []
        },

        isServerHealthy: (serverId: string) => {
          const connectionState = get().connectionStates[serverId]
          return connectionState?.status === 'connected'
        },

        // Server instance management
        initializeTavilyServer: async (serverId: string) => {
          const servers = [...get().builtInServers, ...get().customServers]
          const serverConfig = servers.find((s) => s.id === serverId)

          if (!serverConfig) {
            throw new Error(`Server ${serverId} not found`)
          }

          // Check if this is a Tavily server
          if (serverId !== 'tavily-search') {
            throw new Error(`Server ${serverId} is not a Tavily server`)
          }

          try {
            // Get Tavily API key from settings
            const apiKey = useSettingsStore.getState().getApiKey('tavily')
            if (!apiKey) {
              throw new Error(
                'Tavily API key not configured. Please add your Tavily API key in Settings.'
              )
            }

            // Update server config with API key from settings
            const configWithApiKey = {
              ...serverConfig,
              config: {
                ...serverConfig.config,
                apiKey,
              },
            }

            // Create Tavily server instance
            const tavilyServer = new TavilyMCPServer(configWithApiKey)
            await tavilyServer.initialize()

            // Store instance
            serverInstances.tavilyServers.set(serverId, tavilyServer)

            // Register with auto-injection manager
            autoInjectionManager.registerServer(serverId, tavilyServer)

            console.log(`Tavily server ${serverId} initialized successfully`)
          } catch (error) {
            console.error(
              `Failed to initialize Tavily server ${serverId}:`,
              error
            )
            throw error
          }
        },

        getTavilyServer: (serverId: string) => {
          return serverInstances.tavilyServers.get(serverId) || null
        },

        updateServerInstance: async (serverId: string) => {
          const servers = [...get().builtInServers, ...get().customServers]
          const serverConfig = servers.find((s) => s.id === serverId)

          if (!serverConfig) {
            return
          }

          // Update Tavily server if it exists
          const tavilyServer = serverInstances.tavilyServers.get(serverId)
          if (tavilyServer) {
            try {
              await tavilyServer.updateConfig(serverConfig.config)
            } catch (error) {
              console.error(
                `Failed to update Tavily server ${serverId}:`,
                error
              )
            }
          }
        },

        cleanupServerInstances: () => {
          // Disconnect all Tavily servers
          for (const [
            serverId,
            server,
          ] of serverInstances.tavilyServers.entries()) {
            server.disconnect().catch(console.error)
            autoInjectionManager.unregisterServer(serverId)
          }
          serverInstances.tavilyServers.clear()

          // Cleanup auto-injection manager
          autoInjectionManager.cleanup()
        },

        // Request handling
        executeServerRequest: async (serverId: string, request: MCPRequest) => {
          const startTime = Date.now()

          try {
            const isHealthy = get().isServerHealthy(serverId)
            if (!isHealthy) {
              throw new Error('Server is not connected')
            }

            // TODO: Implement actual MCP request execution
            await new Promise((resolve) =>
              setTimeout(resolve, 100 + Math.random() * 500)
            )

            const responseTime = Date.now() - startTime
            get().updateStats(true, responseTime)

            // Mock response
            const response: MCPResponse = {
              result: { success: true, data: 'Mock response' },
              id: request.id,
            }

            return response
          } catch (error) {
            const responseTime = Date.now() - startTime
            get().updateStats(false, responseTime)

            const response: MCPResponse = {
              error: {
                code: -1,
                message:
                  error instanceof Error ? error.message : 'Unknown error',
              },
              id: request.id,
            }

            return response
          }
        },

        broadcastRequest: async (
          request: MCPRequest,
          capability: MCPCapability
        ) => {
          const serversWithCapability = get()
            .getServersByCapability(capability)
            .filter(
              (server) => server.enabled && get().isServerHealthy(server.id)
            )

          const responses = await Promise.all(
            serversWithCapability.map((server) =>
              get().executeServerRequest(server.id, request)
            )
          )

          return responses
        },

        // Statistics and monitoring
        updateStats: (success: boolean, responseTime: number) => {
          set((state) => {
            state.stats.totalRequests++

            if (success) {
              state.stats.successfulRequests++
            } else {
              state.stats.failedRequests++
            }

            // Update average response time
            const totalRequests = state.stats.totalRequests
            const currentAvg = state.stats.averageResponseTime
            state.stats.averageResponseTime =
              (currentAvg * (totalRequests - 1) + responseTime) / totalRequests
          })
        },

        getServerStats: (serverId: string) => {
          // TODO: Implement per-server statistics tracking
          return {
            requests: 0,
            successes: 0,
            failures: 0,
            avgResponseTime: 0,
          }
        },

        resetStats: () => {
          set((state) => {
            state.stats = {
              totalRequests: 0,
              successfulRequests: 0,
              failedRequests: 0,
              averageResponseTime: 0,
            }
          })
        },

        // Import/Export
        exportServers: async () => {
          const { customServers } = get()

          const exportData = {
            version: 1,
            servers: customServers.map((server) => ({
              ...server,
              // Remove sensitive data
              config: {},
            })),
            exportedAt: new Date().toISOString(),
          }

          const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json',
          })

          return blob
        },

        importServers: async (file: File) => {
          const text = await file.text()
          const importData = JSON.parse(text)

          if (!importData.servers || !Array.isArray(importData.servers)) {
            throw new Error('Invalid import file format')
          }

          const serversToImport: MCPServer[] = importData.servers.map(
            (serverData: any) => ({
              ...serverData,
              id: nanoid(), // Generate new IDs to avoid conflicts
              enabled: false, // Start disabled for safety
              status: 'disconnected',
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          )

          set((state) => {
            state.customServers.push(...serversToImport)

            // Initialize connection states
            serversToImport.forEach((server) => {
              state.connectionStates[server.id] = {
                status: 'disconnected',
              }
            })
          })
        },

        // Utilities
        validateServerConfig: (server: Partial<MCPServer>) => {
          const errors: string[] = []

          if (!server.name || server.name.trim().length === 0) {
            errors.push('Server name is required')
          }

          if (!server.url || server.url.trim().length === 0) {
            errors.push('Server URL is required')
          } else {
            try {
              new URL(server.url)
            } catch {
              errors.push('Invalid server URL format')
            }
          }

          if (server.capabilities && !Array.isArray(server.capabilities)) {
            errors.push('Capabilities must be an array')
          }

          return {
            isValid: errors.length === 0,
            errors,
          }
        },

        getConnectionStatus: (serverId: string) => {
          const connectionState = get().connectionStates[serverId]
          return connectionState?.status || 'disconnected'
        },

        formatServerUrl: (url: string) => {
          try {
            const urlObj = new URL(url)
            return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`
          } catch {
            return url
          }
        },
      })),
      {
        name: 'minddeck-mcp-store',
        storage: createStorage('localStorage'),
        version: 1,
        partialize: createAutoPartializer(['loading', 'connectionStates']),
        onRehydrateStorage: () => (state) => {
          // Reset transient state after rehydration
          if (state) {
            state.loading = {
              testConnection: false,
              enableServer: false,
              addCustomServer: false,
              removeServer: false,
            }
            state.connectionStates = {}
            
            // Initialize connection states for servers
            ;[...state.builtInServers, ...state.customServers].forEach(
              (server) => {
                if (!state.connectionStates[server.id]) {
                  state.connectionStates[server.id] = {
                    status: 'disconnected',
                  }
                }
              }
            )
            
            // Auto-injection will be handled automatically when servers are registered
          }
        },
      } as any
    )
  )
)
