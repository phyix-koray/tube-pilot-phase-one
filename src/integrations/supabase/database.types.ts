// Hand-written types for our Supabase schema.
// Kept alongside client (not under /supabase/) since the /supabase/ path
// is reserved by Lovable's managed migration system.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      skills: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          file_md: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          file_md?: string;
        };
        Update: Partial<Database["public"]["Tables"]["skills"]["Insert"]>;
        Relationships: [];
      };
      skill_messages: {
        Row: {
          id: string;
          skill_id: string;
          user_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          model: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          skill_id: string;
          user_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          model?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["skill_messages"]["Insert"]>;
        Relationships: [];
      };
      skill_versions: {
        Row: {
          id: string;
          skill_id: string;
          user_id: string;
          file_md: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          skill_id: string;
          user_id: string;
          file_md: string;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["skill_versions"]["Insert"]>;
        Relationships: [];
      };
      agent_skill_links: {
        Row: {
          id: string;
          user_id: string;
          agent_id: string;
          skill_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          agent_id: string;
          skill_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["agent_skill_links"]["Insert"]>;
        Relationships: [];
      };
      agent_skill_uploads: {
        Row: {
          id: string;
          user_id: string;
          agent_id: string;
          name: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          agent_id: string;
          name: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["agent_skill_uploads"]["Insert"]>;
        Relationships: [];
      };
      channels: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          provider: string;
          external_id: string | null;
          avatar_url: string | null;
          metadata_json: Json;
          connected_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          provider?: string;
          external_id?: string | null;
          avatar_url?: string | null;
          metadata_json?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["channels"]["Insert"]>;
        Relationships: [];
      };
      agent_runs: {
        Row: {
          id: string;
          user_id: string;
          agent_id: string;
          status: "draft" | "queued" | "running" | "completed" | "failed" | "cancelled";
          channel_id: string | null;
          config_json: Json;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          agent_id: string;
          status?: "draft" | "queued" | "running" | "completed" | "failed" | "cancelled";
          channel_id?: string | null;
          config_json?: Json;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["agent_runs"]["Insert"]>;
        Relationships: [];
      };
      content_plan_rows: {
        Row: {
          id: string;
          run_id: string;
          user_id: string;
          position: number;
          date: string | null;
          video_title: string | null;
          video_topic: string | null;
          video_length: string | null;
          video_format: string | null;
          art_style: string | null;
          web_search: boolean;
          deep_research: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          user_id: string;
          position?: number;
          date?: string | null;
          video_title?: string | null;
          video_topic?: string | null;
          video_length?: string | null;
          video_format?: string | null;
          art_style?: string | null;
          web_search?: boolean;
          deep_research?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["content_plan_rows"]["Insert"]>;
        Relationships: [];
      };
      videos: {
        Row: {
          id: string;
          user_id: string;
          channel_id: string | null;
          run_id: string | null;
          title: string;
          description: string | null;
          tags: string[];
          status: "draft" | "scheduled" | "processing" | "published" | "failed";
          scheduled_at: string | null;
          published_at: string | null;
          thumbnail_url: string | null;
          video_url: string | null;
          duration_seconds: number | null;
          metadata_json: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          channel_id?: string | null;
          run_id?: string | null;
          title?: string;
          description?: string | null;
          tags?: string[];
          status?: "draft" | "scheduled" | "processing" | "published" | "failed";
          scheduled_at?: string | null;
          published_at?: string | null;
          thumbnail_url?: string | null;
          video_url?: string | null;
          duration_seconds?: number | null;
          metadata_json?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["videos"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
