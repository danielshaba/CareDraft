/**
 * Notification Realtime Service (Stub Implementation)
 * This is a placeholder until the notifications table is created and realtime functionality is implemented
 */

import type { Database } from '@/lib/database.types'

type NotificationRow = Database['public']['Tables']['notifications']['Row']

export interface NotificationSubscription {
  userId: string
  types: string[]
  callback: (notification: NotificationRow) => void
}

export interface NotificationEventHandlers {
  onNewNotification?: (notification: NotificationRow) => void
  onNotificationUpdate?: (notification: NotificationRow) => void
  onNotificationDelete?: (notificationId: string) => void
  onConnectionChange?: (connected: boolean) => void
  onError?: (error: Error) => void
}

export class NotificationRealtimeService {
  private static instance: NotificationRealtimeService
  private subscriptions: Map<string, NotificationSubscription> = new Map()

  static getInstance(): NotificationRealtimeService {
    if (!NotificationRealtimeService.instance) {
      NotificationRealtimeService.instance = new NotificationRealtimeService()
    }
    return NotificationRealtimeService.instance
  }

  /**
   * Subscribe to real-time notifications (stub implementation)
   */
  subscribe(_userId: string, _handlers: NotificationEventHandlers): void {
    console.log('Stub: subscribe called')
    // Stub implementation - no actual subscription
    // Call connection change handler to simulate connection
    _handlers.onConnectionChange?.(true)
  }

  /**
   * Unsubscribe from notifications (stub implementation)
   */
  unsubscribe(): void {
    console.log('Stub: unsubscribe called')
    this.subscriptions.clear()
  }

  /**
   * Force reconnection (stub implementation)
   */
  reconnect(): void {
    console.log('Stub: reconnect called')
    // Stub implementation - no actual reconnection
  }

  /**
   * Subscribe to real-time notifications (alternative method - stub implementation)
   */
  async subscribeToNotifications(
    _userId: string,
    _callback: (notification: NotificationRow) => void,
    _types?: string[]
  ): Promise<void> {
    console.log('Stub: subscribeToNotifications called')
    // Stub implementation - no actual subscription
  }

  /**
   * Unsubscribe from notifications (alternative method - stub implementation)
   */
  async unsubscribeFromNotifications(_userId: string): Promise<void> {
    console.log('Stub: unsubscribeFromNotifications called')
    this.subscriptions.delete(_userId)
  }

  /**
   * Send a notification (stub implementation)
   */
  async sendNotification(_notification: Omit<NotificationRow, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    console.log('Stub: sendNotification called')
    // Stub implementation - no actual notification sent
  }

  /**
   * Mark notification as read (stub implementation)
   */
  async markAsRead(_notificationId: string, _userId: string): Promise<void> {
    console.log('Stub: markAsRead called')
    // Stub implementation - no actual update
  }

  /**
   * Get unread count (stub implementation)
   */
  async getUnreadCount(_userId: string): Promise<number> {
    console.log('Stub: getUnreadCount called')
    return 0
  }

  /**
   * Get notifications for user (stub implementation)
   */
  async getNotifications(_userId: string, _limit?: number): Promise<NotificationRow[]> {
    console.log('Stub: getNotifications called')
    return []
  }

  /**
   * Cleanup subscriptions (stub implementation)
   */
  cleanup(): void {
    console.log('Stub: cleanup called')
    this.subscriptions.clear()
  }
}

/**
 * Get or create the notification real-time service instance (stub implementation)
 */
export function getNotificationRealtimeService(): NotificationRealtimeService {
  return NotificationRealtimeService.getInstance()
} 