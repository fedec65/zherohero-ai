/**
 * Persistence middleware for Zustand stores with multiple storage backends
 */

import { StateStorage } from "zustand/middleware";
import { StorageConfig } from "../types";

// IndexedDB adapter for large data
class IndexedDBStorage implements StateStorage {
  private dbName: string;
  private version: number;
  private db: IDBDatabase | null = null;

  constructor(dbName: string = "minddeck-store", version: number = 1) {
    this.dbName = dbName;
    this.version = version;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof indexedDB === "undefined") {
      throw new Error("IndexedDB not available in this environment");
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("store")) {
          db.createObjectStore("store", { keyPath: "key" });
        }
      };
    });
  }

  async getItem(name: string): Promise<string | null> {
    try {
      // Return null during SSR
      if (typeof window === "undefined") {
        return null;
      }

      const db = await this.getDB();
      const transaction = db.transaction(["store"], "readonly");
      const store = transaction.objectStore("store");

      return new Promise((resolve, reject) => {
        const request = store.get(name);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.value : null);
        };
      });
    } catch (error) {
      // Don't log errors during SSR, just return null silently
      if (typeof window === "undefined") {
        return null;
      }
      console.error("IndexedDB getItem error:", error);
      return null;
    }
  }

  async setItem(name: string, value: string): Promise<void> {
    try {
      // Do nothing during SSR
      if (typeof window === "undefined") {
        return;
      }

      const db = await this.getDB();
      const transaction = db.transaction(["store"], "readwrite");
      const store = transaction.objectStore("store");

      return new Promise((resolve, reject) => {
        const request = store.put({ key: name, value });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      // Don't log errors during SSR, just fail silently
      if (typeof window !== "undefined") {
        console.error("IndexedDB setItem error:", error);
      }
    }
  }

  async removeItem(name: string): Promise<void> {
    try {
      // Do nothing during SSR
      if (typeof window === "undefined") {
        return;
      }

      const db = await this.getDB();
      const transaction = db.transaction(["store"], "readwrite");
      const store = transaction.objectStore("store");

      return new Promise((resolve, reject) => {
        const request = store.delete(name);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      // Don't log errors during SSR, just fail silently
      if (typeof window !== "undefined") {
        console.error("IndexedDB removeItem error:", error);
      }
    }
  }
}

// Storage factory
export function createStorage(type: StorageConfig["storage"]): StateStorage {
  switch (type) {
    case "localStorage":
      return {
        getItem: (name) => localStorage.getItem(name),
        setItem: (name, value) => localStorage.setItem(name, value),
        removeItem: (name) => localStorage.removeItem(name),
      };

    case "sessionStorage":
      return {
        getItem: (name) => sessionStorage.getItem(name),
        setItem: (name, value) => sessionStorage.setItem(name, value),
        removeItem: (name) => sessionStorage.removeItem(name),
      };

    case "indexedDB":
      return new IndexedDBStorage();

    case "memory":
    default:
      const memoryStorage = new Map<string, string>();
      return {
        getItem: (name) => memoryStorage.get(name) ?? null,
        setItem: (name, value) => {
          memoryStorage.set(name, value);
        },
        removeItem: (name) => {
          memoryStorage.delete(name);
        },
      };
  }
}

// Enhanced persistence options
export interface PersistOptions<T> extends StorageConfig {
  onRehydrateStorage?: (state: T) => void;
  onFinishHydration?: (state: T) => void;
  partialize?: (state: T) => Partial<T>;
  skipHydration?: boolean;
}

// Compression utilities for large datasets
export const compression = {
  compress: (data: string): string => {
    try {
      // Simple LZ-string-like compression for demo
      // In production, use a proper compression library
      return btoa(data);
    } catch {
      return data;
    }
  },

  decompress: (data: string): string => {
    try {
      return atob(data);
    } catch {
      return data;
    }
  },
};

// Migration utilities
export function createMigration<T>(
  migrations: Record<number, (state: unknown) => T>,
) {
  return (persistedState: unknown, version: number): T => {
    let state = persistedState;

    for (
      let v = version;
      v < Math.max(...Object.keys(migrations).map(Number));
      v++
    ) {
      const migration = migrations[v + 1];
      if (migration) {
        state = migration(state);
      }
    }

    return state as T;
  };
}

// Selective persistence helper
export function createPartializer<T>(
  excludeKeys: (keyof T)[],
): (state: T) => Partial<T> {
  return (state: T) => {
    const result: Partial<T> = {};

    for (const [key, value] of Object.entries(state) as [
      keyof T,
      T[keyof T],
    ][]) {
      if (!excludeKeys.includes(key)) {
        result[key] = value;
      }
    }

    return result;
  };
}

// Debounced storage to prevent excessive writes
export function createDebouncedStorage(
  storage: StateStorage,
  delay: number = 500,
): StateStorage {
  const timeouts = new Map<string, NodeJS.Timeout>();

  return {
    getItem: storage.getItem,
    removeItem: storage.removeItem,
    setItem: (name, value) => {
      const existingTimeout = timeouts.get(name);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        storage.setItem(name, value);
        timeouts.delete(name);
      }, delay);

      timeouts.set(name, timeout);
    },
  };
}
