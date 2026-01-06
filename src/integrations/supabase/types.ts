export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      issue_reports: {
        Row: {
          assigned_collector_id: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          location: string | null
          rating: number | null
          reporter_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["issue_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_collector_id?: string | null
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          location?: string | null
          rating?: number | null
          reporter_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_collector_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          location?: string | null
          rating?: number | null
          reporter_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      issue_requests: {
        Row: {
          admin_notes: string | null
          collector_id: string
          created_at: string
          id: string
          issue_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          collector_id: string
          created_at?: string
          id?: string
          issue_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          collector_id?: string
          created_at?: string
          id?: string
          issue_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_requests_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issue_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      pickup_requests: {
        Row: {
          admin_notes: string | null
          collector_id: string
          created_at: string
          id: string
          pickup_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          collector_id: string
          created_at?: string
          id?: string
          pickup_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          collector_id?: string
          created_at?: string
          id?: string
          pickup_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_requests_pickup_id_fkey"
            columns: ["pickup_id"]
            isOneToOne: false
            referencedRelation: "waste_pickups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          banned: boolean
          banned_at: string | null
          banned_reason: string | null
          created_at: string
          failed_login_attempts: number | null
          id: string
          last_failed_login_at: string | null
          locked_until: string | null
          name: string
          phone: string | null
          referral_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          banned?: boolean
          banned_at?: string | null
          banned_reason?: string | null
          created_at?: string
          failed_login_attempts?: number | null
          id: string
          last_failed_login_at?: string | null
          locked_until?: string | null
          name: string
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          banned?: boolean
          banned_at?: string | null
          banned_reason?: string | null
          created_at?: string
          failed_login_attempts?: number | null
          id?: string
          last_failed_login_at?: string | null
          locked_until?: string | null
          name?: string
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reward_transactions: {
        Row: {
          created_at: string
          description: string
          id: string
          points: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          points: number
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          points?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      rewards: {
        Row: {
          created_at: string
          id: string
          points: number
          total_earned: number
          total_redeemed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points?: number
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          points_awarded: number | null
          referral_code: string
          referred_user_id: string
          referrer_id: string
          status: Database["public"]["Enums"]["referral_status"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          points_awarded?: number | null
          referral_code: string
          referred_user_id: string
          referrer_id: string
          status?: Database["public"]["Enums"]["referral_status"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          points_awarded?: number | null
          referral_code?: string
          referred_user_id?: string
          referrer_id?: string
          status?: Database["public"]["Enums"]["referral_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      waste_pickups: {
        Row: {
          collector_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          location: string | null
          notes: string | null
          proof_image_url: string | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["pickup_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          collector_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          proof_image_url?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["pickup_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          collector_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          proof_image_url?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["pickup_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_issue_request: {
        Args: { _request_id: string }
        Returns: undefined
      }
      approve_pickup_request: {
        Args: { _request_id: string }
        Returns: undefined
      }
      award_points: {
        Args: { _description: string; _points: number; _user_id: string }
        Returns: undefined
      }
      ban_user: {
        Args: { _reason?: string; _user_id: string }
        Returns: undefined
      }
      check_ip_rate_limit: { Args: { ip_addr: string }; Returns: Json }
      delete_user_account: { Args: { _user_id: string }; Returns: undefined }
      get_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          name: string
          pickups_completed: number
          points: number
          total_earned: number
          user_id: string
        }[]
      }
      get_public_profile: {
        Args: { profile_id: string }
        Returns: {
          id: string
          name: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      handle_failed_login: {
        Args: {
          failure_reason?: string
          ip_addr?: string
          user_agent_str?: string
          user_email: string
        }
        Returns: Json
      }
      handle_successful_login: {
        Args: { ip_addr?: string; user_agent_str?: string; user_email: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_account_locked: { Args: { user_email: string }; Returns: boolean }
      redeem_points: {
        Args: { _description: string; _points: number; _user_id: string }
        Returns: undefined
      }
      reject_issue_request: {
        Args: { _reason?: string; _request_id: string }
        Returns: undefined
      }
      reject_pickup_request: {
        Args: { _reason?: string; _request_id: string }
        Returns: undefined
      }
      unban_user: { Args: { _user_id: string }; Returns: undefined }
      update_user_streak: { Args: { _user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "citizen" | "company" | "collector" | "admin"
      issue_status: "pending" | "in_progress" | "resolved"
      pickup_status:
        | "pending"
        | "in_progress"
        | "collected"
        | "failed"
        | "delayed"
      referral_status: "pending" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["citizen", "company", "collector", "admin"],
      issue_status: ["pending", "in_progress", "resolved"],
      pickup_status: [
        "pending",
        "in_progress",
        "collected",
        "failed",
        "delayed",
      ],
      referral_status: ["pending", "completed"],
    },
  },
} as const
