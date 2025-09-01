/**
 * Safe Persistence Middleware - Prevents hydration errors with zustand persistence
 */

import { StateStorage } from 'zustand/middleware'

/**
 * Creates a safe storage wrapper that handles SSR and hydration gracefully
 */
export function createSafeStorage(
  storage: 'localStorage' | 'sessionStorage'
): StateStorage {
  return {
    getItem: (name: string): string | null => {
      // Only access storage on client side
      if (typeof window === 'undefined') return null

      try {
        const storageObj =
          storage === 'localStorage' ? localStorage : sessionStorage
        return storageObj.getItem(name)
      } catch (error) {
        console.warn(`Failed to get item "${name}" from ${storage}:`, error)
        return null
      }
    },
    setItem: (name: string, value: string): void => {
      // Only access storage on client side
      if (typeof window === 'undefined') return

      try {
        const storageObj =
          storage === 'localStorage' ? localStorage : sessionStorage
        storageObj.setItem(name, value)
      } catch (error) {
        console.warn(`Failed to set item "${name}" in ${storage}:`, error)
      }
    },
    removeItem: (name: string): void => {
      // Only access storage on client side
      if (typeof window === 'undefined') return

      try {
        const storageObj =
          storage === 'localStorage' ? localStorage : sessionStorage
        storageObj.removeItem(name)
      } catch (error) {
        console.warn(`Failed to remove item "${name}" from ${storage}:`, error)
      }
    },
  }
}

/**
 * Creates a hydration-safe persist config for zustand
 */
export function createSafePersistConfig<T>(config: {
  name: string
  storage?: 'localStorage' | 'sessionStorage'
  partialize?: (state: T) => Partial<T>
  onRehydrateStorage?: () => ((state: T | undefined) => void) | void
  version?: number
}) {
  return {
    name: config.name,
    storage: createSafeStorage(config.storage || 'localStorage'),
    partialize: config.partialize,
    version: config.version || 1,

    // Enhanced rehydration with error handling
    onRehydrateStorage: () => {
      return (state: T | undefined, error?: Error) => {
        if (error) {
          console.warn(`Failed to rehydrate store "${config.name}":`, error)
          return
        }

        // Call the original onRehydrateStorage callback if provided
        const originalCallback = config.onRehydrateStorage?.()
        if (originalCallback && state) {
          try {
            originalCallback(state)
          } catch (callbackError) {
            console.warn(
              `Error in onRehydrateStorage callback for "${config.name}":`,
              callbackError
            )
          }
        }
      }
    },

    // Skip hydration on server side
    skipHydration: typeof window === 'undefined',
  }
}

/**
 * Merges state safely, handling undefined/null values during hydration
 */
export function safeMergeState<T extends Record<string, any>>(
  persistedState: unknown,
  currentState: T
): T {
  if (!persistedState || typeof persistedState !== 'object') {
    return currentState
  }

  try {
    const mergedState = { ...currentState } as any

    for (const [key, value] of Object.entries(
      persistedState as Record<string, any>
    )) {
      if (key in currentState && value !== undefined) {
        mergedState[key] = value
      }
    }

    return mergedState
  } catch (error) {
    console.warn('Failed to merge persisted state:', error)
    return currentState
  }
}
