'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Settings, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { SearchSuggestions } from './search-suggestions';
import { SearchResults } from './search-results';
import { SearchFilters } from './search-filters';
import { cn } from '../../lib/utils';
import { debounce } from '../../lib/utils/search';
import { SearchOptions, FilterOptions, SearchResult, SearchHistory } from '../../lib/stores/types';

interface EnhancedSearchProps {
  value: string;
  onSearch: (options: SearchOptions) => Promise<SearchResult[]>;
  onClear: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
  searchHistory: SearchHistory[];
  suggestions: string[];
  results: SearchResult[];
  isSearching: boolean;
  onSelectResult: (resultId: string) => void;
  placeholder?: string;
  className?: string;
}

export function EnhancedSearch({
  value,
  onSearch,
  onClear,
  filters,
  onFiltersChange,
  searchHistory,
  suggestions,
  results,
  isSearching,
  onSelectResult,
  placeholder = "Search chats and messages...",
  className,
}: EnhancedSearchProps) {
  const [inputValue, setInputValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchMode, setSearchMode] = useState<'simple' | 'advanced'>('simple');
  const [isRegex, setIsRegex] = useState(false);
  const [isExact, setIsExact] = useState(false);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        onClear();
        return;
      }

      const searchOptions: SearchOptions = {
        query: query.trim(),
        type: 'all',
        regex: isRegex,
        exact: isExact,
        caseSensitive: isCaseSensitive,
        limit: 50,
      };

      await onSearch(searchOptions);
    }, 300),
    [onSearch, onClear, isRegex, isExact, isCaseSensitive]
  );

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    debouncedSearch(newValue);
    
    // Show suggestions dropdown when typing
    if (newValue) {
      setShowDropdown(true);
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    setShowDropdown(false);
    debouncedSearch(suggestion);
    inputRef.current?.focus();
  };

  // Handle clear search
  const handleClear = () => {
    setInputValue('');
    setShowDropdown(false);
    onClear();
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && inputValue.trim()) {
      setShowDropdown(false);
      debouncedSearch(inputValue);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync with external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const hasQuery = inputValue.trim().length > 0;
  const showSuggestions = showDropdown && !isSearching && !hasQuery;
  const showResults = hasQuery && (results.length > 0 || !isSearching);

  return (
    <div ref={searchRef} className={cn('relative', className)}>
      {/* Search input container */}
      <div className="relative">
        {/* Main search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowDropdown(true)}
            className={cn(
              'pl-10 pr-20',
              (isRegex || isExact || isCaseSensitive) && 'border-blue-300 dark:border-blue-700'
            )}
          />
          
          {/* Search controls */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {/* Advanced search toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchMode(searchMode === 'simple' ? 'advanced' : 'simple')}
              className={cn(
                'h-6 w-6 p-0',
                searchMode === 'advanced' && 'text-blue-600 dark:text-blue-400'
              )}
              title="Advanced search options"
            >
              <Settings className="h-3 w-3" />
            </Button>
            
            {/* Clear button */}
            {hasQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                title="Clear search"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Advanced search options */}
        {searchMode === 'advanced' && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4 text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRegex}
                  onChange={(e) => setIsRegex(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-gray-700 dark:text-gray-300">Regex</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isExact}
                  onChange={(e) => setIsExact(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-gray-700 dark:text-gray-300">Exact match</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCaseSensitive}
                  onChange={(e) => setIsCaseSensitive(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-gray-700 dark:text-gray-300">Case sensitive</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Dropdown content */}
      {(showSuggestions || showResults) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
            {/* Filters */}
            <SearchFilters
              filters={filters}
              onFiltersChange={onFiltersChange}
              onClearFilters={() => onFiltersChange({
                starred: undefined,
                chatType: 'all',
                dateRange: undefined,
                hasMessages: undefined,
                folders: [],
              })}
              resultsCount={results.length}
            />

            {/* Suggestions */}
            {showSuggestions && (
              <SearchSuggestions
                suggestions={suggestions}
                searchHistory={searchHistory}
                query={inputValue}
                onSelectSuggestion={handleSelectSuggestion}
              />
            )}

            {/* Results */}
            {showResults && (
              <SearchResults
                results={results}
                isSearching={isSearching}
                query={inputValue}
                onSelectResult={(resultId) => {
                  onSelectResult(resultId);
                  setShowDropdown(false);
                }}
                onClearSearch={handleClear}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Quick search shortcuts component
export function SearchShortcuts({ onSearch }: { onSearch: (query: string) => void }) {
  const shortcuts = [
    { label: 'Recent', query: '*', icon: '⏰' },
    { label: 'Starred', query: 'starred:true', icon: '⭐' },
    { label: 'Incognito', query: 'type:incognito', icon: '🔒' },
    { label: 'This Week', query: 'date:week', icon: '📅' },
  ];

  return (
    <div className="flex items-center space-x-1 mt-2">
      {shortcuts.map((shortcut) => (
        <Button
          key={shortcut.query}
          variant="outline"
          size="sm"
          onClick={() => onSearch(shortcut.query)}
          className="h-7 px-2 text-xs"
        >
          <span className="mr-1">{shortcut.icon}</span>
          {shortcut.label}
        </Button>
      ))}
    </div>
  );
}