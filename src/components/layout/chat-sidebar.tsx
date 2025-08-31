'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, Plus, FolderPlus, Filter, Star } from 'lucide-react'
import { Button } from '../ui/button'
import { EnhancedSearch } from '../chat/enhanced-search'
import { ChatHierarchyView } from '../chat/chat-hierarchy-view'
import { CreateFolderDialog } from '../chat/create-folder-dialog'
import { MoveChatDialog } from '../chat/move-chat-dialog'
import { RenameDialog } from '../chat/rename-dialog'
import { useChatStore } from '../../lib/stores/chat-store'
import { useSettingsStore } from '../../lib/stores/settings-store'
import { cn } from '../../lib/utils'
import { Tooltip } from '../ui/tooltip'

interface ChatSidebarProps {
  className?: string
}

export function ChatSidebar({ className }: ChatSidebarProps) {
  const {
    chats,
    createChat,
    search,
    performSearch,
    clearSearch,
    setSearchFilters,
    getSearchSuggestions,
    selectSearchResult,
    openCreateFolderDialog,
    getChatHierarchy,
    buildChatHierarchy,
  } = useChatStore()

  const { settings, setSidebarWidth } = useSettingsStore()
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [currentWidth, setCurrentWidth] = useState(settings.sidebarWidth)

  // Build hierarchy on mount and when chats change
  useEffect(() => {
    buildChatHierarchy()
  }, [chats, buildChatHierarchy])

  const chatHierarchy = getChatHierarchy()

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

  const handleNewChat = () => {
    createChat()
  }

  const handleNewFolder = () => {
    openCreateFolderDialog()
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

          {/* Primary Action Button */}
          <div className="flex items-center gap-2">
            <Tooltip content="New Chat">
              <Button
                onClick={handleNewChat}
                className="min-w-0 flex-1 whitespace-nowrap bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="whitespace-nowrap">New Chat</span>
              </Button>
            </Tooltip>
          </div>

          {/* Secondary buttons */}
          <div className="mt-2 flex items-center gap-2">
            <Tooltip content="New Folder">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewFolder}
                className="group relative flex-1 overflow-hidden border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 font-medium transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200 hover:from-indigo-50 hover:to-purple-50 hover:shadow-lg dark:border-gray-600 dark:from-gray-800 dark:to-gray-700 dark:hover:border-indigo-700 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20"
              >
                <FolderPlus className="mr-2 h-4 w-4 flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                <span className="transition-colors duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Folder
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </Button>
            </Tooltip>
            <Tooltip content="Filter & Sort">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </Tooltip>
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
