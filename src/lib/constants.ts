/**
 * Application constants and configuration values
 */

// Folder color options for chat organization
export interface FolderColor {
  id: string
  name: string
  value: string // Tailwind CSS class
  textColor: string // Text color for contrast
  ring: string // Ring color for selection
}

export const FOLDER_COLORS: FolderColor[] = [
  {
    id: 'blue',
    name: 'Blue',
    value: 'bg-blue-500',
    textColor: 'text-white',
    ring: 'ring-blue-500',
  },
  {
    id: 'green',
    name: 'Green', 
    value: 'bg-green-500',
    textColor: 'text-white',
    ring: 'ring-green-500',
  },
  {
    id: 'purple',
    name: 'Purple',
    value: 'bg-purple-500',
    textColor: 'text-white',
    ring: 'ring-purple-500',
  },
  {
    id: 'red',
    name: 'Red',
    value: 'bg-red-500',
    textColor: 'text-white',
    ring: 'ring-red-500',
  },
  {
    id: 'yellow',
    name: 'Yellow',
    value: 'bg-yellow-500',
    textColor: 'text-black',
    ring: 'ring-yellow-500',
  },
  {
    id: 'orange',
    name: 'Orange',
    value: 'bg-orange-500', 
    textColor: 'text-white',
    ring: 'ring-orange-500',
  },
  {
    id: 'pink',
    name: 'Pink',
    value: 'bg-pink-500',
    textColor: 'text-white',
    ring: 'ring-pink-500',
  },
  {
    id: 'indigo',
    name: 'Indigo',
    value: 'bg-indigo-500',
    textColor: 'text-white',
    ring: 'ring-indigo-500',
  },
  {
    id: 'gray',
    name: 'Gray',
    value: 'bg-gray-500',
    textColor: 'text-white',
    ring: 'ring-gray-500',
  },
]

// Default folder color
export const DEFAULT_FOLDER_COLOR = FOLDER_COLORS[0] // Blue

// Get folder color by id
export function getFolderColorById(colorId: string): FolderColor {
  return FOLDER_COLORS.find(color => color.id === colorId) || DEFAULT_FOLDER_COLOR
}

// Get folder icon color class for display
export function getFolderIconColor(colorId?: string): string {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-500',
    green: 'text-green-500', 
    purple: 'text-purple-500',
    red: 'text-red-500',
    yellow: 'text-yellow-500',
    orange: 'text-orange-500',
    pink: 'text-pink-500',
    indigo: 'text-indigo-500',
    gray: 'text-gray-500',
  }
  
  return colorMap[colorId || ''] || 'text-blue-500'
}

// Application metadata
export const APP_CONFIG = {
  name: 'ZheroHero',
  version: '1.0.0',
  description: 'AI Chat Interface with Multiple Model Support',
  author: 'ZheroHero Team',
  repository: 'https://github.com/zherohero/zherohero_llm',
}

// API Configuration
export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
}

// UI Constants
export const UI_CONFIG = {
  sidebarMinWidth: 240,
  sidebarMaxWidth: 480,
  sidebarDefaultWidth: 320,
  maxChatTitleLength: 50,
  maxMessageLength: 4000,
  searchDebounceDelay: 300,
  toastDefaultDuration: 5000,
}

// Model providers and their display information
export const MODEL_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    icon: '/logos/openai.png',
    color: 'text-green-600',
    website: 'https://openai.com',
  },
  anthropic: {
    name: 'Anthropic',
    icon: '/logos/anthropic.png', 
    color: 'text-orange-600',
    website: 'https://anthropic.com',
  },
  gemini: {
    name: 'Google Gemini',
    icon: '/logos/gemini.jpeg',
    color: 'text-blue-600',
    website: 'https://ai.google.dev',
  },
  xai: {
    name: 'xAI',
    icon: '/logos/xai.png',
    color: 'text-black dark:text-white',
    website: 'https://x.ai',
  },
  deepseek: {
    name: 'DeepSeek',
    icon: '/logos/deepseek.png',
    color: 'text-blue-500',
    website: 'https://deepseek.com',
  },
  openrouter: {
    name: 'OpenRouter',
    icon: '/logos/openrouter.png',
    color: 'text-purple-600',
    website: 'https://openrouter.ai',
  },
}

// Storage keys for localStorage/sessionStorage
export const STORAGE_KEYS = {
  theme: 'minddeck-theme',
  sidebarWidth: 'minddeck-sidebar-width',
  apiKeys: 'minddeck-api-keys',
  userSettings: 'minddeck-user-settings',
}

// Feature flags
export const FEATURES = {
  voiceInput: true,
  fileUpload: true,
  mcpServers: true,
  customModels: true,
  folderOrganization: true,
  chatExport: true,
  searchEnhancements: true,
}