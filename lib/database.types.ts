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
          source_page: number | null
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
          source_page?: number | null
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
          source_page?: number | null
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
      organizations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
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
          proposal_id: string
          query: string
          results: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          proposal_id: string
          query: string
          results?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          proposal_id?: string
          query?: string
          results?: Json | null
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
            foreignKeyName: "research_sessions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
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
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization_and_user: {
        Args: {
          user_email: string
          user_full_name: string
          organization_name?: string
          organization_id?: string
        }
        Returns: string
      }
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
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_manager_or_above: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_manager_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      owns_file: {
        Args: { file_owner_id: string }
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
    }
    Enums: {
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

export type UserRole = Database['public']['Enums']['user_role']
export type ProposalStatus = Database['public']['Enums']['proposal_status']
export type SectionStatus = Database['public']['Enums']['section_status']

export type UserInsert = TablesInsert<'users'>
export type ProposalInsert = TablesInsert<'proposals'>
export type SectionInsert = TablesInsert<'sections'>
export type ComplianceItemInsert = TablesInsert<'compliance_items'>
export type AnswerBankInsert = TablesInsert<'answer_bank'>
export type ResearchSessionInsert = TablesInsert<'research_sessions'>

export type UserUpdate = TablesUpdate<'users'>
export type ProposalUpdate = TablesUpdate<'proposals'>
export type SectionUpdate = TablesUpdate<'sections'>
export type ComplianceItemUpdate = TablesUpdate<'compliance_items'>
export type AnswerBankUpdate = TablesUpdate<'answer_bank'>
export type ResearchSessionUpdate = TablesUpdate<'research_sessions'>

// Database function types for enhanced functionality
export type ProposalDeadlineData = Database['public']['Functions']['get_proposals_approaching_deadline']['Returns'][number] 