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
      merchants: {
        Row: {
          id: string
          cognito_user_id: string | null
          cognito_email: string | null
          fdv_user_id: number | null
          ref_code: string | null
          email: string
          phone: string | null
          line_id: string | null
          business_name: string | null
          business_type: 'food' | 'creator' | 'ngo' | 'events' | 'education' | 'retail' | 'fitness' | 'beauty' | 'hospitality' | 'other' | null
          business_description: string | null
          business_size: 'solo' | '2-5' | '6-20' | '21-50' | '50+' | null
          location: string | null
          website_url: string | null
          social_urls: Json
          logo_url: string | null
          banner_url: string | null
          primary_color: string
          secondary_color: string | null
          onboarding_status: 'signup' | 'context' | 'branding' | 'products' | 'rewards' | 'golive' | 'completed' | 'abandoned'
          onboarding_started_at: string | null
          onboarding_completed_at: string | null
          onboarding_data: Json
          onboarding_last_phase_at: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_term: string | null
          utm_vertical: string | null
          referrer_url: string | null
          landing_page: string | null
          gclid: string | null
          fbclid: string | null
          assigned_to: string | null
          status: 'lead' | 'onboarding' | 'onboarded' | 'active' | 'dormant' | 'churned' | 'lost'
          health_score: number | null
          health_score_updated_at: string | null
          last_activity_at: string | null
          last_contact_at: string | null
          next_follow_up_at: string | null
          notes: Json
          tags: string[]
          lifetime_revenue: number
          lifetime_transactions: number
          monthly_revenue: number
          monthly_transactions: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          cognito_user_id?: string | null
          cognito_email?: string | null
          fdv_user_id?: number | null
          ref_code?: string | null
          phone?: string | null
          line_id?: string | null
          business_name?: string | null
          business_type?: 'food' | 'creator' | 'ngo' | 'events' | 'education' | 'retail' | 'fitness' | 'beauty' | 'hospitality' | 'other' | null
          business_description?: string | null
          business_size?: 'solo' | '2-5' | '6-20' | '21-50' | '50+' | null
          location?: string | null
          website_url?: string | null
          social_urls?: Json
          logo_url?: string | null
          banner_url?: string | null
          primary_color?: string
          secondary_color?: string | null
          onboarding_status?: 'signup' | 'context' | 'branding' | 'products' | 'rewards' | 'golive' | 'completed' | 'abandoned'
          onboarding_started_at?: string | null
          onboarding_completed_at?: string | null
          onboarding_data?: Json
          onboarding_last_phase_at?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_term?: string | null
          utm_vertical?: string | null
          referrer_url?: string | null
          landing_page?: string | null
          gclid?: string | null
          fbclid?: string | null
          assigned_to?: string | null
          status?: 'lead' | 'onboarding' | 'onboarded' | 'active' | 'dormant' | 'churned' | 'lost'
          health_score?: number | null
          health_score_updated_at?: string | null
          last_activity_at?: string | null
          last_contact_at?: string | null
          next_follow_up_at?: string | null
          notes?: Json
          tags?: string[]
          lifetime_revenue?: number
          lifetime_transactions?: number
          monthly_revenue?: number
          monthly_transactions?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['merchants']['Insert']>
      }
      events: {
        Row: {
          id: string
          merchant_id: string | null
          anonymous_id: string | null
          session_id: string | null
          event_type: string
          event_data: Json
          page_url: string | null
          user_agent: string | null
          ip_country: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
      conversations: {
        Row: {
          id: string
          merchant_id: string | null
          role: 'user' | 'assistant' | 'system' | 'tool'
          content: string
          phase: string | null
          metadata: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
      }
      handoffs: {
        Row: {
          id: string
          merchant_id: string | null
          reason: string
          reason_category: 'technical' | 'pricing' | 'custom' | 'frustrated' | 'timeout' | 'explicit' | 'other' | null
          stuck_at_phase: string | null
          context: Json | null
          status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
          priority: 'low' | 'normal' | 'high' | 'urgent'
          assigned_to: string | null
          slack_message_ts: string | null
          slack_channel_id: string | null
          resolved_at: string | null
          resolution_notes: string | null
          resolution_outcome: 'completed_onboarding' | 'scheduled_call' | 'answered_question' | 'not_qualified' | 'no_response' | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['handoffs']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['handoffs']['Insert']>
      }
      products: {
        Row: {
          id: string
          merchant_id: string | null
          name: string
          description: string | null
          price: number | null
          currency: string
          image_url: string | null
          category: string | null
          sku: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      crm_users: {
        Row: {
          id: string
          email: string
          name: string
          slack_user_id: string | null
          role: 'admin' | 'member'
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['crm_users']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['crm_users']['Insert']>
      }
      crm_activities: {
        Row: {
          id: string
          merchant_id: string | null
          crm_user_id: string | null
          activity_type: 'note' | 'call' | 'email' | 'meeting' | 'line_message' | 'status_change' | 'assignment' | 'tag_change' | 'follow_up_set'
          description: string | null
          metadata: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['crm_activities']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['crm_activities']['Insert']>
      }
    }
    Views: {
      merchant_funnel_stats: {
        Row: {
          day: string | null
          total_signups: number | null
          in_onboarding: number | null
          completed: number | null
          abandoned: number | null
          active: number | null
          from_google: number | null
          from_facebook: number | null
          from_line: number | null
          from_referral: number | null
          from_direct: number | null
        }
      }
      channel_performance: {
        Row: {
          channel: string | null
          vertical: string | null
          total_leads: number | null
          completed: number | null
          completion_rate_pct: number | null
          avg_onboard_minutes: number | null
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
