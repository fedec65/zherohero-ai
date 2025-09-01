'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useChatStore } from '../../lib/stores/chat-store'
import { Chat } from '../../lib/stores/types'
import {
  MessageSquare,
  Pin,
  Edit2,
  Copy,
  FolderOpen,
  Trash2,
  MoreVertical,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { useMounted } from '../../lib/hooks/use-mounted'
import { ErrorBoundary } from '../ui/error-boundary'

interface ChatItemProps {
  chat: Chat
  level?: number
}

function ChatItemInner({ chat, level = 0 }: ChatItemProps) {
  const mounted = useMounted()
  const [showMenu, setShowMenu] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const actionInProgressRef = useRef(false)

  const chatStore = useChatStore()
  const {
    activeChat,
    setActiveChat,
    pinChat,
    duplicateChat,
    deleteChat,
    openMoveDialog,
    openRenameDialog,
  } = chatStore

  // Prevent multiple rapid actions
  const performAction = useCallback(
    async (action: () => Promise<void> | void) => {
      if (actionInProgressRef.current || !mounted) return

      actionInProgressRef.current = true
      setIsUpdating(true)

      try {
        await action()
      } catch (error) {
        console.warn('Chat item action failed:', error)
      } finally {
        actionInProgressRef.current = false
        setIsUpdating(false)
        setShowMenu(false)
      }
    },
    [mounted]
  )

  const handleChatClick = useCallback(() => {
    if (!mounted || isUpdating) return
    try {
      setActiveChat(chat.id)
    } catch (error) {
      console.warn('Failed to set active chat:', error)
    }
  }, [mounted, isUpdating, setActiveChat, chat.id])

  const handlePinToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      performAction(() => pinChat(chat.id))
    },
    [performAction, pinChat, chat.id]
  )

  const handleRename = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      performAction(() => openRenameDialog('chat', chat.id, chat.title))
    },
    [performAction, openRenameDialog, chat.id, chat.title]
  )

  const handleDuplicate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      performAction(async () => {
        await duplicateChat(chat.id)
      })
    },
    [performAction, duplicateChat, chat.id]
  )

  const handleMove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      performAction(() => openMoveDialog(chat.id))
    },
    [performAction, openMoveDialog, chat.id]
  )

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      performAction(() => deleteChat(chat.id))
    },
    [performAction, deleteChat, chat.id]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      actionInProgressRef.current = false
    }
  }, [])

  // Show loading skeleton during hydration
  if (!mounted) {
    return (
      <div className="group relative">
        <div className="flex w-full items-center gap-2 rounded-lg px-3 py-2">
          <div className="h-4 w-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 flex-1 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    )
  }

  return (
    <div className="group relative">
      <button
        onClick={handleChatClick}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
          level > 0 && 'ml-6',
          activeChat === chat.id
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
          isUpdating && 'pointer-events-none opacity-50'
        )}
        disabled={isUpdating}
      >
        <MessageSquare className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 truncate text-left">{chat.title}</span>

        {chat.isPinned && (
          <Pin className="h-3 w-3 flex-shrink-0 text-blue-500" />
        )}

        {/* Three-dots menu */}
        <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'rounded p-1 transition-all',
                'opacity-0 group-hover:opacity-100',
                'hover:bg-gray-200 dark:hover:bg-gray-700',
                showMenu && 'opacity-100'
              )}
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(true)
              }}
            >
              <MoreVertical className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handlePinToggle}>
              <Pin className="mr-2 h-4 w-4" />
              {chat.isPinned ? 'Unpin' : 'Pin'}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleRename}>
              <Edit2 className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleMove}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Move
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </button>
    </div>
  )
}

export function ChatItem({ chat, level = 0 }: ChatItemProps) {
  return (
    <ErrorBoundary
      fallback={({ retry }) => (
        <div className="group relative">
          <div className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm">
            <MessageSquare className="h-4 w-4 flex-shrink-0 text-gray-400" />
            <span className="flex-1 truncate text-left text-gray-400">
              Failed to load chat
            </span>
            <button
              onClick={retry}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    >
      <ChatItemInner chat={chat} level={level} />
    </ErrorBoundary>
  )
}
