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
      compatibility_rules: {
        Row: {
          compatibility: string
          confidence: number | null
          created_at: string | null
          id: string
          notes: string | null
          species_a_id: string
          species_b_id: string
        }
        Insert: {
          compatibility: string
          confidence?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          species_a_id: string
          species_b_id: string
        }
        Update: {
          compatibility?: string
          confidence?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          species_a_id?: string
          species_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compatibility_rules_species_a_id_fkey"
            columns: ["species_a_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compatibility_rules_species_b_id_fkey"
            columns: ["species_b_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      species: {
        Row: {
          aggression_level: number | null
          bioload_rating: number | null
          breeding_difficulty: string | null
          care_level: string | null
          common_name: string
          compatibility_tags: string[]
          created_at: string | null
          diet: string | null
          family: string | null
          id: string
          image_url: string | null
          invert_safe: boolean | null
          lifespan_years: number | null
          max_ph: number | null
          max_size_inches: number | null
          max_temp_f: number | null
          min_group_size: number | null
          min_ph: number | null
          min_temp_f: number | null
          origin: string | null
          plant_safe: boolean | null
          region: string | null
          schooling: boolean | null
          scientific_name: string
          slug: string
          summary: string | null
          tank_size_gal: number | null
          temperament: string | null
          updated_at: string | null
        }
        Insert: {
          aggression_level?: number | null
          bioload_rating?: number | null
          breeding_difficulty?: string | null
          care_level?: string | null
          common_name: string
          compatibility_tags?: string[]
          created_at?: string | null
          diet?: string | null
          family?: string | null
          id?: string
          image_url?: string | null
          invert_safe?: boolean | null
          lifespan_years?: number | null
          max_ph?: number | null
          max_size_inches?: number | null
          max_temp_f?: number | null
          min_group_size?: number | null
          min_ph?: number | null
          min_temp_f?: number | null
          origin?: string | null
          plant_safe?: boolean | null
          region?: string | null
          schooling?: boolean | null
          scientific_name: string
          slug: string
          summary?: string | null
          tank_size_gal?: number | null
          temperament?: string | null
          updated_at?: string | null
        }
        Update: {
          aggression_level?: number | null
          bioload_rating?: number | null
          breeding_difficulty?: string | null
          care_level?: string | null
          common_name?: string
          compatibility_tags?: string[]
          created_at?: string | null
          diet?: string | null
          family?: string | null
          id?: string
          image_url?: string | null
          invert_safe?: boolean | null
          lifespan_years?: number | null
          max_ph?: number | null
          max_size_inches?: number | null
          max_temp_f?: number | null
          min_group_size?: number | null
          min_ph?: number | null
          min_temp_f?: number | null
          origin?: string | null
          plant_safe?: boolean | null
          region?: string | null
          schooling?: boolean | null
          scientific_name?: string
          slug?: string
          summary?: string | null
          tank_size_gal?: number | null
          temperament?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      species_aliases: {
        Row: {
          alias: string
          created_at: string | null
          id: string
          species_id: string
        }
        Insert: {
          alias: string
          created_at?: string | null
          id?: string
          species_id: string
        }
        Update: {
          alias?: string
          created_at?: string | null
          id?: string
          species_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "species_aliases_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      tank_size_guidelines: {
        Row: {
          created_at: string | null
          gallons: number
          id: string
          notes: string | null
          scenario: string
          species_id: string
        }
        Insert: {
          created_at?: string | null
          gallons: number
          id?: string
          notes?: string | null
          scenario?: string
          species_id: string
        }
        Update: {
          created_at?: string | null
          gallons?: number
          id?: string
          notes?: string | null
          scenario?: string
          species_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tank_size_guidelines_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
