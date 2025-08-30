'use client'

import React from 'react'
import { Plus, Shield, Database, MessageCircle, Sparkles } from 'lucide-react'
import { Button } from '../ui/button'
import { useChatStore } from '../../lib/stores/chat-store'
import { loadDemoData } from './demo-data'

export function ChatHome() {
  const { createChat } = useChatStore()

  const handleNewChat = () => {
    createChat()
  }

  const handleNewIncognitoChat = () => {
    createChat({ isIncognito: true })
  }

  const handleLoadDemoData = () => {
    loadDemoData()
    window.location.reload() // Reload to see the demo data
  }

  return (
    <div className="flex min-h-[600px] flex-1 items-center justify-center p-8">
      <div className="mx-auto max-w-lg space-y-8 text-center">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to ZheroHero
            </h1>
            <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              Start a conversation with our advanced AI models
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mx-auto max-w-sm space-y-3">
          {/* Main New Chat Button */}
          <Button
            onClick={handleNewChat}
            size="xl"
            className="group relative w-full transform overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 font-semibold text-white shadow-lg transition-all duration-200 ease-out hover:scale-[1.02] hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
          >
            <div className="flex items-center justify-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>New Chat</span>
              <Sparkles className="h-4 w-4 opacity-75 group-hover:opacity-100" />
            </div>
            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-200 group-hover:opacity-10" />
          </Button>

          {/* New Incognito Chat Button */}
          <Button
            onClick={handleNewIncognitoChat}
            variant="outline"
            size="lg"
            className="group relative w-full transform overflow-hidden border-2 border-purple-200 font-medium text-purple-700 shadow-sm transition-all duration-200 ease-out hover:scale-[1.01] hover:border-purple-300 hover:bg-purple-50 hover:shadow-md dark:border-purple-800 dark:text-purple-400 dark:hover:border-purple-700 dark:hover:bg-purple-950/30"
          >
            <div className="flex items-center justify-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>New Incognito Chat</span>
            </div>
          </Button>
        </div>

        {/* Feature highlights */}
        <div className="mx-auto mt-12 grid max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800/50">
            <div className="mx-auto mb-2 h-8 w-8 text-blue-600 dark:text-blue-400">
              <MessageCircle className="h-full w-full" />
            </div>
            <h3 className="mb-1 font-medium text-gray-900 dark:text-white">
              Multiple Models
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Access 40+ AI models from top providers
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800/50">
            <div className="mx-auto mb-2 h-8 w-8 text-purple-600 dark:text-purple-400">
              <Shield className="h-full w-full" />
            </div>
            <h3 className="mb-1 font-medium text-gray-900 dark:text-white">
              Privacy First
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Incognito mode for sensitive conversations
            </p>
          </div>
        </div>

        {/* Subtle hint text */}
        <div className="mt-8 space-y-1 text-sm text-gray-500 dark:text-gray-400">
          <p className="flex items-center justify-center gap-2">
            <span className="inline-block h-1 w-1 rounded-full bg-gray-400"></span>
            Your conversations are saved automatically
            <span className="inline-block h-1 w-1 rounded-full bg-gray-400"></span>
          </p>
        </div>

        {/* Development: Load demo data button */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-12 border-t border-gray-200 pt-6 dark:border-gray-700">
            <Button
              onClick={handleLoadDemoData}
              variant="ghost"
              size="sm"
              className="font-normal text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <Database className="mr-2 h-3 w-3" />
              Load Demo Chats
            </Button>
            <p className="mt-2 text-xs text-gray-400">Development mode</p>
          </div>
        )}
      </div>
    </div>
  )
}
