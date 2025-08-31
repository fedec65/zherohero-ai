'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Search,
  Plus,
  FolderPlus,
  Filter,
  Star,
  MoreHorizontal,
  Trash2,
  Edit3,
} from 'lucide-react'
import { Button } from '../ui/button'
import { SearchInput } from '../ui/input'
import { Tooltip } from '../ui/tooltip'
import { EnhancedSearch } from '../chat/enhanced-search'
import { useChatStore } from '../../lib/stores/chat-store'
import { useSettingsStore } from '../../lib/stores/settings-store'
import { cn } from '../../lib/utils'

interface ChatSidebarProps {
  className?: string
}

export function ChatSidebar({ className }: ChatSidebarProps) {
  const {
    chats,
    searchQuery,
    setSearchQuery,
    createChat,
    deleteChat,
    setActiveChat,
    activeChat,
    search,
    performSearch,
    clearSearch,
    setSearchFilters,
    getFilteredChats,
    getSearchSuggestions,
    selectSearchResult,
  } = useChatStore()
  const { settings, setSidebarWidth } = useSettingsStore()
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [currentWidth, setCurrentWidth] = useState(settings.sidebarWidth)

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

  // Get chats to display - either search results or filtered chats
  const displayChats = search.query
    ? search.results
        .filter((result) => result.type === 'chat')
        .map((result) => chats[result.id])
        .filter(Boolean)
    : getFilteredChats()

  const starredChats = displayChats.filter((chat) => chat.starred)
  const regularChats = displayChats.filter((chat) => !chat.starred)

  const handleNewChat = () => {
    createChat()
  }

  const handleChatClick = (chatId: string) => {
    setActiveChat(chatId)
  }

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteChat(chatId)
  }

  return (
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
            placeholder="Search chats and messages..."
            className="w-full"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Tooltip content="New Chat">
            <Button
              onClick={handleNewChat}
              className="min-w-0 flex-1 whitespace-nowrap bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4 flex-shrink-0" />
              New Chat
            </Button>
          </Tooltip>
        </div>

        {/* Secondary buttons */}
        <div className="mt-2 flex items-center gap-2">
          <Tooltip content="New Folder">
            <Button
              variant="outline"
              size="sm"
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

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {displayChats.length === 0 ? (
          <div className="p-4 text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {search.query ? 'No matching chats' : 'No chat groups yet'}
            </div>
            {!search.query && (
              <Button
                variant="ghost"
                onClick={handleNewChat}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Plus className="mr-1 h-4 w-4" />
                Create your first chat
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {/* Regular chats */}
            {regularChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={activeChat === chat.id}
                onClick={() => handleChatClick(chat.id)}
                onDelete={(e) => handleDeleteChat(chat.id, e)}
                searchQuery={search.query}
                searchResults={search.results}
              />
            ))}
          </div>
        )}
      </div>

      {/* Starred section */}
      {starredChats.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <Star className="h-3 w-3" />
              Starred
            </div>
            <div className="space-y-1">
              {starredChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={activeChat === chat.id}
                  onClick={() => handleChatClick(chat.id)}
                  onDelete={(e) => handleDeleteChat(chat.id, e)}
                  searchQuery={search.query}
                  searchResults={search.results}
                  compact
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-blue-500"
        onMouseDown={handleResizeStart}
        style={{ cursor: isResizing ? 'col-resize' : 'e-resize' }}
      />
    </div>
  )
}

interface ChatItemProps {
  chat: {
    id: string
    title: string
    lastMessageAt?: Date
    messageCount: number
    starred: boolean
  }
  isActive: boolean
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
  searchQuery?: string
  searchResults?: any[]
  compact?: boolean
}

function ChatItem({
  chat,
  isActive,
  onClick,
  onDelete,
  searchQuery,
  searchResults,
  compact = false,
}: ChatItemProps) {
  const [showActions, setShowActions] = useState(false)

  // Find search highlights for this chat
  const searchResult = searchResults?.find(
    (result) => result.type === 'chat' && result.id === chat.id
  )
  const highlights =
    searchResult?.highlights || (searchQuery ? [searchQuery] : [])

  // Component for highlighted text
  const HighlightedTitle = ({
    title,
    highlights,
  }: {
    title: string
    highlights: string[]
  }) => {
    if (!highlights.length) return <>{title}</>

    let highlightedTitle = title
    highlights.forEach((highlight) => {
      const regex = new RegExp(`(${highlight})`, 'gi')
      highlightedTitle = highlightedTitle.replace(
        regex,
        '<mark class="bg-yellow-200 dark:bg-yellow-900 text-inherit rounded px-0.5">$1</mark>'
      )
    })

    return <span dangerouslySetInnerHTML={{ __html: highlightedTitle }} />
  }

  return (
    <div
      className={cn(
        'group relative cursor-pointer rounded-lg p-3 transition-all',
        'hover:bg-white dark:hover:bg-gray-800',
        isActive &&
          'bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700',
        compact && 'p-2'
      )}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4
              className={cn(
                'truncate font-medium text-gray-900 dark:text-white',
                compact ? 'text-sm' : 'text-sm'
              )}
            >
              <HighlightedTitle title={chat.title} highlights={highlights} />
            </h4>
            {chat.starred && (
              <Star className="h-3 w-3 flex-shrink-0 fill-current text-yellow-500" />
            )}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {chat.lastMessageAt
                ? new Date(chat.lastMessageAt).toLocaleDateString()
                : 'New chat'}
            </span>
            {!compact && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {chat.messageCount} messages
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="ml-2 flex items-center gap-1">
            <Tooltip content="Edit">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Implement edit functionality
                }}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </Tooltip>
            <Tooltip content="More options">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Implement more options menu
                }}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </Tooltip>
            <Tooltip content="Delete">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-500 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20"
                onClick={onDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  )
}
