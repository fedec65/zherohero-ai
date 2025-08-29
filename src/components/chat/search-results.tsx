'use client';

import React from 'react';
import { MessageCircle, FileText, Clock, Star, ArrowRight, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { SearchResult } from '../../lib/stores/types';

interface SearchResultsProps {
  results: SearchResult[];
  isSearching: boolean;
  query: string;
  onSelectResult: (resultId: string) => void;
  onClearSearch: () => void;
  className?: string;
}

export function SearchResults({
  results,
  isSearching,
  query,
  onSelectResult,
  onClearSearch,
  className,
}: SearchResultsProps) {
  if (isSearching) {
    return (
      <div className={cn('p-4', className)}>
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Searching...</span>
        </div>
      </div>
    );
  }

  if (!query) {
    return null;
  }

  if (results.length === 0) {
    return (
      <div className={cn('p-4 text-center', className)}>
        <div className="space-y-3">
          <div className="text-gray-500 dark:text-gray-400">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No results found</p>
            <p className="text-xs">Try different keywords or check your filters</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSearch}
            className="text-xs"
          >
            Clear search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('p-2', className)}>
      {/* Search results header */}
      <div className="flex items-center justify-between px-2 py-1 mb-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {results.length} result{results.length !== 1 ? 's' : ''}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSearch}
          className="h-6 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Clear
        </Button>
      </div>

      {/* Results list */}
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {results.map((result) => (
          <SearchResultItem
            key={result.id}
            result={result}
            query={query}
            onSelect={() => onSelectResult(result.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface SearchResultItemProps {
  result: SearchResult;
  query: string;
  onSelect: () => void;
}

function SearchResultItem({ result, query, onSelect }: SearchResultItemProps) {
  const getResultIcon = () => {
    switch (result.type) {
      case 'chat':
        return <MessageCircle className="h-4 w-4" />;
      case 'message':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group relative p-3 rounded-lg cursor-pointer transition-all',
        'hover:bg-white dark:hover:bg-gray-800',
        'border border-transparent hover:border-gray-200 dark:hover:border-gray-700',
        'hover:shadow-sm'
      )}
    >
      <div className="flex items-start space-x-3">
        {/* Result type icon */}
        <div className="flex-shrink-0 mt-0.5">
          <div className={cn(
            'p-1.5 rounded-md',
            result.type === 'chat' 
              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          )}>
            {getResultIcon()}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Title with highlights */}
              <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                <HighlightedText text={result.title} highlights={result.highlights || [query]} />
              </h4>
              
              {/* Result type and context */}
              <div className="flex items-center space-x-2 mt-1">
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded font-medium',
                  result.type === 'chat'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                )}>
                  {result.type === 'chat' ? 'Chat' : 'Message'}
                </span>
                
                {result.type === 'message' && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    in {result.title}
                  </span>
                )}
              </div>

              {/* Snippet for message results */}
              {result.snippet && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                  <HighlightedText text={result.snippet} highlights={result.highlights || [query]} />
                </p>
              )}
            </div>

            {/* Relevance and actions */}
            <div className="flex items-center space-x-2 ml-2">
              <div className="flex items-center space-x-1">
                <div className={cn(
                  'h-1.5 w-8 rounded-full',
                  result.relevance >= 80 ? 'bg-green-400' :
                  result.relevance >= 60 ? 'bg-yellow-400' :
                  'bg-gray-300 dark:bg-gray-600'
                )} />
                <span className="text-xs text-gray-400 tabular-nums">
                  {result.relevance}%
                </span>
              </div>
              
              <ArrowRight className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface HighlightedTextProps {
  text: string;
  highlights: string[];
}

function HighlightedText({ text, highlights }: HighlightedTextProps) {
  if (!highlights.length) return <>{text}</>;

  let highlightedText = text;
  highlights.forEach((highlight) => {
    const regex = new RegExp(`(${highlight})`, 'gi');
    highlightedText = highlightedText.replace(
      regex,
      '<mark class="bg-yellow-200 dark:bg-yellow-900 text-inherit rounded px-0.5">$1</mark>'
    );
  });

  return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
}