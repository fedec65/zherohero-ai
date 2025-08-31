'use client'

import React, { useState, useMemo } from 'react'
import {
  Copy,
  Edit3,
  RefreshCw,
  MoreVertical,
  Check,
  X,
  Clock,
  AlertCircle,
  User,
  Bot,
} from 'lucide-react'
import { Message } from '../../lib/stores/types'
import { Button } from '../ui/button'
import { Tooltip } from '../ui/tooltip'
import { Badge } from '../ui/badge'
import { useChatStore } from '../../lib/stores/chat-store'
import { cn } from '../../lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism'

interface MessageItemProps {
  message: Message
  isStreaming?: boolean
  streamingContent?: string
  className?: string
}

export function MessageItem({
  message,
  isStreaming = false,
  streamingContent,
  className,
}: MessageItemProps) {
  const { editMessage, deleteMessage, regenerateMessage } = useChatStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [isCopied, setIsCopied] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const displayContent =
    isStreaming && streamingContent !== undefined
      ? streamingContent
      : message.content

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayContent)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Handle edit save
  const handleSaveEdit = () => {
    if (editContent.trim() !== message.content) {
      editMessage(message.id, editContent.trim())
    }
    setIsEditing(false)
  }

  // Handle edit cancel
  const handleCancelEdit = () => {
    setEditContent(message.content)
    setIsEditing(false)
  }

  // Handle regenerate
  const handleRegenerate = () => {
    regenerateMessage(message.id)
  }

  // Format timestamp
  const formattedTime = useMemo(() => {
    const date = new Date(message.createdAt)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [message.createdAt])

  // Custom markdown components
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : ''

      return !inline && language ? (
        <div className="group relative">
          <SyntaxHighlighter
            style={tomorrow}
            language={language}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => navigator.clipboard.writeText(String(children))}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <code
          className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm dark:bg-gray-800"
          {...props}
        >
          {children}
        </code>
      )
    },
    p({ children, ...props }: any) {
      return (
        <p className="mb-3 last:mb-0" {...props}>
          {children}
        </p>
      )
    },
    ul({ children, ...props }: any) {
      return (
        <ul className="mb-3 list-disc pl-6" {...props}>
          {children}
        </ul>
      )
    },
    ol({ children, ...props }: any) {
      return (
        <ol className="mb-3 list-decimal pl-6" {...props}>
          {children}
        </ol>
      )
    },
    blockquote({ children, ...props }: any) {
      return (
        <blockquote
          className="mb-3 border-l-4 border-gray-300 pl-4 italic text-gray-700 dark:border-gray-600 dark:text-gray-300"
          {...props}
        >
          {children}
        </blockquote>
      )
    },
    h1({ children, ...props }: any) {
      return (
        <h1 className="mb-3 text-xl font-bold" {...props}>
          {children}
        </h1>
      )
    },
    h2({ children, ...props }: any) {
      return (
        <h2 className="mb-2 text-lg font-bold" {...props}>
          {children}
        </h2>
      )
    },
    h3({ children, ...props }: any) {
      return (
        <h3 className="mb-2 text-base font-bold" {...props}>
          {children}
        </h3>
      )
    },
  }

  // Streaming indicator
  const StreamingIndicator = () => (
    <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
      <div className="flex space-x-1">
        <div
          className="h-1 w-1 animate-bounce rounded-full bg-current"
          style={{ animationDelay: '0ms' }}
        ></div>
        <div
          className="h-1 w-1 animate-bounce rounded-full bg-current"
          style={{ animationDelay: '150ms' }}
        ></div>
        <div
          className="h-1 w-1 animate-bounce rounded-full bg-current"
          style={{ animationDelay: '300ms' }}
        ></div>
      </div>
      <span className="ml-2 text-xs">Thinking...</span>
    </div>
  )

  return (
    <div
      className={cn(
        'group relative py-4 transition-colors',
        'hover:bg-gray-50/50 dark:hover:bg-gray-800/30',
        className
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
        {/* Avatar */}
        <div
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium',
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* Message content */}
        <div
          className={cn(
            'min-w-0 max-w-[80%] flex-1',
            isUser && 'flex flex-col items-end'
          )}
        >
          {/* Message bubble */}
          <div
            className={cn(
              'relative max-w-full break-words rounded-2xl px-4 py-3',
              isUser
                ? 'ml-12 bg-blue-600 text-white'
                : 'mr-12 border border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white',
              isStreaming && 'min-h-[60px]'
            )}
          >
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full resize-none rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600"
                  rows={Math.max(2, Math.ceil(editContent.length / 60))}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveEdit}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    'prose max-w-none text-sm',
                    isUser && 'prose-invert'
                  )}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {displayContent}
                  </ReactMarkdown>
                </div>

                {isStreaming && !displayContent && <StreamingIndicator />}
              </>
            )}

            {/* Message status indicators */}
            <div
              className={cn(
                'mt-2 flex items-center justify-between border-t border-opacity-20 pt-2',
                isUser ? 'border-white' : 'border-gray-200 dark:border-gray-600'
              )}
            >
              <div className="flex items-center gap-2">
                {/* Timestamp */}
                <span
                  className={cn(
                    'text-xs opacity-70',
                    isUser ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {formattedTime}
                </span>

                {/* Status badges */}
                {message.streamingState === 'streaming' && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="mr-1 h-2 w-2" />
                    Streaming
                  </Badge>
                )}

                {message.streamingState === 'error' && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="mr-1 h-2 w-2" />
                    Error
                  </Badge>
                )}

                {message.model && isAssistant && (
                  <Badge variant="secondary" className="text-xs">
                    {message.model}
                  </Badge>
                )}

                {message.tokens && (
                  <Badge variant="outline" className="text-xs">
                    {message.tokens} tokens
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Error message */}
          {message.error && (
            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{message.error}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {showActions && !isEditing && !isStreaming && (
        <div
          className={cn(
            'absolute top-2 flex items-center gap-1 rounded-lg border border-gray-200 bg-white opacity-0 shadow-sm transition-all group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800',
            isUser ? 'right-16' : 'left-16'
          )}
        >
          <Tooltip content={isCopied ? 'Copied!' : 'Copy'}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleCopy}
            >
              {isCopied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </Tooltip>

          {isUser && (
            <Tooltip content="Edit">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </Tooltip>
          )}

          {isAssistant && (
            <Tooltip content="Regenerate">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleRegenerate}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </Tooltip>
          )}

          <Tooltip content="More">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </Tooltip>
        </div>
      )}

      {/* Attachments */}
      {message.attachments && message.attachments.length > 0 && (
        <div
          className={cn(
            'mt-2 flex flex-wrap gap-2',
            isUser ? 'justify-end' : 'justify-start'
          )}
        >
          {message.attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 rounded-lg bg-gray-100 p-2 text-sm dark:bg-gray-800"
            >
              <div className="text-gray-500">
                {attachment.type === 'image' ? '🖼️' : '📁'}
              </div>
              <span className="max-w-[200px] truncate">{attachment.name}</span>
              <span className="text-xs text-gray-400">
                {(attachment.size / 1024).toFixed(1)}KB
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
