'use client'

import React, { useEffect } from 'react'
import { ChatSidebar } from '../../components/layout/chat-sidebar'
import { useChatStore } from '../../lib/stores/chat-store'
import { loadSearchDemoData } from '../../components/chat/search-demo-data'

export default function SearchDemoPage() {
  const { chats } = useChatStore()

  // Load demo data on component mount
  useEffect(() => {
    if (Object.keys(chats).length === 0) {
      loadSearchDemoData(useChatStore)
    }
  }, [chats])

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      {/* Sidebar Navigation */}
      <div className="w-16 border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex h-full flex-col items-center justify-center">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Search Demo
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <ChatSidebar className="w-80" />

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Enhanced Search Demo
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            Test the advanced search and filtering capabilities in the chat
            sidebar.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                🔍 Search Features
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Full-text search across chats and messages</li>
                <li>• Search suggestions and history</li>
                <li>• Regex and exact match options</li>
                <li>• Real-time search results</li>
                <li>• Context highlighting</li>
              </ul>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                🎛️ Filter Options
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Filter by starred chats</li>
                <li>• Incognito chat filtering</li>
                <li>• Date range selection</li>
                <li>• Sort by date, title, or message count</li>
                <li>• Quick filter shortcuts</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
              Try These Sample Searches:
            </h4>
            <div className="flex flex-wrap gap-2 text-sm">
              <code className="rounded bg-blue-100 px-2 py-1 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                JavaScript
              </code>
              <code className="rounded bg-blue-100 px-2 py-1 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                Python
              </code>
              <code className="rounded bg-blue-100 px-2 py-1 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                array methods
              </code>
              <code className="rounded bg-blue-100 px-2 py-1 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                machine learning
              </code>
              <code className="rounded bg-blue-100 px-2 py-1 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                API design
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
