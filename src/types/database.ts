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
      auctions: {
        Row: {
          closed_at: string | null
          current_price: number | null
          ends_at: string | null
          id: string
          leading_team_id: string | null
          paused_remaining_ms: number | null
          player_id: string
          room_id: string
          started_at: string
          starting_price: number
          status: Database["public"]["Enums"]["auction_status"]
        }
        Insert: {
          closed_at?: string | null
          current_price?: number | null
          ends_at?: string | null
          id?: string
          leading_team_id?: string | null
          paused_remaining_ms?: number | null
          player_id: string
          room_id: string
          started_at?: string
          starting_price: number
          status?: Database["public"]["Enums"]["auction_status"]
        }
        Update: {
          closed_at?: string | null
          current_price?: number | null
          ends_at?: string | null
          id?: string
          leading_team_id?: string | null
          paused_remaining_ms?: number | null
          player_id?: string
          room_id?: string
          started_at?: string
          starting_price?: number
          status?: Database["public"]["Enums"]["auction_status"]
        }
        Relationships: [
          {
            foreignKeyName: "auctions_leading_team_id_fkey"
            columns: ["leading_team_id"]
            isOneToOne: false
            referencedRelation: "team_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "auctions_leading_team_id_fkey"
            columns: ["leading_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auctions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auctions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amount: number
          auction_id: string
          created_at: string
          id: number
          team_id: string
        }
        Insert: {
          amount: number
          auction_id: string
          created_at?: string
          id?: never
          team_id: string
        }
        Update: {
          amount?: number
          auction_id?: string
          created_at?: string
          id?: never
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "bids_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          draw_order: number | null
          id: string
          is_captain: boolean
          name: string
          photo_url: string | null
          position: string | null
          room_id: string
          sold_at: string | null
          sold_price: number | null
          status: Database["public"]["Enums"]["player_status"]
          team_id: string | null
        }
        Insert: {
          created_at?: string
          draw_order?: number | null
          id?: string
          is_captain?: boolean
          name: string
          photo_url?: string | null
          position?: string | null
          room_id: string
          sold_at?: string | null
          sold_price?: number | null
          status?: Database["public"]["Enums"]["player_status"]
          team_id?: string | null
        }
        Update: {
          created_at?: string
          draw_order?: number | null
          id?: string
          is_captain?: boolean
          name?: string
          photo_url?: string | null
          position?: string | null
          room_id?: string
          sold_at?: string | null
          sold_price?: number | null
          status?: Database["public"]["Enums"]["player_status"]
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          anti_snipe_seconds: number
          auction_seconds: number
          code: string
          created_at: string
          id: string
          initial_budget: number
          max_teams: number
          min_price: number
          name: string
          order_drawn_at: string | null
          squad_size_max: number
          squad_size_min: number
          status: Database["public"]["Enums"]["room_status"]
          teams_at_max: number
        }
        Insert: {
          anti_snipe_seconds?: number
          auction_seconds?: number
          code: string
          created_at?: string
          id?: string
          initial_budget?: number
          max_teams?: number
          min_price?: number
          name: string
          order_drawn_at?: string | null
          squad_size_max?: number
          squad_size_min?: number
          status?: Database["public"]["Enums"]["room_status"]
          teams_at_max?: number
        }
        Update: {
          anti_snipe_seconds?: number
          auction_seconds?: number
          code?: string
          created_at?: string
          id?: string
          initial_budget?: number
          max_teams?: number
          min_price?: number
          name?: string
          order_drawn_at?: string | null
          squad_size_max?: number
          squad_size_min?: number
          status?: Database["public"]["Enums"]["room_status"]
          teams_at_max?: number
        }
        Relationships: []
      }
      team_access: {
        Row: {
          failed_attempts: number
          locked_until: string | null
          pin: string
          team_id: string
        }
        Insert: {
          failed_attempts?: number
          locked_until?: string | null
          pin: string
          team_id: string
        }
        Update: {
          failed_attempts?: number
          locked_until?: string | null
          pin?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_access_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "team_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_access_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          initial_budget: number
          name: string
          room_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          initial_budget?: number
          name: string
          room_id: string
        }
        Update: {
          created_at?: string
          id?: string
          initial_budget?: number
          name?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      team_standings: {
        Row: {
          initial_budget: number | null
          max_bid: number | null
          name: string | null
          players_count: number | null
          remaining: number | null
          room_id: string | null
          slots_left: number | null
          spent: number | null
          squad_size_cap: number | null
          team_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      assign_player: {
        Args: { p_player_id: string; p_price: number; p_team_id: string }
        Returns: undefined
      }
      cancel_auction: { Args: { p_auction_id: string }; Returns: undefined }
      close_auction: {
        Args: { p_auction_id: string; p_force?: boolean }
        Returns: string
      }
      create_team: {
        Args: {
          p_captain_name: string
          p_name: string
          p_pin: string
          p_room_id: string
        }
        Returns: string
      }
      draw_auction_order: { Args: { p_room_id: string }; Returns: undefined }
      pause_auction: { Args: { p_auction_id: string }; Returns: undefined }
      place_bid: {
        Args: { p_amount: number; p_auction_id: string; p_team_id: string }
        Returns: undefined
      }
      refresh_room_status: { Args: { p_room_id: string }; Returns: undefined }
      resume_auction: { Args: { p_auction_id: string }; Returns: undefined }
      start_auction: {
        Args: { p_player_id: string; p_room_id: string }
        Returns: string
      }
      unassign_player: { Args: { p_player_id: string }; Returns: undefined }
      verify_team_pin: {
        Args: { p_pin: string; p_team_id: string }
        Returns: string
      }
    }
    Enums: {
      auction_status: "running" | "paused" | "sold" | "unsold" | "cancelled"
      player_status: "available" | "in_auction" | "sold"
      room_status: "setup" | "live" | "finished"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      auction_status: ["running", "paused", "sold", "unsold", "cancelled"],
      player_status: ["available", "in_auction", "sold"],
      room_status: ["setup", "live", "finished"],
    },
  },
} as const
