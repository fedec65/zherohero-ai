"use client";

import React, { useEffect, useRef, useCallback, useMemo } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { useChatStore } from "../../lib/stores/chat-store";
import { MessageItem } from "./message-item";
import { Message } from "../../lib/stores/types";
import { ChatMessageSkeleton } from "../ui/skeleton";
import { cn } from "../../lib/utils";

interface MessageListProps {
  chatId: string;
  className?: string;
}

export function MessageList({ chatId, className }: MessageListProps) {
  const { messages, streamingMessage } = useChatStore();
  const chatMessages = useMemo(() => messages[chatId] || [], [messages, chatId]);
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = React.useState(400);
  const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true);
  const isStreamingInThisChat = streamingMessage?.chatId === chatId;

  // Resize observer for dynamic height
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (listRef.current && shouldAutoScroll) {
      listRef.current.scrollToItem(chatMessages.length - 1, "end");
    }
  }, [chatMessages.length, shouldAutoScroll]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages.length, isStreamingInThisChat, scrollToBottom]);

  // Handle scroll to detect if user scrolled up
  const handleScroll = useCallback(
    (props: any) => {
      const { scrollOffset } = props;
      const maxScroll = Math.max(
        0,
        chatMessages.length * 100 - containerHeight,
      ); // Rough estimation
      const nearBottom = scrollOffset >= maxScroll - 100; // Within 100px of bottom
      setShouldAutoScroll(nearBottom);
    },
    [chatMessages.length, containerHeight],
  );

  // Memoized item data to prevent unnecessary re-renders
  const itemData = useMemo(
    () => ({
      messages: chatMessages,
      streamingMessage,
      isStreamingInThisChat,
    }),
    [chatMessages, streamingMessage, isStreamingInThisChat],
  );

  // Calculate item height (dynamic based on content)
  const getItemSize = useCallback(
    (index: number) => {
      const message = chatMessages[index];
      if (!message) return 100;

      // Rough estimation based on content length
      const lines = Math.ceil(message.content.length / 80); // ~80 chars per line
      const baseHeight = 80; // Base height for message bubble
      const lineHeight = 24; // Height per line of text
      const minHeight = 120; // Minimum height for any message

      return Math.max(minHeight, baseHeight + lines * lineHeight);
    },
    [chatMessages],
  );

  // Render individual message item
  const MessageRow = React.memo(
    ({ index, style, data }: ListChildComponentProps & { data: any }) => {
      const {
        messages: msgs,
        streamingMessage: streaming,
        isStreamingInThisChat: isStreamingChat,
      } = data;
      const message = msgs[index];

      if (!message) return null;

      const isStreaming =
        isStreamingChat && streaming?.messageId === message.id;

      return (
        <div style={style} className="px-4">
          <MessageItem
            key={message.id}
            message={message}
            isStreaming={isStreaming}
            streamingContent={
              isStreaming ? streaming?.content || "" : undefined
            }
          />
        </div>
      );
    },
  );

  MessageRow.displayName = "MessageRow";

  // Empty state
  if (chatMessages.length === 0) {
    return (
      <div
        className={cn("flex-1 flex items-center justify-center p-8", className)}
      >
        <div className="text-center space-y-3 max-w-md">
          <div className="text-gray-400 dark:text-gray-500 text-lg">💬</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Start the conversation
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Send your first message to begin chatting with the AI assistant.
          </p>
        </div>
      </div>
    );
  }

  // Loading state while messages are being fetched
  if (chatMessages.length === 0) {
    return (
      <div className={cn("flex-1 p-4 space-y-4", className)}>
        <ChatMessageSkeleton role="user" />
        <ChatMessageSkeleton role="assistant" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("flex-1 overflow-hidden", className)}>
      <List
        ref={listRef}
        height={containerHeight}
        width="100%"
        itemCount={chatMessages.length}
        itemSize={80}
        itemData={itemData}
        onScroll={handleScroll}
        overscanCount={3} // Render a few extra items for smooth scrolling
      >
        {MessageRow}
      </List>

      {/* Scroll to bottom button */}
      {!shouldAutoScroll && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all z-10"
          aria-label="Scroll to bottom"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
