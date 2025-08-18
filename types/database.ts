export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          timezone: string;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      instagram_accounts: {
        Row: {
          id: string;
          user_id: string;
          instagram_user_id: string;
          username: string;
          access_token: string | null;
          token_expires_at: string | null;
          account_type: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          instagram_user_id: string;
          username: string;
          access_token?: string | null;
          token_expires_at?: string | null;
          account_type?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          instagram_user_id?: string;
          username?: string;
          access_token?: string | null;
          token_expires_at?: string | null;
          account_type?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          instagram_account_id: string | null;
          content: string;
          caption: string;
          media_url: string | null;
          media_type: string;
          hashtags: string[] | null;
          scheduled_at: string | null;
          published_at: string | null;
          instagram_post_id: string | null;
          status: string;
          error_message: string | null;
          engagement_data: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          instagram_account_id?: string | null;
          content: string;
          caption: string;
          media_url?: string | null;
          media_type?: string;
          hashtags?: string[] | null;
          scheduled_at?: string | null;
          published_at?: string | null;
          instagram_post_id?: string | null;
          status?: string;
          error_message?: string | null;
          engagement_data?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          instagram_account_id?: string | null;
          content?: string;
          caption?: string;
          media_url?: string | null;
          media_type?: string;
          hashtags?: string[] | null;
          scheduled_at?: string | null;
          published_at?: string | null;
          instagram_post_id?: string | null;
          status?: string;
          error_message?: string | null;
          engagement_data?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_requests: {
        Row: {
          id: string;
          user_id: string;
          type: 'text' | 'image';
          input_prompt: string;
          result_data: any | null;
          tokens_used: number;
          cost_usd: number;
          status: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'text' | 'image';
          input_prompt: string;
          result_data?: any | null;
          tokens_used?: number;
          cost_usd?: number;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'text' | 'image';
          input_prompt?: string;
          result_data?: any | null;
          tokens_used?: number;
          cost_usd?: number;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
      };
    };
  };
}