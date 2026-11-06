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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          content: string
          created_at: string
          excerpt: string
          id: string
          image_url: string
          published: boolean
          title: string
          translations: Json
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          image_url?: string
          published?: boolean
          title: string
          translations?: Json
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          image_url?: string
          published?: boolean
          title?: string
          translations?: Json
          updated_at?: string
        }
        Relationships: []
      }
      awards: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string
          published: boolean
          sort_order: number
          title: string
          translations: Json
          year: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          published?: boolean
          sort_order?: number
          title: string
          translations?: Json
          year?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          published?: boolean
          sort_order?: number
          title?: string
          translations?: Json
          year?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          pack_label: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          pack_label?: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          pack_label?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          acquisition_source: string
          address: string
          commune: string
          country: string
          created_at: string
          delivery_type: string
          destination: string
          email: string
          first_name: string
          id: string
          last_name: string
          order_number: number
          phone: string
          shipping_fee: number
          status: string
          total: number
          wilaya: string
        }
        Insert: {
          acquisition_source?: string
          address: string
          commune: string
          country?: string
          created_at?: string
          delivery_type?: string
          destination?: string
          email?: string
          first_name: string
          id?: string
          last_name: string
          order_number?: number
          phone: string
          shipping_fee?: number
          status?: string
          total?: number
          wilaya: string
        }
        Update: {
          acquisition_source?: string
          address?: string
          commune?: string
          country?: string
          created_at?: string
          delivery_type?: string
          destination?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          order_number?: number
          phone?: string
          shipping_fee?: number
          status?: string
          total?: number
          wilaya?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string
          description_ar: string
          description_en: string
          id: string
          image_url: string
          name: string
          name_ar: string
          name_en: string
          packs_enabled: boolean
          price: number
          quantity_offers: Json
          sale_price: number | null
          size: string
          sort_order: number
          stock: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          description_ar?: string
          description_en?: string
          id?: string
          image_url?: string
          name: string
          name_ar?: string
          name_en?: string
          packs_enabled?: boolean
          price?: number
          quantity_offers?: Json
          sale_price?: number | null
          size?: string
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          description_ar?: string
          description_en?: string
          id?: string
          image_url?: string
          name?: string
          name_ar?: string
          name_en?: string
          packs_enabled?: boolean
          price?: number
          quantity_offers?: Json
          sale_price?: number | null
          size?: string
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email?: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          approved: boolean
          comment: string
          created_at: string
          id: string
          name: string
          product_id: string
          rating: number
        }
        Insert: {
          approved?: boolean
          comment?: string
          created_at?: string
          id?: string
          name: string
          product_id: string
          rating: number
        }
        Update: {
          approved?: boolean
          comment?: string
          created_at?: string
          id?: string
          name?: string
          product_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_rates: {
        Row: {
          available: boolean
          desk_price: number
          home_price: number
          updated_at: string
          wilaya: string
          wilaya_code: number
        }
        Insert: {
          available?: boolean
          desk_price?: number
          home_price?: number
          updated_at?: string
          wilaya: string
          wilaya_code: number
        }
        Update: {
          available?: boolean
          desk_price?: number
          home_price?: number
          updated_at?: string
          wilaya?: string
          wilaya_code?: number
        }
        Relationships: []
      }
      site_texts: {
        Row: {
          key: string
          label: string
          sort_order: number
          translations: Json
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          label?: string
          sort_order?: number
          translations?: Json
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          label?: string
          sort_order?: number
          translations?: Json
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visit_daily: {
        Row: {
          country: string
          day: string
          device: string
          language: string
          source: string
          visits: number
        }
        Insert: {
          country?: string
          day?: string
          device: string
          language: string
          source: string
          visits?: number
        }
        Update: {
          country?: string
          day?: string
          device?: string
          language?: string
          source?: string
          visits?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_manager_account: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      grant_manager: { Args: { target_user_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      order_line_price: {
        Args: { p_offer_id: string; p_product: Json; p_quantity: number }
        Returns: Json
      }
      place_order: {
        Args: { p_customer: Json; p_items: Json }
        Returns: number
      }
      record_shop_visit: {
        Args: {
          p_country: string
          p_device: string
          p_language: string
          p_source: string
        }
        Returns: undefined
      }
      revoke_manager: { Args: { target_user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user" | "manager"
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
      app_role: ["admin", "user", "manager"],
    },
  },
} as const
