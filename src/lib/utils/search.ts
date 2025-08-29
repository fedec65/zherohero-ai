/**
 * Advanced search utilities for chat and message searching
 */

import { Chat, Message, SearchResult, SearchOptions, FilterOptions } from '../../lib/stores/types';

// Text search and highlight utilities
export class SearchEngine {
  private static instance: SearchEngine;
  private searchIndex: Map<string, Set<string>> = new Map();

  static getInstance(): SearchEngine {
    if (!SearchEngine.instance) {
      SearchEngine.instance = new SearchEngine();
    }
    return SearchEngine.instance;
  }

  /**
   * Builds a search index for faster full-text search
   */
  buildIndex(chats: Record<string, Chat>, messages: Record<string, Message[]>): void {
    this.searchIndex.clear();

    // Index chat titles and metadata
    Object.values(chats).forEach(chat => {
      const terms = this.tokenize(chat.title);
      terms.forEach(term => {
        if (!this.searchIndex.has(term)) {
          this.searchIndex.set(term, new Set());
        }
        this.searchIndex.get(term)!.add(`chat:${chat.id}`);
      });
    });

    // Index message content
    Object.entries(messages).forEach(([chatId, chatMessages]) => {
      chatMessages.forEach((message, index) => {
        const terms = this.tokenize(message.content);
        terms.forEach(term => {
          if (!this.searchIndex.has(term)) {
            this.searchIndex.set(term, new Set());
          }
          this.searchIndex.get(term)!.add(`message:${chatId}:${index}`);
        });
      });
    });
  }

  /**
   * Performs advanced search with ranking and filtering
   */
  search(
    options: SearchOptions,
    chats: Record<string, Chat>,
    messages: Record<string, Message[]>
  ): SearchResult[] {
    if (!options.query.trim()) return [];

    const { query, type = 'all', exact = false, regex = false, limit = 50 } = options;
    const results: SearchResult[] = [];

    if (regex) {
      return this.regexSearch(options, chats, messages);
    }

    if (exact) {
      return this.exactSearch(options, chats, messages);
    }

    return this.fuzzySearch(options, chats, messages);
  }

  /**
   * Regex-based search
   */
  private regexSearch(
    options: SearchOptions,
    chats: Record<string, Chat>,
    messages: Record<string, Message[]>
  ): SearchResult[] {
    const results: SearchResult[] = [];
    let regex: RegExp;

    try {
      regex = new RegExp(options.query, options.caseSensitive ? 'g' : 'gi');
    } catch (error) {
      // Invalid regex, fall back to literal search
      return this.exactSearch(options, chats, messages);
    }

    // Search in chats
    if (options.type === 'chat' || options.type === 'all') {
      Object.values(chats).forEach(chat => {
        const matches = chat.title.match(regex);
        if (matches) {
          results.push({
            type: 'chat',
            id: chat.id,
            title: chat.title,
            relevance: this.calculateChatRelevance(chat, options.query),
            highlights: matches.slice(0, 3),
          });
        }
      });
    }

    // Search in messages
    if (options.type === 'message' || options.type === 'all') {
      Object.entries(messages).forEach(([chatId, chatMessages]) => {
        chatMessages.forEach((message, index) => {
          const matches = message.content.match(regex);
          if (matches) {
            results.push({
              type: 'message',
              id: message.id,
              chatId,
              messageIndex: index,
              title: chats[chatId]?.title || 'Unknown Chat',
              snippet: this.createSnippet(message.content, matches[0]),
              relevance: this.calculateMessageRelevance(message, options.query),
              highlights: matches.slice(0, 3),
            });
          }
        });
      });
    }

    return this.sortResults(results, options.limit);
  }

  /**
   * Exact phrase search
   */
  private exactSearch(
    options: SearchOptions,
    chats: Record<string, Chat>,
    messages: Record<string, Message[]>
  ): SearchResult[] {
    const results: SearchResult[] = [];
    const searchQuery = options.caseSensitive ? options.query : options.query.toLowerCase();

    // Search in chats
    if (options.type === 'chat' || options.type === 'all') {
      Object.values(chats).forEach(chat => {
        const title = options.caseSensitive ? chat.title : chat.title.toLowerCase();
        if (title.includes(searchQuery)) {
          results.push({
            type: 'chat',
            id: chat.id,
            title: chat.title,
            relevance: this.calculateChatRelevance(chat, options.query),
            highlights: [options.query],
          });
        }
      });
    }

    // Search in messages
    if (options.type === 'message' || options.type === 'all') {
      Object.entries(messages).forEach(([chatId, chatMessages]) => {
        chatMessages.forEach((message, index) => {
          const content = options.caseSensitive ? message.content : message.content.toLowerCase();
          if (content.includes(searchQuery)) {
            results.push({
              type: 'message',
              id: message.id,
              chatId,
              messageIndex: index,
              title: chats[chatId]?.title || 'Unknown Chat',
              snippet: this.createSnippet(message.content, options.query),
              relevance: this.calculateMessageRelevance(message, options.query),
              highlights: [options.query],
            });
          }
        });
      });
    }

    return this.sortResults(results, options.limit);
  }

  /**
   * Fuzzy search with token matching and ranking
   */
  private fuzzySearch(
    options: SearchOptions,
    chats: Record<string, Chat>,
    messages: Record<string, Message[]>
  ): SearchResult[] {
    const results: SearchResult[] = [];
    const queryTokens = this.tokenize(options.query);

    // Search in chats
    if (options.type === 'chat' || options.type === 'all') {
      Object.values(chats).forEach(chat => {
        const titleTokens = this.tokenize(chat.title);
        const matches = this.findMatches(queryTokens, titleTokens);
        
        if (matches.length > 0) {
          results.push({
            type: 'chat',
            id: chat.id,
            title: chat.title,
            relevance: this.calculateChatRelevance(chat, options.query, matches.length / queryTokens.length),
            highlights: matches,
          });
        }
      });
    }

    // Search in messages
    if (options.type === 'message' || options.type === 'all') {
      Object.entries(messages).forEach(([chatId, chatMessages]) => {
        chatMessages.forEach((message, index) => {
          const contentTokens = this.tokenize(message.content);
          const matches = this.findMatches(queryTokens, contentTokens);
          
          if (matches.length > 0) {
            results.push({
              type: 'message',
              id: message.id,
              chatId,
              messageIndex: index,
              title: chats[chatId]?.title || 'Unknown Chat',
              snippet: this.createSnippet(message.content, matches[0]),
              relevance: this.calculateMessageRelevance(message, options.query, matches.length / queryTokens.length),
              highlights: matches,
            });
          }
        });
      });
    }

    return this.sortResults(results, options.limit);
  }

  /**
   * Tokenizes text into searchable terms
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  }

  /**
   * Finds matching tokens between query and content
   */
  private findMatches(queryTokens: string[], contentTokens: string[]): string[] {
    const matches: string[] = [];
    const contentSet = new Set(contentTokens);

    queryTokens.forEach(token => {
      if (contentSet.has(token)) {
        matches.push(token);
      }
    });

    return matches;
  }

  /**
   * Creates a snippet with highlighted search terms
   */
  private createSnippet(content: string, searchTerm: string, maxLength = 150): string {
    const index = content.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) return content.slice(0, maxLength) + '...';

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + searchTerm.length + 50);
    
    let snippet = content.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * Calculates relevance score for chat results
   */
  private calculateChatRelevance(chat: Chat, query: string, matchRatio = 1): number {
    let score = matchRatio * 100;

    // Boost exact title matches
    if (chat.title.toLowerCase().includes(query.toLowerCase())) {
      score += 50;
    }

    // Boost starred chats
    if (chat.starred) {
      score += 20;
    }

    // Boost recent chats
    if (chat.lastMessageAt) {
      const daysSinceUpdate = (Date.now() - chat.lastMessageAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) score += 15;
      else if (daysSinceUpdate < 30) score += 10;
    }

    // Boost chats with more messages
    score += Math.min(chat.messageCount * 2, 20);

    return Math.round(score);
  }

  /**
   * Calculates relevance score for message results
   */
  private calculateMessageRelevance(message: Message, query: string, matchRatio = 1): number {
    let score = matchRatio * 100;

    // Boost exact content matches
    if (message.content.toLowerCase().includes(query.toLowerCase())) {
      score += 30;
    }

    // Boost recent messages
    const daysSinceMessage = (Date.now() - message.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceMessage < 1) score += 20;
    else if (daysSinceMessage < 7) score += 15;
    else if (daysSinceMessage < 30) score += 10;

    // Boost assistant messages slightly over user messages
    if (message.role === 'assistant') score += 5;

    return Math.round(score);
  }

  /**
   * Sorts results by relevance and applies limit
   */
  private sortResults(results: SearchResult[], limit?: number): SearchResult[] {
    const sorted = results.sort((a, b) => b.relevance - a.relevance);
    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Generates search suggestions based on history and content
   */
  generateSuggestions(
    query: string,
    searchHistory: { query: string }[],
    chats: Record<string, Chat>
  ): string[] {
    const suggestions: string[] = [];
    const queryLower = query.toLowerCase();

    // History-based suggestions
    const historySuggestions = searchHistory
      .filter(h => h.query.toLowerCase().includes(queryLower) && h.query !== query)
      .map(h => h.query)
      .slice(0, 3);

    suggestions.push(...historySuggestions);

    // Chat title suggestions
    const titleSuggestions = Object.values(chats)
      .filter(chat => chat.title.toLowerCase().includes(queryLower))
      .map(chat => chat.title)
      .slice(0, 3);

    suggestions.push(...titleSuggestions);

    // Remove duplicates and limit
    return Array.from(new Set(suggestions)).slice(0, 5);
  }
}

/**
 * Applies filters to search results or chat list
 */
export function applyFilters<T extends Chat>(
  items: T[],
  filters: FilterOptions,
  messages?: Record<string, Message[]>
): T[] {
  let filtered = [...items];

  // Filter by starred
  if (filters.starred !== undefined) {
    filtered = filtered.filter(item => item.starred === filters.starred);
  }

  // Filter by chat type
  if (filters.chatType && filters.chatType !== 'all') {
    filtered = filtered.filter(item => {
      if (filters.chatType === 'incognito') return item.isIncognito;
      return !item.isIncognito;
    });
  }

  // Filter by date range
  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    filtered = filtered.filter(item => {
      if (!item.lastMessageAt) return false;
      return item.lastMessageAt >= start && item.lastMessageAt <= end;
    });
  }

  // Filter by folder
  if (filters.folders && filters.folders.length > 0) {
    filtered = filtered.filter(item => 
      filters.folders!.includes(item.folderId || 'root')
    );
  }

  // Filter by message existence
  if (filters.hasMessages !== undefined) {
    filtered = filtered.filter(item => {
      const hasMessages = item.messageCount > 0;
      return hasMessages === filters.hasMessages;
    });
  }

  // Apply sorting
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'date':
          const aDate = a.lastMessageAt?.getTime() || 0;
          const bDate = b.lastMessageAt?.getTime() || 0;
          comparison = bDate - aDate;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'messageCount':
          comparison = b.messageCount - a.messageCount;
          break;
      }

      return filters.sortOrder === 'desc' ? comparison : -comparison;
    });
  }

  return filtered;
}

/**
 * Debounces function calls for search optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Highlights search terms in text
 */
export function highlightMatches(text: string, searchTerms: string[]): string {
  if (!searchTerms.length) return text;

  let highlighted = text;
  searchTerms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  });

  return highlighted;
}