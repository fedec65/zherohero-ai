/**
 * UI Store - Manages UI state, modals, notifications, and interface interactions
 */

import { createWithEqualityFn } from "zustand/traditional";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// UI state interfaces
interface ModalState {
  id: string;
  component: string;
  props?: Record<string, unknown>;
  options?: {
    closable?: boolean;
    overlay?: boolean;
    size?: "small" | "medium" | "large" | "fullscreen";
  };
}

interface NotificationState {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
  timestamp: Date;
}

interface ToastState {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration: number;
  timestamp: Date;
}

interface KeyboardShortcut {
  key: string;
  modifiers: string[];
  action: string;
  description: string;
  scope?: "global" | "chat" | "models" | "mcp";
}

// UI store state interface
interface UIState {
  // Layout state
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  chatSidebarCollapsed: boolean;
  chatSidebarWidth: number;

  // Modal system
  modals: ModalState[];
  modalHistory: string[];

  // Notifications and toasts
  notifications: NotificationState[];
  toasts: ToastState[];

  // Loading states
  loading: Record<string, boolean>;

  // Error states
  errors: Record<string, string | null>;

  // Search and filtering
  searchStates: Record<
    string,
    {
      query: string;
      filters: Record<string, unknown>;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }
  >;

  // UI preferences (not persisted)
  dragStates: Record<
    string,
    {
      isDragging: boolean;
      dragData?: unknown;
    }
  >;

  // Focus management
  focusStates: {
    activeElement: string | null;
    focusHistory: string[];
    trapFocus: boolean;
  };

  // Keyboard shortcuts
  shortcuts: KeyboardShortcut[];
  shortcutsEnabled: boolean;

  // Command palette
  commandPalette: {
    isOpen: boolean;
    query: string;
    selectedIndex: number;
    commands: Array<{
      id: string;
      label: string;
      description?: string;
      icon?: string;
      keywords: string[];
      action: () => void;
      group?: string;
    }>;
  };

  // Context menus
  contextMenus: Record<
    string,
    {
      isOpen: boolean;
      x: number;
      y: number;
      items: Array<{
        id: string;
        label: string;
        icon?: string;
        shortcut?: string;
        disabled?: boolean;
        separator?: boolean;
        action: () => void;
      }>;
    }
  >;

  // Tour and onboarding
  tour: {
    isActive: boolean;
    currentStep: number;
    completedSteps: string[];
    skipped: boolean;
  };
}

// UI store actions interface
interface UIActions {
  // Layout management
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setChatSidebarCollapsed: (collapsed: boolean) => void;
  setChatSidebarWidth: (width: number) => void;
  toggleSidebar: () => void;
  toggleChatSidebar: () => void;

  // Modal system
  openModal: (
    component: string,
    props?: Record<string, unknown>,
    options?: ModalState["options"],
  ) => string;
  closeModal: (modalId?: string) => void;
  closeAllModals: () => void;
  updateModalProps: (modalId: string, props: Record<string, unknown>) => void;
  isModalOpen: (component: string) => boolean;
  getActiveModal: () => ModalState | null;

  // Notifications
  addNotification: (
    notification: Omit<NotificationState, "id" | "timestamp">,
  ) => string;
  removeNotification: (notificationId: string) => void;
  clearNotifications: () => void;
  updateNotification: (
    notificationId: string,
    updates: Partial<NotificationState>,
  ) => void;

  // Toast system
  showToast: (
    message: string,
    type?: ToastState["type"],
    duration?: number,
  ) => string;
  hideToast: (toastId: string) => void;
  clearToasts: () => void;

  // Loading states
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  clearLoading: () => void;

  // Error states
  setError: (key: string, error: string | null) => void;
  getError: (key: string) => string | null;
  clearError: (key: string) => void;
  clearAllErrors: () => void;

  // Search states
  setSearchState: (
    context: string,
    state: UIState["searchStates"][string],
  ) => void;
  updateSearchQuery: (context: string, query: string) => void;
  updateSearchFilters: (
    context: string,
    filters: Record<string, unknown>,
  ) => void;
  clearSearchState: (context: string) => void;

  // Drag and drop
  setDragState: (key: string, state: UIState["dragStates"][string]) => void;
  clearDragState: (key: string) => void;
  isDragging: (key: string) => boolean;

  // Focus management
  setActiveElement: (elementId: string | null) => void;
  focusElement: (elementId: string) => void;
  setTrapFocus: (trap: boolean) => void;
  restoreFocus: () => void;

  // Keyboard shortcuts
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (key: string) => void;
  executeShortcut: (key: string, modifiers: string[]) => boolean;
  setShortcutsEnabled: (enabled: boolean) => void;
  getShortcutsForScope: (
    scope: KeyboardShortcut["scope"],
  ) => KeyboardShortcut[];

  // Command palette
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setCommandQuery: (query: string) => void;
  selectCommand: (index: number) => void;
  executeSelectedCommand: () => void;
  registerCommand: (command: UIState["commandPalette"]["commands"][0]) => void;
  unregisterCommand: (commandId: string) => void;

  // Context menus
  openContextMenu: (
    menuId: string,
    x: number,
    y: number,
    items: UIState["contextMenus"][string]["items"],
  ) => void;
  closeContextMenu: (menuId: string) => void;
  closeAllContextMenus: () => void;

  // Tour and onboarding
  startTour: () => void;
  nextTourStep: () => void;
  previousTourStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  markStepCompleted: (stepId: string) => void;

  // Utility functions
  debounce: <T extends unknown[]>(
    fn: (...args: T) => void,
    delay: number,
  ) => (...args: T) => void;
  throttle: <T extends unknown[]>(
    fn: (...args: T) => void,
    delay: number,
  ) => (...args: T) => void;
  generateId: () => string;
}

type UIStore = UIState & UIActions;

// Default keyboard shortcuts
const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: "k",
    modifiers: ["cmd"],
    action: "open-command-palette",
    description: "Open command palette",
    scope: "global",
  },
  {
    key: "n",
    modifiers: ["cmd"],
    action: "new-chat",
    description: "Create new chat",
    scope: "global",
  },
  {
    key: "b",
    modifiers: ["cmd"],
    action: "toggle-sidebar",
    description: "Toggle sidebar",
    scope: "global",
  },
  {
    key: "f",
    modifiers: ["cmd"],
    action: "search",
    description: "Search chats",
    scope: "chat",
  },
  {
    key: "Escape",
    modifiers: [],
    action: "close-modal",
    description: "Close modal/dialog",
    scope: "global",
  },
];

// Create the UI store
export const useUIStore = createWithEqualityFn<UIStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      sidebarCollapsed: false,
      sidebarWidth: 64,
      chatSidebarCollapsed: false,
      chatSidebarWidth: 320,
      modals: [],
      modalHistory: [],
      notifications: [],
      toasts: [],
      loading: {},
      errors: {},
      searchStates: {},
      dragStates: {},
      focusStates: {
        activeElement: null,
        focusHistory: [],
        trapFocus: false,
      },
      shortcuts: DEFAULT_SHORTCUTS,
      shortcutsEnabled: true,
      commandPalette: {
        isOpen: false,
        query: "",
        selectedIndex: 0,
        commands: [],
      },
      contextMenus: {},
      tour: {
        isActive: false,
        currentStep: 0,
        completedSteps: [],
        skipped: false,
      },

      // Actions

      // Layout management
      setSidebarCollapsed: (collapsed: boolean) => {
        set((state) => {
          state.sidebarCollapsed = collapsed;
        });
      },

      setSidebarWidth: (width: number) => {
        set((state) => {
          state.sidebarWidth = Math.max(200, Math.min(800, width));
        });
      },

      setChatSidebarCollapsed: (collapsed: boolean) => {
        set((state) => {
          state.chatSidebarCollapsed = collapsed;
        });
      },

      setChatSidebarWidth: (width: number) => {
        set((state) => {
          state.chatSidebarWidth = Math.max(200, Math.min(600, width));
        });
      },

      toggleSidebar: () => {
        set((state) => {
          state.sidebarCollapsed = !state.sidebarCollapsed;
        });
      },

      toggleChatSidebar: () => {
        set((state) => {
          state.chatSidebarCollapsed = !state.chatSidebarCollapsed;
        });
      },

      // Modal system
      openModal: (component: string, props = {}, options = {}) => {
        const modalId = get().generateId();

        set((state) => {
          const modal: ModalState = {
            id: modalId,
            component,
            props,
            options: {
              closable: true,
              overlay: true,
              size: "medium",
              ...options,
            },
          };

          state.modals.push(modal);
          state.modalHistory.push(modalId);
        });

        return modalId;
      },

      closeModal: (modalId?: string) => {
        set((state) => {
          if (modalId) {
            state.modals = state.modals.filter((m) => m.id !== modalId);
            state.modalHistory = state.modalHistory.filter(
              (id) => id !== modalId,
            );
          } else {
            // Close the most recent modal
            if (state.modals.length > 0) {
              state.modals.pop();
              state.modalHistory.pop();
            }
          }
        });
      },

      closeAllModals: () => {
        set((state) => {
          state.modals = [];
          state.modalHistory = [];
        });
      },

      updateModalProps: (modalId: string, props: Record<string, unknown>) => {
        set((state) => {
          const modal = state.modals.find((m) => m.id === modalId);
          if (modal) {
            Object.assign(modal.props || {}, props);
          }
        });
      },

      isModalOpen: (component: string) => {
        const state = get();
        return state.modals.some((m) => m.component === component);
      },

      getActiveModal: () => {
        const state = get();
        return state.modals.length > 0
          ? state.modals[state.modals.length - 1]
          : null;
      },

      // Notifications
      addNotification: (notification) => {
        const notificationId = get().generateId();

        set((state) => {
          state.notifications.push({
            ...notification,
            id: notificationId,
            timestamp: new Date(),
          });
        });

        // Auto-remove after duration if specified
        if (notification.duration) {
          setTimeout(() => {
            get().removeNotification(notificationId);
          }, notification.duration);
        }

        return notificationId;
      },

      removeNotification: (notificationId: string) => {
        set((state) => {
          state.notifications = state.notifications.filter(
            (n) => n.id !== notificationId,
          );
        });
      },

      clearNotifications: () => {
        set((state) => {
          state.notifications = [];
        });
      },

      updateNotification: (
        notificationId: string,
        updates: Partial<NotificationState>,
      ) => {
        set((state) => {
          const notification = state.notifications.find(
            (n) => n.id === notificationId,
          );
          if (notification) {
            Object.assign(notification, updates);
          }
        });
      },

      // Toast system
      showToast: (message: string, type = "info" as const, duration = 5000) => {
        const toastId = get().generateId();

        set((state) => {
          state.toasts.push({
            id: toastId,
            type,
            message,
            duration,
            timestamp: new Date(),
          });
        });

        // Auto-remove after duration
        setTimeout(() => {
          get().hideToast(toastId);
        }, duration);

        return toastId;
      },

      hideToast: (toastId: string) => {
        set((state) => {
          state.toasts = state.toasts.filter((t) => t.id !== toastId);
        });
      },

      clearToasts: () => {
        set((state) => {
          state.toasts = [];
        });
      },

      // Loading states
      setLoading: (key: string, loading: boolean) => {
        set((state) => {
          state.loading[key] = loading;
        });
      },

      isLoading: (key: string) => {
        const state = get();
        return state.loading[key] || false;
      },

      clearLoading: () => {
        set((state) => {
          state.loading = {};
        });
      },

      // Error states
      setError: (key: string, error: string | null) => {
        set((state) => {
          state.errors[key] = error;
        });
      },

      getError: (key: string) => {
        const state = get();
        return state.errors[key] || null;
      },

      clearError: (key: string) => {
        set((state) => {
          delete state.errors[key];
        });
      },

      clearAllErrors: () => {
        set((state) => {
          state.errors = {};
        });
      },

      // Search states
      setSearchState: (
        context: string,
        searchState: UIState["searchStates"][string],
      ) => {
        set((state) => {
          state.searchStates[context] = searchState;
        });
      },

      updateSearchQuery: (context: string, query: string) => {
        set((state) => {
          if (!state.searchStates[context]) {
            state.searchStates[context] = { query: "", filters: {} };
          }
          state.searchStates[context].query = query;
        });
      },

      updateSearchFilters: (
        context: string,
        filters: Record<string, unknown>,
      ) => {
        set((state) => {
          if (!state.searchStates[context]) {
            state.searchStates[context] = { query: "", filters: {} };
          }
          Object.assign(state.searchStates[context].filters, filters);
        });
      },

      clearSearchState: (context: string) => {
        set((state) => {
          delete state.searchStates[context];
        });
      },

      // Drag and drop
      setDragState: (key: string, dragState: UIState["dragStates"][string]) => {
        set((state) => {
          state.dragStates[key] = dragState;
        });
      },

      clearDragState: (key: string) => {
        set((state) => {
          delete state.dragStates[key];
        });
      },

      isDragging: (key: string) => {
        const state = get();
        return state.dragStates[key]?.isDragging || false;
      },

      // Focus management
      setActiveElement: (elementId: string | null) => {
        set((state) => {
          if (state.focusStates.activeElement) {
            state.focusStates.focusHistory.push(
              state.focusStates.activeElement,
            );
          }
          state.focusStates.activeElement = elementId;
        });
      },

      focusElement: (elementId: string) => {
        get().setActiveElement(elementId);

        // Actually focus the element if it exists
        const element = document.getElementById(elementId);
        if (element && typeof element.focus === "function") {
          element.focus();
        }
      },

      setTrapFocus: (trap: boolean) => {
        set((state) => {
          state.focusStates.trapFocus = trap;
        });
      },

      restoreFocus: () => {
        set((state) => {
          const lastElement = state.focusStates.focusHistory.pop();
          if (lastElement) {
            state.focusStates.activeElement = lastElement;

            // Actually focus the element
            const element = document.getElementById(lastElement);
            if (element && typeof element.focus === "function") {
              element.focus();
            }
          }
        });
      },

      // Keyboard shortcuts
      registerShortcut: (shortcut: KeyboardShortcut) => {
        set((state) => {
          // Remove existing shortcut with same key combination
          state.shortcuts = state.shortcuts.filter(
            (s) =>
              !(
                s.key === shortcut.key &&
                JSON.stringify(s.modifiers.sort()) ===
                  JSON.stringify(shortcut.modifiers.sort())
              ),
          );

          state.shortcuts.push(shortcut);
        });
      },

      unregisterShortcut: (key: string) => {
        set((state) => {
          state.shortcuts = state.shortcuts.filter((s) => s.key !== key);
        });
      },

      executeShortcut: (key: string, modifiers: string[]) => {
        const state = get();

        if (!state.shortcutsEnabled) return false;

        const shortcut = state.shortcuts.find(
          (s) =>
            s.key.toLowerCase() === key.toLowerCase() &&
            JSON.stringify(s.modifiers.sort()) ===
              JSON.stringify(modifiers.sort()),
        );

        if (shortcut) {
          // Execute the action based on the shortcut
          switch (shortcut.action) {
            case "open-command-palette":
              get().openCommandPalette();
              return true;
            case "toggle-sidebar":
              get().toggleSidebar();
              return true;
            case "close-modal":
              get().closeModal();
              return true;
            default:
              // Custom actions would be handled by other stores
              return false;
          }
        }

        return false;
      },

      setShortcutsEnabled: (enabled: boolean) => {
        set((state) => {
          state.shortcutsEnabled = enabled;
        });
      },

      getShortcutsForScope: (scope: KeyboardShortcut["scope"]) => {
        const state = get();
        return state.shortcuts.filter(
          (s) => s.scope === scope || s.scope === "global",
        );
      },

      // Command palette
      openCommandPalette: () => {
        set((state) => {
          state.commandPalette.isOpen = true;
          state.commandPalette.query = "";
          state.commandPalette.selectedIndex = 0;
        });
      },

      closeCommandPalette: () => {
        set((state) => {
          state.commandPalette.isOpen = false;
          state.commandPalette.query = "";
          state.commandPalette.selectedIndex = 0;
        });
      },

      setCommandQuery: (query: string) => {
        set((state) => {
          state.commandPalette.query = query;
          state.commandPalette.selectedIndex = 0;
        });
      },

      selectCommand: (index: number) => {
        set((state) => {
          const maxIndex = state.commandPalette.commands.length - 1;
          state.commandPalette.selectedIndex = Math.max(
            0,
            Math.min(index, maxIndex),
          );
        });
      },

      executeSelectedCommand: () => {
        const state = get();
        const selectedCommand =
          state.commandPalette.commands[state.commandPalette.selectedIndex];

        if (selectedCommand) {
          selectedCommand.action();
          get().closeCommandPalette();
        }
      },

      registerCommand: (command) => {
        set((state) => {
          // Remove existing command with same id
          state.commandPalette.commands = state.commandPalette.commands.filter(
            (c) => c.id !== command.id,
          );
          state.commandPalette.commands.push(command);
        });
      },

      unregisterCommand: (commandId: string) => {
        set((state) => {
          state.commandPalette.commands = state.commandPalette.commands.filter(
            (c) => c.id !== commandId,
          );
        });
      },

      // Context menus
      openContextMenu: (menuId: string, x: number, y: number, items) => {
        set((state) => {
          // Close other context menus
          Object.keys(state.contextMenus).forEach((id) => {
            if (id !== menuId) {
              state.contextMenus[id].isOpen = false;
            }
          });

          state.contextMenus[menuId] = {
            isOpen: true,
            x,
            y,
            items,
          };
        });
      },

      closeContextMenu: (menuId: string) => {
        set((state) => {
          if (state.contextMenus[menuId]) {
            state.contextMenus[menuId].isOpen = false;
          }
        });
      },

      closeAllContextMenus: () => {
        set((state) => {
          Object.keys(state.contextMenus).forEach((menuId) => {
            state.contextMenus[menuId].isOpen = false;
          });
        });
      },

      // Tour and onboarding
      startTour: () => {
        set((state) => {
          state.tour.isActive = true;
          state.tour.currentStep = 0;
          state.tour.skipped = false;
        });
      },

      nextTourStep: () => {
        set((state) => {
          state.tour.currentStep++;
        });
      },

      previousTourStep: () => {
        set((state) => {
          state.tour.currentStep = Math.max(0, state.tour.currentStep - 1);
        });
      },

      skipTour: () => {
        set((state) => {
          state.tour.isActive = false;
          state.tour.skipped = true;
        });
      },

      completeTour: () => {
        set((state) => {
          state.tour.isActive = false;
        });
      },

      markStepCompleted: (stepId: string) => {
        set((state) => {
          if (!state.tour.completedSteps.includes(stepId)) {
            state.tour.completedSteps.push(stepId);
          }
        });
      },

      // Utility functions
      debounce: <T extends unknown[]>(
        fn: (...args: T) => void,
        delay: number,
      ) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: T) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => fn(...args), delay);
        };
      },

      throttle: <T extends unknown[]>(
        fn: (...args: T) => void,
        delay: number,
      ) => {
        let lastCall = 0;
        return (...args: T) => {
          const now = Date.now();
          if (now - lastCall >= delay) {
            lastCall = now;
            fn(...args);
          }
        };
      },

      generateId: () => {
        return (
          Math.random().toString(36).substring(2) + Date.now().toString(36)
        );
      },
    })),
  ),
);
