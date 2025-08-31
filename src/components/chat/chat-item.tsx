'use client'

import { useState } from 'react'
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

interface ChatItemProps {
  chat: Chat
  level?: number
}

export function ChatItem({ chat, level = 0 }: ChatItemProps) {
  const {
    activeChat,
    setActiveChat,
    pinChat,
    duplicateChat,
    deleteChat,
    openMoveDialog,
    openRenameDialog,
  } = useChatStore()

  const [showMenu, setShowMenu] = useState(false)

  const handleChatClick = () => {
    setActiveChat(chat.id)
  }

  const handlePinToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    pinChat(chat.id)
    setShowMenu(false)
  }

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    openRenameDialog('chat', chat.id, chat.title)
    setShowMenu(false)
  }

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await duplicateChat(chat.id)
    setShowMenu(false)
  }

  const handleMove = (e: React.MouseEvent) => {
    e.stopPropagation()
    openMoveDialog(chat.id)
    setShowMenu(false)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteChat(chat.id)
    setShowMenu(false)
  }

  return (
    <div className="relative group">
      <button
        onClick={handleChatClick}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
          level > 0 && 'ml-6',
          activeChat === chat.id
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        )}
      >
        <MessageSquare className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left truncate">{chat.title}</span>
        
        {chat.isPinned && (
          <Pin className="h-3 w-3 text-blue-500 flex-shrink-0" />
        )}

        {/* Three-dots menu */}
        <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'p-1 rounded transition-all',
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
              <Pin className="h-4 w-4 mr-2" />
              {chat.isPinned ? 'Unpin' : 'Pin'}
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleRename}>
              <Edit2 className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleMove}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Move
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </button>
    </div>
  )
}