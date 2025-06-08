// Real-time Notification Service
// Handles Supabase real-time subscriptions for instant notification delivery

import { createClient } from '../supabase.client';
import { Database } from '../database.types';
import { RealtimeChannel, RealtimePostgresChangesPayload, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

// Event handlers for notification updates
export interface NotificationEventHandlers {
  onNewNotification?: (notification: NotificationRow) => void;
  onNotificationUpdate?: (notification: NotificationRow) => void;
  onNotificationDelete?: (notificationId: string) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Error) => void;
}

export class NotificationRealtimeService {
  private supabase = createClient();
  private channel: RealtimeChannel | null = null;
  private handlers: NotificationEventHandlers = {};
  private currentUserId: string | null = null;
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor(userId?: string) {
    this.currentUserId = userId || null;
  }

  /**
   * Initialize real-time subscription for notifications
   */
  public subscribe(userId: string, handlers: NotificationEventHandlers = {}) {
    this.currentUserId = userId;
    this.handlers = handlers;
    
    // Cleanup existing subscription
    this.unsubscribe();
    
    try {
      // Create channel for user-specific notifications
      this.channel = this.supabase
        .channel(`notifications:user:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          this.handleInsert.bind(this)
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          this.handleUpdate.bind(this)
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          this.handleDelete.bind(this)
        )
                 .subscribe((status: string) => {
          console.log(`[NotificationRealtime] Subscription status: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.handlers.onConnectionChange?.(true);
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            this.isConnected = false;
            this.handlers.onConnectionChange?.(false);
            this.attemptReconnect();
          }
        });

      console.log(`[NotificationRealtime] Subscribed to notifications for user: ${userId}`);
      
    } catch {
      console.error('[NotificationRealtime] Subscription error:', error);
      this.handlers.onError?.(error as Error);
      this.attemptReconnect();
    }
  }

  /**
   * Handle new notification insert
   */
  private handleInsert(payload: RealtimePostgresChangesPayload<NotificationRow>) {
    console.log('[NotificationRealtime] New notification:', payload);
    
    try {
      const notification = payload.new as NotificationRow;
      if (notification && 'user_id' in notification && this.currentUserId === notification.user_id) {
        this.handlers.onNewNotification?.(notification);
      }
    } catch {
      console.error('[NotificationRealtime] Error handling insert:', error);
      this.handlers.onError?.(error as Error);
    }
  }

  /**
   * Handle notification update (e.g., read status change)
   */
  private handleUpdate(payload: RealtimePostgresChangesPayload<NotificationRow>) {
    console.log('[NotificationRealtime] Notification updated:', payload);
    
    try {
      const notification = payload.new as NotificationRow;
      if (notification && 'user_id' in notification && this.currentUserId === notification.user_id) {
        this.handlers.onNotificationUpdate?.(notification);
      }
    } catch {
      console.error('[NotificationRealtime] Error handling update:', error);
      this.handlers.onError?.(error as Error);
    }
  }

  /**
   * Handle notification deletion
   */
  private handleDelete(payload: RealtimePostgresChangesPayload<NotificationRow>) {
    console.log('[NotificationRealtime] Notification deleted:', payload);
    
    try {
      const notification = payload.old as NotificationRow;
      if (notification && 'user_id' in notification && 'id' in notification && this.currentUserId === notification.user_id) {
        this.handlers.onNotificationDelete?.(notification.id);
      }
    } catch {
      console.error('[NotificationRealtime] Error handling delete:', error);
      this.handlers.onError?.(error as Error);
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[NotificationRealtime] Max reconnection attempts reached');
      this.handlers.onError?.(new Error('Failed to establish real-time connection after multiple attempts'));
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`[NotificationRealtime] Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      if (this.currentUserId) {
        this.subscribe(this.currentUserId, this.handlers);
      }
    }, delay);
  }

  /**
   * Unsubscribe from real-time notifications
   */
  public unsubscribe() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }

    this.isConnected = false;
    this.reconnectAttempts = 0;
    console.log('[NotificationRealtime] Unsubscribed from notifications');
  }

  /**
   * Check if currently connected
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get current user ID
   */
  public getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Update handlers without resubscribing
   */
  public updateHandlers(handlers: Partial<NotificationEventHandlers>) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Force reconnection
   */
  public reconnect() {
    if (this.currentUserId) {
      console.log('[NotificationRealtime] Force reconnection requested');
      this.reconnectAttempts = 0;
      this.subscribe(this.currentUserId, this.handlers);
    }
  }
}

// Singleton instance for app-wide use
let realtimeService: NotificationRealtimeService | null = null;

/**
 * Get or create the notification real-time service instance
 */
export function getNotificationRealtimeService(): NotificationRealtimeService {
  if (!realtimeService) {
    realtimeService = new NotificationRealtimeService();
  }
  return realtimeService;
}

/**
 * Cleanup service on app unmount
 */
export function cleanupNotificationRealtime() {
  if (realtimeService) {
    realtimeService.unsubscribe();
    realtimeService = null;
  }
} 