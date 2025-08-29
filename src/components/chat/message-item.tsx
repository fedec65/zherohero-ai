"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { Message } from "../../lib/stores/types";
import { Button } from "../ui/button";
import { Tooltip } from "../ui/tooltip";
import { Badge } from "../ui/badge";
import { useChatStore } from "../../lib/stores/chat-store";
import { cn } from "../../lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  streamingContent?: string;
  className?: string;
}

export function MessageItem({
  message,
  isStreaming = false,
  streamingContent,
  className,
}: MessageItemProps) {
  const { editMessage, deleteMessage, regenerateMessage } = useChatStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isCopied, setIsCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const displayContent =
    isStreaming && streamingContent !== undefined
      ? streamingContent
      : message.content;

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Handle edit save
  const handleSaveEdit = () => {
    if (editContent.trim() !== message.content) {
      editMessage(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  // Handle edit cancel
  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  // Handle regenerate
  const handleRegenerate = () => {
    regenerateMessage(message.id);
  };

  // Format timestamp
  const formattedTime = useMemo(() => {
    const date = new Date(message.createdAt);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [message.createdAt]);

  // Custom markdown components
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";

      return !inline && language ? (
        <div className="relative group">
          <SyntaxHighlighter
            style={tomorrow}
            language={language}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => navigator.clipboard.writeText(String(children))}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <code
          className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    },
    p({ children, ...props }: any) {
      return (
        <p className="mb-3 last:mb-0" {...props}>
          {children}
        </p>
      );
    },
    ul({ children, ...props }: any) {
      return (
        <ul className="list-disc pl-6 mb-3" {...props}>
          {children}
        </ul>
      );
    },
    ol({ children, ...props }: any) {
      return (
        <ol className="list-decimal pl-6 mb-3" {...props}>
          {children}
        </ol>
      );
    },
    blockquote({ children, ...props }: any) {
      return (
        <blockquote
          className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300 mb-3"
          {...props}
        >
          {children}
        </blockquote>
      );
    },
    h1({ children, ...props }: any) {
      return (
        <h1 className="text-xl font-bold mb-3" {...props}>
          {children}
        </h1>
      );
    },
    h2({ children, ...props }: any) {
      return (
        <h2 className="text-lg font-bold mb-2" {...props}>
          {children}
        </h2>
      );
    },
    h3({ children, ...props }: any) {
      return (
        <h3 className="text-base font-bold mb-2" {...props}>
          {children}
        </h3>
      );
    },
  };

  // Streaming indicator
  const StreamingIndicator = () => (
    <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
      <div className="flex space-x-1">
        <div
          className="w-1 h-1 bg-current rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="w-1 h-1 bg-current rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        ></div>
        <div
          className="w-1 h-1 bg-current rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></div>
      </div>
      <span className="text-xs ml-2">Thinking...</span>
    </div>
  );

  return (
    <div
      className={cn(
        "group relative py-4 transition-colors",
        "hover:bg-gray-50/50 dark:hover:bg-gray-800/30",
        className,
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
        {/* Avatar */}
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
            isUser
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* Message content */}
        <div
          className={cn(
            "flex-1 min-w-0 max-w-[80%]",
            isUser && "flex flex-col items-end",
          )}
        >
          {/* Message bubble */}
          <div
            className={cn(
              "relative rounded-2xl px-4 py-3 max-w-full break-words",
              isUser
                ? "bg-blue-600 text-white ml-12"
                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 mr-12",
              isStreaming && "min-h-[60px]",
            )}
          >
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm resize-none"
                  rows={Math.max(2, Math.ceil(editContent.length / 60))}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveEdit}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    "prose max-w-none text-sm",
                    isUser && "prose-invert",
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
                "flex items-center justify-between mt-2 pt-2 border-t border-opacity-20",
                isUser
                  ? "border-white"
                  : "border-gray-200 dark:border-gray-600",
              )}
            >
              <div className="flex items-center gap-2">
                {/* Timestamp */}
                <span
                  className={cn(
                    "text-xs opacity-70",
                    isUser ? "text-white" : "text-gray-500 dark:text-gray-400",
                  )}
                >
                  {formattedTime}
                </span>

                {/* Status badges */}
                {message.streamingState === "streaming" && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-2 w-2 mr-1" />
                    Streaming
                  </Badge>
                )}

                {message.streamingState === "error" && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="h-2 w-2 mr-1" />
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
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
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
            "absolute top-2 flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all",
            isUser ? "right-16" : "left-16",
          )}
        >
          <Tooltip content={isCopied ? "Copied!" : "Copy"}>
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
            "mt-2 flex flex-wrap gap-2",
            isUser ? "justify-end" : "justify-start",
          )}
        >
          {message.attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
            >
              <div className="text-gray-500">
                {attachment.type === "image" ? "🖼️" : "📁"}
              </div>
              <span className="truncate max-w-[200px]">{attachment.name}</span>
              <span className="text-gray-400 text-xs">
                {(attachment.size / 1024).toFixed(1)}KB
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
