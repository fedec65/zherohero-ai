'use client'

import React, { useState } from 'react'
import { Menu, Edit3, Crown, ChevronDown } from 'lucide-react'
import { Button } from '../ui/button'
import { Tooltip } from '../ui/tooltip'
import { cn } from '../../lib/utils'
import { useChatStore } from '../../lib/stores/chat-store'

interface MainContentProps {
  children: React.ReactNode
  title?: string
  showHeader?: boolean
  className?: string
}

export function MainContent({
  children,
  title,
  showHeader = true,
  className,
}: MainContentProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { activeChat, chats } = useChatStore()

  // Get current chat title if available
  const currentChat = activeChat ? chats[activeChat] : null
  const displayTitle = title || currentChat?.title || 'ZheroHero AI'

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-white dark:bg-gray-800',
        className
      )}
    >
      {showHeader && (
        <Header
          title={displayTitle}
          onToggleMobileMenu={toggleMobileMenu}
          showEditButton={!!currentChat}
        />
      )}

      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}

interface HeaderProps {
  title: string
  onToggleMobileMenu: () => void
  showEditButton?: boolean
}

function Header({
  title,
  onToggleMobileMenu,
  showEditButton = false,
}: HeaderProps) {
  const handleEditTitle = () => {
    // TODO: Implement title editing
    console.log('Edit title clicked')
  }

  const handleUpgrade = () => {
    // TODO: Implement upgrade flow
    console.log('Upgrade clicked')
  }

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleMobileMenu}
          className="lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Title */}
        <div className="flex items-center gap-2">
          <h1 className="max-w-md truncate text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>

          {showEditButton && (
            <Tooltip content="Edit title">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditTitle}
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Model selector (placeholder) */}
        <ModelSelector />

        {/* Upgrade button */}
        <Tooltip content="Upgrade to Pro">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUpgrade}
            className="hidden items-center gap-2 border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20 sm:flex"
          >
            <Crown className="h-4 w-4" />
            <span className="hidden md:inline">Upgrade</span>
          </Button>
        </Tooltip>

        {/* Mobile upgrade button */}
        <Tooltip content="Upgrade to Pro">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUpgrade}
            className="text-amber-600 dark:text-amber-400 sm:hidden"
          >
            <Crown className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>
    </header>
  )
}

function ModelSelector() {
  // TODO: Connect to actual model store
  const currentModel = 'GPT-4'

  return (
    <Button
      variant="ghost"
      size="sm"
      className="hidden items-center gap-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 sm:flex"
    >
      <span className="text-sm">{currentModel}</span>
      <ChevronDown className="h-3 w-3" />
    </Button>
  )
}

// Loading state component
export function MainContentLoading({
  title = 'Loading...',
  className,
}: {
  title?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-full flex-col bg-white dark:bg-gray-800',
        className
      )}
    >
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-pulse rounded bg-gray-200 dark:bg-gray-700 lg:hidden" />
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden h-8 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700 sm:block" />
          <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center overflow-hidden">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-gray-500 dark:text-gray-400">{title}</p>
        </div>
      </main>
    </div>
  )
}

// Error state component
export function MainContentError({
  title = 'Something went wrong',
  message = 'Please try refreshing the page.',
  onRetry,
  className,
}: {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-full flex-col bg-white dark:bg-gray-800',
        className
      )}
    >
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h1 className="text-lg font-semibold text-red-600 dark:text-red-400">
          Error
        </h1>
      </header>

      <main className="flex flex-1 items-center justify-center overflow-hidden">
        <div className="max-w-md space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <div className="h-8 w-8 rounded-full bg-red-500" />
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </div>
          {onRetry && (
            <Button onClick={onRetry} className="mt-4">
              Try Again
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
