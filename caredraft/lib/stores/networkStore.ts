'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface QueuedAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  exponentialDelay: number;
  originalFunction: () => Promise<any>;
  onSuccess?: (result: unknown) => void;
  onError?: (error: Error) => void;
  onFinalFailure?: (error: Error) => void;
}

export interface NetworkState {
  isOnline: boolean;
  isConnected: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  downlink: number;
  rtt: number;
  queuedActions: QueuedAction[];
  retryingActions: Set<string>;
  networkEvents: Array<{
    type: 'online' | 'offline' | 'connection-change';
    timestamp: number;
    details?: unknown;
  }>;
}

interface NetworkActions {
  setOnlineStatus: (isOnline: boolean) => void;
  updateConnectionInfo: (info: Partial<Pick<NetworkState, 'connectionType' | 'effectiveType' | 'downlink' | 'rtt'>>) => void;
  queueAction: (action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>) => string;
  removeQueuedAction: (id: string) => void;
  retryAction: (id: string) => Promise<void>;
  retryAllActions: () => Promise<void>;
  clearQueue: () => void;
  addNetworkEvent: (type: NetworkState['networkEvents'][0]['type'], details?: unknown) => void;
  startNetworkMonitoring: () => void;
  stopNetworkMonitoring: () => void;
}

// Exponential backoff calculation
const calculateDelay = (retryCount: number, baseDelay: number = 1000, maxDelay: number = 30000): number => {
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
};

// Check if we should retry based on error type
const shouldRetry = (error: Error): boolean => {
  // Don't retry on authentication errors, validation errors, etc.
  const nonRetryableErrors = [
    'authentication',
    'authorization', 
    'validation',
    'not_found',
    'bad_request'
  ];
  
  const errorMessage = error.message.toLowerCase();
  return !nonRetryableErrors.some(type => errorMessage.includes(type));
};

export const useNetworkStore = create<NetworkState & NetworkActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isConnected: true,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    queuedActions: [],
    retryingActions: new Set(),
    networkEvents: [],

    // Actions
    setOnlineStatus: (isOnline: boolean) => {
      set(state => {
        if (state.isOnline !== isOnline) {
          return {
            isOnline,
            isConnected: isOnline,
            networkEvents: [
              ...state.networkEvents.slice(-49), // Keep last 50 events
              {
                type: isOnline ? 'online' : 'offline',
                timestamp: Date.now()
              }
            ]
          };
        }
        return state;
      });

      // Auto-retry queued actions when coming back online
      if (isOnline) {
        setTimeout(() => {
          get().retryAllActions();
        }, 1000); // Wait 1 second to ensure connection is stable
      }
    },

    updateConnectionInfo: (info) => {
      set(state => ({
        ...state,
        ...info,
        networkEvents: [
          ...state.networkEvents.slice(-49),
          {
            type: 'connection-change',
            timestamp: Date.now(),
            details: info
          }
        ]
      }));
    },

    queueAction: (action) => {
      const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const queuedAction: QueuedAction = {
        ...action,
        id,
        timestamp: Date.now(),
        retryCount: 0
      };

      set(state => ({
        queuedActions: [...state.queuedActions, queuedAction]
      }));

      // Try immediate execution if online
      if (get().isOnline) {
        setTimeout(() => get().retryAction(id), 0);
      }

      return id;
    },

    removeQueuedAction: (id) => {
      set(state => ({
        queuedActions: state.queuedActions.filter(action => action.id !== id),
        retryingActions: new Set([...state.retryingActions].filter(actionId => actionId !== id))
      }));
    },

    retryAction: async (id) => {
      const state = get();
      const action = state.queuedActions.find(a => a.id === id);
      
      if (!action || state.retryingActions.has(id)) {
        return;
      }

      // Mark as retrying
      set(state => ({
        retryingActions: new Set([...state.retryingActions, id])
      }));

      try {
        const result = await action.originalFunction();
        
        // Success - remove from queue
        get().removeQueuedAction(id);
        
        if (action.onSuccess) {
          action.onSuccess(result);
        }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        
        // Remove from retrying set
        set(state => ({
          retryingActions: new Set([...state.retryingActions].filter(actionId => actionId !== id))
        }));

        // Check if we should retry
        if (action.retryCount < action.maxRetries && shouldRetry(errorObj)) {
          // Update retry count and schedule next retry
          set(state => ({
            queuedActions: state.queuedActions.map(a => 
              a.id === id 
                ? { ...a, retryCount: a.retryCount + 1 }
                : a
            )
          }));

          const delay = calculateDelay(action.retryCount, action.exponentialDelay);
          setTimeout(() => {
            get().retryAction(id);
          }, delay);

          if (action.onError) {
            action.onError(errorObj);
          }
        } else {
          // Max retries reached or non-retryable error
          get().removeQueuedAction(id);
          
          if (action.onFinalFailure) {
            action.onFinalFailure(errorObj);
          } else if (action.onError) {
            action.onError(errorObj);
          }
        }
      }
    },

    retryAllActions: async () => {
      const { queuedActions, isOnline } = get();
      
      if (!isOnline || queuedActions.length === 0) {
        return;
      }

      // Retry all actions with a small delay between each
      for (const action of queuedActions) {
        if (!get().retryingActions.has(action.id)) {
          setTimeout(() => get().retryAction(action.id), Math.random() * 2000);
        }
      }
    },

    clearQueue: () => {
      set({
        queuedActions: [],
        retryingActions: new Set()
      });
    },

    addNetworkEvent: (type, details) => {
      set(state => ({
        networkEvents: [
          ...state.networkEvents.slice(-49),
          {
            type,
            timestamp: Date.now(),
            details
          }
        ]
      }));
    },

    startNetworkMonitoring: () => {
      if (typeof window === 'undefined') return;

      // Basic online/offline detection
      const handleOnline = () => get().setOnlineStatus(true);
      const handleOffline = () => get().setOnlineStatus(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Advanced connection monitoring if available
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        
        const updateConnectionInfo = () => {
          get().updateConnectionInfo({
            connectionType: connection.type || 'unknown',
            effectiveType: connection.effectiveType || 'unknown',
            downlink: connection.downlink || 0,
            rtt: connection.rtt || 0
          });
        };

        connection.addEventListener('change', updateConnectionInfo);
        updateConnectionInfo(); // Initial update
      }

      // Periodic connectivity check
      const connectivityCheck = async () => {
        try {
          const response = await fetch('/api/health', { 
            method: 'HEAD',
            cache: 'no-cache'
          });
          const isConnected = response.ok;
          
          set({
            isConnected,
            isOnline: isConnected
          });
        } catch {
          set({ isConnected: false, isOnline: false });
        }
      };

      // Check connectivity every 30 seconds
      const connectivityInterval = setInterval(connectivityCheck, 30000);

      // Store cleanup function
      (window as any).__networkCleanup = () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        clearInterval(connectivityInterval);
      };
    },

    stopNetworkMonitoring: () => {
      if (typeof window !== 'undefined' && (window as any).__networkCleanup) {
        (window as any).__networkCleanup();
        delete (window as any).__networkCleanup;
      }
    }
  }))
);

// Hook for easy access to network status
export const useNetworkStatus = () => {
  const isOnline = useNetworkStore(state => state.isOnline);
  const isConnected = useNetworkStore(state => state.isConnected);
  const connectionType = useNetworkStore(state => state.connectionType);
  const effectiveType = useNetworkStore(state => state.effectiveType);
  
  return {
    isOnline,
    isConnected,
    connectionType,
    effectiveType,
    isSlowConnection: effectiveType === 'slow-2g' || effectiveType === '2g'
  };
};

// Hook for managing queued actions
export const useQueuedActions = () => {
  const queuedActions = useNetworkStore(state => state.queuedActions);
  const retryingActions = useNetworkStore(state => state.retryingActions);
  const { queueAction, removeQueuedAction, retryAction, retryAllActions, clearQueue } = useNetworkStore();
  
  return {
    queuedActions,
    retryingActions,
    queueAction,
    removeQueuedAction,
    retryAction,
    retryAllActions,
    clearQueue,
    hasQueuedActions: queuedActions.length > 0
  };
}; 