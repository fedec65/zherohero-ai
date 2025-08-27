/**
 * Core type definitions for the MindDeck state management architecture
 */

// Base entity types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Chat and messaging types
export interface Chat extends BaseEntity {
  title: string;
  folderId?: string;
  starred: boolean;
  isIncognito: boolean;
  modelId: string;
  lastMessageAt?: Date;
  messageCount: number;
}

export interface Message extends BaseEntity {
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  tokens?: number;
  streamingState?: 'pending' | 'streaming' | 'complete' | 'error';
  error?: string;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'audio';
  name: string;
  size: number;
  url?: string;
  data?: string; // base64 for small files
}

export interface Folder extends BaseEntity {
  name: string;
  parentId?: string;
  color?: string;
}

// AI Model types
export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'xai' | 'deepseek' | 'custom';

export interface Model {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  maxTokens?: number;
  pricing?: {
    input: number; // per 1K tokens
    output: number; // per 1K tokens
  };
  capabilities: ModelCapability[];
  isNew?: boolean;
  isDeprecated?: boolean;
}

export type ModelCapability = 
  | 'text-generation' 
  | 'code-generation' 
  | 'image-understanding' 
  | 'function-calling' 
  | 'json-mode'
  | 'streaming';

export interface ModelConfig {
  temperature: number;
  maxTokens?: number;
  topP: number;
  topK?: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt?: string;
  stopSequences?: string[];
}

export interface CustomModel extends Model {
  apiEndpoint: string;
  apiKeyRequired: boolean;
  headers?: Record<string, string>;
}

// MCP Server types
export interface MCPServer extends BaseEntity {
  name: string;
  description: string;
  url: string;
  enabled: boolean;
  autoInject: boolean;
  capabilities: MCPCapability[];
  config: Record<string, unknown>;
  status: 'connected' | 'disconnected' | 'error';
  lastHealthCheck?: Date;
}

export type MCPCapability = 
  | 'tools' 
  | 'resources' 
  | 'prompts' 
  | 'logging';

// Settings and preferences
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  sidebarWidth: number;
  fontSize: 'small' | 'medium' | 'large';
  sendOnEnter: boolean;
  showTokenCount: boolean;
  autoSave: boolean;
  apiKeys: Partial<Record<AIProvider, string>>;
  privacy: {
    shareChats: boolean;
    telemetry: boolean;
    crashReporting: boolean;
  };
}

// UI State types
export interface UIState {
  sidebarCollapsed: boolean;
  activeModal: string | null;
  searchQuery: string;
  sortBy: 'date' | 'name' | 'model';
  sortOrder: 'asc' | 'desc';
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
}

// Async operation states
export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated?: Date;
};

// Utility types for state updates
export type Patch<T> = Partial<T> & { id: string };
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event system types
export interface StoreEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: Date;
}

// Storage configuration
export interface StorageConfig {
  key: string;
  storage: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'memory';
  version: number;
  migrate?: (persistedState: unknown, version: number) => unknown;
  serialize?: (state: unknown) => string;
  deserialize?: (str: string) => unknown;
  exclude?: string[]; // Fields to exclude from persistence
}

// Search and filtering
export interface SearchResult {
  type: 'chat' | 'message' | 'model';
  id: string;
  title: string;
  snippet?: string;
  relevance: number;
}

export interface FilterOptions {
  providers?: AIProvider[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  starred?: boolean;
  folders?: string[];
}