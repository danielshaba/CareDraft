import { Database } from '@/lib/database.types'
import { Session } from '@supabase/supabase-js'
import { RealtimeChannel } from '@supabase/supabase-js'

// Base types from database
export type DbUser = Database['public']['Tables']['users']['Row']
export type DbProposal = Database['public']['Tables']['proposals']['Row']
export type DbSection = Database['public']['Tables']['sections']['Row']
export type NotificationType = Database['public']['Enums']['notification_type']
export type ProposalStatus = Database['public']['Enums']['proposal_status']
export type UserRole = Database['public']['Enums']['user_role']

// ==================== AUTH STORE TYPES ====================

export interface AuthUser extends DbUser {
  session?: Session
  permissions?: UserPermissions
}

export interface UserPermissions {
  canCreateProposals: boolean
  canEditProposals: boolean
  canDeleteProposals: boolean
  canManageUsers: boolean
  canManageOrganization: boolean
  canApproveProposals: boolean
  canViewAnalytics: boolean
  canManageSettings: boolean
}

export interface AuthState {
  // User data
  user: AuthUser | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Auth status
  isSigningIn: boolean
  isSigningOut: boolean
  isSigningUp: boolean
  
  // Error handling
  error: string | null
  lastError: Date | null
  
  // Session management
  sessionExpiresAt: Date | null
  refreshAttempts: number
  maxRefreshAttempts: number
}

export interface AuthActions {
  // Auth operations
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, userData?: Partial<DbUser>) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  
  // Session management
  refreshSession: () => Promise<boolean>
  validateSession: () => Promise<boolean>
  setSession: (session: Session | null) => void
  
  // User management
  updateUser: (updates: Partial<DbUser>) => Promise<boolean>
  updatePermissions: (permissions: UserPermissions) => void
  
  // State management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  reset: () => void
}

export interface AuthStore extends AuthState, AuthActions {}

// ==================== PROPOSAL STORE TYPES ====================

export interface ProposalSection extends DbSection {
  isExpanded?: boolean
  isEditing?: boolean
  hasUnsavedChanges?: boolean
  lastSaved?: Date
}

export interface ActiveProposal extends DbProposal {
  sections: ProposalSection[]
  collaborators?: AuthUser[]
  isOwner?: boolean
  canEdit?: boolean
  lastModified?: Date
  isDirty?: boolean
}

export interface ProposalState {
  // Active proposal
  activeProposal: ActiveProposal | null
  isLoading: boolean
  isSaving: boolean
  
  // Sections management
  sections: ProposalSection[]
  activeSectionId: string | null
  expandedSections: Set<string>
  
  // Editing state
  isEditing: boolean
  hasUnsavedChanges: boolean
  lastSaved: Date | null
  autoSaveTimer: NodeJS.Timeout | null
  
  // Collaboration
  collaborators: AuthUser[]
  activeUsers: { userId: string; lastSeen: Date; currentSection?: string }[]
  
  // History and versions
  lastSnapshot: ActiveProposal | null
  operationQueue: ProposalOperation[]
  
  // Error handling
  error: string | null
  savingError: string | null
}

export interface ProposalOperation {
  id: string
  type: 'create' | 'update' | 'delete' | 'reorder'
  timestamp: Date
  payload: unknown
  isOptimistic: boolean
  rollback?: () => void
}

export interface ProposalActions {
  // Proposal management
  loadProposal: (proposalId: string) => Promise<boolean>
  createProposal: (proposal: Partial<DbProposal>) => Promise<string | null>
  updateProposal: (updates: Partial<DbProposal>) => Promise<boolean>
  saveProposal: () => Promise<boolean>
  deleteProposal: (proposalId: string) => Promise<boolean>
  
  // Section management
  addSection: (section: Partial<DbSection>) => Promise<string | null>
  updateSection: (sectionId: string, updates: Partial<DbSection>) => Promise<boolean>
  deleteSection: (sectionId: string) => Promise<boolean>
  reorderSections: (sectionIds: string[]) => Promise<boolean>
  
  // Section state
  setActiveSection: (sectionId: string | null) => void
  toggleSectionExpanded: (sectionId: string) => void
  setEditingSection: (sectionId: string, editing: boolean) => void
  
  // Auto-save and change tracking
  markDirty: () => void
  markClean: () => void
  enableAutoSave: () => void
  disableAutoSave: () => void
  
  // Optimistic updates
  addOptimisticOperation: (operation: ProposalOperation) => void
  rollbackOperation: (operationId: string) => void
  
  // State management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  reset: () => void
}

export interface ProposalStore extends ProposalState, ProposalActions {}

// ==================== UI STORE TYPES ====================

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  priority: 1 | 2 | 3 | 4 | 5
  timestamp: Date
  isRead: boolean
  autoHide?: boolean
  hideAfter?: number // milliseconds
  actionUrl?: string
  actionText?: string
}

export interface ModalState {
  isOpen: boolean
  component?: string
  props?: Record<string, unknown>
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  autoSave: boolean
  autoSaveInterval: number // minutes
  notificationSettings: {
    desktop: boolean
    email: boolean
    inApp: boolean
    sound: boolean
  }
  editorPreferences: {
    fontSize: number
    fontFamily: string
    lineHeight: number
    showLineNumbers: boolean
    wordWrap: boolean
  }
  dashboardLayout: {
    proposalsPerPage: number
    defaultView: 'grid' | 'list'
    sortBy: 'updated' | 'created' | 'title' | 'status'
    sortOrder: 'asc' | 'desc'
  }
}

export interface UIState {
  // Layout state
  sidebarCollapsed: boolean
  rightPanelOpen: boolean
  activePanel: 'proposals' | 'notifications' | 'settings' | null
  
  // Modal management
  modals: Record<string, ModalState>
  activeModal: string | null
  
  // Notifications
  notifications: NotificationItem[]
  unreadCount: number
  
  // Loading states
  globalLoading: boolean
  loadingStates: Record<string, boolean>
  
  // User preferences
  preferences: UserPreferences
  
  // Navigation
  currentPath: string
  breadcrumbs: { label: string; href?: string }[]
  
  // Search state
  searchQuery: string
  searchResults: unknown[]
  isSearching: boolean
  
  // Error states
  errors: Record<string, string>
  
  // Connection status
  isOnline: boolean
  isConnected: boolean
  lastConnectionCheck: Date | null
}

export interface UIActions {
  // Layout actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleRightPanel: () => void
  setActivePanel: (panel: string | null) => void
  
  // Modal management
  openModal: (modalId: string, component?: string, props?: Record<string, unknown>) => void
  closeModal: (modalId?: string) => void
  closeAllModals: () => void
  
  // Notification management
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => string
  removeNotification: (notificationId: string) => void
  markNotificationRead: (notificationId: string) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void
  
  // Preferences
  updatePreferences: (preferences: Partial<UserPreferences>) => void
  loadPreferences: () => void
  savePreferences: () => void
  resetPreferences: () => void
  
  // Loading states
  setGlobalLoading: (loading: boolean) => void
  setLoadingState: (key: string, loading: boolean) => void
  clearLoadingState: (key: string) => void
  
  // Navigation
  setCurrentPath: (path: string) => void
  setBreadcrumbs: (breadcrumbs: { label: string; href?: string }[]) => void
  
  // Search
  setSearchQuery: (query: string) => void
  setSearchResults: (results: unknown[]) => void
  setIsSearching: (searching: boolean) => void
  clearSearch: () => void
  
  // Error management
  setError: (key: string, error: string) => void
  clearError: (key: string) => void
  clearAllErrors: () => void
  
  // Connection status
  setOnlineStatus: (online: boolean) => void
  setConnectionStatus: (connected: boolean) => void
  checkConnection: () => void
  
  // State management
  reset: () => void
}

export interface UIStore extends UIState, UIActions {}

// ==================== REAL-TIME STORE TYPES ====================

export interface RealtimeSubscription {
  channel: RealtimeChannel
  table: string
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  callback: (payload: unknown) => void
  isActive: boolean
}

export interface RealtimeState {
  // Connection status
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastConnectionCheck: Date | null
  
  // Subscriptions
  subscriptions: Map<string, RealtimeSubscription>
  activeSubscriptions: string[]
  
  // Error handling
  connectionErrors: string[]
  retryCount: number
  maxRetries: number
  
  // Sync status
  isSyncing: boolean
  lastSyncTime: Date | null
  syncQueue: unknown[]
}

export interface RealtimeActions {
  // Connection management
  connect: () => Promise<boolean>
  disconnect: () => void
  reconnect: () => Promise<boolean>
  
  // Subscription management
  subscribe: (
    table: string, 
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    callback: (payload: unknown) => void,
    filter?: string
  ) => string
  unsubscribe: (subscriptionId: string) => void
  unsubscribeAll: () => void
  
  // Sync operations
  syncState: () => Promise<void>
  addToSyncQueue: (operation: unknown) => void
  processSyncQueue: () => Promise<void>
  
  // State management
  setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void
  addConnectionError: (error: string) => void
  clearConnectionErrors: () => void
  reset: () => void
}

export interface RealtimeStore extends RealtimeState, RealtimeActions {}

// ==================== STORE MIDDLEWARE TYPES ====================

export interface PersistConfig {
  name: string
  storage?: 'localStorage' | 'sessionStorage'
  include?: string[]
  exclude?: string[]
  version?: number
  migrate?: (persistedState: unknown, version: number) => any
}

export interface DevtoolsConfig {
  enabled: boolean
  name?: string
  trace?: boolean
}

export interface StoreConfig {
  persist?: PersistConfig
  devtools?: DevtoolsConfig
  subscriptions?: {
    enabled: boolean
    tables?: string[]
  }
}

// ==================== COMBINED STORE TYPES ====================

export interface RootStore {
  auth: AuthStore
  proposal: ProposalStore
  ui: UIStore
  realtime: RealtimeStore
}

export interface StoreSlice<T> {
  (...args: unknown[]): T
}

// Export utility types for store implementation
export type StoreSelector<T, U> = (state: T) => U
export type StoreListener<T> = (state: T, previousState: T) => void
export type StoreSubscriber<T> = (listener: StoreListener<T>) => () => void 