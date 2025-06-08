export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      answer_bank: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string
          id: string
          organization_id: string
          title: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          organization_id: string
          title: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          organization_id?: string
          title?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "answer_bank_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_items: {
        Row: {
          completed: boolean
          confidence_score: number | null
          created_at: string | null
          id: string
          notes: string | null
          proposal_id: string
          requirement: string
          source_type: string
          source_document_id: string | null
          source_page: number | null
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          completed?: boolean
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          proposal_id: string
          requirement: string
          source_type?: string
          source_document_id?: string | null
          source_page?: number | null
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          completed?: boolean
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          proposal_id?: string
          requirement?: string
          source_type?: string
          source_document_id?: string | null
          source_page?: number | null
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          created_at: string | null
          deadline: string | null
          id: string
          issuing_authority: string | null
          owner_id: string
          status: Database["public"]["Enums"]["proposal_status"]
          tender_document_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          id?: string
          issuing_authority?: string | null
          owner_id: string
          status?: Database["public"]["Enums"]["proposal_status"]
          tender_document_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          id?: string
          issuing_authority?: string | null
          owner_id?: string
          status?: Database["public"]["Enums"]["proposal_status"]
          tender_document_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      research_sessions: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          organization_id: string
          query: string
          results: Json | null
          session_metadata: Json | null
          shared_with: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          organization_id: string
          query: string
          results?: Json | null
          session_metadata?: Json | null
          shared_with?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          organization_id?: string
          query?: string
          results?: Json | null
          session_metadata?: Json | null
          shared_with?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          assigned_to: string | null
          content: string | null
          created_at: string | null
          due_date: string | null
          id: string
          parent_section_id: string | null
          proposal_id: string
          status: Database["public"]["Enums"]["section_status"]
          title: string
          updated_at: string | null
          word_limit: number | null
        }
        Insert: {
          assigned_to?: string | null
          content?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          parent_section_id?: string | null
          proposal_id: string
          status?: Database["public"]["Enums"]["section_status"]
          title: string
          updated_at?: string | null
          word_limit?: number | null
        }
        Update: {
          assigned_to?: string | null
          content?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          parent_section_id?: string | null
          proposal_id?: string
          status?: Database["public"]["Enums"]["section_status"]
          title?: string
          updated_at?: string | null
          word_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sections_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_parent_section_id_fkey"
            columns: ["parent_section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: Database["public"]["Enums"]["notification_type"]
          title: string
          content: Json
          read_status: boolean
          action_url: string | null
          related_entity_type: string | null
          related_entity_id: string | null
          sender_id: string | null
          created_at: string
          updated_at: string
          expires_at: string | null
          priority: number
        }
        Insert: {
          id?: string
          user_id: string
          type: Database["public"]["Enums"]["notification_type"]
          title: string
          content?: Json
          read_status?: boolean
          action_url?: string | null
          related_entity_type?: string | null
          related_entity_id?: string | null
          sender_id?: string | null
          created_at?: string
          updated_at?: string
          expires_at?: string | null
          priority?: number
        }
        Update: {
          id?: string
          user_id?: string
          type?: Database["public"]["Enums"]["notification_type"]
          title?: string
          content?: Json
          read_status?: boolean
          action_url?: string | null
          related_entity_type?: string | null
          related_entity_id?: string | null
          sender_id?: string | null
          created_at?: string
          updated_at?: string
          expires_at?: string | null
          priority?: number
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_preferences: {
        Row: {
          id: string
          user_id: string
          email_mentions: boolean
          email_deadlines: boolean
          email_proposal_updates: boolean
          email_review_requests: boolean
          email_system_announcements: boolean
          email_team_invitations: boolean
          email_document_shared: boolean
          app_mentions: boolean
          app_deadlines: boolean
          app_proposal_updates: boolean
          app_review_requests: boolean
          app_system_announcements: boolean
          app_team_invitations: boolean
          app_document_shared: boolean
          email_digest_frequency: string
          quiet_hours_start: string | null
          quiet_hours_end: string | null
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_mentions?: boolean
          email_deadlines?: boolean
          email_proposal_updates?: boolean
          email_review_requests?: boolean
          email_system_announcements?: boolean
          email_team_invitations?: boolean
          email_document_shared?: boolean
          app_mentions?: boolean
          app_deadlines?: boolean
          app_proposal_updates?: boolean
          app_review_requests?: boolean
          app_system_announcements?: boolean
          app_team_invitations?: boolean
          app_document_shared?: boolean
          email_digest_frequency?: string
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_mentions?: boolean
          email_deadlines?: boolean
          email_proposal_updates?: boolean
          email_review_requests?: boolean
          email_system_announcements?: boolean
          email_team_invitations?: boolean
          email_document_shared?: boolean
          app_mentions?: boolean
          app_deadlines?: boolean
          app_proposal_updates?: boolean
          app_review_requests?: boolean
          app_system_announcements?: boolean
          app_team_invitations?: boolean
          app_document_shared?: boolean
          email_digest_frequency?: string
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_aggregates: {
        Row: {
          id: string
          user_id: string
          unread_count: number
          last_read_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          unread_count?: number
          last_read_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          unread_count?: number
          last_read_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_aggregates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_status_history: {
        Row: {
          id: string
          proposal_id: string
          from_status: Database["public"]["Enums"]["proposal_status"] | null
          to_status: Database["public"]["Enums"]["proposal_status"]
          changed_by: string
          changed_at: string
          comment: string | null
          transition_reason: string | null
          metadata: Json
          automatic: boolean
          created_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          from_status?: Database["public"]["Enums"]["proposal_status"] | null
          to_status: Database["public"]["Enums"]["proposal_status"]
          changed_by: string
          changed_at?: string
          comment?: string | null
          transition_reason?: string | null
          metadata?: Json
          automatic?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          from_status?: Database["public"]["Enums"]["proposal_status"] | null
          to_status?: Database["public"]["Enums"]["proposal_status"]
          changed_by?: string
          changed_at?: string
          comment?: string | null
          transition_reason?: string | null
          metadata?: Json
          automatic?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_status_history_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_workflow_permissions: {
        Row: {
          id: string
          from_status: Database["public"]["Enums"]["proposal_status"] | null
          to_status: Database["public"]["Enums"]["proposal_status"]
          required_role: Database["public"]["Enums"]["user_role"]
          conditions: Json
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_status?: Database["public"]["Enums"]["proposal_status"] | null
          to_status: Database["public"]["Enums"]["proposal_status"]
          required_role: Database["public"]["Enums"]["user_role"]
          conditions?: Json
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          from_status?: Database["public"]["Enums"]["proposal_status"] | null
          to_status?: Database["public"]["Enums"]["proposal_status"]
          required_role?: Database["public"]["Enums"]["user_role"]
          conditions?: Json
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      proposal_workflow_settings: {
        Row: {
          id: string
          organization_id: string
          auto_archive_after_days: number
          auto_review_reminder_days: number
          auto_submit_reminder_days: number
          require_comments_on_rejection: boolean
          require_comments_on_approval: boolean
          allow_self_approval: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          auto_archive_after_days?: number
          auto_review_reminder_days?: number
          auto_submit_reminder_days?: number
          require_comments_on_rejection?: boolean
          require_comments_on_approval?: boolean
          allow_self_approval?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          auto_archive_after_days?: number
          auto_review_reminder_days?: number
          auto_submit_reminder_days?: number
          require_comments_on_rejection?: boolean
          require_comments_on_approval?: boolean
          allow_self_approval?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      proposal_reviewer_assignments: {
        Row: {
          id: string
          proposal_id: string
          reviewer_id: string
          assigned_by: string
          assigned_at: string
          completed_at: string | null
          decision: Database["public"]["Enums"]["proposal_status"] | null
          review_comments: string | null
          created_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          reviewer_id: string
          assigned_by: string
          assigned_at?: string
          completed_at?: string | null
          decision?: Database["public"]["Enums"]["proposal_status"] | null
          review_comments?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          reviewer_id?: string
          assigned_by?: string
          assigned_at?: string
          completed_at?: string | null
          decision?: Database["public"]["Enums"]["proposal_status"] | null
          review_comments?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_reviewer_assignments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_reviewer_assignments_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_reviewer_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_proposals_approaching_deadline: {
        Args: { days_ahead?: number }
        Returns: {
          proposal_id: string
          title: string
          deadline: string
          days_remaining: number
          owner_email: string
          organization_id: string
        }[]
      }
      get_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_manager_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      test_rls_as_user: {
        Args: { test_user_id: string }
        Returns: {
          test_name: string
          table_name: string
          visible_rows: number
          test_result: string
        }[]
      }
      can_user_transition_proposal_status: {
        Args: {
          p_proposal_id: string
          p_from_status: Database["public"]["Enums"]["proposal_status"]
          p_to_status: Database["public"]["Enums"]["proposal_status"]
          p_user_id?: string
        }
        Returns: boolean
      }
      get_proposal_status_workflow: {
        Args: { p_proposal_id: string }
        Returns: {
          id: string
          from_status: Database["public"]["Enums"]["proposal_status"] | null
          to_status: Database["public"]["Enums"]["proposal_status"]
          changed_by_name: string
          changed_by_email: string
          changed_at: string
          comment: string | null
          transition_reason: string | null
          automatic: boolean
        }[]
      }
      auto_archive_expired_proposals: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_compliance_statistics: {
        Args: { p_proposal_id: string }
        Returns: {
          total_items: number
          completed_items: number
          completion_percentage: number
          auto_items: number
          manual_items: number
        }[]
      }
      get_user_research_sessions: {
        Args: { 
          user_id: string
          page_size?: number
          page_offset?: number
          search_query?: string
        }
        Returns: {
          id: string
          title: string
          query: string
          results: Json
          created_by: string
          organization_id: string
          created_at: string
          updated_at: string
          shared_with: Json
          session_metadata: Json
          is_shared: boolean
          result_count: number
        }[]
      }
      share_research_session: {
        Args: {
          session_id: string
          user_ids: string[]
        }
        Returns: Json
      }
      get_research_session_stats: {
        Args: { user_id: string }
        Returns: Json
      }
    }
    Enums: {
      notification_type: "mention" | "deadline" | "proposal_update" | "review_request" | "system_announcement" | "team_invitation" | "document_shared"
      proposal_status: "draft" | "review" | "submitted" | "archived"
      section_status: "not_started" | "in_progress" | "review" | "complete"
      user_role: "admin" | "manager" | "writer" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      proposal_status: ["draft", "review", "submitted", "archived"],
      section_status: ["not_started", "in_progress", "review", "complete"],
      user_role: ["admin", "manager", "writer", "viewer"],
    },
  },
} as const

// Additional type helpers for convenience
export type User = Tables<'users'>
export type Proposal = Tables<'proposals'>
export type Section = Tables<'sections'>
export type ComplianceItem = Tables<'compliance_items'>
export type AnswerBank = Tables<'answer_bank'>
export type ResearchSession = Tables<'research_sessions'>
export type Notification = Tables<'notifications'>
export type UserNotificationPreferences = Tables<'user_notification_preferences'>
export type NotificationAggregate = Tables<'notification_aggregates'>

export type UserRole = Database['public']['Enums']['user_role']
export type ProposalStatus = Database['public']['Enums']['proposal_status']
export type SectionStatus = Database['public']['Enums']['section_status']
export type NotificationType = Database['public']['Enums']['notification_type']

export type UserInsert = TablesInsert<'users'>
export type ProposalInsert = TablesInsert<'proposals'>
export type SectionInsert = TablesInsert<'sections'>
export type ComplianceItemInsert = TablesInsert<'compliance_items'>
export type AnswerBankInsert = TablesInsert<'answer_bank'>
export type ResearchSessionInsert = TablesInsert<'research_sessions'>
export type NotificationInsert = TablesInsert<'notifications'>
export type UserNotificationPreferencesInsert = TablesInsert<'user_notification_preferences'>
export type NotificationAggregateInsert = TablesInsert<'notification_aggregates'>

export type UserUpdate = TablesUpdate<'users'>
export type ProposalUpdate = TablesUpdate<'proposals'>
export type SectionUpdate = TablesUpdate<'sections'>
export type ComplianceItemUpdate = TablesUpdate<'compliance_items'>
export type AnswerBankUpdate = TablesUpdate<'answer_bank'>
export type ResearchSessionUpdate = TablesUpdate<'research_sessions'>
export type NotificationUpdate = TablesUpdate<'notifications'>
export type UserNotificationPreferencesUpdate = TablesUpdate<'user_notification_preferences'>
export type NotificationAggregateUpdate = TablesUpdate<'notification_aggregates'>

// Database function types for enhanced functionality
export type ProposalDeadlineData = Database['public']['Functions']['get_proposals_approaching_deadline']['Returns'][number]

// New proposal workflow types
export type ProposalStatusHistory = Tables<'proposal_status_history'>
export type ProposalWorkflowPermissions = Tables<'proposal_workflow_permissions'>
export type ProposalWorkflowSettings = Tables<'proposal_workflow_settings'>
export type ProposalReviewerAssignments = Tables<'proposal_reviewer_assignments'>

export type ProposalStatusHistoryInsert = TablesInsert<'proposal_status_history'>
export type ProposalWorkflowPermissionsInsert = TablesInsert<'proposal_workflow_permissions'>
export type ProposalWorkflowSettingsInsert = TablesInsert<'proposal_workflow_settings'>
export type ProposalReviewerAssignmentsInsert = TablesInsert<'proposal_reviewer_assignments'>

export type ProposalStatusHistoryUpdate = TablesUpdate<'proposal_status_history'>
export type ProposalWorkflowPermissionsUpdate = TablesUpdate<'proposal_workflow_permissions'>
export type ProposalWorkflowSettingsUpdate = TablesUpdate<'proposal_workflow_settings'>
export type ProposalReviewerAssignmentsUpdate = TablesUpdate<'proposal_reviewer_assignments'>

export type ProposalStatusWorkflowData = Database['public']['Functions']['get_proposal_status_workflow']['Returns'][number]

// Research Session types and function return types
export type ResearchSessionWithStats = Database['public']['Functions']['get_user_research_sessions']['Returns'][number]
export type ResearchSessionStats = Database['public']['Functions']['get_research_session_stats']['Returns'] 