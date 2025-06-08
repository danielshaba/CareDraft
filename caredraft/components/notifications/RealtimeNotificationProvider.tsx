'use client';

// Real-time Notification Provider
// App-level provider for managing real-time notification state and broadcasting events

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNotificationRealtime } from '../../lib/hooks/useNotificationRealtime';
import { Database } from '../../lib/database.types';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];

interface NotificationContextValue {
  // Connection status
  isConnected: boolean;
  connectionError: Error | null;
  
  // Notification data
  latestNotification: NotificationRow | null;
  realtimeNotifications: NotificationRow[];
  unreadCount: number;
  
  // Actions
  markAsRead: (notificationId: string) => void;
  clearNotifications: () => void;
  removeNotification: (notificationId: string) => void;
  reconnect: () => void;
  
  // Manual connection control
  connect: (userId: string) => void;
  disconnect: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

interface RealtimeNotificationProviderProps {
  children: React.ReactNode;
  /** User ID for real-time subscription */
  userId?: string;
  /** Auto-connect when userId is available */
  autoConnect?: boolean;
  /** Enable debug logging */
  debug?: boolean;
  /** Show browser notifications for new notifications */
  showBrowserNotifications?: boolean;
  /** Custom notification sound URL */
  notificationSoundUrl?: string;
}

export function RealtimeNotificationProvider({
  children,
  userId,
  autoConnect = true,
  debug = false,
  showBrowserNotifications = true,
  notificationSoundUrl
}: RealtimeNotificationProviderProps) {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
  const {
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
  } = useNotificationRealtime({
    userId,
    autoConnect,
    debug
  });

  // Initialize audio element for notification sounds
  useEffect(() => {
    if (notificationSoundUrl && typeof window !== 'undefined') {
      const audio = new Audio(notificationSoundUrl);
      audio.preload = 'auto';
      setAudioElement(audio);
    }
  }, [notificationSoundUrl]);

  // Handle browser notifications and sounds
  useEffect(() => {
    if (!latestNotification) return;

    const handleNewNotification = async () => {
      // Request notification permission if not granted
      if (showBrowserNotifications && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
        
        if (Notification.permission === 'granted') {
          const notification = new Notification(latestNotification.title, {
            body: getNotificationBody(latestNotification),
            icon: '/favicon.ico', // You can customize this
            tag: latestNotification.id, // Prevents duplicate notifications
            requireInteraction: latestNotification.priority >= 4, // High priority notifications stay visible
          });

          // Auto-close normal priority notifications after 5 seconds
          if (latestNotification.priority < 4) {
            setTimeout(() => notification.close(), 5000);
          }

          // Handle notification click
          notification.onclick = () => {
            window.focus();
            if (latestNotification.action_url) {
              window.location.href = latestNotification.action_url;
            }
            notification.close();
          };
        }
      }

      // Play notification sound
      if (audioElement) {
        try {
          await audioElement.play();
        } catch {
          if (debug) {
            console.log('[NotificationProvider] Could not play notification sound:', error);
          }
        }
      }
    };

    handleNewNotification();
  }, [latestNotification, showBrowserNotifications, audioElement, debug]);

  // Helper function to extract readable content from notification
  const getNotificationBody = (notification: NotificationRow): string => {
    if (typeof notification.content === 'object' && notification.content) {
      return (notification.content as any).message || 
             (notification.content as any).description || 
             (notification.content as any).text || 
             'New notification';
    }
    return 'New notification';
  };

  const contextValue: NotificationContextValue = {
    isConnected,
    connectionError,
    latestNotification,
    realtimeNotifications,
    unreadCount,
    markAsRead,
    clearNotifications,
    removeNotification,
    reconnect,
    connect,
    disconnect,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to access notification context
 */
export function useNotificationContext(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a RealtimeNotificationProvider');
  }
  return context;
}

/**
 * Hook for components that only need connection status
 */
export function useNotificationConnectionStatus() {
  const { isConnected, connectionError, reconnect } = useNotificationContext();
  return { isConnected, connectionError, reconnect };
}

/**
 * Hook for components that need unread count
 */
export function useUnreadNotificationCount() {
  const { unreadCount } = useNotificationContext();
  return unreadCount;
}

/**
 * Hook for notification management
 */
export function useNotificationActions() {
  const { 
    markAsRead, 
    clearNotifications, 
    removeNotification, 
    connect, 
    disconnect 
  } = useNotificationContext();
  
  return {
    markAsRead,
    clearNotifications,
    removeNotification,
    connect,
    disconnect,
  };
} 