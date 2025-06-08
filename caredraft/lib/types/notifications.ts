// Notification System Types
// Comprehensive type definitions for notifications, preferences, and aggregates

export type NotificationType = 
  | 'mention'
  | 'deadline'
  | 'proposal_update'
  | 'review_request'
  | 'system_announcement'
  | 'team_invitation'
  | 'document_shared'
  | 'research_session_shared';

export type EmailDigestFrequency = 
  | 'immediate'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'never';

export type NotificationPriority = 1 | 2 | 3 | 4 | 5; // 1=low, 5=urgent

export type RelatedEntityType = 
  | 'proposal'
  | 'comment'
  | 'section'
  | 'user'
  | 'team'
  | 'document'
  | 'deadline';

// Database table types
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: Record<string, unknown>;
  read_status: boolean;
  action_url?: string;
  related_entity_type?: RelatedEntityType;
  related_entity_id?: string;
  sender_id?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  priority: NotificationPriority;
}

export interface UserNotificationPreferences {
  id: string;
  user_id: string;
  
  // Email notification preferences
  email_mentions: boolean;
  email_deadlines: boolean;
  email_proposal_updates: boolean;
  email_review_requests: boolean;
  email_system_announcements: boolean;
  email_team_invitations: boolean;
  email_document_shared: boolean;
  
  // In-app notification preferences
  app_mentions: boolean;
  app_deadlines: boolean;
  app_proposal_updates: boolean;
  app_review_requests: boolean;
  app_system_announcements: boolean;
  app_team_invitations: boolean;
  app_document_shared: boolean;
  
  // Timing preferences
  email_digest_frequency: EmailDigestFrequency;
  quiet_hours_start?: string; // TIME format
  quiet_hours_end?: string; // TIME format
  timezone: string;
  
  created_at: string;
  updated_at: string;
}

export interface NotificationAggregate {
  id: string;
  user_id: string;
  unread_count: number;
  last_read_at?: string;
  updated_at: string;
}

// Extended notification with sender information (from view)
export interface NotificationDetails extends Notification {
  sender_name?: string;
  sender_email?: string;
  is_expired: boolean;
}

// Input types for creating notifications
export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  content?: Record<string, unknown>;
  action_url?: string;
  related_entity_type?: RelatedEntityType;
  related_entity_id?: string;
  sender_id?: string;
  priority?: NotificationPriority;
  expires_at?: string;
}

// Input types for updating notification preferences
export interface UpdateNotificationPreferencesInput {
  email_mentions?: boolean;
  email_deadlines?: boolean;
  email_proposal_updates?: boolean;
  email_review_requests?: boolean;
  email_system_announcements?: boolean;
  email_team_invitations?: boolean;
  email_document_shared?: boolean;
  
  app_mentions?: boolean;
  app_deadlines?: boolean;
  app_proposal_updates?: boolean;
  app_review_requests?: boolean;
  app_system_announcements?: boolean;
  app_team_invitations?: boolean;
  app_document_shared?: boolean;
  
  email_digest_frequency?: EmailDigestFrequency;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone?: string;
}

// Notification content types for different notification types
export interface MentionNotificationContent {
  message: string;
  mentioner_name: string;
  context_type: 'comment' | 'proposal' | 'section';
  context_title: string;
}

export interface DeadlineNotificationContent {
  deadline_date: string;
  deadline_title: string;
  time_remaining: string;
  proposal_title?: string;
}

export interface ProposalUpdateNotificationContent {
  proposal_title: string;
  update_type: 'created' | 'updated' | 'status_changed' | 'shared';
  updater_name: string;
  changes?: string[];
}

export interface ReviewRequestNotificationContent {
  proposal_title: string;
  requester_name: string;
  due_date?: string;
  message?: string;
}

export interface SystemAnnouncementNotificationContent {
  announcement_type: 'maintenance' | 'feature' | 'update' | 'security';
  message: string;
  action_required?: boolean;
}

export interface TeamInvitationNotificationContent {
  team_name: string;
  inviter_name: string;
  role: string;
  expires_at?: string;
}

export interface DocumentSharedNotificationContent {
  document_title: string;
  sharer_name: string;
  document_type: 'proposal' | 'template' | 'export';
  access_level: 'view' | 'edit' | 'admin';
}

export interface ResearchSessionSharedNotificationContent {
  session_title: string;
  sharer_name: string;
  session_id: string;
  access_level: 'view' | 'edit';
  query_preview?: string;
}

// Union type for all notification content types
export type NotificationContent = 
  | MentionNotificationContent
  | DeadlineNotificationContent
  | ProposalUpdateNotificationContent
  | ReviewRequestNotificationContent
  | SystemAnnouncementNotificationContent
  | TeamInvitationNotificationContent
  | DocumentSharedNotificationContent
  | ResearchSessionSharedNotificationContent;

// API response types
export interface NotificationListResponse {
  notifications: NotificationDetails[];
  total: number;
  unread_count: number;
  has_more: boolean;
}

export interface NotificationPreferencesResponse {
  preferences: UserNotificationPreferences;
}

export interface NotificationAggregateResponse {
  unread_count: number;
  last_read_at?: string;
}

// Query parameters for fetching notifications
export interface NotificationQueryParams {
  limit?: number;
  offset?: number;
  type?: NotificationType;
  read_status?: boolean;
  priority?: NotificationPriority;
  sort_by?: 'created_at' | 'priority' | 'read_status';
  sort_order?: 'asc' | 'desc';
}

// Utility types for notification actions
export interface MarkAsReadInput {
  notification_ids: string[];
}

export interface BulkNotificationAction {
  action: 'mark_read' | 'mark_unread' | 'delete';
  notification_ids: string[];
}

// Real-time notification event types
export interface NotificationRealtimeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Notification;
  old?: Notification;
}

export interface NotificationAggregateRealtimeEvent {
  eventType: 'UPDATE';
  new?: NotificationAggregate;
  old?: NotificationAggregate;
}

// Notification templates for different types
export interface NotificationTemplate {
  type: NotificationType;
  title_template: string;
  content_template: Record<string, unknown>;
  default_priority: NotificationPriority;
  expires_after?: number; // minutes
}

// Context for notification creation
export interface NotificationContext {
  user_id: string;
  sender_id?: string;
  proposal_id?: string;
  comment_id?: string;
  section_id?: string;
  team_id?: string;
  document_id?: string;
}

// Notification service interface
export interface NotificationService {
  create(input: CreateNotificationInput): Promise<Notification>;
  getForUser(userId: string, params?: NotificationQueryParams): Promise<NotificationListResponse>;
  markAsRead(notificationIds: string[]): Promise<number>;
  markAllAsRead(userId: string): Promise<number>;
  delete(notificationId: string): Promise<boolean>;
  getUnreadCount(userId: string): Promise<number>;
  getPreferences(userId: string): Promise<UserNotificationPreferences>;
  updatePreferences(userId: string, input: UpdateNotificationPreferencesInput): Promise<UserNotificationPreferences>;
  cleanupExpired(): Promise<number>;
}

// Email notification data
export interface EmailNotificationData {
  to: string;
  subject: string;
  html_content: string;
  text_content: string;
  notification_type: NotificationType;
  user_preferences: UserNotificationPreferences;
}

// Push notification data (for future implementation)
export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: number;
  action_url?: string;
  notification_type: NotificationType;
}

export default {
  // Type guards
  isNotification: (obj: unknown): obj is Notification => {
    return obj && typeof obj.id === 'string' && typeof obj.user_id === 'string' && typeof obj.type === 'string';
  },
  
  isNotificationPreferences: (obj: unknown): obj is UserNotificationPreferences => {
    return obj && typeof obj.id === 'string' && typeof obj.user_id === 'string';
  },
  
  isValidNotificationType: (type: string): type is NotificationType => {
    const validTypes: NotificationType[] = [
      'mention', 'deadline', 'proposal_update', 'review_request',
      'system_announcement', 'team_invitation', 'document_shared', 'research_session_shared'
    ];
    return validTypes.includes(type as NotificationType);
  },
  
  isValidPriority: (priority: number): priority is NotificationPriority => {
    return priority >= 1 && priority <= 5;
  },
  
  isValidDigestFrequency: (frequency: string): frequency is EmailDigestFrequency => {
    const validFrequencies: EmailDigestFrequency[] = [
      'immediate', 'hourly', 'daily', 'weekly', 'never'
    ];
    return validFrequencies.includes(frequency as EmailDigestFrequency);
  }
}; 