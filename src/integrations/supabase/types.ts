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
      contact_profiles: {
        Row: {
          company: string | null
          created_at: string
          display_name: string | null
          email: string | null
          how_we_met: string | null
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          pinned: boolean
          pinned_order: number | null
          private_notes: string | null
          relationship_type: string
          source_tag: string
          title: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          how_we_met?: string | null
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          pinned?: boolean
          pinned_order?: number | null
          private_notes?: string | null
          relationship_type?: string
          source_tag?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          how_we_met?: string | null
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          pinned?: boolean
          pinned_order?: number | null
          private_notes?: string | null
          relationship_type?: string
          source_tag?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_tags: {
        Row: {
          color: string
          contact_name: string
          created_at: string
          id: string
          tag: string
        }
        Insert: {
          color?: string
          contact_name: string
          created_at?: string
          id?: string
          tag: string
        }
        Update: {
          color?: string
          contact_name?: string
          created_at?: string
          id?: string
          tag?: string
        }
        Relationships: []
      }
      custom_signal_types: {
        Row: {
          color_bg: string
          color_border: string
          color_text: string
          created_at: string
          description: string | null
          id: string
          training_examples: Json
          type_name: string
        }
        Insert: {
          color_bg?: string
          color_border?: string
          color_text?: string
          created_at?: string
          description?: string | null
          id?: string
          training_examples?: Json
          type_name: string
        }
        Update: {
          color_bg?: string
          color_border?: string
          color_text?: string
          created_at?: string
          description?: string | null
          id?: string
          training_examples?: Json
          type_name?: string
        }
        Relationships: []
      }
      engagement_sequences: {
        Row: {
          contact_name: string
          created_at: string
          enabled: boolean
          id: string
          interval_days: number
          last_fired_at: string | null
          next_due_at: string
          note: string | null
          sequence_type: string
        }
        Insert: {
          contact_name: string
          created_at?: string
          enabled?: boolean
          id?: string
          interval_days?: number
          last_fired_at?: string | null
          next_due_at?: string
          note?: string | null
          sequence_type?: string
        }
        Update: {
          contact_name?: string
          created_at?: string
          enabled?: boolean
          id?: string
          interval_days?: number
          last_fired_at?: string | null
          next_due_at?: string
          note?: string | null
          sequence_type?: string
        }
        Relationships: []
      }
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
      feedback_entries: {
        Row: {
          ai_summaries: Json | null
          author: string
          chatgpt_links: string[]
          created_at: string
          id: string
          narrative: string
          parsed_chatgpt: Json | null
          screenshot_urls: string[]
          sprint_processed: boolean
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          ai_summaries?: Json | null
          author: string
          chatgpt_links?: string[]
          created_at?: string
          id?: string
          narrative?: string
          parsed_chatgpt?: Json | null
          screenshot_urls?: string[]
          sprint_processed?: boolean
          status?: string
          subject?: string
          updated_at?: string
        }
        Update: {
          ai_summaries?: Json | null
          author?: string
          chatgpt_links?: string[]
          created_at?: string
          id?: string
          narrative?: string
          parsed_chatgpt?: Json | null
          screenshot_urls?: string[]
          sprint_processed?: boolean
          status?: string
          subject?: string
          updated_at?: string
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
      meeting_speakers: {
        Row: {
          created_at: string
          id: string
          signal_id: string
          speaker_profile_id: string
          turn_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          signal_id: string
          speaker_profile_id: string
          turn_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          signal_id?: string
          speaker_profile_id?: string
          turn_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "meeting_speakers_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_speakers_speaker_profile_id_fkey"
            columns: ["speaker_profile_id"]
            isOneToOne: false
            referencedRelation: "speaker_profiles"
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
      relationship_alerts: {
        Row: {
          alert_type: string
          contact_name: string
          created_at: string
          current_strength: number
          dismissed: boolean
          id: string
          previous_strength: number
        }
        Insert: {
          alert_type?: string
          contact_name: string
          created_at?: string
          current_strength?: number
          dismissed?: boolean
          id?: string
          previous_strength?: number
        }
        Update: {
          alert_type?: string
          contact_name?: string
          created_at?: string
          current_strength?: number
          dismissed?: boolean
          id?: string
          previous_strength?: number
        }
        Relationships: []
      }
      relationship_briefs: {
        Row: {
          brief_text: string
          contact_name: string
          generated_at: string
          id: string
        }
        Insert: {
          brief_text: string
          contact_name: string
          generated_at?: string
          id?: string
        }
        Update: {
          brief_text?: string
          contact_name?: string
          generated_at?: string
          id?: string
        }
        Relationships: []
      }
      signal_briefs: {
        Row: {
          context_id: string | null
          generated_at: string
          headline: string
          id: string
          items: Json
          summary: string
          user_id: string
        }
        Insert: {
          context_id?: string | null
          generated_at?: string
          headline: string
          id?: string
          items?: Json
          summary: string
          user_id: string
        }
        Update: {
          context_id?: string | null
          generated_at?: string
          headline?: string
          id?: string
          items?: Json
          summary?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_briefs_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "user_contexts"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_corrections: {
        Row: {
          corrected_at: string
          corrected_priority: string | null
          corrected_type: string | null
          id: string
          original_priority: string
          original_type: string
          signal_id: string
        }
        Insert: {
          corrected_at?: string
          corrected_priority?: string | null
          corrected_type?: string | null
          id?: string
          original_priority: string
          original_type: string
          signal_id: string
        }
        Update: {
          corrected_at?: string
          corrected_priority?: string | null
          corrected_type?: string | null
          id?: string
          original_priority?: string
          original_type?: string
          signal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_corrections_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          actions_taken: string[]
          call_pointer: string | null
          captured_at: string
          classification_reasoning: string | null
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
          classification_reasoning?: string | null
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
          classification_reasoning?: string | null
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
      speaker_profiles: {
        Row: {
          aliases: string[]
          created_at: string
          email: string | null
          first_seen_at: string
          id: string
          last_seen_at: string
          meeting_count: number
          metadata: Json | null
          name: string
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          email?: string | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          meeting_count?: number
          metadata?: Json | null
          name: string
        }
        Update: {
          aliases?: string[]
          created_at?: string
          email?: string | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          meeting_count?: number
          metadata?: Json | null
          name?: string
        }
        Relationships: []
      }
      sprint_items: {
        Row: {
          ai_reasoning: string | null
          created_at: string
          description: string
          effort: string
          feedback_entry_id: string | null
          id: string
          priority: string
          sprint_phase: number
          status: string
          subject: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_reasoning?: string | null
          created_at?: string
          description?: string
          effort?: string
          feedback_entry_id?: string | null
          id?: string
          priority?: string
          sprint_phase?: number
          status?: string
          subject?: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_reasoning?: string | null
          created_at?: string
          description?: string
          effort?: string
          feedback_entry_id?: string | null
          id?: string
          priority?: string
          sprint_phase?: number
          status?: string
          subject?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_items_feedback_entry_id_fkey"
            columns: ["feedback_entry_id"]
            isOneToOne: false
            referencedRelation: "feedback_entries"
            referencedColumns: ["id"]
          },
        ]
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
      user_contexts: {
        Row: {
          context_type: string
          created_at: string
          id: string
          is_primary: boolean
          name: string
          user_id: string
        }
        Insert: {
          context_type?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          name: string
          user_id: string
        }
        Update: {
          context_type?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          active_context_id: string | null
          context_setup_complete: boolean
          created_at: string
          delivery_email: boolean
          delivery_email_address: string | null
          delivery_push: boolean
          delivery_sms: boolean
          delivery_time: string
          delivery_timezone: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_context_id?: string | null
          context_setup_complete?: boolean
          created_at?: string
          delivery_email?: boolean
          delivery_email_address?: string | null
          delivery_push?: boolean
          delivery_sms?: boolean
          delivery_time?: string
          delivery_timezone?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_context_id?: string | null
          context_setup_complete?: boolean
          created_at?: string
          delivery_email?: boolean
          delivery_email_address?: string | null
          delivery_push?: boolean
          delivery_sms?: boolean
          delivery_time?: string
          delivery_timezone?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_active_context_id_fkey"
            columns: ["active_context_id"]
            isOneToOne: false
            referencedRelation: "user_contexts"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          action_steps: Json
          created_at: string
          enabled: boolean
          id: string
          name: string
          trigger_config: Json
        }
        Insert: {
          action_steps?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          trigger_config?: Json
        }
        Update: {
          action_steps?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          trigger_config?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      refresh_demo_timestamps: { Args: never; Returns: undefined }
    }
    Enums: {
      signal_priority: "high" | "medium" | "low"
      signal_risk_level: "low" | "medium" | "high" | "critical"
      signal_source:
        | "linq"
        | "gmail"
        | "manual"
        | "recall"
        | "phone"
        | "fireflies"
        | "otter"
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
      signal_source: [
        "linq",
        "gmail",
        "manual",
        "recall",
        "phone",
        "fireflies",
        "otter",
      ],
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
