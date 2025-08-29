'use client';

import React from 'react';
import { useChatStore } from '../../lib/stores/chat-store';
import { ChatInterface } from './chat-interface';
import { ChatHome } from './chat-home';

interface ChatContainerProps {
  className?: string;
}

export function ChatContainer({ className }: ChatContainerProps) {
  const { activeChat, chats } = useChatStore();

  // If there's an active chat and it exists, show the chat interface
  if (activeChat && chats[activeChat]) {
    return (
      <div className={className}>
        <ChatInterface chatId={activeChat} />
      </div>
    );
  }

  // Otherwise show the home/welcome screen
  return (
    <div className={className}>
      <ChatHome />
    </div>
  );
}