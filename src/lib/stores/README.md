# MindDeck State Management Architecture

A comprehensive state management solution built with Zustand, TypeScript, and performance optimization patterns.

## Architecture Overview

```
lib/stores/
├── types/              # TypeScript interfaces and types
├── middleware/         # Storage and persistence middleware
├── hooks/             # Custom hooks for optimized access
├── chat-store.ts      # Chat and message management
├── model-store.ts     # AI model configuration
├── settings-store.ts  # User preferences and settings
├── mcp-store.ts       # MCP server management
├── ui-store.ts        # UI state and interactions
└── index.ts           # Store composition and initialization
```

## Store Responsibilities

### ChatStore

- **Messages & Conversations**: Normalized state with efficient operations
- **Streaming**: Real-time message updates with streaming state
- **Search & Organization**: Folder management and chat search
- **Persistence**: IndexedDB for large chat histories

### ModelStore

- **Model Management**: Built-in and custom AI models from all providers
- **Configurations**: Per-model settings (temperature, max tokens, etc.)
- **Testing & Validation**: Model capability testing and health checks
- **Provider Integration**: Support for OpenAI, Anthropic, Gemini, xAI, DeepSeek

### SettingsStore

- **Theme Management**: Light/dark/system theme with auto-detection
- **API Keys**: Secure storage with validation patterns
- **UI Preferences**: Font size, shortcuts, display options
- **Import/Export**: Settings backup and migration

### MCPStore

- **Server Management**: Built-in and custom MCP server configurations
- **Connection Handling**: Health checks, auto-reconnection, status monitoring
- **Request Processing**: MCP protocol request/response handling
- **Auto-injection**: Seamless integration with chat flows

### UIStore

- **Layout State**: Sidebar widths, collapse states, responsive behavior
- **Modal System**: Stack-based modal management with props
- **Notifications**: Toast and notification system with actions
- **Keyboard Shortcuts**: Global and context-specific shortcuts
- **Command Palette**: Fuzzy search command execution
- **Focus Management**: Accessibility-focused element management

## Key Features

### Performance Optimization

- **Shallow selectors** prevent unnecessary re-renders
- **Memoized hooks** for computed values
- **Debounced/throttled** actions for expensive operations
- **Selective persistence** excludes transient state

### Type Safety

- **Complete TypeScript coverage** with strict types
- **Discriminated unions** for different entity types
- **Generic utilities** for common patterns (Patch<T>, AsyncState<T>)
- **Runtime validation** for API boundaries

### Persistence Strategy

- **localStorage**: User preferences, theme, settings
- **sessionStorage**: Temporary UI state, search queries
- **IndexedDB**: Large datasets (chat history, messages)
- **Memory**: Sensitive data (API keys, real-time state)

### Cross-Store Communication

- **Zustand subscriptions** for reactive updates
- **Event-driven architecture** for loose coupling
- **Computed selectors** that depend on multiple stores
- **Action composition** for atomic multi-store updates

## Usage Examples

### Basic Store Access

```typescript
import { useChatStore, useModelStore } from '@/lib/stores'

// Direct store access
const createChat = useChatStore((state) => state.createChat)
const selectedModel = useModelStore((state) => state.selectedModel)
```

### Optimized Hooks

```typescript
import { useActiveChat, useSelectedModel } from '@/lib/stores'

// Optimized with shallow comparison and memoization
const { chat, messages, setActiveChat } = useActiveChat()
const { model, config, setSelectedModel } = useSelectedModel()
```

### Complex State Relationships

```typescript
import { useChatWithModel } from '@/lib/stores'

// Combined hook with computed values
const { chat, messages, model, canSendMessage, tokenCount } =
  useChatWithModel(chatId)
```

### Store Actions

```typescript
import { useChatActions, useModelConfig } from '@/lib/stores'

const { createChat, sendMessage } = useChatActions()
const { updateConfig } = useModelConfig('openai', 'gpt-4')

// Async operations with error handling
const handleSendMessage = async (content: string) => {
  try {
    await sendMessage(chatId, content)
  } catch (error) {
    // Error automatically handled by store
  }
}
```

### Persistence and Migration

```typescript
// Automatic persistence with versioning
const store = create<StoreState>()(
  persist(
    (set, get) => ({
      /* store implementation */
    }),
    {
      name: 'store-name',
      version: 1,
      migrate: createMigration({
        1: (oldState) => ({ ...oldState, newField: 'default' }),
      }),
      partialize: createPartializer(['excludeField']),
    }
  )
)
```

## Development Tools

### Debug Access

```typescript
// Available in development mode
window.stores.chat.getState()
window.getGlobalSnapshot()
window.resetAllStores()
```

### State Inspection

```typescript
import { getGlobalSnapshot } from '@/lib/stores'

// Get complete state snapshot
const snapshot = getGlobalSnapshot()
console.log('Current state:', snapshot)
```

## Best Practices

### Component Integration

```typescript
// ✅ Good: Use specific selectors
const activeChat = useChatStore((state) => state.activeChat)

// ❌ Bad: Select entire state
const state = useChatStore()
```

### Action Patterns

```typescript
// ✅ Good: Use immer for nested updates
set((state) => {
  state.chats[chatId].title = newTitle
})

// ❌ Bad: Manual immutable updates
set((state) => ({
  ...state,
  chats: {
    ...state.chats,
    [chatId]: { ...state.chats[chatId], title: newTitle },
  },
}))
```

### Error Handling

```typescript
// ✅ Good: Consistent error patterns
try {
  set((state) => {
    state.loading.action = true
  })
  await performAction()
  set((state) => {
    state.loading.action = false
  })
} catch (error) {
  set((state) => {
    state.loading.action = false
    state.errors.action = error.message
  })
  throw error
}
```

This architecture provides a scalable, performant, and type-safe foundation for the MindDeck application's state management needs.
