/**
 * Persistence middleware for Zustand stores with multiple storage backends
 */

import { StateStorage, PersistStorage } from 'zustand/middleware'
import { StorageConfig } from '../types'

// IndexedDB adapter for large data
class IndexedDBStorage implements StateStorage {
  private dbName: string
  private version: number
  private db: IDBDatabase | null = null

  constructor(dbName: string = 'minddeck-store', version: number = 1) {
    this.dbName = dbName
    this.version = version
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db

    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB not available in this environment')
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('store')) {
          db.createObjectStore('store', { keyPath: 'key' })
        }
      }
    })
  }

  async getItem(name: string): Promise<string | null> {
    try {
      // Return null during SSR
      if (typeof window === 'undefined') {
        return null
      }

      const db = await this.getDB()
      const transaction = db.transaction(['store'], 'readonly')
      const store = transaction.objectStore('store')

      return new Promise((resolve, reject) => {
        const request = store.get(name)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const result = request.result
          resolve(result ? result.value : null)
        }
      })
    } catch (error) {
      // Don't log errors during SSR, just return null silently
      if (typeof window === 'undefined') {
        return null
      }
      console.error('IndexedDB getItem error:', error)
      return null
    }
  }

  async setItem(name: string, value: string): Promise<void> {
    try {
      // Do nothing during SSR
      if (typeof window === 'undefined') {
        return
      }

      const db = await this.getDB()
      const transaction = db.transaction(['store'], 'readwrite')
      const store = transaction.objectStore('store')

      return new Promise((resolve, reject) => {
        const request = store.put({ key: name, value })
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      // Don't log errors during SSR, just fail silently
      if (typeof window !== 'undefined') {
        console.error('IndexedDB setItem error:', error)
      }
    }
  }

  async removeItem(name: string): Promise<void> {
    try {
      // Do nothing during SSR
      if (typeof window === 'undefined') {
        return
      }

      const db = await this.getDB()
      const transaction = db.transaction(['store'], 'readwrite')
      const store = transaction.objectStore('store')

      return new Promise((resolve, reject) => {
        const request = store.delete(name)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      // Don't log errors during SSR, just fail silently
      if (typeof window !== 'undefined') {
        console.error('IndexedDB removeItem error:', error)
      }
    }
  }
}

// Enhanced storage factory with serialization support
export function createEnhancedStorage(type: StorageConfig['storage']): any {
  const baseStorage = createStorage(type)
  
  return {
    getItem: async (name: string) => {
      try {
        // SSR guard at the enhanced storage level
        if (typeof window === 'undefined') return null

        const result = await baseStorage.getItem(name)
        if (result === null) return null
        
        // The result should be a JSON string, deserialize it with Date handling
        return stateSerializer.deserialize(result)
      } catch (error) {
        // Don't log warnings during SSR, just return null silently
        if (typeof window !== 'undefined') {
          console.warn(`Failed to get/deserialize item '${name}':`, error)
        }
        return null
      }
    },
    
    setItem: async (name: string, value: string) => {
      try {
        // SSR guard at the enhanced storage level
        if (typeof window === 'undefined') return

        // Zustand passes the stringified state, but we need to enhance it with Date serialization
        // First parse the JSON to get the object
        const parsedValue = JSON.parse(value)
        
        // Then re-serialize it with our enhanced Date serialization
        const enhancedValue = stateSerializer.serialize(parsedValue)
        
        return await baseStorage.setItem(name, enhancedValue)
      } catch (error) {
        // Don't log errors during SSR, just fail silently
        if (typeof window !== 'undefined') {
          console.error(`Failed to serialize/store item '${name}':`, error)
          console.error(`Value that failed: ${value.substring(0, 200)}...`)
        }
        throw error
      }
    },
    
    removeItem: async (name: string) => {
      // SSR guard at the enhanced storage level
      if (typeof window === 'undefined') return
      return await baseStorage.removeItem(name)
    },
  } as StateStorage
}

// Storage factory
export function createStorage(type: StorageConfig['storage']): StateStorage {
  let baseStorage: StateStorage

  switch (type) {
    case 'localStorage':
      baseStorage = {
        getItem: (name) => {
          if (typeof window === 'undefined') return null
          return localStorage.getItem(name)
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return
          localStorage.setItem(name, value)
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return
          localStorage.removeItem(name)
        },
      }
      break

    case 'sessionStorage':
      baseStorage = {
        getItem: (name) => {
          if (typeof window === 'undefined') return null
          return sessionStorage.getItem(name)
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return
          sessionStorage.setItem(name, value)
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return
          sessionStorage.removeItem(name)
        },
      }
      break

    case 'indexedDB':
      baseStorage = new IndexedDBStorage()
      break

    case 'memory':
    default:
      const memoryStorage = new Map<string, string>()
      baseStorage = {
        getItem: (name) => memoryStorage.get(name) ?? null,
        setItem: (name, value) => {
          memoryStorage.set(name, value)
        },
        removeItem: (name) => {
          memoryStorage.delete(name)
        },
      }
      break
  }

  // Wrap with safe storage to handle serialization errors gracefully
  return createSafeStorage(baseStorage)
}

// Enhanced persistence options
export interface PersistOptions<T> extends StorageConfig {
  onRehydrateStorage?: (state: T) => void
  onFinishHydration?: (state: T) => void
  partialize?: (state: T) => Partial<T>
  skipHydration?: boolean
}

// Date serialization utilities
export const dateSerializer = {
  serialize: (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj
    }

    if (obj instanceof Date) {
      return {
        __type: 'Date',
        __value: obj.toISOString(),
      }
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => dateSerializer.serialize(item))
    }

    if (typeof obj === 'object') {
      const serialized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        serialized[key] = dateSerializer.serialize(value)
      }
      return serialized
    }

    return obj
  },

  deserialize: (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj
    }

    // Handle Date objects marked with __type: 'Date'
    if (
      typeof obj === 'object' &&
      obj.__type === 'Date' &&
      typeof obj.__value === 'string'
    ) {
      return new Date(obj.__value)
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => dateSerializer.deserialize(item))
    }

    if (typeof obj === 'object') {
      const deserialized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        deserialized[key] = dateSerializer.deserialize(value)
      }
      return deserialized
    }

    return obj
  },
}

// Enhanced serialization utilities for state persistence
export const stateSerializer = {
  serialize: (state: any): string => {
    try {
      // First, serialize Date objects to a special format
      const dateSerializedState = dateSerializer.serialize(state)
      
      // Then convert to JSON string
      const result = JSON.stringify(dateSerializedState)
      
      // Validation check to prevent "[object Object]" issues
      if (result === '"[object Object]"' || result === '[object Object]') {
        console.error('Serialization produced "[object Object]" string')
        console.error('Original state:', state)
        throw new Error('State serialization failed - produced "[object Object]" string')
      }
      
      return result
    } catch (error) {
      console.error('State serialization error:', error)
      console.error('State that failed to serialize:', state)
      throw error
    }
  },

  deserialize: (str: string): any => {
    try {
      // Check for the problematic "[object Object]" string
      if (str === '[object Object]' || str === '"[object Object]"') {
        console.warn('Encountered "[object Object]" string during deserialization, returning empty object')
        return {}
      }
      
      // Parse JSON first
      const parsed = JSON.parse(str)
      
      // Then deserialize Date objects
      return dateSerializer.deserialize(parsed)
    } catch (error) {
      console.error('State deserialization error:', error)
      console.error('String that failed to deserialize:', str.substring(0, 200) + '...')
      throw error
    }
  },
}

// Compression utilities for large datasets
export const compression = {
  compress: (data: string): string => {
    try {
      // Simple LZ-string-like compression for demo
      // In production, use a proper compression library
      return btoa(data)
    } catch {
      return data
    }
  },

  decompress: (data: string): string => {
    try {
      return atob(data)
    } catch {
      return data
    }
  },
}

// Migration utilities
export function createMigration<T>(
  migrations: Record<number, (state: unknown) => T>
) {
  return (persistedState: unknown, version: number): T => {
    let state = persistedState

    for (
      let v = version;
      v < Math.max(...Object.keys(migrations).map(Number));
      v++
    ) {
      const migration = migrations[v + 1]
      if (migration) {
        state = migration(state)
      }
    }

    return state as T
  }
}

// Selective persistence helper
export function createPartializer<T>(
  excludeKeys: (keyof T)[]
): (state: T) => Partial<T> {
  return (state: T) => {
    const result: Partial<T> = {}

    for (const [key, value] of Object.entries(state) as [
      keyof T,
      T[keyof T],
    ][]) {
      if (!excludeKeys.includes(key)) {
        result[key] = value
      }
    }

    return result
  }
}

// Auto-partializer that excludes all functions and specified additional keys
export function createAutoPartializer<T>(
  additionalExcludes: (keyof T)[] = []
): (state: T) => Partial<T> {
  return (state: T) => {
    const result: Partial<T> = {}

    for (const [key, value] of Object.entries(state) as [
      keyof T,
      T[keyof T],
    ][]) {
      // Skip functions (including async functions)
      if (typeof value === 'function') {
        console.log(`Excluding function property: ${String(key)}`)
        continue
      }

      // Skip symbols
      if (typeof value === 'symbol') {
        console.log(`Excluding symbol property: ${String(key)}`)
        continue
      }

      // Skip undefined values
      if (value === undefined) {
        console.log(`Excluding undefined property: ${String(key)}`)
        continue
      }

      // Skip additional excluded keys
      if (additionalExcludes.includes(key)) {
        console.log(`Excluding additional property: ${String(key)}`)
        continue
      }

      // Handle special cases
      try {
        // Date objects are fine - they'll be handled by the date serializer
        if (value instanceof Date) {
          result[key] = value
          continue
        }

        // Arrays are generally fine if their contents are serializable
        if (Array.isArray(value)) {
          // Test serialization of the array
          const testSerialized = stateSerializer.serialize(value)
          if (testSerialized && testSerialized !== '"[object Object]"' && testSerialized !== '[object Object]') {
            result[key] = value
            continue
          } else {
            console.warn(`Excluding non-serializable array property: ${String(key)}`)
            continue
          }
        }

        // For primitive types, include them directly
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean' ||
          value === null
        ) {
          result[key] = value
          continue
        }

        // For objects, test basic JSON serialization to catch edge cases
        if (typeof value === 'object' && value !== null) {
          try {
            const testSerialized = JSON.stringify(value)
            
            // Check if serialization produced the problematic "[object Object]" string
            if (testSerialized === '"[object Object]"' || testSerialized === '[object Object]') {
              console.warn(`Excluding property that serializes to "[object Object]": ${String(key)}`, value)
              continue
            }

            // Basic validation that it can be parsed back
            JSON.parse(testSerialized)
            result[key] = value
            continue
          } catch (testError) {
            console.warn(`Excluding property that failed serialization test: ${String(key)}`, testError)
            continue
          }
        }

        // If we get here, it's probably safe to include
        result[key] = value
      } catch (error) {
        // Skip values that can't be serialized
        console.warn(
          `Skipping non-serializable property: ${String(key)} - Error: ${error instanceof Error ? error.message : String(error)}`,
          { value, error }
        )
      }
    }

    console.log(`Auto-partializer processed ${Object.keys(state || {}).length} properties, included ${Object.keys(result).length}`)
    return result
  }
}

// Safe partializer that only includes explicitly allowed keys
export function createInclusivePartializer<T extends object>(
  includeKeys: (keyof T)[]
): (state: T) => Partial<T> {
  return (state: T) => {
    const result: Partial<T> = {}

    for (const key of includeKeys) {
      if (key in state) {
        const value = state[key]

        // Double-check that the value is serializable
        try {
          JSON.stringify(value)
          result[key] = value
        } catch (error) {
          console.warn(
            `Skipping non-serializable included property: ${String(key)}`,
            error
          )
        }
      }
    }

    return result
  }
}

// Debounced storage to prevent excessive writes
export function createDebouncedStorage(
  storage: StateStorage,
  delay: number = 500
): StateStorage {
  const timeouts = new Map<string, NodeJS.Timeout>()

  return {
    getItem: storage.getItem,
    removeItem: storage.removeItem,
    setItem: (name, value) => {
      const existingTimeout = timeouts.get(name)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      const timeout = setTimeout(() => {
        storage.setItem(name, value)
        timeouts.delete(name)
      }, delay)

      timeouts.set(name, timeout)
    },
  }
}

// Safe storage wrapper that catches and handles serialization errors
export function createSafeStorage(storage: StateStorage): StateStorage {
  return {
    getItem: async (name: string) => {
      try {
        // Additional SSR guard at the wrapper level
        if (typeof window === 'undefined') return null
        return await storage.getItem(name)
      } catch (error) {
        // Don't log warnings during SSR, just return null silently
        if (typeof window !== 'undefined') {
          console.warn(`Failed to get item '${name}' from storage:`, error)
        }
        return null
      }
    },

    setItem: async (name: string, value: string) => {
      try {
        // Additional SSR guard at the wrapper level
        if (typeof window === 'undefined') return

        // Add detailed logging to catch serialization issues
        if (typeof value !== 'string') {
          console.error(`Invalid value type for storage. Expected string, got:`, typeof value, value)
          throw new Error(`Storage value must be a string, got ${typeof value}`)
        }

        // Check if the value is the problematic "[object Object]" string
        if (value === '[object Object]') {
          console.error('Attempting to store "[object Object]" string - this indicates a serialization bug')
          console.error('Stack trace:', new Error().stack)
          throw new Error('Cannot store "[object Object]" - object was not properly serialized')
        }

        // Basic JSON validation without double-parsing
        // (Zustand already handles JSON serialization, we just validate format)
        if (value.length > 0 && (value[0] === '{' || value[0] === '[')) {
          try {
            JSON.parse(value)
          } catch (parseError) {
            console.error(`Invalid JSON format for storage item '${name}':`, value.substring(0, 200) + '...')
            throw new Error(`Invalid JSON format: ${parseError}`)
          }
        }

        await storage.setItem(name, value)
      } catch (error) {
        // Don't log errors during SSR, just fail silently
        if (typeof window !== 'undefined') {
          console.error(`Failed to set item '${name}' to storage:`, error)
          console.error(`Value type: ${typeof value}`)
          console.error(`Value preview: ${String(value).substring(0, 200)}...`)
          
          if (
            error instanceof Error &&
            error.message.includes('could not be cloned')
          ) {
            console.error(
              'This is likely due to non-serializable data (functions, symbols, etc.) in the state'
            )
            console.error(
              "Check your store's partialize configuration to exclude non-serializable properties"
            )
          }
        }
        throw error
      }
    },

    removeItem: async (name: string) => {
      try {
        // Additional SSR guard at the wrapper level
        if (typeof window === 'undefined') return
        await storage.removeItem(name)
      } catch (error) {
        // Don't log warnings during SSR, just fail silently
        if (typeof window !== 'undefined') {
          console.warn(`Failed to remove item '${name}' from storage:`, error)
        }
      }
    },
  }
}
