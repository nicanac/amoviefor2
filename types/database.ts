// =============================================================================
// Supabase Database Types — mirrors the SQL schema
// These will be replaced by auto-generated types once `supabase gen types` runs.
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string;
          avatar_url: string | null;
          partner_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name: string;
          avatar_url?: string | null;
          partner_code?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string;
          avatar_url?: string | null;
          partner_code?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      couples: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string | null;
          status: "pending" | "active" | "dissolved";
          created_at: string;
        };
        Insert: {
          id?: string;
          user1_id: string;
          user2_id?: string | null;
          status?: "pending" | "active" | "dissolved";
          created_at?: string;
        };
        Update: {
          user2_id?: string | null;
          status?: "pending" | "active" | "dissolved";
        };
        Relationships: [];
      };
      questions: {
        Row: {
          id: number;
          text: string;
          type: "single_choice" | "multi_choice" | "slider";
          options: Json;
          category: "genre" | "mood" | "era" | "length" | "language" | "rating";
          weight: number;
          order: number;
        };
        Insert: {
          id?: number;
          text: string;
          type: "single_choice" | "multi_choice" | "slider";
          options: Json;
          category: "genre" | "mood" | "era" | "length" | "language" | "rating";
          weight: number;
          order: number;
        };
        Update: {
          text?: string;
          type?: "single_choice" | "multi_choice" | "slider";
          options?: Json;
          category?:
            | "genre"
            | "mood"
            | "era"
            | "length"
            | "language"
            | "rating";
          weight?: number;
          order?: number;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          couple_id: string;
          status:
            | "answering"
            | "matching"
            | "swiping"
            | "completed"
            | "expired";
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          status?:
            | "answering"
            | "matching"
            | "swiping"
            | "completed"
            | "expired";
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          status?:
            | "answering"
            | "matching"
            | "swiping"
            | "completed"
            | "expired";
          expires_at?: string;
        };
        Relationships: [];
      };
      user_answers: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          question_id: number;
          answer: Json;
          answered_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          question_id: number;
          answer: Json;
          answered_at?: string;
        };
        Update: {
          answer?: Json;
          answered_at?: string;
        };
        Relationships: [];
      };
      session_movies: {
        Row: {
          id: string;
          session_id: string;
          tmdb_id: number;
          title: string;
          poster_path: string;
          overview: string;
          release_year: number;
          genres: Json;
          vote_average: number;
          match_score: number;
          rank: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          tmdb_id: number;
          title: string;
          poster_path: string;
          overview: string;
          release_year: number;
          genres: Json;
          vote_average: number;
          match_score: number;
          rank: number;
          created_at?: string;
        };
        Update: {
          match_score?: number;
          rank?: number;
        };
        Relationships: [];
      };
      swipes: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          session_movie_id: string;
          direction: "right" | "left";
          swiped_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          session_movie_id: string;
          direction: "right" | "left";
          swiped_at?: string;
        };
        Update: {
          direction?: "right" | "left";
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          session_id: string;
          session_movie_id: string;
          matched_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          session_movie_id: string;
          matched_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      seen_movies: {
        Row: {
          id: string;
          user_id: string;
          tmdb_id: number;
          source: "auto" | "manual";
          marked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tmdb_id: number;
          source: "auto" | "manual";
          marked_at?: string;
        };
        Update: {
          source?: "auto" | "manual";
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_partner_code: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      couple_status: "pending" | "active" | "dissolved";
      session_status:
        | "answering"
        | "matching"
        | "swiping"
        | "completed"
        | "expired";
      question_type: "single_choice" | "multi_choice" | "slider";
      question_category:
        | "genre"
        | "mood"
        | "era"
        | "length"
        | "language"
        | "rating";
      swipe_direction: "right" | "left";
      seen_movie_source: "auto" | "manual";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
