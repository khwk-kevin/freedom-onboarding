-- ============================================================
-- Freedom World Merchant Onboarding Pipeline
-- Supabase Schema v1.0
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: merchants — Core merchant record + CRM data
-- ============================================================
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Freedom World identity
  cognito_user_id TEXT UNIQUE,              -- Cognito 'sub' claim
  cognito_email TEXT,                        -- Email used for Cognito signup
  fdv_user_id INTEGER,                       -- Freedom internal user ID (from signup response)
  ref_code TEXT,                             -- Freedom refCode (from signup response)
  
  -- Contact
  email TEXT NOT NULL,
  phone TEXT,
  line_id TEXT,                              -- LINE contact (common in TH)
  
  -- Business info (collected during AI onboarding)
  business_name TEXT,
  business_type TEXT CHECK (business_type IN (
    'food', 'creator', 'ngo', 'events', 'education', 
    'retail', 'fitness', 'beauty', 'hospitality', 'other'
  )),
  business_description TEXT,
  business_size TEXT CHECK (business_size IN (
    'solo', '2-5', '6-20', '21-50', '50+'
  )),
  location TEXT,
  website_url TEXT,
  social_urls JSONB DEFAULT '{}',            -- { instagram: "...", facebook: "...", line_oa: "..." }
  
  -- Branding (set during onboarding Phase 2)
  logo_url TEXT,
  banner_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT,
  
  -- Onboarding state machine
  onboarding_status TEXT DEFAULT 'signup' CHECK (onboarding_status IN (
    'signup',      -- Account created, hasn't started AI onboarding
    'context',     -- Phase 1: collecting business info
    'branding',    -- Phase 2: logo, banner, colors
    'products',    -- Phase 3: listing products
    'rewards',     -- Phase 4: token configuration
    'golive',      -- Phase 5: preview & launch
    'completed',   -- All phases done
    'abandoned'    -- Dropped off, flagged for re-engagement
  )),
  onboarding_started_at TIMESTAMPTZ,
  onboarding_completed_at TIMESTAMPTZ,
  onboarding_data JSONB DEFAULT '{}',        -- Full state blob for session resume
  onboarding_last_phase_at TIMESTAMPTZ,      -- When they last advanced a phase
  
  -- Acquisition attribution (captured on first landing page visit)
  utm_source TEXT,                           -- google, facebook, line, referral, direct, etc.
  utm_medium TEXT,                           -- cpc, organic, social, email, qr
  utm_campaign TEXT,                         -- campaign identifier
  utm_content TEXT,                          -- ad variant
  utm_term TEXT,                             -- keyword (for paid search)
  utm_vertical TEXT,                         -- Which spoke page: 'food', 'creators', 'hub'
  referrer_url TEXT,                         -- document.referrer
  landing_page TEXT,                         -- First page URL
  gclid TEXT,                                -- Google click ID
  fbclid TEXT,                               -- Facebook click ID
  
  -- CRM fields
  assigned_to TEXT,                          -- BD team member (Slack user ID)
  status TEXT DEFAULT 'lead' CHECK (status IN (
    'lead',        -- Signed up, not yet onboarding
    'onboarding',  -- In AI onboarding flow
    'onboarded',   -- Completed onboarding
    'active',      -- Has transactions / activity
    'dormant',     -- No activity for 14+ days
    'churned',     -- No activity for 30+ days
    'lost'         -- Explicitly opted out
  )),
  health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
  health_score_updated_at TIMESTAMPTZ,
  
  -- CRM activity
  last_activity_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,              -- Last BD team interaction
  next_follow_up_at TIMESTAMPTZ,
  notes JSONB DEFAULT '[]',                  -- [{date, author, text}]
  tags TEXT[] DEFAULT '{}',                  -- ['vip', 'raja-ferry-referred', 'food-vertical']
  
  -- Revenue (synced from Freedom platform or manual entry)
  lifetime_revenue DECIMAL(12,2) DEFAULT 0,
  lifetime_transactions INTEGER DEFAULT 0,
  monthly_revenue DECIMAL(12,2) DEFAULT 0,
  monthly_transactions INTEGER DEFAULT 0,
  
  -- Lifecycle
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_merchants_status ON merchants(status);
CREATE INDEX idx_merchants_onboarding_status ON merchants(onboarding_status);
CREATE INDEX idx_merchants_utm_source ON merchants(utm_source);
CREATE INDEX idx_merchants_business_type ON merchants(business_type);
CREATE INDEX idx_merchants_health_score ON merchants(health_score);
CREATE INDEX idx_merchants_assigned_to ON merchants(assigned_to);
CREATE INDEX idx_merchants_email ON merchants(email);
CREATE INDEX idx_merchants_created ON merchants(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- TABLE: events — Full event log (every interaction)
-- ============================================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  anonymous_id TEXT,                         -- Pre-signup: PostHog distinct_id / cookie ID
  session_id TEXT,                           -- PostHog session ID for replay correlation
  
  event_type TEXT NOT NULL,
  -- Landing page events:
  --   page_view, scroll_depth, cta_click, video_play, faq_expand
  -- Signup events:
  --   signup_start, signup_complete, signup_error
  -- Onboarding events:
  --   onboard_start, onboard_step_context, onboard_step_branding,
  --   onboard_step_products, onboard_step_rewards, onboard_step_golive,
  --   onboard_complete, onboard_drop_off, onboard_resume
  -- Handoff events:
  --   handoff_triggered, handoff_assigned, handoff_resolved
  -- Post-onboarding events:
  --   first_product, first_member, first_transaction,
  --   return_visit, weekly_active
  
  event_data JSONB DEFAULT '{}',             -- Flexible payload per event type
  page_url TEXT,
  user_agent TEXT,
  ip_country TEXT,
  
  -- Attribution (denormalized from merchant for pre-signup events)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_events_merchant ON events(merchant_id);
CREATE INDEX idx_events_anonymous ON events(anonymous_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created ON events(created_at DESC);
CREATE INDEX idx_events_session ON events(session_id);


-- ============================================================
-- TABLE: conversations — AI onboarding chat history
-- ============================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  phase TEXT,                                -- Which onboarding phase
  
  -- For tool calls / structured data
  metadata JSONB DEFAULT '{}',               -- {tool_call_id, function_name, extracted_data}
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversations_merchant ON conversations(merchant_id);
CREATE INDEX idx_conversations_phase ON conversations(phase);
CREATE INDEX idx_conversations_created ON conversations(created_at);


-- ============================================================
-- TABLE: handoffs — Human escalation queue
-- ============================================================
CREATE TABLE handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  
  reason TEXT NOT NULL,                      -- Why AI escalated to human
  reason_category TEXT CHECK (reason_category IN (
    'technical',    -- Can't answer a technical question
    'pricing',      -- Questions about cost/pricing
    'custom',       -- Custom requirements outside standard flow
    'frustrated',   -- Detected frustration / negative sentiment
    'timeout',      -- Stuck too long on a phase
    'explicit',     -- Merchant explicitly asked for human
    'other'
  )),
  stuck_at_phase TEXT,
  context JSONB,                             -- Last 10 conversation messages for context
  
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to TEXT,                          -- BD team member Slack ID
  slack_message_ts TEXT,                     -- Slack message ID for thread tracking
  slack_channel_id TEXT,                     -- Which Slack channel the notification went to
  
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  resolution_outcome TEXT CHECK (resolution_outcome IN (
    'completed_onboarding',  -- BD helped them finish
    'scheduled_call',        -- Booked a follow-up
    'answered_question',     -- Simple Q&A resolved
    'not_qualified',         -- Not a fit
    'no_response'            -- Merchant never replied
  )),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_handoffs_status ON handoffs(status);
CREATE INDEX idx_handoffs_merchant ON handoffs(merchant_id);
CREATE INDEX idx_handoffs_assigned ON handoffs(assigned_to);
CREATE INDEX idx_handoffs_priority ON handoffs(priority);

CREATE TRIGGER handoffs_updated_at
  BEFORE UPDATE ON handoffs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- TABLE: products — Merchant products (set up during onboarding)
-- ============================================================
CREATE TABLE products (
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

CREATE INDEX idx_products_merchant ON products(merchant_id);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- TABLE: crm_users — BD team members who access the CRM
-- ============================================================
CREATE TABLE crm_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slack_user_id TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- TABLE: crm_activities — BD team actions on merchants
-- ============================================================
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  crm_user_id UUID REFERENCES crm_users(id),
  
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'note', 'call', 'email', 'meeting', 'line_message',
    'status_change', 'assignment', 'tag_change', 'follow_up_set'
  )),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_crm_activities_merchant ON crm_activities(merchant_id);


-- ============================================================
-- VIEW: merchant_funnel_stats — Quick funnel metrics
-- ============================================================
CREATE OR REPLACE VIEW merchant_funnel_stats AS
SELECT
  date_trunc('day', created_at) AS day,
  COUNT(*) FILTER (WHERE onboarding_status != 'abandoned') AS total_signups,
  COUNT(*) FILTER (WHERE onboarding_status IN ('context','branding','products','rewards','golive')) AS in_onboarding,
  COUNT(*) FILTER (WHERE onboarding_status = 'completed') AS completed,
  COUNT(*) FILTER (WHERE onboarding_status = 'abandoned') AS abandoned,
  COUNT(*) FILTER (WHERE status = 'active') AS active,
  -- By source
  COUNT(*) FILTER (WHERE utm_source = 'google') AS from_google,
  COUNT(*) FILTER (WHERE utm_source = 'facebook') AS from_facebook,
  COUNT(*) FILTER (WHERE utm_source = 'line') AS from_line,
  COUNT(*) FILTER (WHERE utm_source = 'referral') AS from_referral,
  COUNT(*) FILTER (WHERE utm_source = 'direct' OR utm_source IS NULL) AS from_direct
FROM merchants
GROUP BY date_trunc('day', created_at)
ORDER BY day DESC;


-- ============================================================
-- VIEW: channel_performance — Conversion rates by channel
-- ============================================================
CREATE OR REPLACE VIEW channel_performance AS
SELECT
  COALESCE(utm_source, 'direct') AS channel,
  COALESCE(utm_vertical, 'hub') AS vertical,
  COUNT(*) AS total_leads,
  COUNT(*) FILTER (WHERE onboarding_status = 'completed') AS completed,
  ROUND(
    COUNT(*) FILTER (WHERE onboarding_status = 'completed')::DECIMAL / 
    NULLIF(COUNT(*), 0) * 100, 1
  ) AS completion_rate_pct,
  AVG(
    EXTRACT(EPOCH FROM (onboarding_completed_at - onboarding_started_at)) / 60
  ) FILTER (WHERE onboarding_completed_at IS NOT NULL) AS avg_onboard_minutes
FROM merchants
GROUP BY COALESCE(utm_source, 'direct'), COALESCE(utm_vertical, 'hub')
ORDER BY total_leads DESC;


-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

-- Service role (Nash API, CRM backend) bypasses RLS automatically.
-- Anon role policies (for future merchant self-service portal):
CREATE POLICY "Merchants read own data" ON merchants
  FOR SELECT USING (cognito_user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "Merchants read own events" ON events
  FOR SELECT USING (merchant_id IN (
    SELECT id FROM merchants WHERE cognito_user_id = current_setting('request.jwt.claims')::json->>'sub'
  ));

CREATE POLICY "Merchants read own conversations" ON conversations
  FOR SELECT USING (merchant_id IN (
    SELECT id FROM merchants WHERE cognito_user_id = current_setting('request.jwt.claims')::json->>'sub'
  ));

CREATE POLICY "Merchants read own products" ON products
  FOR ALL USING (merchant_id IN (
    SELECT id FROM merchants WHERE cognito_user_id = current_setting('request.jwt.claims')::json->>'sub'
  ));