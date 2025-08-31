'use client'

import { ChatHierarchy } from '../../lib/stores/types'
import { ChatItem } from './chat-item'
import { FolderNode } from './folder-node'
import { Pin } from 'lucide-react'

interface ChatHierarchyViewProps {
  hierarchy: ChatHierarchy
}

export function ChatHierarchyView({ hierarchy }: ChatHierarchyViewProps) {
  return (
    <div className="space-y-1 px-3 py-2">
      {/* Pinned chats section */}
      {hierarchy.pinnedChats.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            <Pin className="h-3 w-3" />
            <span>PINNED</span>
          </div>
          {hierarchy.pinnedChats.map((chat) => (
            <ChatItem key={chat.id} chat={chat} />
          ))}
        </div>
      )}

      {/* Root level chats */}
      {hierarchy.rootChats.length > 0 && (
        <div className="space-y-1">
          {hierarchy.rootChats.map((chat) => (
            <ChatItem key={chat.id} chat={chat} />
          ))}
        </div>
      )}

      {/* Folders with their chats */}
      {hierarchy.folders.length > 0 && (
        <div className="space-y-1">
          {hierarchy.folders.map((folderNode) => (
            <FolderNode key={folderNode.folder.id} node={folderNode} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {hierarchy.pinnedChats.length === 0 &&
        hierarchy.rootChats.length === 0 &&
        hierarchy.folders.length === 0 && (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">No chats yet</p>
            <p className="mt-1 text-xs">Create a new chat to get started</p>
          </div>
        )}
    </div>
  )
}
