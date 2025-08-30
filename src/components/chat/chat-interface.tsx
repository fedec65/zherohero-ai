'use client'

import React, { useEffect, useMemo } from 'react'
import {
  MessageSquare,
  Edit3,
  Crown,
  MoreHorizontal,
  Share,
  Star,
  Archive,
  Trash2,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tooltip } from '../ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { MessageList } from './message-list'
import { ChatInputComponent } from './chat-input'
import { useChatStore } from '../../lib/stores/chat-store'
import { useModelStore } from '../../lib/stores/model-store'
import { cn } from '../../lib/utils'

interface ChatInterfaceProps {
  chatId: string
  className?: string
}

export function ChatInterface({ chatId, className }: ChatInterfaceProps) {
  const {
    chats,
    messages,
    updateChat,
    deleteChat,
    starChat,
    getChatMessageCount,
    streamingMessage,
  } = useChatStore()
  const { models, selectedModel } = useModelStore()

  const chat = chats[chatId]
  const chatMessages = useMemo(() => messages[chatId] || [], [messages, chatId])
  const messageCount = getChatMessageCount(chatId)
  const isStreaming = streamingMessage?.chatId === chatId

  // Auto-update chat title from first message
  useEffect(() => {
    if (chat && chatMessages.length > 0 && chat.title === 'New Chat') {
      const firstMessage = chatMessages.find((m) => m.role === 'user')
      if (firstMessage) {
        const title =
          firstMessage.content.slice(0, 50) +
          (firstMessage.content.length > 50 ? '...' : '')
        updateChat(chatId, { id: chatId, title })
      }
    }
  }, [chat, chatMessages, chatId, updateChat])

  if (!chat) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="space-y-3 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Chat not found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The chat you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>
        </div>
      </div>
    )
  }

  // Get selected model info
  const selectedModelInfo = selectedModel
    ? Object.values(models)
        .flat()
        .find((m) => m.id === selectedModel.modelId)
    : null

  const handleEditTitle = () => {
    const newTitle = prompt('Enter new chat title:', chat.title)
    if (newTitle && newTitle !== chat.title) {
      updateChat(chatId, { id: chatId, title: newTitle.trim() })
    }
  }

  const handleStarToggle = () => {
    starChat(chatId, !chat.starred)
  }

  const handleDeleteChat = () => {
    if (
      confirm(
        'Are you sure you want to delete this chat? This action cannot be undone.'
      )
    ) {
      deleteChat(chatId)
    }
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Message list */}
      <div className="flex-1 overflow-hidden">
        <MessageList chatId={chatId} />
      </div>

      {/* Chat input */}
      <div className="flex-shrink-0">
        <ChatInputComponent chatId={chatId} />
      </div>
    </div>
  )
}
