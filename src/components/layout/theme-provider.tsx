'use client'

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { useSettingsStore } from '../../lib/stores/settings-store'
import {
  applyThemeWithTransition,
  createSystemThemeListener,
} from '../../lib/theme-utils'
import { useMounted } from '../../lib/hooks/use-mounted'
import { ErrorBoundary } from '../ui/error-boundary'

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system'
  effectiveTheme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleTheme: () => void
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
}

function ThemeProviderInner({ children }: ThemeProviderProps) {
  const mounted = useMounted()
  const [isStoreReady, setIsStoreReady] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)
  
  // Get store values with error handling
  const settingsStore = useSettingsStore()
  const { settings, setTheme, toggleTheme, getEffectiveTheme } = settingsStore
  
  const [currentEffectiveTheme, setCurrentEffectiveTheme] = useState<'light' | 'dark'>(() => {
    // Only access getEffectiveTheme if mounted to prevent hydration issues
    if (typeof window === 'undefined') return 'light'
    return 'light'
  })

  // Initialize store readiness after mount
  useEffect(() => {
    if (mounted) {
      setIsStoreReady(true)
    }
  }, [mounted])

  // Memoized theme update function to prevent unnecessary re-renders
  const updateTheme = useCallback(() => {
    if (!mounted || !isStoreReady) return

    try {
      const newEffectiveTheme = getEffectiveTheme()
      setCurrentEffectiveTheme(newEffectiveTheme)

      // Apply theme with transition only on client
      if (typeof window !== 'undefined') {
        applyThemeWithTransition(newEffectiveTheme)
      }
    } catch (error) {
      console.warn('Failed to update theme:', error)
      // Fallback to light theme on error
      setCurrentEffectiveTheme('light')
    }
  }, [mounted, isStoreReady, getEffectiveTheme])

  // Update effective theme when settings change
  useEffect(() => {
    updateTheme()
  }, [updateTheme, settings.theme])

  // Handle system theme listener
  useEffect(() => {
    if (!mounted || !isStoreReady || settings.theme !== 'system') {
      return
    }

    try {
      const cleanup = createSystemThemeListener((systemTheme) => {
        setCurrentEffectiveTheme(systemTheme)
        if (typeof window !== 'undefined') {
          applyThemeWithTransition(systemTheme)
        }
      })

      cleanupRef.current = cleanup
      return cleanup
    } catch (error) {
      console.warn('Failed to setup system theme listener:', error)
    }
  }, [mounted, isStoreReady, settings.theme])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        try {
          cleanupRef.current()
        } catch (error) {
          console.warn('Failed to cleanup theme listener:', error)
        }
      }
    }
  }, [])

  const value: ThemeContextType = {
    theme: isStoreReady ? settings.theme : 'light',
    effectiveTheme: currentEffectiveTheme,
    setTheme: mounted ? setTheme : () => {},
    toggleTheme: mounted ? toggleTheme : () => {},
    mounted,
  }

  // Show loading skeleton during hydration to prevent flash
  if (!mounted || !isStoreReady) {
    return (
      <div className="min-h-screen bg-gray-50 transition-colors duration-200">
        {children}
      </div>
    )
  }

  return (
    <ThemeContext.Provider value={value}>
      <div className="min-h-screen bg-gray-50 transition-colors duration-200 dark:bg-gray-900">
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ErrorBoundary
      fallback={({ retry }) => (
        <div className="min-h-screen bg-gray-50 transition-colors duration-200">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="mb-4 text-gray-600">Failed to load theme provider</p>
              <button
                onClick={retry}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    >
      <ThemeProviderInner>{children}</ThemeProviderInner>
    </ErrorBoundary>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)

  // During SSR, hydration, or if context is not available, return safe defaults
  if (context === undefined) {
    return {
      theme: 'light' as const,
      effectiveTheme: 'light' as const,
      setTheme: () => {},
      toggleTheme: () => {},
      mounted: false,
    }
  }

  return context
}
