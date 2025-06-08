import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { createClient, RealtimeChannel } from '@supabase/supabase-js'
import type { 
  RealtimeStore, 
  RealtimeSubscription 
} from '@/lib/types/store.types'
import type { Database } from '@/lib/database.types'

// Create Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Initial state
const initialState = {
  // Connection status
  isConnected: false,
  connectionStatus: 'disconnected' as const,
  lastConnectionCheck: null,
  
  // Subscriptions
  subscriptions: new Map<string, RealtimeSubscription>(),
  activeSubscriptions: [],
  
  // Error handling
  connectionErrors: [],
  retryCount: 0,
  maxRetries: 5,
  
  // Sync status
  isSyncing: false,
  lastSyncTime: null,
  syncQueue: [],
}

// Utility functions
const generateSubscriptionId = () => Math.random().toString(36).substr(2, 9)

// Retry delays (exponential backoff)
const getRetryDelay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 30000)

export const useRealtimeStore = create<RealtimeStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        // ==================== CONNECTION MANAGEMENT ====================
        
        connect: async () => {
          set((state) => {
            state.connectionStatus = 'connecting'
            state.retryCount = 0
          })

          try {
            // Test connection by attempting to get session
            const { data: { session }, error } = await supabase.auth.getSession()
            
            if (error) {
              throw new Error('Authentication failed: ' + error.message)
            }

            // Supabase realtime connection is managed automatically
            // We'll track connection status through subscription success/failure

            set((state) => {
              state.isConnected = true
              state.connectionStatus = 'connected'
              state.lastConnectionCheck = new Date()
            })

            return true
          } catch (error: unknown) {
            const errorMessage = error.message || 'Connection failed'
            
            set((state) => {
              state.isConnected = false
              state.connectionStatus = 'error'
              state.connectionErrors.push(errorMessage)
              state.lastConnectionCheck = new Date()
            })

            return false
          }
        },

        disconnect: () => {
          // Unsubscribe from all channels
          get().unsubscribeAll()

          // Disconnect from Supabase realtime
          supabase.realtime.disconnect()

          set((state) => {
            state.isConnected = false
            state.connectionStatus = 'disconnected'
            state.lastConnectionCheck = new Date()
          })
        },

        reconnect: async () => {
          const state = get()
          
          if (state.retryCount >= state.maxRetries) {
            set((state) => {
              state.connectionStatus = 'error'
              state.connectionErrors.push('Max retry attempts reached')
            })
            return false
          }

          set((state) => {
            state.retryCount += 1
          })

          // Wait before retrying
          const delay = getRetryDelay(state.retryCount)
          await new Promise(resolve => setTimeout(resolve, delay))

          // Attempt reconnection
          const connected = await get().connect()

          if (connected) {
            // Reestablish subscriptions
            const subscriptions = Array.from(state.subscriptions.values())
            for (const sub of subscriptions) {
              if (sub.isActive) {
                // Reactivate subscription
                try {
                  sub.channel = supabase
                    .channel(`${sub.table}_${generateSubscriptionId()}`)
                    .on('postgres_changes', {
                      event: sub.event,
                      schema: 'public',
                      table: sub.table
                    }, sub.callback)
                    .subscribe()
                } catch {
                  console.warn('Failed to reestablish subscription:', error)
                }
              }
            }
          }

          return connected
        },

        // ==================== SUBSCRIPTION MANAGEMENT ====================
        
        subscribe: (
          table: string, 
          event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
          callback: (payload: unknown) => void,
          filter?: string
        ) => {
          const subscriptionId = generateSubscriptionId()
          
          try {
            // Create channel with unique name
            const channelName = `${table}_${subscriptionId}`
            const channel = supabase.channel(channelName)

            // Configure postgres changes listener
            const changeConfig: unknown = {
              event,
              schema: 'public',
              table
            }

            if (filter) {
              changeConfig.filter = filter
            }

            channel.on('postgres_changes' as any, changeConfig, callback)

            // Subscribe to channel
            channel.subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                set((state) => {
                  if (!state.activeSubscriptions.includes(subscriptionId)) {
                    state.activeSubscriptions.push(subscriptionId)
                  }
                })
              }
            })

            // Store subscription
            const subscription: RealtimeSubscription = {
              channel,
              table,
              event,
              callback,
              isActive: true
            }

            set((state) => {
              // Use non-immer operation for complex objects
              const newSubscriptions = new Map(state.subscriptions)
              newSubscriptions.set(subscriptionId, subscription)
              state.subscriptions = newSubscriptions
            })

            return subscriptionId
          } catch (error: unknown) {
            const errorMessage = error.message || 'Failed to create subscription'
            set((state) => {
              state.connectionErrors.push(errorMessage)
            })
            return ''
          }
        },

        unsubscribe: (subscriptionId: string) => {
          const state = get()
          const subscription = state.subscriptions.get(subscriptionId)

          if (subscription) {
            try {
              // Unsubscribe from channel
              subscription.channel.unsubscribe()
              
              set((state) => {
                state.subscriptions.delete(subscriptionId)
                state.activeSubscriptions = state.activeSubscriptions.filter(
                  id => id !== subscriptionId
                )
              })
            } catch {
              console.warn('Failed to unsubscribe:', error)
            }
          }
        },

        unsubscribeAll: () => {
          const state = get()
          
          // Unsubscribe from all channels
          state.subscriptions.forEach((subscription, id) => {
            try {
              subscription.channel.unsubscribe()
            } catch {
              console.warn('Failed to unsubscribe from channel:', error)
            }
          })

          set((state) => {
            state.subscriptions.clear()
            state.activeSubscriptions = []
          })
        },

        // ==================== SYNC OPERATIONS ====================
        
        syncState: async () => {
          set((state) => {
            state.isSyncing = true
          })

          try {
            // Process any pending sync operations
            await get().processSyncQueue()

            set((state) => {
              state.lastSyncTime = new Date()
              state.isSyncing = false
            })
          } catch (error: unknown) {
            const errorMessage = error.message || 'Sync failed'
            set((state) => {
              state.connectionErrors.push(errorMessage)
              state.isSyncing = false
            })
          }
        },

        addToSyncQueue: (operation: unknown) => {
          set((state) => {
            state.syncQueue.push({
              ...operation,
              timestamp: new Date(),
              id: generateSubscriptionId()
            })
          })
        },

        processSyncQueue: async () => {
          const state = get()
          const queue = [...state.syncQueue]

          if (queue.length === 0) return

          set((state) => {
            state.syncQueue = []
          })

          // Process operations in order
          for (const operation of queue) {
            try {
              // Handle different operation types
              switch (operation.type) {
                case 'proposal_update':
                  await supabase
                    .from('proposals')
                    .update(operation.data)
                    .eq('id', operation.proposalId)
                  break

                case 'section_update':
                  await supabase
                    .from('sections')
                    .update(operation.data)
                    .eq('id', operation.sectionId)
                  break

                case 'user_presence':
                  // Handle user presence updates
                  await supabase
                    .from('user_sessions')
                    .upsert(operation.data)
                  break

                default:
                  console.warn('Unknown sync operation type:', operation.type)
              }
            } catch {
              console.error('Failed to process sync operation:', operation, error)
              
              // Re-add failed operations to queue for retry
              set((state) => {
                state.syncQueue.push(operation)
              })
            }
          }
        },

        // ==================== STATE MANAGEMENT ====================
        
        setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
          set((state) => {
            state.connectionStatus = status
            state.isConnected = status === 'connected'
            state.lastConnectionCheck = new Date()
          })
        },

        addConnectionError: (error: string) => {
          set((state) => {
            state.connectionErrors.push(error)
          })
        },

        clearConnectionErrors: () => {
          set((state) => {
            state.connectionErrors = []
          })
        },

        reset: () => {
          // Disconnect and cleanup
          get().disconnect()
          
          set(() => ({
            ...initialState,
            subscriptions: new Map(),
          }))
        }
      }))
    ),
    {
      name: 'RealtimeStore',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
)

// Auto-connect on store initialization (client-side only)
if (typeof window !== 'undefined') {
  // Auto-connect when store is created
  setTimeout(() => {
    useRealtimeStore.getState().connect()
  }, 1000) // Delay to ensure auth is ready

  // Set up auth state change listener to reconnect when user logs in
  supabase.auth.onAuthStateChange((event, session) => {
    const store = useRealtimeStore.getState()
    
    if (event === 'SIGNED_IN' && session) {
      // Reconnect when user signs in
      store.connect()
    } else if (event === 'SIGNED_OUT') {
      // Disconnect when user signs out
      store.disconnect()
    }
  })

  // Handle browser online/offline events
  window.addEventListener('online', () => {
    const store = useRealtimeStore.getState()
    if (!store.isConnected) {
      store.reconnect()
    }
  })

  window.addEventListener('offline', () => {
    useRealtimeStore.getState().setConnectionStatus('disconnected')
  })

  // Periodic connection health check
  setInterval(() => {
    const store = useRealtimeStore.getState()
    if (store.connectionStatus === 'connected' && !store.isConnected) {
      // Connection status mismatch, attempt reconnection
      store.reconnect()
    }
  }, 60000) // Check every minute
} 