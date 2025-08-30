/**
 * Main store exports and store composition
 */

// Store exports
export { useChatStore } from './chat-store'
export { useModelStore } from './model-store'
export { useSettingsStore } from './settings-store'
export { useMCPStore } from './mcp-store'
export { useUIStore } from './ui-store'

// Hook exports
export * from './hooks'

// Type exports
export * from './types'

// Middleware exports
export * from './middleware/persistence'

// Store initialization and cross-store subscriptions
import { useChatStore } from './chat-store'
import { useModelStore } from './model-store'
import { useSettingsStore } from './settings-store'
import { useMCPStore } from './mcp-store'
import { useUIStore } from './ui-store'

/**
 * Initialize cross-store subscriptions and relationships
 */
export const initializeStores = () => {
  // Subscribe to model changes and update active chat model
  useModelStore.subscribe(
    (state) => state.selectedModel,
    (selectedModel) => {
      if (selectedModel) {
        const activeChat = useChatStore.getState().activeChat
        if (activeChat) {
          // Update the chat model
          const chatState = useChatStore.getState()
          if (chatState.chats[activeChat]) {
            chatState.updateChat(activeChat, {
              ...chatState.chats[activeChat],
              modelId: `${selectedModel.provider}:${selectedModel.modelId}`,
            })
          }
        }
      }
    }
  )

  // Subscribe to settings changes and apply them
  useSettingsStore.subscribe(
    (state) => state.settings.sidebarWidth,
    (sidebarWidth) => {
      useUIStore.getState().setSidebarWidth(sidebarWidth)
    }
  )

  // Subscribe to UI sidebar changes and persist to settings
  useUIStore.subscribe(
    (state) => state.sidebarWidth,
    (sidebarWidth) => {
      useSettingsStore.getState().updateSettings({ sidebarWidth })
    }
  )

  // Subscribe to theme changes and apply to document
  useSettingsStore.subscribe(
    (state) => state.effectiveTheme,
    (theme) => {
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(theme)
    }
  )

  // Subscribe to MCP server changes and notify other stores
  useMCPStore.subscribe(
    (state) => state.getEnabledServers(),
    (enabledServers) => {
      // Notify UI about MCP availability
      if (enabledServers.length > 0) {
        useUIStore
          .getState()
          .showToast(
            `${enabledServers.length} MCP server${enabledServers.length > 1 ? 's' : ''} active`,
            'info',
            3000
          )
      }
    }
  )

  // Subscribe to errors across stores and show notifications
  const handleStoreError = (storeName: string) => (error: string | null) => {
    if (error) {
      useUIStore.getState().addNotification({
        type: 'error',
        title: `${storeName} Error`,
        message: error,
        duration: 5000,
      })
    }
  }

  // Error handling subscriptions would go here
  // Note: Individual stores handle their own error states

  console.log('Store subscriptions initialized')
}

/**
 * Reset all stores to their initial state
 */
export const resetAllStores = () => {
  useChatStore.getState().clearAllChats()
  useModelStore.getState().resetAllConfigs()
  useSettingsStore.getState().resetToDefaults()
  useMCPStore.getState().disconnectAllServers()
  useUIStore.getState().closeAllModals()
  useUIStore.getState().clearNotifications()
  useUIStore.getState().clearToasts()
}

/**
 * Export all stores for development/debugging
 */
export const stores = {
  chat: useChatStore,
  model: useModelStore,
  settings: useSettingsStore,
  mcp: useMCPStore,
  ui: useUIStore,
}

/**
 * Get current state snapshot from all stores
 */
export const getGlobalSnapshot = () => ({
  chat: useChatStore.getState(),
  model: useModelStore.getState(),
  settings: useSettingsStore.getState(),
  mcp: useMCPStore.getState(),
  ui: useUIStore.getState(),
  timestamp: new Date().toISOString(),
})

/**
 * Development helpers
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Expose stores to window for debugging
  ;(window as any).stores = stores
  ;(window as any).getGlobalSnapshot = getGlobalSnapshot
  ;(window as any).resetAllStores = resetAllStores
}
