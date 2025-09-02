'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useChatStore } from '../../lib/stores/chat-store'
import { cn } from '../../lib/utils'

export interface SortDropdownProps {
  className?: string
  onClose?: () => void
}

export function SortDropdown({ className, onClose }: SortDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { search, setSearchFilters } = useChatStore()
  
  const sortOptions = [
    { value: 'date', label: 'Created' },
    { value: 'title', label: 'Alphabetical' },
    { value: 'messageCount', label: 'Last Activity' },
    { value: 'relevance', label: 'Custom Order' },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose?.()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleSortChange = (sortBy: string) => {
    setSearchFilters({ sortBy: sortBy as 'date' | 'title' | 'messageCount' | 'relevance' })
    onClose?.()
  }

  const handleReverseOrderChange = () => {
    const newOrder = search.filters.sortOrder === 'asc' ? 'desc' : 'asc'
    setSearchFilters({ sortOrder: newOrder })
  }

  const handleShowFoldersFirstChange = () => {
    // Toggle show folders first preference
    // This would need to be added to FilterOptions if not already present
    setSearchFilters({ showFoldersFirst: !search.filters.showFoldersFirst })
  }

  const currentSort = sortOptions.find(option => option.value === search.filters.sortBy) || sortOptions[0]

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Dropdown menu */}
      <div className="absolute top-full right-0 mt-2 w-56 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800 z-50">
          {/* Sort by section */}
          <div className="mb-3">
            <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Sort by
            </div>
            <div className="space-y-1">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={cn(
                    'flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors',
                    search.filters.sortBy === option.value
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  )}
                >
                  {option.label}
                  {search.filters.sortBy === option.value && (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="my-2 h-px bg-gray-200 dark:bg-gray-700" />

          {/* Options section */}
          <div className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Reverse order
              </span>
              <input
                type="checkbox"
                checked={search.filters.sortOrder === 'asc'}
                onChange={handleReverseOrderChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show folders first
              </span>
              <input
                type="checkbox"
                checked={search.filters.showFoldersFirst || false}
                onChange={handleShowFoldersFirstChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
            </label>
          </div>
        </div>
    </div>
  )
}