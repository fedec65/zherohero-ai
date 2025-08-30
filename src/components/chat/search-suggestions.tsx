'use client'

import React from 'react'
import { Clock, Search, TrendingUp, X, ArrowUpRight } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { SearchHistory } from '../../lib/stores/types'

interface SearchSuggestionsProps {
  suggestions: string[]
  searchHistory: SearchHistory[]
  query: string
  onSelectSuggestion: (suggestion: string) => void
  onClearHistory?: () => void
  className?: string
}

export function SearchSuggestions({
  suggestions,
  searchHistory,
  query,
  onSelectSuggestion,
  onClearHistory,
  className,
}: SearchSuggestionsProps) {
  if (!query && searchHistory.length === 0 && suggestions.length === 0) {
    return null
  }

  const filteredHistory = searchHistory
    .filter((h) =>
      query ? h.query.toLowerCase().includes(query.toLowerCase()) : true
    )
    .slice(0, 5)

  const filteredSuggestions = suggestions
    .filter((s) =>
      query ? s.toLowerCase().includes(query.toLowerCase()) : true
    )
    .slice(0, 5)

  if (filteredHistory.length === 0 && filteredSuggestions.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900',
        'max-h-80 overflow-y-auto rounded-lg py-2 shadow-lg',
        className
      )}
    >
      {/* Recent searches */}
      {filteredHistory.length > 0 && (
        <div className="px-1">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Recent
              </span>
            </div>
            {onClearHistory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearHistory}
                className="h-6 px-2 text-xs text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="space-y-1">
            {filteredHistory.map((item) => (
              <SuggestionItem
                key={item.id}
                text={item.query}
                icon={<Clock className="h-3 w-3" />}
                meta={`${item.resultsCount} result${item.resultsCount !== 1 ? 's' : ''}`}
                query={query}
                onClick={() => onSelectSuggestion(item.query)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      {filteredHistory.length > 0 && filteredSuggestions.length > 0 && (
        <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
      )}

      {/* Suggestions */}
      {filteredSuggestions.length > 0 && (
        <div className="px-1">
          <div className="flex items-center space-x-2 px-3 py-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Suggestions
            </span>
          </div>

          <div className="space-y-1">
            {filteredSuggestions.map((suggestion, index) => (
              <SuggestionItem
                key={index}
                text={suggestion}
                icon={<Search className="h-3 w-3" />}
                query={query}
                onClick={() => onSelectSuggestion(suggestion)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search all option */}
      {query && (
        <>
          <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
          <div className="px-1">
            <SuggestionItem
              text={`Search for "${query}"`}
              icon={<ArrowUpRight className="h-3 w-3" />}
              query=""
              onClick={() => onSelectSuggestion(query)}
              primary
            />
          </div>
        </>
      )}
    </div>
  )
}

interface SuggestionItemProps {
  text: string
  icon: React.ReactNode
  meta?: string
  query: string
  onClick: () => void
  primary?: boolean
}

function SuggestionItem({
  text,
  icon,
  meta,
  query,
  onClick,
  primary = false,
}: SuggestionItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'mx-1 flex cursor-pointer items-center space-x-3 rounded-md px-3 py-2 transition-colors',
        'hover:bg-gray-50 dark:hover:bg-gray-800',
        primary &&
          'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 text-gray-400',
          primary && 'text-blue-500 dark:text-blue-400'
        )}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'truncate text-sm text-gray-900 dark:text-white',
            primary && 'font-medium text-blue-900 dark:text-blue-100'
          )}
        >
          <HighlightedText text={text} query={query} />
        </div>
        {meta && (
          <div className="text-xs text-gray-500 dark:text-gray-400">{meta}</div>
        )}
      </div>
    </div>
  )
}

interface HighlightedTextProps {
  text: string
  query: string
}

function HighlightedText({ text, query }: HighlightedTextProps) {
  if (!query) return <>{text}</>

  const regex = new RegExp(`(${query})`, 'gi')
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, index) => (
        <span
          key={index}
          className={cn(
            regex.test(part) &&
              'rounded bg-yellow-200 px-0.5 dark:bg-yellow-900'
          )}
        >
          {part}
        </span>
      ))}
    </>
  )
}
