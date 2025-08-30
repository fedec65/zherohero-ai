'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Button } from '../ui/button'
import { SidebarNavigation } from './sidebar-navigation'
import { ChatSidebar } from './chat-sidebar'
import { cn } from '../../lib/utils'

interface MobileNavigationProps {
  isOpen: boolean
  onClose: () => void
  showChatSidebar?: boolean
}

export function MobileNavigation({
  isOpen,
  onClose,
  showChatSidebar = true,
}: MobileNavigationProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex transform transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Navigation sidebar */}
        <div className="w-16 flex-shrink-0">
          <SidebarNavigation />
        </div>

        {/* Chat sidebar */}
        {showChatSidebar && (
          <div
            className="border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
            style={{ width: '320px' }}
          >
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chats
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="h-full">
              <ChatSidebar />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
