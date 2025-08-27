'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, FolderPlus, Filter, Star, MoreHorizontal, Trash2, Edit3 } from 'lucide-react';
import { Button } from '../ui/button';
import { SearchInput } from '../ui/input';
import { Tooltip } from '../ui/tooltip';
import { useChatStore } from '../../../lib/stores/chat-store';
import { useSettingsStore } from '../../../lib/stores/settings-store';
import { cn } from '../../lib/utils';

interface ChatSidebarProps {
  className?: string;
}

export function ChatSidebar({ className }: ChatSidebarProps) {
  const { chats, searchQuery, setSearchQuery, createChat, deleteChat, setActiveChat, activeChat } = useChatStore();
  const { settings, setSidebarWidth } = useSettingsStore();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [currentWidth, setCurrentWidth] = useState(settings.sidebarWidth);

  // Handle sidebar resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;

      const rect = sidebarRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      const clampedWidth = Math.max(240, Math.min(480, newWidth));
      
      setCurrentWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        setSidebarWidth(currentWidth);
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, currentWidth, setSidebarWidth]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const filteredChats = Object.values(chats || {}).filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const starredChats = filteredChats.filter(chat => chat.starred);
  const regularChats = filteredChats.filter(chat => !chat.starred);

  const handleNewChat = () => {
    createChat();
  };

  const handleChatClick = (chatId: string) => {
    setActiveChat(chatId);
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteChat(chatId);
  };

  return (
    <div 
      ref={sidebarRef}
      className={cn(
        'relative h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col',
        className
      )}
      style={{ width: `${currentWidth}px` }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {/* Search */}
        <div className="mb-3">
          <SearchInput
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Tooltip content="New Chat">
            <Button
              onClick={handleNewChat}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </Tooltip>
        </div>

        {/* Secondary buttons */}
        <div className="flex items-center gap-2 mt-2">
          <Tooltip content="New Folder">
            <Button variant="outline" size="sm" className="flex-1">
              <FolderPlus className="h-4 w-4 mr-1" />
              Folder
            </Button>
          </Tooltip>
          <Tooltip content="Filter & Sort">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center">
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              {searchQuery ? 'No matching chats' : 'No chat groups yet'}
            </div>
            {!searchQuery && (
              <Button
                variant="ghost"
                onClick={handleNewChat}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create your first chat
              </Button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {/* Regular chats */}
            {regularChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={activeChat === chat.id}
                onClick={() => handleChatClick(chat.id)}
                onDelete={(e) => handleDeleteChat(chat.id, e)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Starred section */}
      {starredChats.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              <Star className="h-3 w-3" />
              Starred
            </div>
            <div className="space-y-1">
              {starredChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={activeChat === chat.id}
                  onClick={() => handleChatClick(chat.id)}
                  onDelete={(e) => handleDeleteChat(chat.id, e)}
                  compact
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
        onMouseDown={handleResizeStart}
        style={{ cursor: isResizing ? 'col-resize' : 'e-resize' }}
      />
    </div>
  );
}

interface ChatItemProps {
  chat: {
    id: string;
    title: string;
    lastMessageAt?: Date;
    messageCount: number;
    starred: boolean;
  };
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  compact?: boolean;
}

function ChatItem({ chat, isActive, onClick, onDelete, compact = false }: ChatItemProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={cn(
        'group relative p-3 rounded-lg cursor-pointer transition-all',
        'hover:bg-white dark:hover:bg-gray-800',
        isActive && 'bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700',
        compact && 'p-2'
      )}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              'font-medium text-gray-900 dark:text-white truncate',
              compact ? 'text-sm' : 'text-sm'
            )}>
              {chat.title}
            </h4>
            {chat.starred && (
              <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleDateString() : 'New chat'}
            </span>
            {!compact && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {chat.messageCount} messages
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1 ml-2">
            <Tooltip content="Edit">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Implement edit functionality
                }}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </Tooltip>
            <Tooltip content="More options">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Implement more options menu
                }}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </Tooltip>
            <Tooltip content="Delete">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={onDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}