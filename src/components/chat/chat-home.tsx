'use client';

import React from 'react';
import { Plus, Shield, Database } from 'lucide-react';
import { Button } from '../ui/button';
import { useChatStore } from '../../lib/stores/chat-store';
import { loadDemoData } from './demo-data';

export function ChatHome() {
  const { createChat } = useChatStore();

  const handleNewChat = () => {
    createChat();
  };

  const handleNewIncognitoChat = () => {
    createChat({ isIncognito: true });
  };

  const handleLoadDemoData = () => {
    loadDemoData();
    window.location.reload(); // Reload to see the demo data
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-4">
          {/* Main New Chat Button */}
          <Button
            onClick={handleNewChat}
            size="lg"
            className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white py-4 px-8 text-lg font-medium transition-all hover:shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Chat
          </Button>
          
          {/* New Incognito Chat Button */}
          <Button
            onClick={handleNewIncognitoChat}
            variant="outline"
            size="lg"
            className="w-full max-w-sm bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700 py-3 px-6 transition-all hover:shadow-lg"
          >
            <Shield className="h-4 w-4 mr-2" />
            New Incognito Chat
          </Button>
        </div>

        {/* Optional: Add some introductory text */}
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-8 space-y-2">
          <p>Start a conversation with our advanced AI models.</p>
          <p className="text-xs">
            Choose incognito mode for conversations that won&apos;t be saved.
          </p>
        </div>

        {/* Development: Load demo data button */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleLoadDemoData}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Database className="h-3 w-3 mr-2" />
              Load Demo Chats
            </Button>
            <p className="text-xs text-gray-400 mt-1">For development and testing</p>
          </div>
        )}
      </div>
    </div>
  );
}