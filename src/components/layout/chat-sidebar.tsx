'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Filter, Star, MessageSquare, Plus, Folder, Settings, Sparkles } from 'lucide-react'
import { Button } from '../ui/button'
import { EnhancedSearch } from '../chat/enhanced-search'
import { ChatHierarchyView } from '../chat/chat-hierarchy-view'
import { CreateFolderDialog } from '../chat/create-folder-dialog'
import { MoveChatDialog } from '../chat/move-chat-dialog'
import { RenameDialog } from '../chat/rename-dialog'
import { SortDropdown } from '../chat/sort-dropdown'
import { useChatStore } from '../../lib/stores/chat-store'
import { useSettingsStore } from '../../lib/stores/settings-store'
import { cn } from '../../lib/utils'
import { Tooltip } from '../ui/tooltip'
import { useMounted } from '../../lib/hooks/use-mounted'
import { ErrorBoundary } from '../ui/error-boundary'

interface ChatSidebarProps {
  className?: string
}

function ChatSidebarInner({ className }: ChatSidebarProps) {
  const mounted = useMounted()
  const [isStoreReady, setIsStoreReady] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const chatStore = useChatStore()
  const settingsStore = useSettingsStore()

  const {
    chats,
    createChat,
    openCreateFolderDialog,
    search,
    performSearch,
    clearSearch,
    setSearchFilters,
    getSearchSuggestions,
    selectSearchResult,
    getChatHierarchy,
    buildChatHierarchy,
  } = chatStore

  const { settings, setSidebarWidth } = settingsStore
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [currentWidth, setCurrentWidth] = useState(() => {
    // Initialize with safe default during SSR
    return 320
  })

  // Initialize store readiness and width after mount
  useEffect(() => {
    if (mounted) {
      setIsStoreReady(true)
      setCurrentWidth(settings.sidebarWidth || 320)
    }
  }, [mounted, settings.sidebarWidth])

  // Memoized hierarchy builder to prevent unnecessary re-renders
  const buildHierarchySafe = useCallback(() => {
    if (!mounted || !isStoreReady) return

    try {
      buildChatHierarchy()
    } catch (error) {
      console.warn('Failed to build chat hierarchy:', error)
    }
  }, [mounted, isStoreReady, buildChatHierarchy])

  // Build hierarchy on mount and when chats change
  useEffect(() => {
    buildHierarchySafe()
  }, [buildHierarchySafe, chats])

  // Get hierarchy with error handling
  const chatHierarchy =
    mounted && isStoreReady
      ? (() => {
          try {
            return getChatHierarchy()
          } catch (error) {
            console.warn('Failed to get chat hierarchy:', error)
            return null
          }
        })()
      : null

  // Handle sidebar resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return

      const rect = sidebarRef.current.getBoundingClientRect()
      const newWidth = e.clientX - rect.left
      const clampedWidth = Math.max(240, Math.min(480, newWidth))

      setCurrentWidth(clampedWidth)
    }

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false)
        setSidebarWidth(currentWidth)
      }
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, currentWidth, setSidebarWidth])

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleNewChat = useCallback(() => {
    if (!mounted || !isStoreReady) return
    try {
      createChat()
    } catch (error) {
      console.warn('Failed to create chat:', error)
    }
  }, [mounted, isStoreReady, createChat])

  const handleOpenFolderDialog = useCallback((e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the main button
    if (!mounted || !isStoreReady) return
    try {
      openCreateFolderDialog()
    } catch (error) {
      console.warn('Failed to open folder dialog:', error)
    }
  }, [mounted, isStoreReady, openCreateFolderDialog])

  const handleToggleSortDropdown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the main button
    setShowSortDropdown(!showSortDropdown)
  }, [showSortDropdown])

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSortDropdown && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSortDropdown])


  // Show loading skeleton during hydration
  if (!mounted || !isStoreReady) {
    return (
      <div
        className={cn(
          'relative flex h-full flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900',
          className
        )}
        style={{ width: `320px` }}
      >
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-3">
            <div className="h-9 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 flex-1 animate-pulse rounded bg-blue-100 dark:bg-blue-900" />
            <div className="h-9 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-8 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        ref={sidebarRef}
        className={cn(
          'relative flex h-full flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900',
          className
        )}
        style={{ width: `${currentWidth}px` }}
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          {/* Enhanced Search */}
          <div className="mb-3">
            <EnhancedSearch
              value={search.query}
              onSearch={performSearch}
              onClear={clearSearch}
              filters={search.filters}
              onFiltersChange={setSearchFilters}
              searchHistory={search.searchHistory}
              suggestions={getSearchSuggestions(search.query)}
              results={search.results}
              isSearching={search.isSearching}
              onSelectResult={selectSearchResult}
              placeholder="Search chats"
              className="w-full"
            />
          </div>

          {/* New Chat Button Layout */}
          <div className="space-y-2">
            {/* Main New Chat Button */}
            <Button
              onClick={handleNewChat}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 flex flex-row items-center justify-center gap-2 py-3 h-12"
            >
              <Plus className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium text-base whitespace-nowrap">New Chat</span>
              <Sparkles className="h-4 w-4 flex-shrink-0" />
            </Button>
            
            {/* Secondary Action Buttons */}
            <div className="flex items-center justify-between gap-2 relative">
              {/* Create Folder Button */}
              <Tooltip content="Create Folder">
                <button
                  onClick={handleOpenFolderDialog}
                  className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Create new folder"
                >
                  <Folder className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
              </Tooltip>
              
              {/* Sort/Filter Button */}
              <Tooltip content="Sort & Filter">
                <button
                  onClick={handleToggleSortDropdown}
                  className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Sort and filter options"
                >
                  <Filter className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
              </Tooltip>
              
              {/* Sort Dropdown */}
              {showSortDropdown && (
                <SortDropdown 
                  className="absolute top-10 right-0 z-10" 
                  onClose={() => setShowSortDropdown(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Chat hierarchy */}
        <div className="flex-1 overflow-y-auto">
          {chatHierarchy ? (
            <ChatHierarchyView hierarchy={chatHierarchy} />
          ) : (
            <div className="p-4 text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No chat groups yet
              </div>
              <Button
                variant="ghost"
                onClick={handleNewChat}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Plus className="mr-1 h-4 w-4" />
                Create your first chat
              </Button>
            </div>
          )}
        </div>

        {/* Starred section */}
        <div className="border-t border-gray-200 px-3 py-2 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <Star className="h-3 w-3" />
            Starred
          </div>
        </div>

        {/* Resize handle */}
        <div
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-blue-500"
          onMouseDown={handleResizeStart}
          style={{ cursor: isResizing ? 'col-resize' : 'e-resize' }}
        />
      </div>

      {/* Dialogs */}
      <CreateFolderDialog />
      <MoveChatDialog />
      <RenameDialog />
    </>
  )
}

export function ChatSidebar({ className }: ChatSidebarProps) {
  return (
    <ErrorBoundary
      fallback={({ retry }) => (
        <div
          className={cn(
            'relative flex h-full flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900',
            className
          )}
          style={{ width: `320px` }}
        >
          <div className="flex flex-col items-center justify-center p-8">
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Failed to load sidebar
            </p>
            <button
              onClick={retry}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    >
      <ChatSidebarInner className={className} />
    </ErrorBoundary>
  )
}
