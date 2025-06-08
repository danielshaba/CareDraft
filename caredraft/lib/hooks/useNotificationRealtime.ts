'use client';

// React Hook for Notification Real-time Integration
// Provides easy-to-use interface for components to subscribe to real-time notifications

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  getNotificationRealtimeService, 
  NotificationEventHandlers,
  NotificationRealtimeService 
} from '../services/notification-realtime';
import { Database } from '../database.types';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];

export interface UseNotificationRealtimeOptions {
  /** User ID to subscribe to notifications for */
  userId?: string;
  /** Auto-connect when userId is available */
  autoConnect?: boolean;
  /** Enable console logging for debugging */
  debug?: boolean;
}

export interface UseNotificationRealtimeReturn {
  /** Whether the real-time connection is active */
  isConnected: boolean;
  /** Connection error if any */
  connectionError: Error | null;
  /** Latest notification received */
  latestNotification: NotificationRow | null;
  /** All notifications received in this session */
  realtimeNotifications: NotificationRow[];
  /** Count of unread notifications received */
  unreadCount: number;
  /** Subscribe to real-time notifications */
  connect: (userId: string) => void;
  /** Unsubscribe from real-time notifications */
  disconnect: () => void;
  /** Force reconnection */
  reconnect: () => void;
  /** Mark a notification as read (updates local state) */
  markAsRead: (notificationId: string) => void;
  /** Clear all notifications from local state */
  clearNotifications: () => void;
  /** Remove a specific notification from local state */
  removeNotification: (notificationId: string) => void;
}

export function useNotificationRealtime(
  options: UseNotificationRealtimeOptions = {}
): UseNotificationRealtimeReturn {
  const { userId, autoConnect = true, debug = false } = options;
  
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [latestNotification, setLatestNotification] = useState<NotificationRow | null>(null);
  const [realtimeNotifications, setRealtimeNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Service reference
  const serviceRef = useRef<NotificationRealtimeService | null>(null);
  const isInitialized = useRef(false);

  // Debug logging
  const log = useCallback((message: string, ...args: unknown[]) => {
    if (debug) {
      console.log(`[useNotificationRealtime] ${message}`, ...args);
    }
  }, [debug]);

  // Event handlers
  const handleNewNotification = useCallback((notification: NotificationRow) => {
    log('New notification received:', notification);
    
    setLatestNotification(notification);
    setRealtimeNotifications(prev => [notification, ...prev]);
    
    if (!notification.read_status) {
      setUnreadCount(prev => prev + 1);
    }
  }, [log]);

  const handleNotificationUpdate = useCallback((notification: NotificationRow) => {
    log('Notification updated:', notification);
    
    setRealtimeNotifications(prev => 
      prev.map(n => n.id === notification.id ? notification : n)
    );
    
    // Update unread count if read status changed
    setRealtimeNotifications(prev => {
      const oldNotification = prev.find(n => n.id === notification.id);
      if (oldNotification && !oldNotification.read_status && notification.read_status) {
        setUnreadCount(count => Math.max(0, count - 1));
      } else if (oldNotification && oldNotification.read_status && !notification.read_status) {
        setUnreadCount(count => count + 1);
      }
      return prev.map(n => n.id === notification.id ? notification : n);
    });
  }, [log]);

  const handleNotificationDelete = useCallback((notificationId: string) => {
    log('Notification deleted:', notificationId);
    
    setRealtimeNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read_status) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, [log]);

  const handleConnectionChange = useCallback((connected: boolean) => {
    log('Connection status changed:', connected);
    setIsConnected(connected);
    if (connected) {
      setConnectionError(null);
    }
  }, [log]);

  const handleError = useCallback((error: Error) => {
    log('Real-time error:', error);
    setConnectionError(error);
  }, [log]);

  // Main connection function
  const connect = useCallback((targetUserId: string) => {
    if (!targetUserId) {
      log('Cannot connect: No user ID provided');
      return;
    }

    log('Connecting to real-time notifications for user:', targetUserId);
    
    // Get or create service
    if (!serviceRef.current) {
      serviceRef.current = getNotificationRealtimeService();
    }

    // Set up event handlers
    const handlers: NotificationEventHandlers = {
      onNewNotification: handleNewNotification,
      onNotificationUpdate: handleNotificationUpdate,
      onNotificationDelete: handleNotificationDelete,
      onConnectionChange: handleConnectionChange,
      onError: handleError,
    };

    // Subscribe to real-time events
    serviceRef.current.subscribe(targetUserId, handlers);
    isInitialized.current = true;
  }, [
    handleNewNotification,
    handleNotificationUpdate,
    handleNotificationDelete,
    handleConnectionChange,
    handleError,
    log
  ]);

  // Disconnect function
  const disconnect = useCallback(() => {
    log('Disconnecting from real-time notifications');
    
    if (serviceRef.current) {
      serviceRef.current.unsubscribe();
    }
    
    setIsConnected(false);
    setConnectionError(null);
    isInitialized.current = false;
  }, [log]);

  // Reconnect function
  const reconnect = useCallback(() => {
    log('Forcing reconnection');
    
    if (serviceRef.current) {
      serviceRef.current.reconnect();
    }
  }, [log]);

  // Mark notification as read (local state only)
  const markAsRead = useCallback((notificationId: string) => {
    setRealtimeNotifications(prev =>
      prev.map(n => {
        if (n.id === notificationId && !n.read_status) {
          setUnreadCount(count => Math.max(0, count - 1));
          return { ...n, read_status: true };
        }
        return n;
      })
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    log('Clearing all notifications from local state');
    setRealtimeNotifications([]);
    setLatestNotification(null);
    setUnreadCount(0);
  }, [log]);

  // Remove specific notification
  const removeNotification = useCallback((notificationId: string) => {
    setRealtimeNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read_status) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect && userId && !isInitialized.current) {
      connect(userId);
    }
  }, [userId, autoConnect, connect]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionError,
    latestNotification,
    realtimeNotifications,
    unreadCount,
    connect,
    disconnect,
    reconnect,
    markAsRead,
    clearNotifications,
    removeNotification,
  };
} 