"use client";

import React, { useState } from "react";
import { Menu, Edit3, Crown, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { Tooltip } from "../ui/tooltip";
import { cn } from "../../lib/utils";
import { useChatStore } from "../../lib/stores/chat-store";

interface MainContentProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  className?: string;
}

export function MainContent({
  children,
  title,
  showHeader = true,
  className,
}: MainContentProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { activeChat, chats } = useChatStore();

  // Get current chat title if available
  const currentChat = activeChat ? chats[activeChat] : null;
  const displayTitle = title || currentChat?.title || "ZheroHero AI";

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white dark:bg-gray-800",
        className,
      )}
    >
      {showHeader && (
        <Header
          title={displayTitle}
          onToggleMobileMenu={toggleMobileMenu}
          showEditButton={!!currentChat}
        />
      )}

      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}

interface HeaderProps {
  title: string;
  onToggleMobileMenu: () => void;
  showEditButton?: boolean;
}

function Header({
  title,
  onToggleMobileMenu,
  showEditButton = false,
}: HeaderProps) {
  const handleEditTitle = () => {
    // TODO: Implement title editing
    console.log("Edit title clicked");
  };

  const handleUpgrade = () => {
    // TODO: Implement upgrade flow
    console.log("Upgrade clicked");
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleMobileMenu}
          className="lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Title */}
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-md">
            {title}
          </h1>

          {showEditButton && (
            <Tooltip content="Edit title">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditTitle}
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Model selector (placeholder) */}
        <ModelSelector />

        {/* Upgrade button */}
        <Tooltip content="Upgrade to Pro">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUpgrade}
            className="hidden sm:flex items-center gap-2 text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/20"
          >
            <Crown className="h-4 w-4" />
            <span className="hidden md:inline">Upgrade</span>
          </Button>
        </Tooltip>

        {/* Mobile upgrade button */}
        <Tooltip content="Upgrade to Pro">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUpgrade}
            className="sm:hidden text-amber-600 dark:text-amber-400"
          >
            <Crown className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>
    </header>
  );
}

function ModelSelector() {
  // TODO: Connect to actual model store
  const currentModel = "GPT-4";

  return (
    <Button
      variant="ghost"
      size="sm"
      className="hidden sm:flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <span className="text-sm">{currentModel}</span>
      <ChevronDown className="h-3 w-3" />
    </Button>
  );
}

// Loading state component
export function MainContentLoading({
  title = "Loading...",
  className,
}: {
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white dark:bg-gray-800",
        className,
      )}
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse lg:hidden" />
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse hidden sm:block" />
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 dark:text-gray-400">{title}</p>
        </div>
      </main>
    </div>
  );
}

// Error state component
export function MainContentError({
  title = "Something went wrong",
  message = "Please try refreshing the page.",
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white dark:bg-gray-800",
        className,
      )}
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-semibold text-red-600 dark:text-red-400">
          Error
        </h1>
      </header>

      <main className="flex-1 overflow-hidden flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
            <div className="w-8 h-8 bg-red-500 rounded-full" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </div>
          {onRetry && (
            <Button onClick={onRetry} className="mt-4">
              Try Again
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
