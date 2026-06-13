export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          country: string | null;
          target_budget: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          country?: string | null;
          target_budget?: number | null;
          created_at?: string;
        };
        Update: {
          email?: string;
          name?: string | null;
          country?: string | null;
          target_budget?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      carbon_entries: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          subcategory: string;
          value: number;
          unit: string;
          co2_emission: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          subcategory: string;
          value: number;
          unit: string;
          co2_emission: number;
          created_at?: string;
        };
        Update: {
          category?: string;
          subcategory?: string;
          value?: number;
          unit?: string;
          co2_emission?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      cash_transactions: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          amount: number;
          currency: string;
          parsed_co2: number | null;
          receipt_url: string | null;
          transaction_date: string;
          co2_emission: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          amount: number;
          currency?: string;
          parsed_co2?: number | null;
          receipt_url?: string | null;
          transaction_date: string;
          co2_emission: number;
          created_at?: string;
        };
        Update: {
          category?: string;
          amount?: number;
          currency?: string;
          parsed_co2?: number | null;
          receipt_url?: string | null;
          transaction_date?: string;
          co2_emission?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          annual_limit: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          annual_limit: number;
          created_at?: string;
        };
        Update: {
          annual_limit?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          monthly_limit: number;
          month_year: string;
          spent: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          monthly_limit: number;
          month_year: string;
          spent?: number;
          created_at?: string;
        };
        Update: {
          monthly_limit?: number;
          month_year?: string;
          spent?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      collective_events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          event_date: string;
          location: string | null;
          participants_count: number;
          co2_impact_kg: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          event_date: string;
          location?: string | null;
          participants_count?: number;
          co2_impact_kg?: number;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          event_date?: string;
          location?: string | null;
          participants_count?: number;
          co2_impact_kg?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      group_challenges: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          target_kg: number;
          current_kg: number;
          participants_count: number;
          end_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          target_kg: number;
          current_kg?: number;
          participants_count?: number;
          end_date: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          target_kg?: number;
          current_kg?: number;
          participants_count?: number;
          end_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      calculate_carbon_emission: {
        Args: {
          category: string;
          subcategory: string;
          value: number;
          unit: string;
        };
        Returns: number;
      };
      insert_carbon_entries: {
        Args: {
          entries: Json;
        };
        Returns: Database['public']['Tables']['carbon_entries']['Row'][];
      };
      insert_cash_transaction: {
        Args: {
          category: string;
          amount: number;
          transaction_date: string;
          receipt_url?: string;
          currency?: string;
        };
        Returns: Database['public']['Tables']['cash_transactions']['Row'];
      };
    };
  };
}
