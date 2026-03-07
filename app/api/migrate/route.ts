import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MIGRATION_SECRET = process.env.CRON_SECRET || 'migrate-2026'

// This endpoint runs the initial schema migration via Supabase's pg_dump workaround
// It uses individual table creates through the REST API
// DELETE THIS ENDPOINT AFTER MIGRATION
export async function POST(req: NextRequest) {
  const { secret } = await req.json().catch(() => ({ secret: '' }))
  if (secret !== MIGRATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'public' } }
  )

  // We can't run raw SQL via the REST API, but we can use the
  // supabase-js admin client to execute SQL via the management API
  // Actually, let's use the rpc approach - create a function first

  // Alternative: use fetch to the Supabase SQL endpoint
  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const sql = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- TABLE: merchants
    CREATE TABLE IF NOT EXISTS merchants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cognito_user_id TEXT UNIQUE,
      cognito_email TEXT,
      fdv_user_id INTEGER,
      ref_code TEXT,
      email TEXT NOT NULL,
      phone TEXT,
      line_id TEXT,
      business_name TEXT,
      business_type TEXT,
      business_description TEXT,
      business_size TEXT,
      location TEXT,
      website_url TEXT,
      social_urls JSONB DEFAULT '{}',
      logo_url TEXT,
      banner_url TEXT,
      primary_color TEXT DEFAULT '#6366f1',
      secondary_color TEXT,
      onboarding_status TEXT DEFAULT 'signup',
      onboarding_started_at TIMESTAMPTZ,
      onboarding_completed_at TIMESTAMPTZ,
      onboarding_data JSONB DEFAULT '{}',
      onboarding_last_phase_at TIMESTAMPTZ,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_content TEXT,
      utm_term TEXT,
      utm_vertical TEXT,
      referrer_url TEXT,
      landing_page TEXT,
      gclid TEXT,
      fbclid TEXT,
      auth_provider TEXT,
      assigned_to TEXT,
      status TEXT DEFAULT 'lead',
      health_score INTEGER,
      health_score_updated_at TIMESTAMPTZ,
      last_activity_at TIMESTAMPTZ,
      last_contact_at TIMESTAMPTZ,
      next_follow_up_at TIMESTAMPTZ,
      notes JSONB DEFAULT '[]',
      tags TEXT[] DEFAULT '{}',
      lifetime_revenue DECIMAL(12,2) DEFAULT 0,
      lifetime_transactions INTEGER DEFAULT 0,
      monthly_revenue DECIMAL(12,2) DEFAULT 0,
      monthly_transactions INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- TABLE: events
    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
      anonymous_id TEXT,
      session_id TEXT,
      event_type TEXT NOT NULL,
      event_data JSONB DEFAULT '{}',
      page_url TEXT,
      user_agent TEXT,
      ip_country TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- TABLE: conversations
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      phase TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- TABLE: handoffs
    CREATE TABLE IF NOT EXISTS handoffs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      reason_category TEXT,
      stuck_at_phase TEXT,
      context JSONB,
      status TEXT DEFAULT 'open',
      priority TEXT DEFAULT 'normal',
      assigned_to TEXT,
      slack_message_ts TEXT,
      slack_channel_id TEXT,
      resolved_at TIMESTAMPTZ,
      resolution_notes TEXT,
      resolution_outcome TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- TABLE: products
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10,2),
      currency TEXT DEFAULT 'THB',
      image_url TEXT,
      category TEXT,
      sku TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `

  // Try executing via the Supabase SQL API
  // The /rest/v1/rpc approach won't work for DDL
  // Let's try creating a temporary function that creates the tables

  const createFnSql = `
    CREATE OR REPLACE FUNCTION run_migration()
    RETURNS TEXT AS $$
    BEGIN
      ${sql.replace(/'/g, "''")}
      RETURN 'Migration completed successfully';
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `

  // We need to use the pg endpoint or find another way
  // Let's try inserting test data to see if tables exist
  const results: Record<string, string> = {}

  // Check each table
  for (const table of ['merchants', 'events', 'conversations', 'handoffs', 'products']) {
    const { error } = await supabase.from(table).select('id').limit(1)
    results[table] = error ? `❌ ${error.message}` : '✅ exists'
  }

  return NextResponse.json({
    message: 'Table status check. Tables must be created via Supabase SQL Editor.',
    tables: results,
    sql_file: 'See scripts/001_initial_schema.sql in the repo',
    dashboard_url: 'https://supabase.com/dashboard/project/ttaebkbtqubzcojhujpe/sql',
  })
}
