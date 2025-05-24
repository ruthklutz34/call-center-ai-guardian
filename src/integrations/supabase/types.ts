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
      call_evaluations: {
        Row: {
          ai_reasoning: string | null
          call_id: string
          comments: string | null
          created_at: string
          examples: string[] | null
          id: string
          rule_id: string
          score: number
        }
        Insert: {
          ai_reasoning?: string | null
          call_id: string
          comments?: string | null
          created_at?: string
          examples?: string[] | null
          id?: string
          rule_id: string
          score: number
        }
        Update: {
          ai_reasoning?: string | null
          call_id?: string
          comments?: string | null
          created_at?: string
          examples?: string[] | null
          id?: string
          rule_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "call_evaluations_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_evaluations_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "evaluation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      call_scores: {
        Row: {
          ai_summary: string | null
          call_id: string
          created_at: string
          critical_fails: number | null
          id: string
          recommendations: string[] | null
          status: Database["public"]["Enums"]["evaluation_status"] | null
          total_score: number
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          call_id: string
          created_at?: string
          critical_fails?: number | null
          id?: string
          recommendations?: string[] | null
          status?: Database["public"]["Enums"]["evaluation_status"] | null
          total_score: number
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          call_id?: string
          created_at?: string
          critical_fails?: number | null
          id?: string
          recommendations?: string[] | null
          status?: Database["public"]["Enums"]["evaluation_status"] | null
          total_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_scores_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      call_tags: {
        Row: {
          call_id: string
          confidence: number | null
          created_at: string
          id: string
          tag: string
        }
        Insert: {
          call_id: string
          confidence?: number | null
          created_at?: string
          id?: string
          tag: string
        }
        Update: {
          call_id?: string
          confidence?: number | null
          created_at?: string
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_tags_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          agent_id: string | null
          audio_url: string | null
          call_date: string
          company_id: string
          created_at: string
          duration: number | null
          id: string
          metadata: Json | null
          phone_number: string | null
          status: Database["public"]["Enums"]["call_status"] | null
          transcript: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          audio_url?: string | null
          call_date?: string
          company_id: string
          created_at?: string
          duration?: number | null
          id?: string
          metadata?: Json | null
          phone_number?: string | null
          status?: Database["public"]["Enums"]["call_status"] | null
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          audio_url?: string | null
          call_date?: string
          company_id?: string
          created_at?: string
          duration?: number | null
          id?: string
          metadata?: Json | null
          phone_number?: string | null
          status?: Database["public"]["Enums"]["call_status"] | null
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      evaluation_rules: {
        Row: {
          company_id: string
          created_at: string
          criteria: Json
          description: string | null
          id: string
          is_active: boolean | null
          is_critical: boolean | null
          name: string
          rule_type: Database["public"]["Enums"]["rule_type"]
          updated_at: string
          weight: number
        }
        Insert: {
          company_id: string
          created_at?: string
          criteria?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_critical?: boolean | null
          name: string
          rule_type: Database["public"]["Enums"]["rule_type"]
          updated_at?: string
          weight?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          criteria?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_critical?: boolean | null
          name?: string
          rule_type?: Database["public"]["Enums"]["rule_type"]
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          category: string | null
          company_id: string
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          company_id: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          settings: Json | null
          team_name: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          settings?: Json | null
          team_name?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          settings?: Json | null
          team_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      call_status:
        | "pending"
        | "transcribing"
        | "analyzing"
        | "completed"
        | "failed"
      evaluation_status: "pending" | "in_progress" | "completed" | "failed"
      rule_type:
        | "script_compliance"
        | "communication_quality"
        | "information_accuracy"
        | "business_procedures"
        | "emotional_analysis"
      user_role: "platform_admin" | "client_admin" | "supervisor" | "agent"
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
      call_status: [
        "pending",
        "transcribing",
        "analyzing",
        "completed",
        "failed",
      ],
      evaluation_status: ["pending", "in_progress", "completed", "failed"],
      rule_type: [
        "script_compliance",
        "communication_quality",
        "information_accuracy",
        "business_procedures",
        "emotional_analysis",
      ],
      user_role: ["platform_admin", "client_admin", "supervisor", "agent"],
    },
  },
} as const
