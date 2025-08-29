// Chat components exports
export { ChatContainer } from "./chat-container";
export { ChatInterface } from "./chat-interface";
export { ChatHome } from "./chat-home";
export { MessageList } from "./message-list";
export { MessageItem } from "./message-item";
export { ChatInputComponent } from "./chat-input";

// Search components
export { EnhancedSearch } from "./enhanced-search";
export { SearchResults } from "./search-results";
export { SearchFilters } from "./search-filters";
export { SearchSuggestions } from "./search-suggestions";

// Types - define here since they're used in props
export interface MessageItemProps {
  message: any; // Import from types when available
  isStreaming?: boolean;
  streamingContent?: string;
  className?: string;
}

export interface ChatInputProps {
  chatId: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}
