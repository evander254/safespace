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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          client_id: string
          created_at: string
          id: string
          notes: string | null
          session_date: string
          session_time: string
          status: Database["public"]["Enums"]["booking_status"]
          therapist_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          session_date: string
          session_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          therapist_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          session_date?: string
          session_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          therapist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          booking_id: string | null
          client_id: string | null
          commission_percentage: number | null
          created_at: string | null
          id: string
          therapist_id: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          client_id?: string | null
          commission_percentage?: number | null
          created_at?: string | null
          id?: string
          therapist_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          client_id?: string | null
          commission_percentage?: number | null
          created_at?: string | null
          id?: string
          therapist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      client_intake: {
        Row: {
          id: string
          user_id: string
          primary_concerns: string[]
          concern_trigger: string | null
          affected_areas: string[]
          therapy_goals: string[]
          goals_detail: string | null
          gender: string | null
          ethnicity: string | null
          religion: string | null
          identity_match_importance: number
          therapeutic_style: string | null
          therapy_approach: string | null
          communication_notes: string | null
          availability: string[]
          budget_range: string | null
          insurance_provider: string | null
          preferred_channel: string | null
          previous_therapy: string | null
          previous_therapy_feedback: string | null
          current_safety: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          primary_concerns?: string[]
          concern_trigger?: string | null
          affected_areas?: string[]
          therapy_goals?: string[]
          goals_detail?: string | null
          gender?: string | null
          ethnicity?: string | null
          religion?: string | null
          identity_match_importance?: number
          therapeutic_style?: string | null
          therapy_approach?: string | null
          communication_notes?: string | null
          availability?: string[]
          budget_range?: string | null
          insurance_provider?: string | null
          preferred_channel?: string | null
          previous_therapy?: string | null
          previous_therapy_feedback?: string | null
          current_safety?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          primary_concerns?: string[]
          concern_trigger?: string | null
          affected_areas?: string[]
          therapy_goals?: string[]
          goals_detail?: string | null
          gender?: string | null
          ethnicity?: string | null
          religion?: string | null
          identity_match_importance?: number
          therapeutic_style?: string | null
          therapy_approach?: string | null
          communication_notes?: string | null
          availability?: string[]
          budget_range?: string | null
          insurance_provider?: string | null
          preferred_channel?: string | null
          previous_therapy?: string | null
          previous_therapy_feedback?: string | null
          current_safety?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          sender_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          sender_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          content: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          content: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          content?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          checkout_request_id: string | null
          created_at: string
          id: string
          mpesa_receipt: string | null
          phone_number: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id: string
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          mpesa_receipt?: string | null
          phone_number: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          mpesa_receipt?: string | null
          phone_number?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          client_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          therapist_id: string
        }
        Insert: {
          booking_id: string
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          therapist_id: string
        }
        Update: {
          booking_id?: string
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          end_date: string
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          user_id?: string
        }
        Relationships: []
      }
      therapists: {
        Row: {
          accepts_insurance: boolean
          availability: Json
          avatar_url: string | null
          bio: string | null
          completed_sessions_count: number
          created_at: string
          engagement_style_directive: number
          engagement_style_formal: number
          excluded_populations: string[]
          faith_based_integration: boolean
          full_name: string
          id: string
          insurance_plans: string[]
          intro_video_url: string | null
          is_approved: boolean
          jurisdiction: string | null
          languages: string[]
          license_number: string | null
          license_type: string | null
          lived_experience: string[]
          malpractice_insurance_verified: boolean
          modalities: string[]
          onboarding_completed: boolean
          onboarding_step: number
          price_per_session: number
          rating: number
          reviews_count: number
          session_types: string[]
          sliding_scale: boolean
          specializations: string[]
          updated_at: string
        }
        Insert: {
          accepts_insurance?: boolean
          availability?: Json
          avatar_url?: string | null
          bio?: string | null
          completed_sessions_count?: number
          created_at?: string
          engagement_style_directive?: number
          engagement_style_formal?: number
          excluded_populations?: string[]
          faith_based_integration?: boolean
          full_name: string
          id: string
          insurance_plans?: string[]
          intro_video_url?: string | null
          is_approved?: boolean
          jurisdiction?: string | null
          languages?: string[]
          license_number?: string | null
          license_type?: string | null
          lived_experience?: string[]
          malpractice_insurance_verified?: boolean
          modalities?: string[]
          onboarding_completed?: boolean
          onboarding_step?: number
          price_per_session?: number
          rating?: number
          reviews_count?: number
          session_types?: string[]
          sliding_scale?: boolean
          specializations?: string[]
          updated_at?: string
        }
        Update: {
          accepts_insurance?: boolean
          availability?: Json
          avatar_url?: string | null
          bio?: string | null
          completed_sessions_count?: number
          created_at?: string
          engagement_style_directive?: number
          engagement_style_formal?: number
          excluded_populations?: string[]
          faith_based_integration?: boolean
          full_name?: string
          id?: string
          insurance_plans?: string[]
          intro_video_url?: string | null
          is_approved?: boolean
          jurisdiction?: string | null
          languages?: string[]
          license_number?: string | null
          license_type?: string | null
          lived_experience?: string[]
          malpractice_insurance_verified?: boolean
          modalities?: string[]
          onboarding_completed?: boolean
          onboarding_step?: number
          price_per_session?: number
          rating?: number
          reviews_count?: number
          session_types?: string[]
          sliding_scale?: boolean
          specializations?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
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
      video_sessions: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          meeting_link: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          meeting_link: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          meeting_link?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_sessions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_count: number
          therapist_count: number
          approved_therapists: number
          total_commissions: number
          booking_stats: {
            total: number
            completed: number
            confirmed: number
            pending: number
            cancelled: number
          }
          new_users_week: number
          new_therapists_week: number
          weekly_commissions: number
          recent_pending_therapists: any[]
          recent_clients: any[]
        }
      }
      get_all_applications: {
        Args: Record<PropertyKey, never>
        Returns: any[]
      }
      check_admin_credentials: {
        Args: {
          p_password: string
          p_username: string
        }
        Returns: {
          id: string
          username: string
          full_name: string
        }[]
      }
      get_all_commissions: {
        Args: Record<PropertyKey, never>
        Returns: any[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      get_all_bookings_admin: {
        Args: Record<PropertyKey, never>
        Returns: any[]
      }
      get_all_users_admin: {
        Args: Record<PropertyKey, never>
        Returns: any[]
      }
      get_all_therapists_admin: {
        Args: Record<PropertyKey, never>
        Returns: any[]
      }
      admin_action_therapist: {
        Args: {
          p_is_approved: boolean
          p_therapist_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "client" | "therapist" | "admin"
      booking_status: "pending" | "confirmed" | "completed" | "cancelled"
      payment_status: "pending" | "success" | "failed"
      subscription_plan: "basic" | "premium"
      subscription_status: "active" | "expired" | "cancelled"
      transaction_type: "deposit" | "withdrawal" | "payment" | "refund"
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
      app_role: ["client", "therapist", "admin"],
      booking_status: ["pending", "confirmed", "completed", "cancelled"],
      payment_status: ["pending", "success", "failed"],
      subscription_plan: ["basic", "premium"],
      subscription_status: ["active", "expired", "cancelled"],
    },
  },
} as const
