'use client'

import { FolderNode as FolderNodeType } from '../../lib/stores/types'
import { useChatStore } from '../../lib/stores/chat-store'
import { ChevronDown, ChevronRight, Folder } from 'lucide-react'
import { ChatItem } from './chat-item'
import { cn } from '../../lib/utils'

interface FolderNodeProps {
  node: FolderNodeType
}

export function FolderNode({ node }: FolderNodeProps) {
  const { toggleFolder } = useChatStore()

  const handleToggle = () => {
    toggleFolder(node.folder.id)
  }

  return (
    <div className="mb-1">
      {/* Folder header */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 text-sm',
          'text-gray-700 dark:text-gray-300',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'rounded-lg transition-colors'
        )}
      >
        {node.isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
        <Folder className="h-4 w-4 text-blue-500" />
        <span className="flex-1 text-left truncate font-medium">
          {node.folder.name}
        </span>
        <span className="text-xs text-gray-500">
          {node.chats.length}
        </span>
      </button>

      {/* Folder contents */}
      {node.isExpanded && (
        <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2">
          {node.chats.length > 0 ? (
            node.chats.map(chat => (
              <ChatItem key={chat.id} chat={chat} level={1} />
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 italic">
              No chats in this folder
            </div>
          )}
        </div>
      )}
    </div>
  )
}