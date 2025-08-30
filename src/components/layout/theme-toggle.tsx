'use client'

import React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from './theme-provider'
import { Tooltip } from '../ui/tooltip'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

interface ThemeToggleProps {
  variant?: 'icon' | 'button' | 'menu'
  className?: string
}

export function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
  const { theme, effectiveTheme, setTheme, toggleTheme } = useTheme()

  const getIcon = () => {
    // For system theme, show the actual effective theme icon
    const themeToShow = theme === 'system' ? effectiveTheme : theme
    switch (themeToShow) {
      case 'light':
        return (
          <Sun className="h-4 w-4 transition-transform duration-200 hover:rotate-12" />
        )
      case 'dark':
        return (
          <Moon className="h-4 w-4 transition-transform duration-200 hover:rotate-12" />
        )
      default:
        return (
          <Sun className="h-4 w-4 transition-transform duration-200 hover:rotate-12" />
        )
    }
  }

  const getSystemIcon = () => {
    return <Monitor className="h-3 w-3" />
  }

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Switch to dark mode'
      case 'dark':
        return 'Switch to system mode'
      case 'system':
        return `Switch to light mode (following system: ${effectiveTheme})`
      default:
        return 'Toggle theme'
    }
  }

  const handleClick = () => {
    if (variant === 'menu') {
      // Cycle through all themes for menu variant
      const themes: Array<'light' | 'dark' | 'system'> = [
        'light',
        'dark',
        'system',
      ]
      const currentIndex = themes.indexOf(theme)
      const nextTheme = themes[(currentIndex + 1) % themes.length]
      setTheme(nextTheme)
    } else {
      // Simple toggle for icon variant
      toggleTheme()
    }
  }

  if (variant === 'icon') {
    return (
      <Tooltip content={getLabel()} side="right">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClick}
          className={cn(
            'relative h-10 w-10 rounded-lg',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
            'transition-all duration-200',
            className
          )}
          aria-label={getLabel()}
        >
          {getIcon()}
          {/* System indicator */}
          {theme === 'system' && (
            <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-blue-500 p-0.5 text-white">
              {getSystemIcon()}
            </div>
          )}
        </Button>
      </Tooltip>
    )
  }

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className={cn('gap-2', className)}
      >
        {getIcon()}
        <span className="capitalize">{theme}</span>
      </Button>
    )
  }

  // Menu variant with all theme options
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {(['light', 'dark', 'system'] as const).map((themeOption) => {
        const Icon =
          themeOption === 'light'
            ? Sun
            : themeOption === 'dark'
              ? Moon
              : Monitor
        return (
          <Button
            key={themeOption}
            variant={theme === themeOption ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setTheme(themeOption)}
            className="justify-start gap-2"
          >
            <Icon className="h-4 w-4" />
            <span className="capitalize">{themeOption}</span>
          </Button>
        )
      })}
    </div>
  )
}
