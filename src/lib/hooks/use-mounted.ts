/**
 * Use Mounted Hook - Ensures components are hydrated before accessing client-side APIs
 */

import { useEffect, useState } from 'react'

/**
 * Hook to safely handle hydration in Next.js
 * Returns true only after the component has mounted on the client
 * Prevents hydration mismatches and SSR-related errors
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}

/**
 * Hook to safely access client-side storage
 * Returns the stored value only after hydration is complete
 */
export function useSafeStorage<T>(
  key: string,
  defaultValue: T,
  storage: 'localStorage' | 'sessionStorage' = 'localStorage'
): [T, (value: T) => void] {
  const mounted = useMounted()
  const [value, setValue] = useState<T>(defaultValue)

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return

    try {
      const storageObj =
        storage === 'localStorage' ? localStorage : sessionStorage
      const stored = storageObj.getItem(key)
      if (stored) {
        setValue(JSON.parse(stored))
      }
    } catch (error) {
      console.warn(`Failed to read from ${storage} for key "${key}":`, error)
    }
  }, [mounted, key, storage])

  const setSafeValue = (newValue: T) => {
    setValue(newValue)

    if (mounted && typeof window !== 'undefined') {
      try {
        const storageObj =
          storage === 'localStorage' ? localStorage : sessionStorage
        storageObj.setItem(key, JSON.stringify(newValue))
      } catch (error) {
        console.warn(`Failed to write to ${storage} for key "${key}":`, error)
      }
    }
  }

  return [mounted ? value : defaultValue, setSafeValue]
}
