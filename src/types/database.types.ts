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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      compatibility_rules: {
        Row: {
          compatibility: string
          confidence: number | null
          created_at: string | null
          expert_notes: string | null
          expert_validated: boolean
          id: string
          notes: string | null
          species_a_id: string
          species_b_id: string
        }
        Insert: {
          compatibility: string
          confidence?: number | null
          created_at?: string | null
          expert_notes?: string | null
          expert_validated?: boolean
          id?: string
          notes?: string | null
          species_a_id: string
          species_b_id: string
        }
        Update: {
          compatibility?: string
          confidence?: number | null
          created_at?: string | null
          expert_notes?: string | null
          expert_validated?: boolean
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
      products: {
        Row: {
          brand: string
          category: string
          created_at: string
          description: string | null
          difficulty: string | null
          dimensions: string | null
          flow_rate_gph: number | null
          freshwater: boolean
          guide_rating: number | null
          heater_watts: number | null
          id: string
          image_url: string | null
          is_active: boolean
          light_output: string | null
          light_type: string | null
          model: string | null
          planted_tank: boolean
          price_estimate: number | null
          recommended_tank_max_gallons: number | null
          recommended_tank_min_gallons: number | null
          saltwater: boolean
          short_description: string | null
          slug: string
          substrate_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          brand: string
          category: string
          created_at?: string
          description?: string | null
          difficulty?: string | null
          dimensions?: string | null
          flow_rate_gph?: number | null
          freshwater?: boolean
          guide_rating?: number | null
          heater_watts?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          light_output?: string | null
          light_type?: string | null
          model?: string | null
          planted_tank?: boolean
          price_estimate?: number | null
          recommended_tank_max_gallons?: number | null
          recommended_tank_min_gallons?: number | null
          saltwater?: boolean
          short_description?: string | null
          slug: string
          substrate_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          brand?: string
          category?: string
          created_at?: string
          description?: string | null
          difficulty?: string | null
          dimensions?: string | null
          flow_rate_gph?: number | null
          freshwater?: boolean
          guide_rating?: number | null
          heater_watts?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          light_output?: string | null
          light_type?: string | null
          model?: string | null
          planted_tank?: boolean
          price_estimate?: number | null
          recommended_tank_max_gallons?: number | null
          recommended_tank_min_gallons?: number | null
          saltwater?: boolean
          short_description?: string | null
          slug?: string
          substrate_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      plants: {
        Row: {
          care_level: string
          co2_required: boolean
          common_name: string
          created_at: string
          description: string | null
          growth_rate: string | null
          id: string
          image_url: string | null
          is_active: boolean
          maximum_height_inches: number | null
          maximum_light_level: string | null
          maximum_ph: number | null
          maximum_temperature_f: number | null
          minimum_light_level: string | null
          minimum_ph: number | null
          minimum_tank_gallons: number | null
          minimum_temperature_f: number | null
          placement: string | null
          scientific_name: string
          slug: string
          updated_at: string
        }
        Insert: {
          care_level: string
          co2_required?: boolean
          common_name: string
          created_at?: string
          description?: string | null
          growth_rate?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          maximum_height_inches?: number | null
          maximum_light_level?: string | null
          maximum_ph?: number | null
          maximum_temperature_f?: number | null
          minimum_light_level?: string | null
          minimum_ph?: number | null
          minimum_tank_gallons?: number | null
          minimum_temperature_f?: number | null
          placement?: string | null
          scientific_name: string
          slug: string
          updated_at?: string
        }
        Update: {
          care_level?: string
          co2_required?: boolean
          common_name?: string
          created_at?: string
          description?: string | null
          growth_rate?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          maximum_height_inches?: number | null
          maximum_light_level?: string | null
          maximum_ph?: number | null
          maximum_temperature_f?: number | null
          minimum_light_level?: string | null
          minimum_ph?: number | null
          minimum_tank_gallons?: number | null
          minimum_temperature_f?: number | null
          placement?: string | null
          scientific_name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      species: {
        Row: {
          aggression_level: number | null
          activity_level: string | null
          armored_body: boolean
          bioload_rating: number | null
          bonded_pair_suitable: boolean
          breeding_aggression: boolean
          breeding_difficulty: string | null
          care_level: string | null
          care_warnings: string[]
          common_name: string
          compatibility_tags: string[]
          competitive_feeder: boolean
          created_at: string | null
          data_confidence: string
          delicate_species: boolean
          deep_bodied: boolean
          diet: string | null
          family: string | null
          fin_nipping_risk: boolean
          flow_preference: string | null
          hardness_preference: string | null
          id: string
          image_url: string | null
          invert_safe: boolean | null
          lifespan_years: number | null
          long_fin_vulnerable: boolean
          max_ph: number | null
          max_gh_dgh: number | null
          max_kh_dkh: number | null
          max_size_inches: number | null
          max_temp_f: number | null
          recommended_max_temp_f: number | null
          min_gh_dgh: number | null
          min_group_size: number | null
          min_kh_dkh: number | null
          min_ph: number | null
          min_temp_f: number | null
          recommended_min_temp_f: number | null
          mouth_gape_risk: boolean
          origin: string | null
          plant_safe: boolean | null
          preferred_tank_style: string | null
          ph_stability_required: boolean
          region: string | null
          schooling: boolean | null
          scientific_name: string
          slug: string
          slow_moving: boolean
          specialist_setup: boolean
          species_only_preferred: boolean
          slender_prey_body: boolean
          summary: string | null
          surface_predator: boolean
          tank_size_gal: number | null
          temp_source_notes: string | null
          temperament: string | null
          temperature_category: string | null
          tolerated_max_temp_f: number | null
          tolerated_min_temp_f: number | null
          territory_footprint: string | null
          territory_zone: string | null
          updated_at: string | null
        }
        Insert: {
          aggression_level?: number | null
          activity_level?: string | null
          armored_body?: boolean
          bioload_rating?: number | null
          bonded_pair_suitable?: boolean
          breeding_aggression?: boolean
          breeding_difficulty?: string | null
          care_level?: string | null
          care_warnings?: string[]
          common_name: string
          compatibility_tags?: string[]
          competitive_feeder?: boolean
          created_at?: string | null
          data_confidence?: string
          delicate_species?: boolean
          deep_bodied?: boolean
          diet?: string | null
          family?: string | null
          fin_nipping_risk?: boolean
          flow_preference?: string | null
          hardness_preference?: string | null
          id?: string
          image_url?: string | null
          invert_safe?: boolean | null
          lifespan_years?: number | null
          long_fin_vulnerable?: boolean
          max_ph?: number | null
          max_gh_dgh?: number | null
          max_kh_dkh?: number | null
          max_size_inches?: number | null
          max_temp_f?: number | null
          recommended_max_temp_f?: number | null
          min_gh_dgh?: number | null
          min_group_size?: number | null
          min_kh_dkh?: number | null
          min_ph?: number | null
          min_temp_f?: number | null
          recommended_min_temp_f?: number | null
          mouth_gape_risk?: boolean
          origin?: string | null
          plant_safe?: boolean | null
          preferred_tank_style?: string | null
          ph_stability_required?: boolean
          region?: string | null
          schooling?: boolean | null
          scientific_name: string
          slug: string
          slow_moving?: boolean
          specialist_setup?: boolean
          species_only_preferred?: boolean
          slender_prey_body?: boolean
          summary?: string | null
          surface_predator?: boolean
          tank_size_gal?: number | null
          temp_source_notes?: string | null
          temperament?: string | null
          temperature_category?: string | null
          tolerated_max_temp_f?: number | null
          tolerated_min_temp_f?: number | null
          territory_footprint?: string | null
          territory_zone?: string | null
          updated_at?: string | null
        }
        Update: {
          aggression_level?: number | null
          activity_level?: string | null
          armored_body?: boolean
          bioload_rating?: number | null
          bonded_pair_suitable?: boolean
          breeding_aggression?: boolean
          breeding_difficulty?: string | null
          care_level?: string | null
          care_warnings?: string[]
          common_name?: string
          compatibility_tags?: string[]
          competitive_feeder?: boolean
          created_at?: string | null
          data_confidence?: string
          delicate_species?: boolean
          deep_bodied?: boolean
          diet?: string | null
          family?: string | null
          fin_nipping_risk?: boolean
          flow_preference?: string | null
          hardness_preference?: string | null
          id?: string
          image_url?: string | null
          invert_safe?: boolean | null
          lifespan_years?: number | null
          long_fin_vulnerable?: boolean
          max_ph?: number | null
          max_gh_dgh?: number | null
          max_kh_dkh?: number | null
          max_size_inches?: number | null
          max_temp_f?: number | null
          recommended_max_temp_f?: number | null
          min_gh_dgh?: number | null
          min_group_size?: number | null
          min_kh_dkh?: number | null
          min_ph?: number | null
          min_temp_f?: number | null
          recommended_min_temp_f?: number | null
          mouth_gape_risk?: boolean
          origin?: string | null
          plant_safe?: boolean | null
          preferred_tank_style?: string | null
          ph_stability_required?: boolean
          region?: string | null
          schooling?: boolean | null
          scientific_name?: string
          slug?: string
          slow_moving?: boolean
          specialist_setup?: boolean
          species_only_preferred?: boolean
          slender_prey_body?: boolean
          summary?: string | null
          surface_predator?: boolean
          tank_size_gal?: number | null
          temp_source_notes?: string | null
          temperament?: string | null
          temperature_category?: string | null
          tolerated_max_temp_f?: number | null
          tolerated_min_temp_f?: number | null
          territory_footprint?: string | null
          territory_zone?: string | null
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
      species_source_references: {
        Row: {
          confidence: string
          created_at: string
          id: string
          notes: string | null
          source_category: string
          source_label: string | null
          source_url: string
          species_id: string
          updated_at: string
        }
        Insert: {
          confidence?: string
          created_at?: string
          id?: string
          notes?: string | null
          source_category?: string
          source_label?: string | null
          source_url: string
          species_id: string
          updated_at?: string
        }
        Update: {
          confidence?: string
          created_at?: string
          id?: string
          notes?: string | null
          source_category?: string
          source_label?: string | null
          source_url?: string
          species_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "species_source_references_species_id_fkey"
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
      water_parameters: {
        Row: {
          created_at: string | null
          id: string
          max_hardness_dgh: number | null
          max_ph: number | null
          max_temp_f: number | null
          min_hardness_dgh: number | null
          min_ph: number | null
          min_temp_f: number | null
          species_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_hardness_dgh?: number | null
          max_ph?: number | null
          max_temp_f?: number | null
          min_hardness_dgh?: number | null
          min_ph?: number | null
          min_temp_f?: number | null
          species_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          max_hardness_dgh?: number | null
          max_ph?: number | null
          max_temp_f?: number | null
          min_hardness_dgh?: number | null
          min_ph?: number | null
          min_temp_f?: number | null
          species_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "water_parameters_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
