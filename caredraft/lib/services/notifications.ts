import { createClient } from '@/lib/supabase'
import { Notification, CreateNotificationInput } from '@/types/collaboration'

export class NotificationsService {
  private supabase = createClient()

  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationInput): Promise<Notification> {
    const { data: notification, error } = await this.supabase
      .from('notifications')
      .insert(data)
      .select(`
        *,
        user:user_id(id, email, user_metadata),
        mention:mention_id(*)
      `)
      .single()

    if (error) throw error
    return notification
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select(`
        *,
        user:user_id(id, email, user_metadata),
        mention:mention_id(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select(`
        *,
        user:user_id(id, email, user_metadata),
        mention:mention_id(*)
      `)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)

    if (error) throw error
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)

    if (error) throw error
    return count || 0
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) throw error
  }

  /**
   * Subscribe to real-time notifications for a user
   */
  subscribeToUserNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ) {
    return this.supabase
      .channel(`notifications:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          // Fetch the full notification with relations
          const { data } = await this.supabase
            .from('notifications')
            .select(`
              *,
              user:user_id(id, email, user_metadata),
              mention:mention_id(*)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            callback(data)
          }
        }
      )
      .subscribe()
  }
} 