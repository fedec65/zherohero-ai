'use client'

import React from 'react'
import { ChatHierarchy } from '../../lib/stores/types'
import { ChatItem } from './chat-item'
import { FolderNode } from './folder-node'
import { Pin, AlertCircle, RefreshCw } from 'lucide-react'
import { ErrorBoundary } from '../ui/error-boundary'
import { Button } from '../ui/button'

interface ChatHierarchyViewProps {
  hierarchy: ChatHierarchy
}

const ChatHierarchyViewInner = ({ hierarchy }: ChatHierarchyViewProps) => {
  if (!hierarchy) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Failed to load chat hierarchy
        </p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-1 px-3 py-2">
      {/* Pinned chats section */}
      {hierarchy.pinnedChats.length > 0 && (
        <ErrorBoundary
          fallback={({ retry }) => (
            <div className="p-2 text-center">
              <p className="text-xs text-red-600 dark:text-red-400 mb-2">Failed to load pinned chats</p>
              <Button variant="ghost" size="sm" onClick={retry}>
                Retry
              </Button>
            </div>
          )}
        >
          <div className="mb-4">
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              <Pin className="h-3 w-3" />
              <span>PINNED</span>
            </div>
            {hierarchy.pinnedChats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} />
            ))}
          </div>
        </ErrorBoundary>
      )}

      {/* Root level chats */}
      {hierarchy.rootChats.length > 0 && (
        <ErrorBoundary
          fallback={({ retry }) => (
            <div className="p-2 text-center">
              <p className="text-xs text-red-600 dark:text-red-400 mb-2">Failed to load chats</p>
              <Button variant="ghost" size="sm" onClick={retry}>
                Retry
              </Button>
            </div>
          )}
        >
          <div className="space-y-1">
            {hierarchy.rootChats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} />
            ))}
          </div>
        </ErrorBoundary>
      )}

      {/* Folders with their chats */}
      {hierarchy.folders.length > 0 && (
        <ErrorBoundary
          fallback={({ retry }) => (
            <div className="p-2 text-center">
              <p className="text-xs text-red-600 dark:text-red-400 mb-2">Failed to load folders</p>
              <Button variant="ghost" size="sm" onClick={retry}>
                Retry
              </Button>
            </div>
          )}
        >
          <div className="space-y-1">
            {hierarchy.folders.map((folderNode) => (
              <FolderNode key={folderNode.folder.id} node={folderNode} />
            ))}
          </div>
        </ErrorBoundary>
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

export function ChatHierarchyView({ hierarchy }: ChatHierarchyViewProps) {
  return (
    <ErrorBoundary
      fallback={({ error, retry }) => (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Chat Hierarchy Error
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            {error?.message || 'Failed to render chat hierarchy'}
          </p>
          <Button variant="outline" size="sm" onClick={retry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}
    >
      <ChatHierarchyViewInner hierarchy={hierarchy} />
    </ErrorBoundary>
  )
}
