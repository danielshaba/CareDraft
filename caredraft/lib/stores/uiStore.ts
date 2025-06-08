import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { 
  UIStore, 
  NotificationItem, 
  ModalState, 
  UserPreferences,
  NotificationType
} from '@/lib/types/store.types'

// Default user preferences
const defaultPreferences: UserPreferences = {
  theme: 'system',
  sidebarCollapsed: false,
  autoSave: true,
  autoSaveInterval: 5, // minutes
  notificationSettings: {
    desktop: true,
    email: true,
    inApp: true,
    sound: false
  },
  editorPreferences: {
    fontSize: 14,
    fontFamily: 'Inter',
    lineHeight: 1.5,
    showLineNumbers: true,
    wordWrap: true
  },
  dashboardLayout: {
    proposalsPerPage: 12,
    defaultView: 'grid',
    sortBy: 'updated',
    sortOrder: 'desc'
  }
}

// Initial state
const initialState = {
  // Layout state
  sidebarCollapsed: false,
  rightPanelOpen: false,
  activePanel: null,
  
  // Modal management
  modals: {},
  activeModal: null,
  
  // Notifications
  notifications: [],
  unreadCount: 0,
  
  // Loading states
  globalLoading: false,
  loadingStates: {},
  
  // User preferences
  preferences: defaultPreferences,
  
  // Navigation
  currentPath: '/',
  breadcrumbs: [],
  
  // Search state
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  
  // Error states
  errors: {},
  
  // Connection status
  isOnline: navigator?.onLine ?? true,
  isConnected: true,
  lastConnectionCheck: null,
}

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9)

const isClient = typeof window !== 'undefined'

// Notification auto-hide timeout
const notificationTimeouts = new Map<string, NodeJS.Timeout>()

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          // ==================== LAYOUT ACTIONS ====================
          
          toggleSidebar: () => {
            set((state) => {
              state.sidebarCollapsed = !state.sidebarCollapsed
              state.preferences.sidebarCollapsed = state.sidebarCollapsed
            })
          },

          setSidebarCollapsed: (collapsed: boolean) => {
            set((state) => {
              state.sidebarCollapsed = collapsed
              state.preferences.sidebarCollapsed = collapsed
            })
          },

          toggleRightPanel: () => {
            set((state) => {
              state.rightPanelOpen = !state.rightPanelOpen
            })
          },

          setActivePanel: (panel: string | null) => {
            set((state) => {
              state.activePanel = panel as any
              if (panel) {
                state.rightPanelOpen = true
              }
            })
          },

          // ==================== MODAL MANAGEMENT ====================
          
          openModal: (modalId: string, component?: string, props?: Record<string, unknown>) => {
            set((state) => {
              state.modals[modalId] = {
                isOpen: true,
                component,
                props: props || {},
                size: 'md',
                closable: true
              }
              state.activeModal = modalId
            })
          },

          closeModal: (modalId?: string) => {
            set((state) => {
              const targetModalId = modalId || state.activeModal
              if (targetModalId && state.modals[targetModalId]) {
                state.modals[targetModalId].isOpen = false
                if (state.activeModal === targetModalId) {
                  state.activeModal = null
                }
              }
            })
          },

          closeAllModals: () => {
            set((state) => {
              Object.keys(state.modals).forEach(modalId => {
                state.modals[modalId].isOpen = false
              })
              state.activeModal = null
            })
          },

          // ==================== NOTIFICATION MANAGEMENT ====================
          
          addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => {
            const id = generateId()
            const newNotification: NotificationItem = {
              ...notification,
              id,
              timestamp: new Date(),
              autoHide: notification.priority <= 2, // Auto-hide low priority notifications
              hideAfter: notification.priority <= 2 ? 5000 : undefined,
              isRead: false
            }

            set((state) => {
              state.notifications.unshift(newNotification)
              if (!newNotification.isRead) {
                state.unreadCount += 1
              }
            })

            // Set up auto-hide if configured
            if (newNotification.autoHide && newNotification.hideAfter) {
              const timeout = setTimeout(() => {
                get().removeNotification(id)
              }, newNotification.hideAfter)
              notificationTimeouts.set(id, timeout)
            }

            // Request desktop notification permission if enabled
            if (get().preferences.notificationSettings.desktop && isClient) {
              if (Notification.permission === 'granted') {
                new Notification(newNotification.title, {
                  body: newNotification.message,
                  icon: '/favicon.ico'
                })
              } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                  if (permission === 'granted') {
                    new Notification(newNotification.title, {
                      body: newNotification.message,
                      icon: '/favicon.ico'
                    })
                  }
                })
              }
            }

            return id
          },

          removeNotification: (notificationId: string) => {
            set((state) => {
              const index = state.notifications.findIndex(n => n.id === notificationId)
              if (index > -1) {
                const notification = state.notifications[index]
                if (!notification.isRead) {
                  state.unreadCount = Math.max(0, state.unreadCount - 1)
                }
                state.notifications.splice(index, 1)
              }
            })

            // Clear timeout if exists
            const timeout = notificationTimeouts.get(notificationId)
            if (timeout) {
              clearTimeout(timeout)
              notificationTimeouts.delete(notificationId)
            }
          },

          markNotificationRead: (notificationId: string) => {
            set((state) => {
              const notification = state.notifications.find(n => n.id === notificationId)
              if (notification && !notification.isRead) {
                notification.isRead = true
                state.unreadCount = Math.max(0, state.unreadCount - 1)
              }
            })
          },

          markAllNotificationsRead: () => {
            set((state) => {
              state.notifications.forEach(notification => {
                notification.isRead = true
              })
              state.unreadCount = 0
            })
          },

          clearNotifications: () => {
            set((state) => {
              state.notifications = []
              state.unreadCount = 0
            })

            // Clear all timeouts
            notificationTimeouts.forEach(timeout => clearTimeout(timeout))
            notificationTimeouts.clear()
          },

          // ==================== PREFERENCES ====================
          
          updatePreferences: (updates: Partial<UserPreferences>) => {
            set((state) => {
              state.preferences = { ...state.preferences, ...updates }
            })
          },

          loadPreferences: () => {
            if (!isClient) return

            try {
              const stored = localStorage.getItem('ui-preferences')
              if (stored) {
                const preferences = JSON.parse(stored)
                set((state) => {
                  state.preferences = { ...defaultPreferences, ...preferences }
                  state.sidebarCollapsed = state.preferences.sidebarCollapsed
                })
              }
            } catch {
              console.warn('Failed to load preferences from localStorage:', error)
            }
          },

          savePreferences: () => {
            if (!isClient) return

            try {
              const { preferences } = get()
              localStorage.setItem('ui-preferences', JSON.stringify(preferences))
            } catch {
              console.warn('Failed to save preferences to localStorage:', error)
            }
          },

          resetPreferences: () => {
            set((state) => {
              state.preferences = { ...defaultPreferences }
              state.sidebarCollapsed = defaultPreferences.sidebarCollapsed
            })

            if (isClient) {
              try {
                localStorage.removeItem('ui-preferences')
              } catch {
                console.warn('Failed to clear preferences from localStorage:', error)
              }
            }
          },

          // ==================== LOADING STATES ====================
          
          setGlobalLoading: (loading: boolean) => {
            set((state) => {
              state.globalLoading = loading
            })
          },

          setLoadingState: (key: string, loading: boolean) => {
            set((state) => {
              if (loading) {
                state.loadingStates[key] = true
              } else {
                delete state.loadingStates[key]
              }
            })
          },

          clearLoadingState: (key: string) => {
            set((state) => {
              delete state.loadingStates[key]
            })
          },

          // ==================== NAVIGATION ====================
          
          setCurrentPath: (path: string) => {
            set((state) => {
              state.currentPath = path
            })
          },

          setBreadcrumbs: (breadcrumbs: { label: string; href?: string }[]) => {
            set((state) => {
              state.breadcrumbs = breadcrumbs
            })
          },

          // ==================== SEARCH ====================
          
          setSearchQuery: (query: string) => {
            set((state) => {
              state.searchQuery = query
            })
          },

          setSearchResults: (results: unknown[]) => {
            set((state) => {
              state.searchResults = results
            })
          },

          setIsSearching: (searching: boolean) => {
            set((state) => {
              state.isSearching = searching
            })
          },

          clearSearch: () => {
            set((state) => {
              state.searchQuery = ''
              state.searchResults = []
              state.isSearching = false
            })
          },

          // ==================== ERROR MANAGEMENT ====================
          
          setError: (key: string, error: string) => {
            set((state) => {
              state.errors[key] = error
            })
          },

          clearError: (key: string) => {
            set((state) => {
              delete state.errors[key]
            })
          },

          clearAllErrors: () => {
            set((state) => {
              state.errors = {}
            })
          },

          // ==================== CONNECTION STATUS ====================
          
          setOnlineStatus: (online: boolean) => {
            set((state) => {
              state.isOnline = online
            })
          },

          setConnectionStatus: (connected: boolean) => {
            set((state) => {
              state.isConnected = connected
            })
          },

          checkConnection: () => {
            if (!isClient) return

            const startTime = Date.now()
            
            fetch('/api/health', { 
              method: 'HEAD',
              cache: 'no-cache'
            })
              .then(() => {
                const latency = Date.now() - startTime
                set((state) => {
                  state.isConnected = true
                  state.lastConnectionCheck = new Date()
                })
              })
              .catch(() => {
                set((state) => {
                  state.isConnected = false
                  state.lastConnectionCheck = new Date()
                })
              })
          },

          // ==================== STATE MANAGEMENT ====================
          
          reset: () => {
            set(() => ({ ...initialState }))
            
            // Clear notification timeouts
            notificationTimeouts.forEach(timeout => clearTimeout(timeout))
            notificationTimeouts.clear()
          }
        }))
      ),
      {
        name: 'ui-store',
        partialize: (state) => ({
          // Only persist certain state
          preferences: state.preferences,
          sidebarCollapsed: state.sidebarCollapsed,
          rightPanelOpen: state.rightPanelOpen,
          currentPath: state.currentPath
        }),
        version: 1
      }
    ),
    {
      name: 'UIStore',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
)

// Set up online/offline listeners
if (isClient) {
  window.addEventListener('online', () => {
    useUIStore.getState().setOnlineStatus(true)
    useUIStore.getState().checkConnection()
  })

  window.addEventListener('offline', () => {
    useUIStore.getState().setOnlineStatus(false)
    useUIStore.getState().setConnectionStatus(false)
  })

  // Check connection periodically
  setInterval(() => {
    useUIStore.getState().checkConnection()
  }, 30000) // Every 30 seconds
}

// Subscribe to preference changes to save them
if (isClient) {
  useUIStore.subscribe(
    (state) => state.preferences,
    (preferences) => {
      try {
        localStorage.setItem('ui-preferences', JSON.stringify(preferences))
      } catch {
        console.warn('Failed to save preferences:', error)
      }
    },
    { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
  )
}

// Load preferences on initialization
if (isClient) {
  useUIStore.getState().loadPreferences()
} 