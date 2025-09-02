'use client'

import React from 'react'
import { FolderNode as FolderNodeType } from '../../lib/stores/types'
import { useChatStore } from '../../lib/stores/chat-store'
import { ChevronDown, ChevronRight, Folder, MoreHorizontal, MessageSquare, FolderPlus, Pin, Edit, Palette, Settings, Trash2 } from 'lucide-react'
import { ChatItem } from './chat-item'
import { getFolderIconColor } from '../../lib/constants'
import { cn } from '../../lib/utils'
import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react'
import { ContextMenu, ContextMenuItem, useContextMenu } from '../ui/context-menu'
import { useToast } from '../ui/toast'
import { useConfirmation, ConfirmationPresets } from '../ui/confirmation-dialog'
import { ErrorHandlers } from '../../lib/utils/error-handling'

interface FolderNodeProps {
  node: FolderNodeType
}

const FolderNodeComponent = ({ node }: FolderNodeProps) => {
  const { toggleFolder, createChat, createFolder, pinFolder, unpinFolder, renameFolder, deleteFolder } = useChatStore()
  const [isHovered, setIsHovered] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [contentHeight, setContentHeight] = useState<number>(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const { isOpen, position, openContextMenu, closeContextMenu } = useContextMenu()
  const { showToast } = useToast()
  const { confirm, ConfirmationComponent } = useConfirmation()

  const handleToggle = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    toggleFolder(node.folder.id)
    
    // Reset animation state after transition
    setTimeout(() => {
      setIsAnimating(false)
    }, 300)
  }, [isAnimating, toggleFolder, node.folder.id])

  // Update content height when expanded/collapsed or content changes
  useEffect(() => {
    if (contentRef.current) {
      const height = node.isExpanded ? contentRef.current.scrollHeight : 0
      setContentHeight(height)
    }
  }, [node.isExpanded, node.chats.length])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleToggle()
        break
      case 'ArrowRight':
        if (!node.isExpanded) {
          e.preventDefault()
          handleToggle()
        }
        break
      case 'ArrowLeft':
        if (node.isExpanded) {
          e.preventDefault()
          handleToggle()
        }
        break
      case 'Delete':
        e.preventDefault()
        handleDeleteFolder()
        break
      case 'F2':
        e.preventDefault()
        const newName = prompt('Enter new folder name:', node.folder.name)
        if (newName && newName !== node.folder.name) {
          renameFolder(node.folder.id, newName)
          showToast({
            type: 'success',
            title: 'Success',
            message: 'Folder renamed'
          })
        }
        break
    }
  }, [handleToggle, node.isExpanded, node.folder.id, node.folder.name, deleteFolder, renameFolder, showToast])

  // Handle folder deletion with confirmation
  const handleDeleteFolder = useCallback(async () => {
    try {
      const confirmed = await confirm(ConfirmationPresets.deleteFolder(node.folder.name, node.chats.length))
      if (confirmed) {
        await deleteFolder(node.folder.id)
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Folder deleted successfully'
        })
      }
    } catch (error) {
      const errorMessage = ErrorHandlers.folderOperation(error, 'delete')
      showToast({
        type: 'error',
        title: 'Error',
        message: errorMessage
      })
    }
  }, [confirm, node.folder.name, node.folder.id, node.chats.length, deleteFolder, showToast])

  const folderIconColor = getFolderIconColor(node.folder.color)

  const contextMenuItems: ContextMenuItem[] = useMemo(() => [
    {
      id: 'new-chat',
      label: 'New Chat',
      icon: MessageSquare,
      onClick: () => {
        createChat({ folderId: node.folder.id })
        showToast({
          type: 'success',
          title: 'Success',
          message: 'New chat created'
        })
      }
    },
    {
      id: 'new-folder',
      label: 'New Folder',
      icon: FolderPlus,
      onClick: () => {
        const name = prompt('Enter folder name:')
        if (name) {
          createFolder(name, 'blue', node.folder.id)
          showToast({
            type: 'success',
            title: 'Success',
            message: 'Folder created'
          })
        }
      }
    },
    {
      id: 'separator1',
      label: '',
      separator: true,
      onClick: () => {}
    },
    {
      id: 'pin',
      label: node.folder.isPinned ? 'Unpin' : 'Pin',
      icon: Pin,
      onClick: () => {
        if (node.folder.isPinned) {
          unpinFolder(node.folder.id)
          showToast({
            type: 'success',
            title: 'Success',
            message: 'Folder unpinned'
          })
        } else {
          pinFolder(node.folder.id)
          showToast({
            type: 'success',
            title: 'Success',
            message: 'Folder pinned'
          })
        }
      }
    },
    {
      id: 'rename',
      label: 'Rename',
      icon: Edit,
      onClick: () => {
        const newName = prompt('Enter new folder name:', node.folder.name)
        if (newName && newName !== node.folder.name) {
          renameFolder(node.folder.id, newName)
          showToast({
            type: 'success',
            title: 'Success',
            message: 'Folder renamed'
          })
        }
      }
    },
    {
      id: 'color',
      label: 'Set Color',
      icon: Palette,
      onClick: () => {
        // TODO: Implement color picker dialog
        console.log('Set Color clicked')
      }
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: () => {
        // TODO: Implement folder settings dialog
        console.log('Settings clicked')
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
      onClick: handleDeleteFolder
    }
  ], [node.folder.id, node.folder.name, node.folder.isPinned, createChat, createFolder, pinFolder, unpinFolder, renameFolder, deleteFolder, showToast])

  return (
    <div className="mb-1">
      {/* Folder header */}
      <div
        className={cn(
          'group relative flex w-full items-center gap-2 px-2 py-1.5 text-sm',
          'text-gray-700 dark:text-gray-300',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'rounded-lg transition-all duration-200'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onContextMenu={openContextMenu}
      >
        <button
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className="flex items-center gap-2 flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-md transition-all duration-200 hover:scale-[1.01]"
          aria-label={node.isExpanded ? 'Collapse folder' : 'Expand folder'}
          aria-expanded={node.isExpanded}
          role="treeitem"
          tabIndex={0}
          disabled={isAnimating}
        >
          <div className={cn(
            "flex-shrink-0 transition-all duration-300 ease-out",
            node.isExpanded ? 'rotate-90' : 'rotate-0',
            isAnimating && 'animate-pulse'
          )}>
            <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="flex-shrink-0">
            <Folder className={cn('h-4 w-4 transition-colors', folderIconColor)} />
          </div>
          <span className="flex-1 truncate text-left font-medium">
            {node.folder.name}
          </span>
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded-full transition-colors',
            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
            'group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
          )}>
            {node.chats.length}
          </span>
        </button>
        
        {/* Options menu - shows on hover */}
        {isHovered && (
          <button
            className={cn(
              'flex-shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100',
              'hover:bg-gray-200 dark:hover:bg-gray-700',
              'transition-all duration-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
            aria-label="Folder options"
            onClick={(e) => {
              e.stopPropagation()
              openContextMenu(e as any)
            }}
          >
            <MoreHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>

      {/* Folder contents with smooth height-based animation */}
      <div 
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ 
          height: node.isExpanded ? `${contentHeight}px` : '0px',
          opacity: node.isExpanded ? 1 : 0
        }}
      >
        <div 
          ref={contentRef}
          className="ml-4 border-l-2 pl-3 mt-1 transition-colors border-gray-200 dark:border-gray-700"
        >
          {node.chats.length > 0 ? (
            <div className="space-y-1">
              {node.chats.map((chat, index) => (
                <div
                  key={chat.id}
                  className={cn(
                    'transform transition-all duration-200',
                    node.isExpanded 
                      ? 'translate-x-0 opacity-100' 
                      : 'translate-x-2 opacity-0'
                  )}
                  style={{
                    transitionDelay: node.isExpanded ? `${index * 50}ms` : '0ms'
                  }}
                >
                  <ChatItem chat={chat} level={1} />
                </div>
              ))}
            </div>
          ) : (
            <div className={cn(
              'px-3 py-3 text-xs italic text-gray-500 dark:text-gray-400',
              'rounded-md bg-gray-50 dark:bg-gray-800/50',
              'border border-dashed border-gray-200 dark:border-gray-700',
              'text-center transition-all duration-200',
              node.isExpanded ? 'opacity-100' : 'opacity-0'
            )}>
              No chats in this folder
              <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Drag chats here or create a new one
              </div>
            </div>
          )}
        </div>
      </div>

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

// Memoized component to prevent unnecessary re-renders
export const FolderNode = memo(FolderNodeComponent, (prevProps, nextProps) => {
  const prevNode = prevProps.node
  const nextNode = nextProps.node
  
  // Only re-render if folder properties or chat count/ids change
  return (
    prevNode.folder.id === nextNode.folder.id &&
    prevNode.folder.name === nextNode.folder.name &&
    prevNode.folder.color === nextNode.folder.color &&
    prevNode.folder.isPinned === nextNode.folder.isPinned &&
    prevNode.isExpanded === nextNode.isExpanded &&
    prevNode.chats.length === nextNode.chats.length &&
    prevNode.chats.every((chat, index) => 
      nextNode.chats[index] && chat.id === nextNode.chats[index].id && chat.title === nextNode.chats[index].title
    )
  )
})
