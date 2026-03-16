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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      error_logs: {
        Row: {
          created_at: string
          error_context: Json | null
          error_message: string
          function_name: string
          id: string
        }
        Insert: {
          created_at?: string
          error_context?: Json | null
          error_message: string
          function_name: string
          id?: string
        }
        Update: {
          created_at?: string
          error_context?: Json | null
          error_message?: string
          function_name?: string
          id?: string
        }
        Relationships: []
      }
      meeting_artifacts: {
        Row: {
          attendees: Json | null
          created_at: string
          id: string
          recording_url: string | null
          signal_id: string
          summary_text: string | null
          transcript_json: Json | null
        }
        Insert: {
          attendees?: Json | null
          created_at?: string
          id?: string
          recording_url?: string | null
          signal_id: string
          summary_text?: string | null
          transcript_json?: Json | null
        }
        Update: {
          attendees?: Json | null
          created_at?: string
          id?: string
          recording_url?: string | null
          signal_id?: string
          summary_text?: string | null
          transcript_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_artifacts_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_meeting_briefs: {
        Row: {
          attendee_context: Json
          brief_text: string
          created_at: string
          delivered_dashboard: boolean
          delivered_linq: boolean
          dismissed: boolean
          id: string
          matched_signals: Json
          meeting_id: string
        }
        Insert: {
          attendee_context?: Json
          brief_text: string
          created_at?: string
          delivered_dashboard?: boolean
          delivered_linq?: boolean
          dismissed?: boolean
          id?: string
          matched_signals?: Json
          meeting_id: string
        }
        Update: {
          attendee_context?: Json
          brief_text?: string
          created_at?: string
          delivered_dashboard?: boolean
          delivered_linq?: boolean
          dismissed?: boolean
          id?: string
          matched_signals?: Json
          meeting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_meeting_briefs_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "upcoming_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          actions_taken: string[]
          call_pointer: string | null
          captured_at: string
          confidence_score: number | null
          created_at: string
          due_date: string | null
          email_metadata: Json | null
          id: string
          linq_message_id: string | null
          meeting_id: string | null
          pinned: boolean
          priority: Database["public"]["Enums"]["signal_priority"]
          raw_payload: Json | null
          risk_level: Database["public"]["Enums"]["signal_risk_level"] | null
          sender: string
          signal_type: Database["public"]["Enums"]["signal_type"]
          source: Database["public"]["Enums"]["signal_source"]
          source_message: string
          status: Database["public"]["Enums"]["signal_status"]
          summary: string
        }
        Insert: {
          actions_taken?: string[]
          call_pointer?: string | null
          captured_at?: string
          confidence_score?: number | null
          created_at?: string
          due_date?: string | null
          email_metadata?: Json | null
          id?: string
          linq_message_id?: string | null
          meeting_id?: string | null
          pinned?: boolean
          priority?: Database["public"]["Enums"]["signal_priority"]
          raw_payload?: Json | null
          risk_level?: Database["public"]["Enums"]["signal_risk_level"] | null
          sender: string
          signal_type?: Database["public"]["Enums"]["signal_type"]
          source?: Database["public"]["Enums"]["signal_source"]
          source_message: string
          status?: Database["public"]["Enums"]["signal_status"]
          summary: string
        }
        Update: {
          actions_taken?: string[]
          call_pointer?: string | null
          captured_at?: string
          confidence_score?: number | null
          created_at?: string
          due_date?: string | null
          email_metadata?: Json | null
          id?: string
          linq_message_id?: string | null
          meeting_id?: string | null
          pinned?: boolean
          priority?: Database["public"]["Enums"]["signal_priority"]
          raw_payload?: Json | null
          risk_level?: Database["public"]["Enums"]["signal_risk_level"] | null
          sender?: string
          signal_type?: Database["public"]["Enums"]["signal_type"]
          source?: Database["public"]["Enums"]["signal_source"]
          source_message?: string
          status?: Database["public"]["Enums"]["signal_status"]
          summary?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      upcoming_meetings: {
        Row: {
          attendees: Json
          briefed: boolean
          calendar_event_id: string | null
          created_at: string
          ends_at: string | null
          id: string
          starts_at: string
          title: string
          zoom_meeting_id: string | null
        }
        Insert: {
          attendees?: Json
          briefed?: boolean
          calendar_event_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          starts_at: string
          title: string
          zoom_meeting_id?: string | null
        }
        Update: {
          attendees?: Json
          briefed?: boolean
          calendar_event_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          starts_at?: string
          title?: string
          zoom_meeting_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      signal_priority: "high" | "medium" | "low"
      signal_risk_level: "low" | "medium" | "high" | "critical"
      signal_source: "linq" | "gmail" | "manual" | "recall" | "phone"
      signal_status: "Captured" | "In Progress" | "Complete"
      signal_type:
        | "INTRO"
        | "INSIGHT"
        | "INVESTMENT"
        | "DECISION"
        | "CONTEXT"
        | "NOISE"
        | "MEETING"
        | "PHONE_CALL"
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
      signal_priority: ["high", "medium", "low"],
      signal_risk_level: ["low", "medium", "high", "critical"],
      signal_source: ["linq", "gmail", "manual", "recall", "phone"],
      signal_status: ["Captured", "In Progress", "Complete"],
      signal_type: [
        "INTRO",
        "INSIGHT",
        "INVESTMENT",
        "DECISION",
        "CONTEXT",
        "NOISE",
        "MEETING",
        "PHONE_CALL",
      ],
    },
  },
} as const
