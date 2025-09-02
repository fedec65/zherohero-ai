'use client'

import React from 'react'
import { useState, useCallback, useRef, useEffect, memo, useMemo } from 'react'
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
  Star,
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
import { ContextMenu, ContextMenuItem, useContextMenu } from '../ui/context-menu'
import { useToast } from '../ui/toast'
import { useConfirmation, ConfirmationPresets } from '../ui/confirmation-dialog'
import { ErrorHandlers } from '../../lib/utils/error-handling'

interface ChatItemProps {
  chat: Chat
  level?: number
}

const ChatItemInner = ({ chat, level = 0 }: ChatItemProps) => {
  const mounted = useMounted()
  const [showMenu, setShowMenu] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const actionInProgressRef = useRef(false)

  const chatStore = useChatStore()
  const {
    activeChat,
    setActiveChat,
    pinChat,
    starChat,
    duplicateChat,
    deleteChat,
    openMoveDialog,
    openRenameDialog,
  } = chatStore
  const { isOpen, position, openContextMenu, closeContextMenu } = useContextMenu()
  const { showToast } = useToast()
  const { confirm, ConfirmationComponent } = useConfirmation()

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

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleChatClick()
        break
      case 'Delete':
        e.preventDefault()
        handleDeleteChat()
        break
      case 'F2':
        e.preventDefault()
        performAction(() => openRenameDialog('chat', chat.id, chat.title))
        break
      case 'p':
      case 'P':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          performAction(() => pinChat(chat.id))
          showToast({
            type: 'success',
            title: 'Success',
            message: chat.isPinned ? 'Chat unpinned' : 'Chat pinned'
          })
        }
        break
      case 's':
      case 'S':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          performAction(() => starChat(chat.id))
          showToast({
            type: 'success',
            title: 'Success',
            message: chat.isStarred ? 'Chat unstarred' : 'Chat starred'
          })
        }
        break
    }
  }, [handleChatClick, chat.id, chat.title, chat.isPinned, chat.isStarred, performAction, deleteChat, openRenameDialog, pinChat, starChat, showToast])

  // Handle chat deletion with confirmation
  const handleDeleteChat = useCallback(async () => {
    try {
      const confirmed = await confirm(ConfirmationPresets.deleteChat(chat.title))
      if (confirmed) {
        await performAction(async () => {
          await deleteChat(chat.id)
        })
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Chat deleted successfully'
        })
      }
    } catch (error) {
      const errorMessage = ErrorHandlers.chatOperation(error, 'delete')
      showToast({
        type: 'error',
        title: 'Error',
        message: errorMessage
      })
    }
  }, [confirm, chat.title, chat.id, performAction, deleteChat, showToast])

  const handlePinToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      performAction(() => pinChat(chat.id))
    },
    [performAction, pinChat, chat.id]
  )

  const handleStarToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      performAction(() => starChat(chat.id))
    },
    [performAction, starChat, chat.id]
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

  const contextMenuItems: ContextMenuItem[] = useMemo(() => [
    {
      id: 'move',
      label: 'Move',
      icon: FolderOpen,
      onClick: () => openMoveDialog(chat.id)
    },
    {
      id: 'separator1',
      label: '',
      separator: true,
      onClick: () => {}
    },
    {
      id: 'pin',
      label: chat.isPinned ? 'Unpin' : 'Pin',
      icon: Pin,
      onClick: () => {
        pinChat(chat.id)
        showToast({
          type: 'success',
          title: 'Success',
          message: chat.isPinned ? 'Chat unpinned' : 'Chat pinned'
        })
      }
    },
    {
      id: 'star',
      label: chat.isStarred ? 'Unstar' : 'Star',
      icon: Star,
      onClick: () => {
        starChat(chat.id)
        showToast({
          type: 'success',
          title: 'Success',
          message: chat.isStarred ? 'Chat unstarred' : 'Chat starred'
        })
      }
    },
    {
      id: 'rename',
      label: 'Rename',
      icon: Edit2,
      onClick: () => openRenameDialog('chat', chat.id, chat.title)
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: Copy,
      onClick: () => {
        duplicateChat(chat.id)
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Chat duplicated'
        })
      }
    },
    {
      id: 'separator2',
      label: '',
      separator: true,
      onClick: () => {}
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      onClick: handleDeleteChat
    }
  ], [chat.id, chat.title, chat.isPinned, chat.isStarred, openMoveDialog, pinChat, starChat, openRenameDialog, duplicateChat, deleteChat, showToast])

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
        onContextMenu={openContextMenu}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-900',
          'transform hover:scale-[1.02] active:scale-[0.98]',
          level > 0 && 'ml-6',
          activeChat === chat.id
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 shadow-sm'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-sm',
          isUpdating && 'pointer-events-none opacity-50 animate-pulse'
        )}
        disabled={isUpdating}
        role="treeitem"
        tabIndex={0}
        aria-label={`Chat: ${chat.title}${chat.isPinned ? ' (pinned)' : ''}${chat.isStarred ? ' (starred)' : ''}`}
        aria-selected={activeChat === chat.id}
      >
        <MessageSquare className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 truncate text-left">{chat.title}</span>

        {chat.isPinned && (
          <Pin className="h-3 w-3 flex-shrink-0 text-blue-500" />
        )}

        {chat.isStarred && (
          <Star className="h-3 w-3 flex-shrink-0 text-yellow-500 fill-current" />
        )}

        {/* Three-dots menu */}
        <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'rounded p-1 transition-all duration-200',
                'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
                'hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-110',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:opacity-100',
                showMenu && 'opacity-100'
              )}
              onClick={(e) => {
                e.stopPropagation()
                openContextMenu(e as any)
              }}
              aria-label="Chat options"
              tabIndex={-1}
            >
              <MoreVertical className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handlePinToggle}>
              <Pin className="mr-2 h-4 w-4" />
              {chat.isPinned ? 'Unpin' : 'Pin'}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleStarToggle}>
              <Star className="mr-2 h-4 w-4" />
              {chat.isStarred ? 'Unstar' : 'Star'}
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

      {/* Context Menu */}
      <ContextMenu
        isOpen={isOpen}
        onClose={closeContextMenu}
        position={position}
        items={contextMenuItems}
      />
      
      {/* Confirmation Dialog */}
      <ConfirmationComponent />
    </div>
  )
}

const ChatItemComponent = ({ chat, level = 0 }: ChatItemProps) => {
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

// Memoized component to prevent unnecessary re-renders
export const ChatItem = memo(ChatItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.chat.id === nextProps.chat.id &&
    prevProps.chat.title === nextProps.chat.title &&
    prevProps.chat.isPinned === nextProps.chat.isPinned &&
    prevProps.chat.isStarred === nextProps.chat.isStarred &&
    prevProps.chat.updatedAt === nextProps.chat.updatedAt &&
    prevProps.level === nextProps.level
  )
})
