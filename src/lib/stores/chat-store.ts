/**
 * Chat Store - Manages conversations, messages, and chat operations
 */

import { createWithEqualityFn } from 'zustand/traditional'
import { subscribeWithSelector } from 'zustand/middleware'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import {
  Chat,
  Message,
  Folder,
  FolderTreeItem,
  AsyncState,
  Patch,
  SearchResult,
  SearchOptions,
  FilterOptions,
  SearchHistory,
  SearchState,
  AIProvider,
  DialogState,
  ChatHierarchy,
  FolderNode,
} from './types'
import {
  createEnhancedStorage,
  createAutoPartializer,
  PersistOptions,
} from './middleware/persistence'
import { SearchEngine, applyFilters, debounce } from '../utils/search'
import { aiClientAPI, AIClientAPI } from '../api/client'
import { nanoid } from 'nanoid'

// Chat store state interface
interface ChatState {
  // Normalized state structure
  chats: Record<string, Chat>
  messages: Record<string, Message[]>
  folders: Record<string, Folder>

  // Current state
  activeChat: string | null
  searchQuery: string

  // Enhanced search state
  search: SearchState

  // UI state
  loading: {
    sendMessage: boolean
    deleteChat: boolean
    createChat: boolean
  }

  // Streaming state
  streamingMessage: {
    chatId: string | null
    messageId: string | null
    content: string
  } | null

  // Dialog state
  dialogs: DialogState

  // Chat hierarchy
  chatHierarchy: ChatHierarchy | null
}

// Chat store actions interface
interface ChatActions {
  // Chat management
  createChat: (options?: {
    title?: string
    isIncognito?: boolean
    folderId?: string
  }) => Promise<string>
  deleteChat: (chatId: string) => Promise<void>
  updateChat: (chatId: string, updates: Patch<Chat>) => void
  duplicateChat: (chatId: string) => Promise<string>
  starChat: (chatId: string) => void
  moveToFolder: (chatId: string, folderId: string | null) => void

  // Message management
  sendMessage: (
    chatId: string,
    content: string,
    attachments?: File[]
  ) => Promise<void>
  editMessage: (messageId: string, content: string) => void
  deleteMessage: (messageId: string) => void
  regenerateMessage: (messageId: string) => Promise<void>

  // Streaming
  startStreamingMessage: (chatId: string, messageId: string) => void
  updateStreamingContent: (content: string) => void
  finishStreamingMessage: () => void
  cancelStreaming: () => void

  // Navigation
  setActiveChat: (chatId: string | null) => void
  setSearchQuery: (query: string) => void

  // Folder management
  createFolder: (name: string, color?: string, parentId?: string) => string
  updateFolder: (folderId: string, updates: Patch<Folder>) => void
  deleteFolder: (folderId: string) => void
  toggleFolder: (folderId: string) => void
  toggleFolderExpansion: (folderId: string) => void
  getFolderTree: () => FolderTreeItem[]
  getChatsInFolder: (folderId: string) => Chat[]

  // Chat management actions
  pinChat: (chatId: string) => void
  renameChat: (chatId: string, newName: string) => void
  moveChat: (chatId: string, folderId: string | null) => void

  // Folder management actions
  pinFolder: (folderId: string) => void
  unpinFolder: (folderId: string) => void
  renameFolder: (folderId: string, newName: string) => void

  // Dialog management
  openCreateFolderDialog: () => void
  closeCreateFolderDialog: () => void
  openMoveDialog: (chatId: string) => void
  closeMoveDialog: () => void
  openRenameDialog: (
    type: 'chat' | 'folder',
    id: string,
    currentName: string
  ) => void
  closeRenameDialog: () => void

  // Hierarchy management
  buildChatHierarchy: () => void
  getChatHierarchy: () => ChatHierarchy | null

  // Bulk operations
  deleteMultipleChats: (chatIds: string[]) => Promise<void>
  exportChats: (chatIds: string[]) => Promise<Blob>
  importChats: (file: File) => Promise<void>

  // Search and filtering
  searchChats: (query: string) => Chat[]
  getRecentChats: (limit?: number) => Chat[]
  getStarredChats: () => Chat[]
  getChatsByFolder: (folderId: string | null) => Chat[]

  // Advanced search functionality
  performSearch: (options: SearchOptions) => Promise<SearchResult[]>
  clearSearch: () => void
  setSearchFilters: (filters: Partial<FilterOptions>) => void
  getFilteredChats: () => Chat[]
  addToSearchHistory: (query: string, resultsCount: number) => void
  getSearchSuggestions: (query: string) => string[]
  selectSearchResult: (resultId: string) => void

  // Utility
  getChatTitle: (chatId: string) => string
  getChatMessageCount: (chatId: string) => number
  getLastMessage: (chatId: string) => Message | null

  // Cleanup
  clearAllChats: () => void
  archiveOldChats: (olderThanDays: number) => void

  // AI Integration
  sendAIMessage: (chatId: string, messageId: string) => Promise<void>

  // Migration
  migrateExistingData: (state: any) => void
}

type ChatStore = ChatState & ChatActions

// Create the chat store
export const useChatStore = createWithEqualityFn<ChatStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // Initial state
        chats: {},
        messages: {},
        folders: {},
        activeChat: null,
        searchQuery: '',
        search: {
          query: '',
          results: [],
          isSearching: false,
          searchHistory: [],
          filters: {
            chatType: 'all',
            sortBy: 'date',
            sortOrder: 'desc',
          },
          suggestions: [],
        },
        loading: {
          sendMessage: false,
          deleteChat: false,
          createChat: false,
        },
        streamingMessage: null,
        dialogs: {
          showCreateFolderDialog: false,
          showMoveDialog: false,
          showRenameDialog: false,
          editingItem: null,
          targetChatId: undefined,
          selectedFolderId: undefined,
        },
        chatHierarchy: null,

        // Actions
        createChat: async (options = {}) => {
          const chatId = nanoid()
          const now = new Date()

          set((state) => {
            state.loading.createChat = true
          })

          try {
            const newChat: Chat = {
              id: chatId,
              title: options.title || 'New Chat',
              folderId: options.folderId,
              starred: false,
              isStarred: false,
              isPinned: false,
              isIncognito: options.isIncognito || false,
              modelId: '', // Will be set from model store
              lastMessageAt: now,
              messageCount: 0,
              createdAt: now,
              updatedAt: now,
            }

            set((state) => {
              state.chats[chatId] = newChat
              state.messages[chatId] = []
              state.activeChat = chatId
              state.loading.createChat = false
            })

            return chatId
          } catch (error) {
            set((state) => {
              state.loading.createChat = false
            })
            throw error
          }
        },

        deleteChat: async (chatId: string) => {
          set((state) => {
            state.loading.deleteChat = true
          })

          try {
            set((state) => {
              delete state.chats[chatId]
              delete state.messages[chatId]

              if (state.activeChat === chatId) {
                const remainingChats = Object.keys(state.chats)
                state.activeChat =
                  remainingChats.length > 0 ? remainingChats[0] : null
              }

              state.loading.deleteChat = false
            })
          } catch (error) {
            set((state) => {
              state.loading.deleteChat = false
            })
            throw error
          }
        },

        updateChat: (chatId: string, updates: Patch<Chat>) => {
          set((state) => {
            const chat = state.chats[chatId]
            if (chat) {
              Object.assign(chat, updates, { updatedAt: new Date() })
            }
          })
        },

        duplicateChat: async (chatId: string) => {
          const originalChat = get().chats[chatId]
          const originalMessages = get().messages[chatId] || []

          if (!originalChat) return ''

          const newChatId = nanoid()
          const now = new Date()

          set((state) => {
            state.chats[newChatId] = {
              ...originalChat,
              id: newChatId,
              title: `${originalChat.title} (Copy)`,
              createdAt: now,
              updatedAt: now,
            }

            state.messages[newChatId] = originalMessages.map((msg) => ({
              ...msg,
              id: nanoid(),
              chatId: newChatId,
              createdAt: now,
              updatedAt: now,
            }))
          })

          return newChatId
        },

        starChat: (chatId: string) => {
          set((state) => {
            const chat = state.chats[chatId]
            if (chat) {
              chat.isStarred = !chat.isStarred
              chat.updatedAt = new Date()
            }
          })
          get().buildChatHierarchy()
        },

        moveToFolder: (chatId: string, folderId: string | null) => {
          set((state) => {
            const chat = state.chats[chatId]
            if (chat) {
              chat.folderId = folderId || undefined
              chat.updatedAt = new Date()
            }
          })
        },

        sendMessage: async (
          chatId: string,
          content: string,
          attachments = []
        ) => {
          const messageId = nanoid()
          const now = new Date()

          set((state) => {
            state.loading.sendMessage = true
          })

          try {
            // Add user message
            const userMessage: Message = {
              id: messageId,
              chatId,
              role: 'user',
              content,
              createdAt: now,
              updatedAt: now,
              attachments: attachments.map((file) => ({
                id: nanoid(),
                type: file.type.startsWith('image/') ? 'image' : 'file',
                name: file.name,
                size: file.size,
              })),
            }

            set((state) => {
              if (!state.messages[chatId]) {
                state.messages[chatId] = []
              }
              state.messages[chatId].push(userMessage)

              const chat = state.chats[chatId]
              if (chat) {
                chat.messageCount++
                chat.lastMessageAt = now
                chat.updatedAt = now

                // Auto-generate title from first message
                if (chat.messageCount === 1 && chat.title === 'New Chat') {
                  chat.title =
                    content.slice(0, 50) + (content.length > 50 ? '...' : '')
                }
              }
            })

            // Create assistant message placeholder
            const assistantMessageId = nanoid()
            const assistantMessage: Message = {
              id: assistantMessageId,
              chatId,
              role: 'assistant',
              content: '',
              streamingState: 'pending',
              createdAt: now,
              updatedAt: now,
            }

            set((state) => {
              state.messages[chatId].push(assistantMessage)
              state.streamingMessage = {
                chatId,
                messageId: assistantMessageId,
                content: '',
              }
              state.loading.sendMessage = false
            })

            // Integrate with AI providers
            await get().sendAIMessage(chatId, assistantMessageId)
          } catch (error) {
            set((state) => {
              state.loading.sendMessage = false
            })
            throw error
          }
        },

        editMessage: (messageId: string, content: string) => {
          set((state) => {
            for (const chatMessages of Object.values(state.messages)) {
              const message = chatMessages.find((m) => m.id === messageId)
              if (message) {
                message.content = content
                message.updatedAt = new Date()
                break
              }
            }
          })
        },

        deleteMessage: (messageId: string) => {
          set((state) => {
            for (const [chatId, chatMessages] of Object.entries(
              state.messages
            )) {
              const messageIndex = chatMessages.findIndex(
                (m) => m.id === messageId
              )
              if (messageIndex >= 0) {
                chatMessages.splice(messageIndex, 1)

                const chat = state.chats[chatId]
                if (chat) {
                  chat.messageCount = Math.max(0, chat.messageCount - 1)
                  chat.updatedAt = new Date()
                }
                break
              }
            }
          })
        },

        regenerateMessage: async (messageId: string) => {
          // TODO: Implement message regeneration
          // This would resend the conversation up to the message and get a new response
        },

        // Streaming methods
        startStreamingMessage: (chatId: string, messageId: string) => {
          set((state) => {
            state.streamingMessage = {
              chatId,
              messageId,
              content: '',
            }

            const messages = state.messages[chatId]
            const message = messages?.find((m) => m.id === messageId)
            if (message) {
              message.streamingState = 'streaming'
            }
          })
        },

        updateStreamingContent: (content: string) => {
          set((state) => {
            if (state.streamingMessage) {
              state.streamingMessage.content = content

              const { chatId, messageId } = state.streamingMessage
              const messages = state.messages[chatId]
              const message = messages?.find((m) => m.id === messageId)
              if (message) {
                message.content = content
                message.updatedAt = new Date()
              }
            }
          })
        },

        finishStreamingMessage: () => {
          set((state) => {
            if (state.streamingMessage) {
              const { chatId, messageId } = state.streamingMessage
              const messages = state.messages[chatId]
              const message = messages?.find((m) => m.id === messageId)
              if (message) {
                message.streamingState = 'complete'
                message.updatedAt = new Date()
              }

              state.streamingMessage = null
            }
          })
        },

        cancelStreaming: () => {
          set((state) => {
            if (state.streamingMessage) {
              const { chatId, messageId } = state.streamingMessage
              const messages = state.messages[chatId]
              const messageIndex =
                messages?.findIndex((m) => m.id === messageId) ?? -1

              if (messageIndex >= 0) {
                messages!.splice(messageIndex, 1)
              }

              state.streamingMessage = null
            }
          })
        },

        // Navigation
        setActiveChat: (chatId: string | null) => {
          set((state) => {
            state.activeChat = chatId
          })
        },

        setSearchQuery: (query: string) => {
          set((state) => {
            state.searchQuery = query
          })
        },

        // Folder management
        createFolder: (name: string, color?: string, parentId?: string) => {
          const folderId = nanoid()
          const now = new Date()

          set((state) => {
            state.folders[folderId] = {
              id: folderId,
              name,
              parentId,
              color: color || 'blue', // Default to blue if no color provided
              isExpanded: true,
              isPinned: false,
              chatCount: 0,
              createdAt: now,
              updatedAt: now,
            }
          })

          // Rebuild hierarchy after creating folder
          get().buildChatHierarchy()
          return folderId
        },

        updateFolder: (folderId: string, updates: Patch<Folder>) => {
          set((state) => {
            const folder = state.folders[folderId]
            if (folder) {
              Object.assign(folder, updates, { updatedAt: new Date() })
            }
          })
          // Rebuild hierarchy after updating folder
          get().buildChatHierarchy()
        },

        deleteFolder: (folderId: string) => {
          set((state) => {
            // Move chats out of deleted folder
            Object.values(state.chats).forEach((chat) => {
              if (chat.folderId === folderId) {
                chat.folderId = undefined
              }
            })

            delete state.folders[folderId]
          })
          // Rebuild hierarchy after deleting folder
          get().buildChatHierarchy()
        },

        // Bulk operations
        deleteMultipleChats: async (chatIds: string[]) => {
          set((state) => {
            chatIds.forEach((chatId) => {
              delete state.chats[chatId]
              delete state.messages[chatId]
            })

            if (state.activeChat && chatIds.includes(state.activeChat)) {
              const remainingChats = Object.keys(state.chats)
              state.activeChat =
                remainingChats.length > 0 ? remainingChats[0] : null
            }
          })
        },

        exportChats: async (chatIds: string[]) => {
          const state = get()
          const exportData = {
            chats: chatIds.reduce(
              (acc, id) => {
                acc[id] = state.chats[id]
                return acc
              },
              {} as Record<string, Chat>
            ),
            messages: chatIds.reduce(
              (acc, id) => {
                acc[id] = state.messages[id] || []
                return acc
              },
              {} as Record<string, Message[]>
            ),
          }

          const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json',
          })

          return blob
        },

        importChats: async (file: File) => {
          const text = await file.text()
          const importData = JSON.parse(text)

          set((state) => {
            Object.assign(state.chats, importData.chats)
            Object.assign(state.messages, importData.messages)
          })
        },

        // Search and filtering
        searchChats: (query: string) => {
          const state = get()
          const lowerQuery = query.toLowerCase()

          return Object.values(state.chats).filter((chat) =>
            chat.title.toLowerCase().includes(lowerQuery)
          )
        },

        getRecentChats: (limit = 10) => {
          const state = get()
          return Object.values(state.chats)
            .sort(
              (a, b) =>
                (b.lastMessageAt?.getTime() || 0) -
                (a.lastMessageAt?.getTime() || 0)
            )
            .slice(0, limit)
        },

        getStarredChats: () => {
          const state = get()
          return Object.values(state.chats).filter((chat) => chat.starred)
        },

        getChatsByFolder: (folderId: string | null) => {
          const state = get()
          return Object.values(state.chats).filter(
            (chat) => chat.folderId === folderId
          )
        },

        // Utility
        getChatTitle: (chatId: string) => {
          const chat = get().chats[chatId]
          return chat?.title || 'Unknown Chat'
        },

        getChatMessageCount: (chatId: string) => {
          const messages = get().messages[chatId]
          return messages?.length || 0
        },

        getLastMessage: (chatId: string) => {
          const messages = get().messages[chatId]
          return messages && messages.length > 0
            ? messages[messages.length - 1]
            : null
        },

        // Cleanup
        clearAllChats: () => {
          set((state) => {
            state.chats = {}
            state.messages = {}
            state.activeChat = null
          })
        },

        archiveOldChats: (olderThanDays: number) => {
          const cutoffDate = new Date()
          cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

          set((state) => {
            const toDelete: string[] = []

            Object.entries(state.chats).forEach(([id, chat]) => {
              if (chat.lastMessageAt && chat.lastMessageAt < cutoffDate) {
                toDelete.push(id)
              }
            })

            toDelete.forEach((id) => {
              delete state.chats[id]
              delete state.messages[id]
            })

            if (state.activeChat && toDelete.includes(state.activeChat)) {
              const remainingChats = Object.keys(state.chats)
              state.activeChat =
                remainingChats.length > 0 ? remainingChats[0] : null
            }
          })
        },

        // Advanced search functionality
        performSearch: async (options: SearchOptions) => {
          const state = get()

          set((draft) => {
            draft.search.isSearching = true
            draft.search.query = options.query
          })

          try {
            const searchEngine = SearchEngine.getInstance()

            // Build/update search index if needed
            searchEngine.buildIndex(state.chats, state.messages, state.folders)

            // Perform search
            const results = searchEngine.search(
              options,
              state.chats,
              state.messages,
              state.folders
            )

            set((draft) => {
              draft.search.results = results
              draft.search.isSearching = false
            })

            // Add to search history if query has results
            if (results.length > 0) {
              get().addToSearchHistory(options.query, results.length)
            }

            return results
          } catch (error) {
            set((draft) => {
              draft.search.isSearching = false
              draft.search.results = []
            })
            throw error
          }
        },

        clearSearch: () => {
          set((state) => {
            state.search.query = ''
            state.search.results = []
            state.search.selectedResultId = undefined
            state.searchQuery = ''
          })
        },

        setSearchFilters: (filters: Partial<FilterOptions>) => {
          set((state) => {
            state.search.filters = { ...state.search.filters, ...filters }
          })
        },

        getFilteredChats: () => {
          const state = get()
          const chats = Object.values(state.chats)
          return applyFilters(chats, state.search.filters, state.messages)
        },

        addToSearchHistory: (query: string, resultsCount: number) => {
          set((state) => {
            // Remove existing entry with same query
            state.search.searchHistory = state.search.searchHistory.filter(
              (h) => h.query !== query
            )

            // Add new entry at the beginning
            state.search.searchHistory.unshift({
              id: nanoid(),
              query,
              timestamp: new Date(),
              resultsCount,
            })

            // Keep only last 20 searches
            state.search.searchHistory = state.search.searchHistory.slice(0, 20)
          })
        },

        getSearchSuggestions: (query: string) => {
          const state = get()
          const searchEngine = SearchEngine.getInstance()

          return searchEngine.generateSuggestions(
            query,
            state.search.searchHistory,
            state.chats,
            state.folders
          )
        },

        selectSearchResult: (resultId: string) => {
          const state = get()
          const result = state.search.results.find((r) => r.id === resultId)

          if (result) {
            set((draft) => {
              draft.search.selectedResultId = resultId

              // Navigate to the relevant chat or folder
              if (result.type === 'chat') {
                draft.activeChat = result.id
              } else if (result.type === 'message' && result.chatId) {
                draft.activeChat = result.chatId
              } else if (result.type === 'folder') {
                // For folder results, expand the folder and clear active chat
                if (draft.folders[result.id]) {
                  draft.folders[result.id].isExpanded = true
                }
                draft.activeChat = null
              }
            })

            // Rebuild hierarchy to reflect folder expansion
            if (result.type === 'folder') {
              get().buildChatHierarchy()
            }
          }
        },

        // AI Integration method
        // Toggle folder expansion
        toggleFolder: (folderId: string) => {
          set((state) => {
            const folder = state.folders[folderId]
            if (folder) {
              folder.isExpanded = !folder.isExpanded
            }
          })
          get().buildChatHierarchy()
        },

        // Alias for toggleFolder for backward compatibility  
        toggleFolderExpansion: (folderId: string) => {
          get().toggleFolder(folderId)
        },

        // Get folder tree structure for hierarchical display
        getFolderTree: () => {
          const state = get()
          const folders = Object.values(state.folders)
          const chats = Object.values(state.chats)
          
          // Build tree structure
          const buildTree = (parentId?: string, level = 0): FolderTreeItem[] => {
            const items: FolderTreeItem[] = []
            
            // Add folders at this level
            folders
              .filter(folder => folder.parentId === parentId)
              .sort((a, b) => a.name.localeCompare(b.name))
              .forEach(folder => {
                const folderChats = chats.filter(chat => chat.folderId === folder.id)
                const children = buildTree(folder.id, level + 1)
                
                items.push({
                  id: folder.id,
                  name: folder.name,
                  type: 'folder',
                  parentId: folder.parentId,
                  level,
                  isExpanded: folder.isExpanded,
                  isPinned: folder.isPinned,
                  chatCount: folderChats.length,
                  hasChildren: children.length > 0 || folderChats.length > 0,
                  children: [...children, ...folderChats.map(chat => ({
                    id: chat.id,
                    name: chat.title,
                    type: 'chat' as const,
                    parentId: folder.id,
                    level: level + 1,
                    isPinned: chat.isPinned,
                    color: folder.color,
                    createdAt: chat.createdAt,
                    updatedAt: chat.updatedAt,
                  }))],
                  color: folder.color,
                  createdAt: folder.createdAt,
                  updatedAt: folder.updatedAt,
                })
              })
              
            return items
          }
          
          return buildTree()
        },

        // Get chats in a specific folder
        getChatsInFolder: (folderId: string) => {
          const state = get()
          return Object.values(state.chats).filter(chat => chat.folderId === folderId)
        },

        // Pin/unpin chat
        pinChat: (chatId: string) => {
          set((state) => {
            const chat = state.chats[chatId]
            if (chat) {
              chat.isPinned = !chat.isPinned
              chat.updatedAt = new Date()
            }
          })
          get().buildChatHierarchy()
        },

        // Rename chat
        renameChat: (chatId: string, newName: string) => {
          set((state) => {
            const chat = state.chats[chatId]
            if (chat) {
              chat.title = newName
              chat.updatedAt = new Date()
            }
          })
        },

        // Move chat to folder
        moveChat: (chatId: string, folderId: string | null) => {
          set((state) => {
            const chat = state.chats[chatId]
            if (chat) {
              chat.folderId = folderId || undefined
              chat.updatedAt = new Date()
              
              // Expand the target folder to show the moved chat
              if (folderId && state.folders[folderId]) {
                state.folders[folderId].isExpanded = true
              }
            }
          })
          get().buildChatHierarchy()
        },

        // Pin folder
        pinFolder: (folderId: string) => {
          set((state) => {
            const folder = state.folders[folderId]
            if (folder) {
              folder.isPinned = true
              folder.updatedAt = new Date()
            }
          })
          get().buildChatHierarchy()
        },

        // Unpin folder
        unpinFolder: (folderId: string) => {
          set((state) => {
            const folder = state.folders[folderId]
            if (folder) {
              folder.isPinned = false
              folder.updatedAt = new Date()
            }
          })
          get().buildChatHierarchy()
        },

        // Rename folder
        renameFolder: (folderId: string, newName: string) => {
          set((state) => {
            const folder = state.folders[folderId]
            if (folder) {
              folder.name = newName
              folder.updatedAt = new Date()
            }
          })
          get().buildChatHierarchy()
        },

        // Dialog management
        openCreateFolderDialog: () => {
          set((state) => {
            state.dialogs.showCreateFolderDialog = true
          })
        },

        closeCreateFolderDialog: () => {
          set((state) => {
            state.dialogs.showCreateFolderDialog = false
          })
        },

        openMoveDialog: (chatId: string) => {
          set((state) => {
            const chat = state.chats[chatId]
            if (chat) {
              state.dialogs.showMoveDialog = true
              state.dialogs.targetChatId = chatId
              state.dialogs.editingItem = {
                type: 'chat',
                id: chatId,
                name: chat.title,
              }
            }
          })
        },

        closeMoveDialog: () => {
          set((state) => {
            state.dialogs.showMoveDialog = false
            state.dialogs.targetChatId = undefined
            state.dialogs.selectedFolderId = undefined
          })
        },

        openRenameDialog: (
          type: 'chat' | 'folder',
          id: string,
          currentName: string
        ) => {
          set((state) => {
            state.dialogs.showRenameDialog = true
            state.dialogs.editingItem = {
              type,
              id,
              name: currentName,
            }
          })
        },

        closeRenameDialog: () => {
          set((state) => {
            state.dialogs.showRenameDialog = false
            state.dialogs.editingItem = null
          })
        },

        // Build chat hierarchy
        buildChatHierarchy: () => {
          const state = get()
          const chats = Object.values(state.chats)
          const folders = Object.values(state.folders)

          // Separate pinned chats
          const pinnedChats = chats
            .filter((chat) => chat.isPinned)
            .sort(
              (a, b) =>
                (b.lastMessageAt?.getTime() || 0) -
                (a.lastMessageAt?.getTime() || 0)
            )

          // Separate root chats (no folder)
          const rootChats = chats
            .filter((chat) => !chat.folderId && !chat.isPinned)
            .sort(
              (a, b) =>
                (b.lastMessageAt?.getTime() || 0) -
                (a.lastMessageAt?.getTime() || 0)
            )

          // Build folder nodes
          const folderNodes: FolderNode[] = folders.map((folder) => {
            const folderChats = chats
              .filter((chat) => chat.folderId === folder.id && !chat.isPinned)
              .sort(
                (a, b) =>
                  (b.lastMessageAt?.getTime() || 0) -
                  (a.lastMessageAt?.getTime() || 0)
              )

            // Update folder's chat count
            if (folder.chatCount !== folderChats.length) {
              folder.chatCount = folderChats.length
              folder.updatedAt = new Date()
            }

            return {
              folder,
              chats: folderChats,
              isExpanded: folder.isExpanded ?? true,
            }
          })

          // Sort folders by name
          folderNodes.sort((a, b) => a.folder.name.localeCompare(b.folder.name))

          set((state) => {
            state.chatHierarchy = {
              folders: folderNodes,
              rootChats,
              pinnedChats,
            }
          })
        },

        getChatHierarchy: () => {
          const state = get()
          if (!state.chatHierarchy) {
            get().buildChatHierarchy()
          }
          return state.chatHierarchy
        },

        sendAIMessage: async (chatId: string, messageId: string) => {
          try {
            const state = get()
            const chat = state.chats[chatId]
            const messages = state.messages[chatId] || []

            if (!chat) {
              throw new Error('Chat not found')
            }

            // Import stores dynamically to avoid circular dependencies
            const { useModelStore } = await import('./model-store')
            const { useSettingsStore } = await import('./settings-store')
            const { aiClientAPI } = await import('../api/client')

            const modelState = useModelStore.getState()
            const settingsState = useSettingsStore.getState()

            // Get the selected model and provider
            const selectedModel = modelState.selectedModel
            if (!selectedModel) {
              throw new Error('No model selected')
            }

            const { provider, modelId } = selectedModel

            // Check if API key is available
            if (!settingsState.hasApiKey(provider)) {
              throw new Error(
                `Please configure your ${provider.toUpperCase()} API key in Settings`
              )
            }

            // Get model configuration
            const modelConfig = modelState.getModelConfig(provider, modelId)

            // Get conversation messages (exclude the assistant placeholder)
            const conversationMessages = messages
              .filter((msg) => msg.id !== messageId)
              .map((msg) => ({
                role: msg.role,
                content: msg.content,
              }))

            // Add system prompt if configured
            if (modelConfig.systemPrompt) {
              conversationMessages.unshift({
                role: 'system',
                content: modelConfig.systemPrompt,
              })
            }

            // Start streaming
            get().startStreamingMessage(chatId, messageId)

            // Stream the AI response with model configuration
            await aiClientAPI.streamChatCompletion(
              {
                provider,
                model: modelId,
                messages: conversationMessages,
                stream: true,
                temperature: modelConfig.temperature,
                maxTokens: modelConfig.maxTokens,
                topP: modelConfig.topP,
                topK: modelConfig.topK,
                frequencyPenalty: modelConfig.frequencyPenalty,
                presencePenalty: modelConfig.presencePenalty,
                stopSequences: modelConfig.stopSequences,
              },
              {
                onContent: (content: string, isComplete: boolean) => {
                  get().updateStreamingContent(content)
                },
                onError: (error: string) => {
                  console.error('AI streaming error:', error)

                  set((state) => {
                    const messages = state.messages[chatId]
                    const message = messages?.find((m) => m.id === messageId)
                    if (message) {
                      message.streamingState = 'error'
                      message.error = error
                      message.content = `Sorry, I encountered an error: ${error}`
                    }
                    state.streamingMessage = null
                  })
                },
                onComplete: (fullContent: string) => {
                  set((state) => {
                    const messages = state.messages[chatId]
                    const message = messages?.find((m) => m.id === messageId)
                    if (message) {
                      message.content = fullContent
                      message.streamingState = 'complete'
                      message.updatedAt = new Date()
                    }

                    // Update chat
                    const chat = state.chats[chatId]
                    if (chat) {
                      chat.messageCount++
                      chat.lastMessageAt = new Date()
                      chat.updatedAt = new Date()
                    }
                  })

                  get().finishStreamingMessage()
                },
              }
            )
          } catch (error) {
            console.error('AI message error:', error)

            set((state) => {
              const messages = state.messages[chatId]
              const message = messages?.find((m) => m.id === messageId)
              if (message) {
                message.streamingState = 'error'
                message.error =
                  error instanceof Error ? error.message : 'Unknown error'

                // Provide helpful error messages
                let errorMessage =
                  'Sorry, I encountered an error while processing your request.'
                if (error instanceof Error) {
                  if (error.message.includes('API key')) {
                    errorMessage = `API Key Error: ${error.message}`
                  } else if (
                    error.message.includes('quota') ||
                    error.message.includes('limit')
                  ) {
                    errorMessage = `Rate Limit: ${error.message}`
                  } else if (error.message.includes('model')) {
                    errorMessage = `Model Error: ${error.message}`
                  } else {
                    errorMessage = `Error: ${error.message}`
                  }
                }

                message.content = errorMessage
              }
              state.streamingMessage = null
            })

            throw error
          }
        },

        // Migration function for existing users
        migrateExistingData: (state: any) => {
          console.log('Running migration for existing data...')
          let migrated = false

          // Ensure folders object exists
          if (!state.folders) {
            console.log('Creating empty folders object')
            state.folders = {}
            migrated = true
          }

          // Ensure all chats have required properties
          Object.values(state.chats || {}).forEach((chat: any) => {
            // Ensure folderId is properly set (can be undefined for root chats)
            if (chat.folderId === null) {
              chat.folderId = undefined
              migrated = true
            }

            // Ensure isStarred property exists
            if (chat.isStarred === undefined) {
              chat.isStarred = chat.starred || false
              migrated = true
            }

            // Ensure isPinned property exists
            if (chat.isPinned === undefined) {
              chat.isPinned = false
              migrated = true
            }
          })

          // Ensure all folders have required properties
          Object.values(state.folders || {}).forEach((folder: any) => {
            // Ensure isExpanded property exists (default to true)
            if (folder.isExpanded === undefined) {
              folder.isExpanded = true
              migrated = true
            }

            // Ensure isPinned property exists (default to false)
            if (folder.isPinned === undefined) {
              folder.isPinned = false
              migrated = true
            }

            // Ensure chatCount property exists
            if (folder.chatCount === undefined) {
              // Count chats in this folder
              folder.chatCount = Object.values(state.chats || {}).filter(
                (chat: any) => chat.folderId === folder.id
              ).length
              migrated = true
            }

            // Ensure color property exists (default to blue)
            if (!folder.color) {
              folder.color = 'blue'
              migrated = true
            }
          })

          // Ensure search state exists with proper structure
          if (!state.search) {
            state.search = {
              query: '',
              results: [],
              isSearching: false,
              searchHistory: [],
              filters: {
                chatType: 'all',
                sortBy: 'date',
                sortOrder: 'desc',
              },
              suggestions: [],
            }
            migrated = true
          }

          // Ensure dialogs state exists
          if (!state.dialogs) {
            state.dialogs = {
              showCreateFolderDialog: false,
              showMoveDialog: false,
              showRenameDialog: false,
              editingItem: null,
              targetChatId: undefined,
              selectedFolderId: undefined,
            }
            migrated = true
          }

          if (migrated) {
            console.log('Data migration completed successfully')
          } else {
            console.log('No migration needed - data structure is up to date')
          }
        },
      })),
      {
        name: 'minddeck-chat-store',
        storage: createEnhancedStorage('indexedDB'),
        version: 1,
        partialize: createAutoPartializer([
          'loading',
          'streamingMessage',
          'buildChatHierarchy',
          'getChatHierarchy',
          'createChat',
          'deleteChat',
          'updateChat',
          'duplicateChat',
          'starChat',
          'moveToFolder',
          'sendMessage',
          'editMessage',
          'deleteMessage',
          'regenerateMessage',
          'startStreamingMessage',
          'updateStreamingContent',
          'finishStreamingMessage',
          'cancelStreaming',
          'setActiveChat',
          'setSearchQuery',
          'createFolder',
          'updateFolder',
          'deleteFolder',
          'toggleFolder',
          'pinChat',
          'renameChat',
          'moveChat',
          'openCreateFolderDialog',
          'closeCreateFolderDialog',
          'openMoveDialog',
          'closeMoveDialog',
          'openRenameDialog',
          'closeRenameDialog',
          'getChatHierarchy',
          'deleteMultipleChats',
          'exportChats',
          'importChats',
          'searchChats',
          'getRecentChats',
          'getStarredChats',
          'getChatsByFolder',
          'performSearch',
          'clearSearch',
          'setSearchFilters',
          'getFilteredChats',
          'addToSearchHistory',
          'getSearchSuggestions',
          'selectSearchResult',
          'getChatTitle',
          'getChatMessageCount',
          'getLastMessage',
          'clearAllChats',
          'archiveOldChats',
          'sendAIMessage',
        ]),
        onRehydrateStorage: () => (state) => {
          // Reset transient state after rehydration
          if (state) {
            console.log('Rehydrating chat store state...')
            
            state.loading = {
              sendMessage: false,
              deleteChat: false,
              createChat: false,
            }
            state.streamingMessage = null

            // Migration for existing users - ensure all required properties exist
            // Note: We need to run migration inline since functions aren't available during rehydration
            console.log('Running migration for existing data...')
            let migrated = false

            // Ensure folders object exists
            if (!state.folders) {
              console.log('Creating empty folders object')
              state.folders = {}
              migrated = true
            }

            // Ensure all chats have required properties
            Object.values(state.chats || {}).forEach((chat: any) => {
              // Ensure folderId is properly set (can be undefined for root chats)
              if (chat.folderId === null) {
                chat.folderId = undefined
                migrated = true
              }

              // Ensure isStarred property exists
              if (chat.isStarred === undefined) {
                chat.isStarred = chat.starred || false
                migrated = true
              }

              // Ensure isPinned property exists
              if (chat.isPinned === undefined) {
                chat.isPinned = false
                migrated = true
              }
            })

            // Ensure all folders have required properties
            Object.values(state.folders || {}).forEach((folder: any) => {
              // Ensure isExpanded property exists (default to true)
              if (folder.isExpanded === undefined) {
                folder.isExpanded = true
                migrated = true
              }

              // Ensure isPinned property exists (default to false)
              if (folder.isPinned === undefined) {
                folder.isPinned = false
                migrated = true
              }

              // Ensure chatCount property exists
              if (folder.chatCount === undefined) {
                // Count chats in this folder
                folder.chatCount = Object.values(state.chats || {}).filter(
                  (chat: any) => chat.folderId === folder.id
                ).length
                migrated = true
              }

              // Ensure color property exists (default to blue)
              if (!folder.color) {
                folder.color = 'blue'
                migrated = true
              }
            })

            // Ensure search state exists with proper structure
            if (!state.search) {
              state.search = {
                query: '',
                results: [],
                isSearching: false,
                searchHistory: [],
                filters: {
                  chatType: 'all',
                  sortBy: 'date',
                  sortOrder: 'desc',
                },
                suggestions: [],
              }
              migrated = true
            }

            // Ensure dialogs state exists
            if (!state.dialogs) {
              state.dialogs = {
                showCreateFolderDialog: false,
                showMoveDialog: false,
                showRenameDialog: false,
                editingItem: null,
                targetChatId: undefined,
                selectedFolderId: undefined,
              }
              migrated = true
            }

            if (migrated) {
              console.log('Data migration completed successfully')
            } else {
              console.log('No migration needed - data structure is up to date')
            }

            // Validate rehydrated dates
            try {
              Object.values(state.chats || {}).forEach((chat: any) => {
                if (chat.createdAt && !(chat.createdAt instanceof Date)) {
                  console.warn('Chat createdAt is not a Date object after rehydration:', chat.id, chat.createdAt)
                }
                if (chat.updatedAt && !(chat.updatedAt instanceof Date)) {
                  console.warn('Chat updatedAt is not a Date object after rehydration:', chat.id, chat.updatedAt)
                }
                if (chat.lastMessageAt && !(chat.lastMessageAt instanceof Date)) {
                  console.warn('Chat lastMessageAt is not a Date object after rehydration:', chat.id, chat.lastMessageAt)
                }
              })

              Object.values(state.messages || {}).forEach((chatMessages: any) => {
                if (Array.isArray(chatMessages)) {
                  chatMessages.forEach((message: any) => {
                    if (message.createdAt && !(message.createdAt instanceof Date)) {
                      console.warn('Message createdAt is not a Date object after rehydration:', message.id, message.createdAt)
                    }
                    if (message.updatedAt && !(message.updatedAt instanceof Date)) {
                      console.warn('Message updatedAt is not a Date object after rehydration:', message.id, message.updatedAt)
                    }
                  })
                }
              })

              Object.values(state.folders || {}).forEach((folder: any) => {
                if (folder.createdAt && !(folder.createdAt instanceof Date)) {
                  console.warn('Folder createdAt is not a Date object after rehydration:', folder.id, folder.createdAt)
                }
                if (folder.updatedAt && !(folder.updatedAt instanceof Date)) {
                  console.warn('Folder updatedAt is not a Date object after rehydration:', folder.id, folder.updatedAt)
                }
              })

              console.log('Chat store rehydration completed successfully')
              console.log(`Loaded ${Object.keys(state.chats || {}).length} chats, ${Object.keys(state.folders || {}).length} folders`)
            } catch (error) {
              console.error('Error during chat store rehydration validation:', error)
            }

            // Note: buildChatHierarchy will be called when components mount
            // since functions are not persisted and not available during rehydration
          }
        },
      } as any
    )
  )
)
