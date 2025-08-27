'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSettingsStore } from '../../../lib/stores/settings-store';
import { applyThemeWithTransition, createSystemThemeListener } from '../../lib/theme-utils';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { settings, effectiveTheme, setTheme, toggleTheme, getEffectiveTheme } = useSettingsStore();
  const [mounted, setMounted] = useState(false);
  const [currentEffectiveTheme, setCurrentEffectiveTheme] = useState<'light' | 'dark'>('light');

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update effective theme when settings change
  useEffect(() => {
    if (!mounted) return;
    
    const newEffectiveTheme = getEffectiveTheme();
    setCurrentEffectiveTheme(newEffectiveTheme);
    
    // Apply theme with smooth transition
    applyThemeWithTransition(newEffectiveTheme);

    // Listen for system theme changes only if using system theme
    if (settings.theme === 'system') {
      const cleanup = createSystemThemeListener((systemTheme) => {
        setCurrentEffectiveTheme(systemTheme);
        applyThemeWithTransition(systemTheme);
      });
      
      return cleanup;
    }
  }, [mounted, settings.theme, getEffectiveTheme]);

  const value: ThemeContextType = {
    theme: settings.theme,
    effectiveTheme: currentEffectiveTheme,
    setTheme,
    toggleTheme,
  };

  if (!mounted) {
    // Return a div with the same structure but no theme applied to prevent flash
    return (
      <div className="min-h-screen bg-gray-50 transition-colors duration-200">
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  
  // During SSR or if context is not available, return default values
  if (context === undefined) {
    // Always return default values instead of throwing
    // This handles SSR, hydration mismatches, and missing provider cases
    return {
      theme: 'light' as const,
      effectiveTheme: 'light' as const,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  
  return context;
}