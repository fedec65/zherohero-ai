'use client'

import React, { useState } from 'react'
import {
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  Star,
  MessageCircle,
  Shield,
  SortAsc,
  SortDesc,
  X,
  Clock,
  Hash,
  FileText,
} from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { FilterOptions } from '../../lib/stores/types'

interface SearchFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: Partial<FilterOptions>) => void
  onClearFilters: () => void
  resultsCount?: number
  className?: string
}

export function SearchFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  resultsCount,
  className,
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasActiveFilters = () => {
    return (
      filters.starred !== undefined ||
      filters.chatType !== 'all' ||
      filters.dateRange ||
      filters.hasMessages !== undefined ||
      filters.folders?.length
    )
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.starred !== undefined) count++
    if (filters.chatType !== 'all') count++
    if (filters.dateRange) count++
    if (filters.hasMessages !== undefined) count++
    if (filters.folders?.length) count++
    return count
  }

  return (
    <div
      className={cn('border-b border-gray-200 dark:border-gray-700', className)}
    >
      {/* Filter toggle button */}
      <div className="px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'h-8 w-full justify-between text-sm',
            hasActiveFilters() && 'text-blue-600 dark:text-blue-400'
          )}
        >
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters() && (
              <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {getActiveFiltersCount()}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Expanded filter panel */}
      {isExpanded && (
        <div className="space-y-4 border-t border-gray-100 px-4 pb-4 pt-4 dark:border-gray-800">
          {/* Quick filters row */}
          <div className="flex flex-wrap items-center gap-2 space-x-2">
            <QuickFilterButton
              active={filters.starred === true}
              onClick={() =>
                onFiltersChange({
                  starred: filters.starred === true ? undefined : true,
                })
              }
              icon={Star}
              label="Starred"
            />

            <QuickFilterButton
              active={filters.chatType === 'incognito'}
              onClick={() =>
                onFiltersChange({
                  chatType:
                    filters.chatType === 'incognito' ? 'all' : 'incognito',
                })
              }
              icon={Shield}
              label="Incognito"
            />

            <QuickFilterButton
              active={filters.hasMessages === true}
              onClick={() =>
                onFiltersChange({
                  hasMessages: filters.hasMessages === true ? undefined : true,
                })
              }
              icon={MessageCircle}
              label="Has Messages"
            />
          </div>

          {/* Sort options */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Sort By
            </label>
            <div className="flex items-center space-x-2">
              <SortButton
                active={filters.sortBy === 'date'}
                onClick={() => onFiltersChange({ sortBy: 'date' })}
                icon={Clock}
                label="Date"
              />

              <SortButton
                active={filters.sortBy === 'title'}
                onClick={() => onFiltersChange({ sortBy: 'title' })}
                icon={FileText}
                label="Title"
              />

              <SortButton
                active={filters.sortBy === 'messageCount'}
                onClick={() => onFiltersChange({ sortBy: 'messageCount' })}
                icon={Hash}
                label="Messages"
              />

              {/* Sort order toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onFiltersChange({
                    sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
                  })
                }
                className="h-7 px-2"
              >
                {filters.sortOrder === 'desc' ? (
                  <SortDesc className="h-3 w-3" />
                ) : (
                  <SortAsc className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Date range filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Date Range
            </label>
            <div className="flex items-center space-x-2">
              <DateRangeButton
                active={filters.dateRange && isToday(filters.dateRange)}
                onClick={() => onFiltersChange({ dateRange: getTodayRange() })}
                label="Today"
              />

              <DateRangeButton
                active={filters.dateRange && isThisWeek(filters.dateRange)}
                onClick={() =>
                  onFiltersChange({ dateRange: getThisWeekRange() })
                }
                label="This Week"
              />

              <DateRangeButton
                active={filters.dateRange && isThisMonth(filters.dateRange)}
                onClick={() =>
                  onFiltersChange({ dateRange: getThisMonthRange() })
                }
                label="This Month"
              />
            </div>
          </div>

          {/* Filter actions */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-800">
            {resultsCount !== undefined && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {resultsCount} result{resultsCount !== 1 ? 's' : ''}
              </span>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              disabled={!hasActiveFilters()}
              className="h-6 text-xs"
            >
              <X className="mr-1 h-3 w-3" />
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface QuickFilterButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
}

function QuickFilterButton({
  active,
  onClick,
  icon: Icon,
  label,
}: QuickFilterButtonProps) {
  return (
    <Button
      variant={active ? 'secondary' : 'outline'}
      size="sm"
      onClick={onClick}
      className={cn(
        'h-7 px-3 text-xs',
        active && 'bg-blue-600 text-white hover:bg-blue-700'
      )}
    >
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Button>
  )
}

interface SortButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
}

function SortButton({ active, onClick, icon: Icon, label }: SortButtonProps) {
  return (
    <Button
      variant={active ? 'secondary' : 'outline'}
      size="sm"
      onClick={onClick}
      className={cn(
        'h-7 px-3 text-xs',
        active && 'bg-blue-600 text-white hover:bg-blue-700'
      )}
    >
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Button>
  )
}

interface DateRangeButtonProps {
  active: boolean
  onClick: () => void
  label: string
}

function DateRangeButton({ active, onClick, label }: DateRangeButtonProps) {
  return (
    <Button
      variant={active ? 'secondary' : 'outline'}
      size="sm"
      onClick={onClick}
      className={cn(
        'h-7 px-3 text-xs',
        active && 'bg-blue-600 text-white hover:bg-blue-700'
      )}
    >
      {label}
    </Button>
  )
}

// Date utility functions
function getTodayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function getThisWeekRange() {
  const now = new Date()
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay()
  )
  start.setHours(0, 0, 0, 0)
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay() + 6
  )
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function getThisMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function isToday(range: { start: Date; end: Date }) {
  const today = getTodayRange()
  return (
    range.start.getTime() === today.start.getTime() &&
    range.end.getTime() === today.end.getTime()
  )
}

function isThisWeek(range: { start: Date; end: Date }) {
  const thisWeek = getThisWeekRange()
  return (
    range.start.getTime() === thisWeek.start.getTime() &&
    range.end.getTime() === thisWeek.end.getTime()
  )
}

function isThisMonth(range: { start: Date; end: Date }) {
  const thisMonth = getThisMonthRange()
  return (
    range.start.getTime() === thisMonth.start.getTime() &&
    range.end.getTime() === thisMonth.end.getTime()
  )
}
