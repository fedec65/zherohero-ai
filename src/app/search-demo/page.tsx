'use client';

import React, { useEffect } from 'react';
import { ChatSidebar } from '../../components/layout/chat-sidebar';
import { useChatStore } from '../../../lib/stores/chat-store';
import { loadSearchDemoData } from '../../components/chat/search-demo-data';

export default function SearchDemoPage() {
  const { chats } = useChatStore();

  // Load demo data on component mount
  useEffect(() => {
    if (Object.keys(chats).length === 0) {
      loadSearchDemoData(useChatStore);
    }
  }, [chats]);

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-gray-950">
      {/* Sidebar Navigation */}
      <div className="w-16 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        <div className="h-full flex flex-col items-center justify-center">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Search Demo
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <ChatSidebar className="w-80" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Enhanced Search Demo
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Test the advanced search and filtering capabilities in the chat sidebar.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                🔍 Search Features
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>• Full-text search across chats and messages</li>
                <li>• Search suggestions and history</li>
                <li>• Regex and exact match options</li>
                <li>• Real-time search results</li>
                <li>• Context highlighting</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                🎛️ Filter Options
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>• Filter by starred chats</li>
                <li>• Incognito chat filtering</li>
                <li>• Date range selection</li>
                <li>• Sort by date, title, or message count</li>
                <li>• Quick filter shortcuts</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Try These Sample Searches:
            </h4>
            <div className="flex flex-wrap gap-2 text-sm">
              <code className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                JavaScript
              </code>
              <code className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                Python
              </code>
              <code className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                array methods
              </code>
              <code className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                machine learning
              </code>
              <code className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                API design
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}