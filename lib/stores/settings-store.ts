/**
 * Settings Store - Manages user preferences, theme, and application settings
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { UserSettings, AIProvider } from './types';
import { createStorage, createPartializer, PersistOptions } from './middleware/persistence';

// Default settings
const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  sidebarWidth: 320,
  fontSize: 'medium',
  sendOnEnter: true,
  showTokenCount: false,
  autoSave: true,
  apiKeys: {},
  privacy: {
    shareChats: false,
    telemetry: true,
    crashReporting: true,
  },
};

// Settings store state interface
interface SettingsState {
  settings: UserSettings;
  
  // Computed values
  effectiveTheme: 'light' | 'dark';
  
  // Temporary state (not persisted)
  unsavedChanges: boolean;
  importingSettings: boolean;
  exportingSettings: boolean;
}

// Settings store actions interface
interface SettingsActions {
  // Theme management
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  getEffectiveTheme: () => 'light' | 'dark';
  
  // UI preferences
  setSidebarWidth: (width: number) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setSendOnEnter: (enabled: boolean) => void;
  setShowTokenCount: (show: boolean) => void;
  setAutoSave: (enabled: boolean) => void;
  
  // API Keys management
  setApiKey: (provider: AIProvider, key: string) => void;
  removeApiKey: (provider: AIProvider) => void;
  getApiKey: (provider: AIProvider) => string | undefined;
  hasApiKey: (provider: AIProvider) => boolean;
  validateApiKey: (provider: AIProvider, key: string) => Promise<boolean>;
  testApiConnection: (provider: AIProvider) => Promise<boolean>;
  
  // Privacy settings
  setPrivacySetting: (setting: keyof UserSettings['privacy'], value: boolean) => void;
  updatePrivacySettings: (privacy: Partial<UserSettings['privacy']>) => void;
  
  // Bulk operations
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetSettings: () => void;
  resetToDefaults: () => void;
  
  // Import/Export
  exportSettings: () => Promise<Blob>;
  importSettings: (file: File) => Promise<void>;
  getSettingsAsJson: () => string;
  loadSettingsFromJson: (json: string) => void;
  
  // Validation
  validateSettings: (settings: Partial<UserSettings>) => { isValid: boolean; errors: string[] };
  
  // Keyboard shortcuts
  getKeyboardShortcuts: () => Record<string, string>;
  updateKeyboardShortcut: (action: string, shortcut: string) => void;
  
  // Advanced settings
  getDeveloperSettings: () => Record<string, unknown>;
  setDeveloperSetting: (key: string, value: unknown) => void;
  
  // Settings synchronization (for multi-device)
  syncSettings: () => Promise<void>;
  enableSettingsSync: (enabled: boolean) => void;
}

type SettingsStore = SettingsState & SettingsActions;

// Helper function to detect system theme
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : 'light';
}

// Create the settings store
export const useSettingsStore = create<SettingsStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // Initial state
        settings: DEFAULT_SETTINGS,
        effectiveTheme: 'light',
        unsavedChanges: false,
        importingSettings: false,
        exportingSettings: false,

        // Theme management
        setTheme: (theme: 'light' | 'dark' | 'system') => {
          set((state) => {
            state.settings.theme = theme;
            state.effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
            state.unsavedChanges = true;
          });

          // Apply theme to document
          const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
          document.documentElement.setAttribute('data-theme', effectiveTheme);
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(effectiveTheme);
        },

        toggleTheme: () => {
          const currentTheme = get().effectiveTheme;
          const newTheme = currentTheme === 'light' ? 'dark' : 'light';
          get().setTheme(newTheme);
        },

        getEffectiveTheme: () => {
          const { theme } = get().settings;
          return theme === 'system' ? getSystemTheme() : theme;
        },

        // UI preferences
        setSidebarWidth: (width: number) => {
          set((state) => {
            state.settings.sidebarWidth = Math.max(200, Math.min(600, width));
            state.unsavedChanges = true;
          });
        },

        setFontSize: (size: 'small' | 'medium' | 'large') => {
          set((state) => {
            state.settings.fontSize = size;
            state.unsavedChanges = true;
          });

          // Apply font size to document
          const sizeMap = {
            small: '14px',
            medium: '16px',
            large: '18px',
          };
          document.documentElement.style.setProperty('--base-font-size', sizeMap[size]);
        },

        setSendOnEnter: (enabled: boolean) => {
          set((state) => {
            state.settings.sendOnEnter = enabled;
            state.unsavedChanges = true;
          });
        },

        setShowTokenCount: (show: boolean) => {
          set((state) => {
            state.settings.showTokenCount = show;
            state.unsavedChanges = true;
          });
        },

        setAutoSave: (enabled: boolean) => {
          set((state) => {
            state.settings.autoSave = enabled;
            state.unsavedChanges = true;
          });
        },

        // API Keys management
        setApiKey: (provider: AIProvider, key: string) => {
          set((state) => {
            if (!state.settings.apiKeys) {
              state.settings.apiKeys = {};
            }
            state.settings.apiKeys[provider] = key.trim();
            state.unsavedChanges = true;
          });
        },

        removeApiKey: (provider: AIProvider) => {
          set((state) => {
            if (state.settings.apiKeys) {
              delete state.settings.apiKeys[provider];
              state.unsavedChanges = true;
            }
          });
        },

        getApiKey: (provider: AIProvider) => {
          const { apiKeys } = get().settings;
          return apiKeys?.[provider];
        },

        hasApiKey: (provider: AIProvider) => {
          const apiKey = get().getApiKey(provider);
          return !!apiKey && apiKey.trim().length > 0;
        },

        validateApiKey: async (provider: AIProvider, key: string) => {
          // Basic validation patterns for different providers
          const patterns: Record<AIProvider, RegExp> = {
            openai: /^sk-[a-zA-Z0-9]{48,}$/,
            anthropic: /^sk-ant-[a-zA-Z0-9\-_]{95,}$/,
            gemini: /^AIza[0-9A-Za-z\-_]{35}$/,
            xai: /^xai-[a-zA-Z0-9\-_]+$/,
            deepseek: /^sk-[a-zA-Z0-9]{32,}$/,
            custom: /.+/, // Allow any non-empty string for custom models
          };

          const pattern = patterns[provider];
          if (!pattern) return false;

          return pattern.test(key.trim());
        },

        testApiConnection: async (provider: AIProvider) => {
          const apiKey = get().getApiKey(provider);
          if (!apiKey) return false;

          try {
            // TODO: Implement actual API connection testing
            // This would make a minimal API call to verify the key works
            
            // Simulate API test
            await new Promise(resolve => setTimeout(resolve, 1000));
            return Math.random() > 0.2; // 80% success rate for demo
          } catch (error) {
            console.error(`API test failed for ${provider}:`, error);
            return false;
          }
        },

        // Privacy settings
        setPrivacySetting: (setting: keyof UserSettings['privacy'], value: boolean) => {
          set((state) => {
            state.settings.privacy[setting] = value;
            state.unsavedChanges = true;
          });
        },

        updatePrivacySettings: (privacy: Partial<UserSettings['privacy']>) => {
          set((state) => {
            Object.assign(state.settings.privacy, privacy);
            state.unsavedChanges = true;
          });
        },

        // Bulk operations
        updateSettings: (updates: Partial<UserSettings>) => {
          set((state) => {
            Object.assign(state.settings, updates);
            state.unsavedChanges = true;
          });

          // Apply theme changes if updated
          if (updates.theme) {
            get().setTheme(updates.theme);
          }

          // Apply font size changes if updated
          if (updates.fontSize) {
            get().setFontSize(updates.fontSize);
          }
        },

        resetSettings: () => {
          set((state) => {
            state.settings = { ...DEFAULT_SETTINGS };
            state.unsavedChanges = true;
            state.effectiveTheme = getSystemTheme();
          });

          // Reapply theme and font settings
          get().setTheme(DEFAULT_SETTINGS.theme);
          get().setFontSize(DEFAULT_SETTINGS.fontSize);
        },

        resetToDefaults: () => {
          get().resetSettings();
        },

        // Import/Export
        exportSettings: async () => {
          set((state) => {
            state.exportingSettings = true;
          });

          try {
            const settings = get().settings;
            
            // Remove sensitive data for export
            const exportData = {
              ...settings,
              apiKeys: {}, // Don't export API keys for security
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
              type: 'application/json',
            });

            set((state) => {
              state.exportingSettings = false;
            });

            return blob;
          } catch (error) {
            set((state) => {
              state.exportingSettings = false;
            });
            throw error;
          }
        },

        importSettings: async (file: File) => {
          set((state) => {
            state.importingSettings = true;
          });

          try {
            const text = await file.text();
            const importedSettings = JSON.parse(text) as Partial<UserSettings>;
            
            // Validate imported settings
            const validation = get().validateSettings(importedSettings);
            if (!validation.isValid) {
              throw new Error(`Invalid settings: ${validation.errors.join(', ')}`);
            }

            // Merge with current settings, preserving API keys
            const currentApiKeys = get().settings.apiKeys;
            get().updateSettings({
              ...importedSettings,
              apiKeys: currentApiKeys, // Keep existing API keys
            });

            set((state) => {
              state.importingSettings = false;
              state.unsavedChanges = false;
            });
          } catch (error) {
            set((state) => {
              state.importingSettings = false;
            });
            throw error;
          }
        },

        getSettingsAsJson: () => {
          const settings = get().settings;
          return JSON.stringify(settings, null, 2);
        },

        loadSettingsFromJson: (json: string) => {
          try {
            const settings = JSON.parse(json) as Partial<UserSettings>;
            const validation = get().validateSettings(settings);
            
            if (!validation.isValid) {
              throw new Error(`Invalid settings: ${validation.errors.join(', ')}`);
            }

            get().updateSettings(settings);
          } catch (error) {
            throw new Error(`Failed to load settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        },

        // Validation
        validateSettings: (settings: Partial<UserSettings>) => {
          const errors: string[] = [];

          if (settings.theme && !['light', 'dark', 'system'].includes(settings.theme)) {
            errors.push('Invalid theme value');
          }

          if (settings.sidebarWidth && (settings.sidebarWidth < 200 || settings.sidebarWidth > 600)) {
            errors.push('Sidebar width must be between 200 and 600 pixels');
          }

          if (settings.fontSize && !['small', 'medium', 'large'].includes(settings.fontSize)) {
            errors.push('Invalid font size value');
          }

          if (settings.apiKeys) {
            Object.entries(settings.apiKeys).forEach(([provider, key]) => {
              if (key && typeof key !== 'string') {
                errors.push(`Invalid API key format for ${provider}`);
              }
            });
          }

          return {
            isValid: errors.length === 0,
            errors,
          };
        },

        // Keyboard shortcuts
        getKeyboardShortcuts: () => {
          // Default keyboard shortcuts
          return {
            'new-chat': 'Cmd+N',
            'search': 'Cmd+K',
            'toggle-theme': 'Cmd+Shift+T',
            'toggle-sidebar': 'Cmd+B',
            'send-message': 'Enter',
            'new-line': 'Shift+Enter',
            'clear-chat': 'Cmd+Shift+C',
          };
        },

        updateKeyboardShortcut: (action: string, shortcut: string) => {
          // TODO: Implement keyboard shortcut customization
          console.log(`Updated shortcut for ${action}: ${shortcut}`);
        },

        // Advanced settings
        getDeveloperSettings: () => {
          return {
            debugMode: false,
            verboseLogging: false,
            enableExperimentalFeatures: false,
            maxConcurrentRequests: 3,
            requestTimeout: 30000,
          };
        },

        setDeveloperSetting: (key: string, value: unknown) => {
          // TODO: Implement developer settings storage
          console.log(`Set developer setting ${key}:`, value);
        },

        // Settings synchronization
        syncSettings: async () => {
          // TODO: Implement cloud settings synchronization
          console.log('Syncing settings...');
        },

        enableSettingsSync: (enabled: boolean) => {
          // TODO: Implement settings sync toggle
          console.log(`Settings sync ${enabled ? 'enabled' : 'disabled'}`);
        },
      })),
      {
        name: 'minddeck-settings-store',
        storage: createStorage('localStorage'),
        version: 1,
        partialize: createPartializer(['unsavedChanges', 'importingSettings', 'exportingSettings']),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Apply theme and font size after rehydration
            const effectiveTheme = state.getEffectiveTheme();
            state.effectiveTheme = effectiveTheme;
            
            // Apply to DOM
            document.documentElement.setAttribute('data-theme', effectiveTheme);
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(effectiveTheme);
            
            const sizeMap = {
              small: '14px',
              medium: '16px',
              large: '18px',
            };
            document.documentElement.style.setProperty(
              '--base-font-size', 
              sizeMap[state.settings.fontSize]
            );
            
            // Listen for system theme changes
            if (typeof window !== 'undefined') {
              const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
              const handleThemeChange = () => {
                if (state.settings.theme === 'system') {
                  const newTheme = getSystemTheme();
                  state.effectiveTheme = newTheme;
                  document.documentElement.setAttribute('data-theme', newTheme);
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(newTheme);
                }
              };
              
              mediaQuery.addEventListener('change', handleThemeChange);
            }
          }
        },
      } as any
    )
  )
);