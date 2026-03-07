-- ============================================================
-- Migration 002: Anonymous session support for chat-first flow
-- ============================================================

-- Add anonymous_session_id to conversations
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS anonymous_session_id TEXT,
  ALTER COLUMN merchant_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_anon ON conversations(anonymous_session_id);

-- Anonymous session tracking table (warm leads)
CREATE TABLE IF NOT EXISTS anonymous_sessions (
  id TEXT PRIMARY KEY,                       -- UUID stored in localStorage
  exchange_count INTEGER DEFAULT 0,
  community_data JSONB DEFAULT '{}',         -- Partial data collected before signup
  business_type TEXT,
  business_name TEXT,
  converted_merchant_id UUID REFERENCES merchants(id),
  
  -- Attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer_url TEXT,
  landing_page TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  converted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_anon_sessions_created ON anonymous_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_anon_sessions_merchant ON anonymous_sessions(converted_merchant_id);
