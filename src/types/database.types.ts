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
      article_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      article_category_assignments: {
        Row: {
          article_id: string
          category_id: string
        }
        Insert: {
          article_id: string
          category_id: string
        }
        Update: {
          article_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_category_assignments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_category_assignments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "article_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      article_images: {
        Row: {
          article_id: string
          display_order: number
          image_id: string
        }
        Insert: {
          article_id: string
          display_order: number
          image_id: string
        }
        Update: {
          article_id?: string
          display_order?: number
          image_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_images_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_images_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "content_images"
            referencedColumns: ["id"]
          },
        ]
      }
      article_related_articles: {
        Row: {
          article_id: string
          display_order: number
          related_article_id: string
          relationship_label: string | null
        }
        Insert: {
          article_id: string
          display_order: number
          related_article_id: string
          relationship_label?: string | null
        }
        Update: {
          article_id?: string
          display_order?: number
          related_article_id?: string
          relationship_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_related_articles_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_related_articles_related_article_id_fkey"
            columns: ["related_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_related_care_guides: {
        Row: {
          article_id: string
          care_guide_id: string
          display_order: number
          relationship_label: string | null
        }
        Insert: {
          article_id: string
          care_guide_id: string
          display_order: number
          relationship_label?: string | null
        }
        Update: {
          article_id?: string
          care_guide_id?: string
          display_order?: number
          relationship_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_related_care_guides_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_related_care_guides_care_guide_id_fkey"
            columns: ["care_guide_id"]
            isOneToOne: false
            referencedRelation: "care_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      article_sections: {
        Row: {
          article_id: string
          block_type: string
          content: Json
          created_at: string
          display_order: number
          id: string
          updated_at: string
        }
        Insert: {
          article_id: string
          block_type: string
          content?: Json
          created_at?: string
          display_order: number
          id?: string
          updated_at?: string
        }
        Update: {
          article_id?: string
          block_type?: string
          content?: Json
          created_at?: string
          display_order?: number
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_sections_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_sources: {
        Row: {
          article_id: string
          citation_label: string | null
          display_order: number
          source_id: string
        }
        Insert: {
          article_id: string
          citation_label?: string | null
          display_order: number
          source_id: string
        }
        Update: {
          article_id?: string
          citation_label?: string | null
          display_order?: number
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_sources_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      article_tag_assignments: {
        Row: {
          article_id: string
          tag_id: string
        }
        Insert: {
          article_id: string
          tag_id: string
        }
        Update: {
          article_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_tag_assignments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "article_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      article_tags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          canonical_url: string | null
          created_at: string
          featured_image_id: string | null
          id: string
          is_featured: boolean
          meta_description: string | null
          open_graph_image_id: string | null
          published_at: string | null
          seo_title: string | null
          slug: string | null
          status: string
          summary: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          featured_image_id?: string | null
          id?: string
          is_featured?: boolean
          meta_description?: string | null
          open_graph_image_id?: string | null
          published_at?: string | null
          seo_title?: string | null
          slug?: string | null
          status?: string
          summary?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          featured_image_id?: string | null
          id?: string
          is_featured?: boolean
          meta_description?: string | null
          open_graph_image_id?: string | null
          published_at?: string | null
          seo_title?: string | null
          slug?: string | null
          status?: string
          summary?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_featured_image_id_fkey"
            columns: ["featured_image_id"]
            isOneToOne: false
            referencedRelation: "content_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_open_graph_image_id_fkey"
            columns: ["open_graph_image_id"]
            isOneToOne: false
            referencedRelation: "content_images"
            referencedColumns: ["id"]
          },
        ]
      }
      care_guide_images: {
        Row: {
          care_guide_id: string
          created_at: string
          display_order: number
          image_id: string
          is_primary: boolean
        }
        Insert: {
          care_guide_id: string
          created_at?: string
          display_order: number
          image_id: string
          is_primary?: boolean
        }
        Update: {
          care_guide_id?: string
          created_at?: string
          display_order?: number
          image_id?: string
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "care_guide_images_care_guide_id_fkey"
            columns: ["care_guide_id"]
            isOneToOne: false
            referencedRelation: "care_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_guide_images_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "content_images"
            referencedColumns: ["id"]
          },
        ]
      }
      care_guide_related_species: {
        Row: {
          care_guide_id: string
          display_order: number
          relationship_label: string | null
          species_id: string
        }
        Insert: {
          care_guide_id: string
          display_order: number
          relationship_label?: string | null
          species_id: string
        }
        Update: {
          care_guide_id?: string
          display_order?: number
          relationship_label?: string | null
          species_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_guide_related_species_care_guide_id_fkey"
            columns: ["care_guide_id"]
            isOneToOne: false
            referencedRelation: "care_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_guide_related_species_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      care_guide_sections: {
        Row: {
          care_guide_id: string
          content: Json
          created_at: string
          display_order: number
          heading: string | null
          id: string
          section_type: string
          updated_at: string
        }
        Insert: {
          care_guide_id: string
          content?: Json
          created_at?: string
          display_order: number
          heading?: string | null
          id?: string
          section_type: string
          updated_at?: string
        }
        Update: {
          care_guide_id?: string
          content?: Json
          created_at?: string
          display_order?: number
          heading?: string | null
          id?: string
          section_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_guide_sections_care_guide_id_fkey"
            columns: ["care_guide_id"]
            isOneToOne: false
            referencedRelation: "care_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      care_guide_sources: {
        Row: {
          care_guide_id: string
          citation_label: string | null
          display_order: number
          source_id: string
        }
        Insert: {
          care_guide_id: string
          citation_label?: string | null
          display_order: number
          source_id: string
        }
        Update: {
          care_guide_id?: string
          citation_label?: string | null
          display_order?: number
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_guide_sources_care_guide_id_fkey"
            columns: ["care_guide_id"]
            isOneToOne: false
            referencedRelation: "care_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_guide_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      care_guides: {
        Row: {
          canonical_url: string | null
          created_at: string
          id: string
          is_featured: boolean
          meta_description: string | null
          open_graph_image_id: string | null
          published_at: string | null
          quick_facts: Json
          seo_title: string | null
          slug: string | null
          species_id: string
          status: string
          summary: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          meta_description?: string | null
          open_graph_image_id?: string | null
          published_at?: string | null
          quick_facts?: Json
          seo_title?: string | null
          slug?: string | null
          species_id: string
          status?: string
          summary?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          meta_description?: string | null
          open_graph_image_id?: string | null
          published_at?: string | null
          quick_facts?: Json
          seo_title?: string | null
          slug?: string | null
          species_id?: string
          status?: string
          summary?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_guides_open_graph_image_id_fkey"
            columns: ["open_graph_image_id"]
            isOneToOne: false
            referencedRelation: "content_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_guides_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
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
      content_images: {
        Row: {
          alt_text: string | null
          attribution: string | null
          author: string | null
          caption: string | null
          created_at: string
          file_size_bytes: number | null
          height: number | null
          id: string
          license_name: string | null
          license_url: string | null
          mime_type: string | null
          source_url: string | null
          species_id: string | null
          storage_path: string
          updated_at: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          attribution?: string | null
          author?: string | null
          caption?: string | null
          created_at?: string
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          license_name?: string | null
          license_url?: string | null
          mime_type?: string | null
          source_url?: string | null
          species_id?: string | null
          storage_path: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          attribution?: string | null
          author?: string | null
          caption?: string | null
          created_at?: string
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          license_name?: string | null
          license_url?: string | null
          mime_type?: string | null
          source_url?: string | null
          species_id?: string | null
          storage_path?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_images_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
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
      sources: {
        Row: {
          accessed_date: string | null
          author: string | null
          created_at: string
          id: string
          notes: string | null
          publication_date: string | null
          publisher: string | null
          source_type: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          accessed_date?: string | null
          author?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          publication_date?: string | null
          publisher?: string | null
          source_type?: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          accessed_date?: string | null
          author?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          publication_date?: string | null
          publisher?: string | null
          source_type?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      species: {
        Row: {
          activity_level: string | null
          aggression_level: number | null
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
          deep_bodied: boolean
          delicate_species: boolean
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
          max_gh_dgh: number | null
          max_kh_dkh: number | null
          max_ph: number | null
          max_size_inches: number | null
          max_temp_f: number | null
          min_gh_dgh: number | null
          min_group_size: number | null
          min_kh_dkh: number | null
          min_ph: number | null
          min_temp_f: number | null
          mouth_gape_risk: boolean
          origin: string | null
          ph_stability_required: boolean
          plant_safe: boolean | null
          preferred_tank_style: string | null
          recommended_max_temp_f: number | null
          recommended_min_temp_f: number | null
          region: string | null
          schooling: boolean | null
          scientific_name: string
          slender_prey_body: boolean
          slow_moving: boolean
          slug: string
          specialist_setup: boolean
          species_only_preferred: boolean
          summary: string | null
          surface_predator: boolean
          tank_size_gal: number | null
          temp_source_notes: string | null
          temperament: string | null
          temperature_category: string | null
          territory_footprint: string | null
          territory_zone: string | null
          tolerated_max_temp_f: number | null
          tolerated_min_temp_f: number | null
          updated_at: string | null
        }
        Insert: {
          activity_level?: string | null
          aggression_level?: number | null
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
          deep_bodied?: boolean
          delicate_species?: boolean
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
          max_gh_dgh?: number | null
          max_kh_dkh?: number | null
          max_ph?: number | null
          max_size_inches?: number | null
          max_temp_f?: number | null
          min_gh_dgh?: number | null
          min_group_size?: number | null
          min_kh_dkh?: number | null
          min_ph?: number | null
          min_temp_f?: number | null
          mouth_gape_risk?: boolean
          origin?: string | null
          ph_stability_required?: boolean
          plant_safe?: boolean | null
          preferred_tank_style?: string | null
          recommended_max_temp_f?: number | null
          recommended_min_temp_f?: number | null
          region?: string | null
          schooling?: boolean | null
          scientific_name: string
          slender_prey_body?: boolean
          slow_moving?: boolean
          slug: string
          specialist_setup?: boolean
          species_only_preferred?: boolean
          summary?: string | null
          surface_predator?: boolean
          tank_size_gal?: number | null
          temp_source_notes?: string | null
          temperament?: string | null
          temperature_category?: string | null
          territory_footprint?: string | null
          territory_zone?: string | null
          tolerated_max_temp_f?: number | null
          tolerated_min_temp_f?: number | null
          updated_at?: string | null
        }
        Update: {
          activity_level?: string | null
          aggression_level?: number | null
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
          deep_bodied?: boolean
          delicate_species?: boolean
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
          max_gh_dgh?: number | null
          max_kh_dkh?: number | null
          max_ph?: number | null
          max_size_inches?: number | null
          max_temp_f?: number | null
          min_gh_dgh?: number | null
          min_group_size?: number | null
          min_kh_dkh?: number | null
          min_ph?: number | null
          min_temp_f?: number | null
          mouth_gape_risk?: boolean
          origin?: string | null
          ph_stability_required?: boolean
          plant_safe?: boolean | null
          preferred_tank_style?: string | null
          recommended_max_temp_f?: number | null
          recommended_min_temp_f?: number | null
          region?: string | null
          schooling?: boolean | null
          scientific_name?: string
          slender_prey_body?: boolean
          slow_moving?: boolean
          slug?: string
          specialist_setup?: boolean
          species_only_preferred?: boolean
          summary?: string | null
          surface_predator?: boolean
          tank_size_gal?: number | null
          temp_source_notes?: string | null
          temperament?: string | null
          temperature_category?: string | null
          territory_footprint?: string | null
          territory_zone?: string | null
          tolerated_max_temp_f?: number | null
          tolerated_min_temp_f?: number | null
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
      is_admin: { Args: never; Returns: boolean }
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
