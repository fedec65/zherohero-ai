"use client";

import React from "react";
import { Plus, Shield, Database, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { useChatStore } from "../../lib/stores/chat-store";
import { loadDemoData } from "./demo-data";

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
    <div className="flex-1 flex items-center justify-center p-8 min-h-[600px]">
      <div className="text-center space-y-8 max-w-lg mx-auto">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6 shadow-lg">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to ZheroHero
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Start a conversation with our advanced AI models
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 max-w-sm mx-auto">
          {/* Main New Chat Button */}
          <Button
            onClick={handleNewChat}
            size="xl"
            className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 ease-out"
          >
            <div className="flex items-center justify-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>New Chat</span>
              <Sparkles className="h-4 w-4 opacity-75 group-hover:opacity-100" />
            </div>
            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
          </Button>

          {/* New Incognito Chat Button */}
          <Button
            onClick={handleNewIncognitoChat}
            variant="outline"
            size="lg"
            className="w-full group relative overflow-hidden border-2 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-300 dark:hover:border-purple-700 font-medium shadow-sm hover:shadow-md transform hover:scale-[1.01] transition-all duration-200 ease-out"
          >
            <div className="flex items-center justify-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>New Incognito Chat</span>
            </div>
          </Button>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 max-w-md mx-auto">
          <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <div className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400">
              <MessageCircle className="h-full w-full" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Multiple Models
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Access 40+ AI models from top providers
            </p>
          </div>

          <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <div className="w-8 h-8 mx-auto mb-2 text-purple-600 dark:text-purple-400">
              <Shield className="h-full w-full" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Privacy First
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Incognito mode for sensitive conversations
            </p>
          </div>
        </div>

        {/* Subtle hint text */}
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-8 space-y-1">
          <p className="flex items-center justify-center gap-2">
            <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
            Your conversations are saved automatically
            <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
          </p>
        </div>

        {/* Development: Load demo data button */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleLoadDemoData}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 font-normal"
            >
              <Database className="h-3 w-3 mr-2" />
              Load Demo Chats
            </Button>
            <p className="text-xs text-gray-400 mt-2">Development mode</p>
          </div>
        )}
      </div>
    </div>
  );
}
