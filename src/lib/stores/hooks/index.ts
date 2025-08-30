/**
 * Custom hooks for optimized store access and common patterns
 */

import { useCallback, useMemo, useState, useEffect } from 'react'
import { shallow } from 'zustand/shallow'
import { useChatStore } from '../chat-store'
import { useModelStore } from '../model-store'
import { useSettingsStore } from '../settings-store'
import { useMCPStore } from '../mcp-store'
import { useUIStore } from '../ui-store'
import { Chat, Message, Model, MCPServer, AIProvider } from '../types'

// Chat-related hooks
export const useActiveChat = () => {
  return useChatStore(
    useCallback(
      (state) => ({
        activeChat: state.activeChat,
        chat: state.activeChat ? state.chats[state.activeChat] : null,
        messages: state.activeChat
          ? state.messages[state.activeChat] || []
          : [],
        setActiveChat: state.setActiveChat,
      }),
      []
    ),
    shallow
  )
}

export const useChat = (chatId: string | null) => {
  return useChatStore(
    useCallback(
      (state) => {
        if (!chatId) return { chat: null, messages: [] }
        return {
          chat: state.chats[chatId] || null,
          messages: state.messages[chatId] || [],
        }
      },
      [chatId]
    ),
    shallow
  )
}

export const useChatList = () => {
  return useChatStore(
    useCallback(
      (state) => ({
        chats: Object.values(state.chats).sort(
          (a, b) =>
            (b.lastMessageAt?.getTime() || 0) -
            (a.lastMessageAt?.getTime() || 0)
        ),
        searchQuery: state.searchQuery,
        setSearchQuery: state.setSearchQuery,
      }),
      []
    ),
    shallow
  )
}

export const useChatActions = () => {
  return useChatStore(
    useCallback(
      (state) => ({
        createChat: state.createChat,
        deleteChat: state.deleteChat,
        updateChat: state.updateChat,
        sendMessage: state.sendMessage,
        editMessage: state.editMessage,
        deleteMessage: state.deleteMessage,
      }),
      []
    ),
    shallow
  )
}

export const useStreamingMessage = () => {
  return useChatStore(
    useCallback(
      (state) => ({
        streamingMessage: state.streamingMessage,
        startStreamingMessage: state.startStreamingMessage,
        updateStreamingContent: state.updateStreamingContent,
        finishStreamingMessage: state.finishStreamingMessage,
        cancelStreaming: state.cancelStreaming,
      }),
      []
    ),
    shallow
  )
}

// Model-related hooks
export const useSelectedModel = () => {
  return useModelStore(
    useCallback((state) => {
      const { selectedModel } = state
      if (!selectedModel) return { model: null, config: null }

      const model = state.getModel(
        selectedModel.provider,
        selectedModel.modelId
      )
      const config = state.getModelConfig(
        selectedModel.provider,
        selectedModel.modelId
      )

      return {
        selectedModel,
        model,
        config,
        setSelectedModel: state.setSelectedModel,
      }
    }, []),
    shallow
  )
}

export const useModelsByProvider = (provider: AIProvider | 'all' = 'all') => {
  return useModelStore(
    useCallback(
      (state) => {
        if (provider === 'all') {
          return state.getFilteredModels()
        }
        return { [provider]: state.getProviderModels(provider) }
      },
      [provider]
    ),
    shallow
  )
}

export const useModelConfig = (provider: AIProvider, modelId: string) => {
  return useModelStore(
    useCallback(
      (state) => ({
        config: state.getModelConfig(provider, modelId),
        updateConfig: (
          updates: Parameters<typeof state.updateModelConfig>[2]
        ) => state.updateModelConfig(provider, modelId, updates),
        resetConfig: () => state.resetModelConfig(provider, modelId),
      }),
      [provider, modelId]
    ),
    shallow
  )
}

export const useModelSearch = () => {
  return useModelStore(
    useCallback(
      (state) => ({
        searchQuery: state.searchQuery,
        selectedProvider: state.selectedProvider,
        filteredModels: state.getFilteredModels(),
        setSearchQuery: state.setSearchQuery,
        setSelectedProvider: state.setSelectedProvider,
        searchModels: state.searchModels,
      }),
      []
    ),
    shallow
  )
}

// Performance optimized hooks for models grid
export const useOptimizedModelGrid = () => {
  return useModelStore(
    useCallback(
      (state) => ({
        models: state.models,
        customModels: state.customModels,
        activeTab: state.activeTab,
        searchQuery: state.searchQuery,
        selectedProvider: state.selectedProvider,
      }),
      []
    ),
    shallow
  )
}

export const useModelGridActions = () => {
  return useModelStore(
    useCallback(
      (state) => ({
        setSearchQuery: state.setSearchQuery,
        setSelectedProvider: state.setSelectedProvider,
        setSelectedModel: state.setSelectedModel,
        getFilteredModels: state.getFilteredModels,
        getAvailableProviders: state.getAvailableProviders,
      }),
      []
    ),
    shallow
  )
}

export const useModelSelection = () => {
  return useModelStore(
    useCallback(
      (state) => ({
        selectedModel: state.selectedModel,
        setSelectedModel: state.setSelectedModel,
      }),
      []
    ),
    shallow
  )
}

export const useModelTestResults = () => {
  return useModelStore(
    useCallback(
      (state) => ({
        testResults: state.testResults,
        loading: state.loading,
        getModelKey: state.getModelKey,
        formatContextWindow: state.formatContextWindow,
      }),
      []
    ),
    shallow
  )
}

export const useModelTest = (provider: AIProvider, modelId: string) => {
  const modelKey = useModelStore((state) =>
    state.getModelKey(provider, modelId)
  )
  return useModelStore(
    useCallback(
      (state) => ({
        testResult: state.testResults[modelKey],
        isLoading: state.loading.testModel,
        testModel: state.testModel,
      }),
      [modelKey]
    ),
    shallow
  )
}

// Settings-related hooks
export const useTheme = () => {
  return useSettingsStore(
    useCallback(
      (state) => ({
        theme: state.settings.theme,
        effectiveTheme: state.effectiveTheme,
        setTheme: state.setTheme,
        toggleTheme: state.toggleTheme,
      }),
      []
    ),
    shallow
  )
}

export const useApiKeys = () => {
  return useSettingsStore(
    useCallback(
      (state) => ({
        apiKeys: state.settings.apiKeys,
        setApiKey: state.setApiKey,
        removeApiKey: state.removeApiKey,
        hasApiKey: state.hasApiKey,
        validateApiKey: state.validateApiKey,
      }),
      []
    ),
    shallow
  )
}

export const useUIPreferences = () => {
  return useSettingsStore(
    useCallback(
      (state) => ({
        fontSize: state.settings.fontSize,
        sendOnEnter: state.settings.sendOnEnter,
        showTokenCount: state.settings.showTokenCount,
        autoSave: state.settings.autoSave,
        setFontSize: state.setFontSize,
        setSendOnEnter: state.setSendOnEnter,
        setShowTokenCount: state.setShowTokenCount,
        setAutoSave: state.setAutoSave,
      }),
      []
    ),
    shallow
  )
}

// MCP-related hooks
export const useMCPServers = () => {
  return useMCPStore(
    useCallback((state) => {
      const filtered = state.getFilteredServers()
      return {
        servers:
          state.selectedTab === 'builtin' ? filtered.builtin : filtered.custom,
        selectedTab: state.selectedTab,
        searchQuery: state.searchQuery,
        setSelectedTab: state.setSelectedTab,
        setSearchQuery: state.setSearchQuery,
      }
    }, []),
    shallow
  )
}

export const useEnabledMCPServers = () => {
  return useMCPStore(
    useCallback(
      (state) => ({
        enabledServers: state.getEnabledServers(),
        autoInjectServers: state.getAutoInjectServers(),
        globalSettings: state.globalSettings,
      }),
      []
    ),
    shallow
  )
}

export const useMCPServerActions = () => {
  return useMCPStore(
    useCallback(
      (state) => ({
        addCustomServer: state.addCustomServer,
        updateServer: state.updateServer,
        deleteServer: state.deleteServer,
        connectServer: state.connectServer,
        disconnectServer: state.disconnectServer,
        testConnection: state.testConnection,
        toggleServerEnabled: state.toggleServerEnabled,
      }),
      []
    ),
    shallow
  )
}

// UI-related hooks
export const useSidebars = () => {
  return useUIStore(
    useCallback(
      (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarWidth: state.sidebarWidth,
        chatSidebarCollapsed: state.chatSidebarCollapsed,
        chatSidebarWidth: state.chatSidebarWidth,
        setSidebarCollapsed: state.setSidebarCollapsed,
        setChatSidebarCollapsed: state.setChatSidebarCollapsed,
        setSidebarWidth: state.setSidebarWidth,
        setChatSidebarWidth: state.setChatSidebarWidth,
        toggleSidebar: state.toggleSidebar,
        toggleChatSidebar: state.toggleChatSidebar,
      }),
      []
    ),
    shallow
  )
}

export const useModals = () => {
  return useUIStore(
    useCallback(
      (state) => ({
        modals: state.modals,
        openModal: state.openModal,
        closeModal: state.closeModal,
        closeAllModals: state.closeAllModals,
        updateModalProps: state.updateModalProps,
        isModalOpen: state.isModalOpen,
        getActiveModal: state.getActiveModal,
      }),
      []
    ),
    shallow
  )
}

export const useNotifications = () => {
  return useUIStore(
    useCallback(
      (state) => ({
        notifications: state.notifications,
        addNotification: state.addNotification,
        removeNotification: state.removeNotification,
        clearNotifications: state.clearNotifications,
      }),
      []
    ),
    shallow
  )
}

export const useToasts = () => {
  return useUIStore(
    useCallback(
      (state) => ({
        toasts: state.toasts,
        showToast: state.showToast,
        hideToast: state.hideToast,
        clearToasts: state.clearToasts,
      }),
      []
    ),
    shallow
  )
}

export const useLoading = (key?: string) => {
  return useUIStore(
    useCallback(
      (state) => {
        if (key) {
          return {
            loading: state.loading[key] || false,
            setLoading: (loading: boolean) => state.setLoading(key, loading),
          }
        }
        return {
          loading: state.loading,
          isLoading: state.isLoading,
          setLoading: state.setLoading,
          clearLoading: state.clearLoading,
        }
      },
      [key]
    ),
    shallow
  )
}

export const useErrors = (key?: string) => {
  return useUIStore(
    useCallback(
      (state) => {
        if (key) {
          return {
            error: state.errors[key] || null,
            setError: (error: string | null) => state.setError(key, error),
            clearError: () => state.clearError(key),
          }
        }
        return {
          errors: state.errors,
          getError: state.getError,
          setError: state.setError,
          clearError: state.clearError,
          clearAllErrors: state.clearAllErrors,
        }
      },
      [key]
    ),
    shallow
  )
}

export const useCommandPalette = () => {
  return useUIStore(
    useCallback(
      (state) => ({
        commandPalette: state.commandPalette,
        openCommandPalette: state.openCommandPalette,
        closeCommandPalette: state.closeCommandPalette,
        setCommandQuery: state.setCommandQuery,
        selectCommand: state.selectCommand,
        executeSelectedCommand: state.executeSelectedCommand,
        registerCommand: state.registerCommand,
        unregisterCommand: state.unregisterCommand,
      }),
      []
    ),
    shallow
  )
}

// Combined hooks for complex operations
export const useChatWithModel = (chatId: string | null) => {
  const { chat, messages } = useChat(chatId)
  const { selectedModel, model } = useSelectedModel()

  return useMemo(
    () => ({
      chat,
      messages,
      selectedModel,
      model,
      // Computed values
      canSendMessage: chat && model && selectedModel,
      tokenCount: messages.reduce((sum, msg) => sum + (msg.tokens || 0), 0),
    }),
    [chat, messages, selectedModel, model]
  )
}

export const useModelWithConfig = (provider: AIProvider, modelId: string) => {
  const model = useModelStore((state) => state.getModel(provider, modelId))
  const { config, updateConfig, resetConfig } = useModelConfig(
    provider,
    modelId
  )

  return useMemo(
    () => ({
      model,
      config,
      updateConfig,
      resetConfig,
      // Computed values
      isConfigured: config && Object.keys(config).length > 0,
      hasValidConfig: model && config,
    }),
    [model, config, updateConfig, resetConfig]
  )
}

// Performance optimization hooks
export const useDebounced = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export const useThrottled = <T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number
) => {
  const throttledFn = useUIStore((state) => state.throttle(callback, delay))
  return useCallback(throttledFn, [throttledFn])
}

// Cross-store hooks for complex state relationships
export const useGlobalState = () => {
  const { activeChat } = useActiveChat()
  const { selectedModel } = useSelectedModel()
  const { theme } = useTheme()
  const { enabledServers } = useEnabledMCPServers()

  return useMemo(
    () => ({
      activeChat,
      selectedModel,
      theme,
      enabledServers,
      // Computed global state
      isReady: selectedModel !== null,
      mcpEnabled: enabledServers.length > 0,
    }),
    [activeChat, selectedModel, theme, enabledServers]
  )
}
