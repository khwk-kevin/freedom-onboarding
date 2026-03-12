-- ============================================================
-- Freedom World App Builder — Database Schema
-- Migration: 001_merchant_apps
-- Sprint 1.1 — Data Layer
--
-- Tables:
--   merchant_apps        — Per-merchant app registry (MerchantAppSpec)
--   build_tasks          — Claude Code task log (one per interview answer)
--   app_builder_sessions — Session tracking for funnel analytics
--
-- Design decisions:
--   - MerchantAppSpec stored as JSONB (spec column) for flexibility
--   - Key indexed fields promoted to top-level columns for fast queries
--   - status, region, slug, freedom_user_id are indexed individually
--   - RLS: service role (server API) bypasses; anon role reads own data
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE app_status AS ENUM (
  'interviewing',   -- AVA interview in progress
  'building',       -- Claude Code actively building
  'deployed',       -- Live on {slug}.app.freedom.world
  'iterating',      -- Post-deploy edits in progress
  'suspended'       -- Paused / token budget exhausted
);

CREATE TYPE build_task_status AS ENUM (
  'queued',   -- Waiting for VM to be ready
  'running',  -- SSH command dispatched, claude running
  'success',  -- Claude Code completed without error
  'failed'    -- Claude Code errored or SSH failed
);

CREATE TYPE build_trigger AS ENUM (
  'scrape_complete',   -- Q2: scraper returned business data
  'idea_described',    -- Q2: idea path — description captured
  'mood_selected',     -- Q3: mood/vibe chosen
  'color_changed',     -- Q4: primary color set via picker
  'products_added',    -- Q5: products/services captured
  'priorities_set',    -- Q6: app priority order defined
  'anti_prefs_set',    -- Q7: anti-preferences captured
  'audience_defined',  -- Q8: target audience described
  'features_selected', -- Q9: Freedom features chosen
  'ad_hoc_request'     -- Q10 / iteration: freeform merchant request
);

CREATE TYPE session_phase AS ENUM (
  'hook',       -- Phase 1a: Q1–Q4, pre-signup
  'depth',      -- Phase 1b: Q5–Q10, post-signup
  'deploy',     -- Phase 2: finalise + deploy
  'iteration'   -- Phase 3: post-deploy console edits
);

CREATE TYPE funnel_stage AS ENUM (
  'page_view',
  'q1',
  'q2',
  'q3',
  'q4',
  'preview',
  'signup',
  'q5',
  'q6',
  'q7',
  'q8',
  'q9',
  'q10',
  'deploy',
  'return'
);

-- ============================================================
-- TABLE: merchant_apps
--
-- One row per merchant app build.
-- `spec` JSONB holds the full MerchantAppSpec.
-- Frequently-queried fields are promoted to typed columns.
-- ============================================================

CREATE TABLE merchant_apps (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Promoted indexed columns (subset of spec) ────────────
  -- These mirror fields in spec JSONB for fast filtering/sorting.
  slug                TEXT UNIQUE,                           -- {slug}.app.freedom.world
  status              app_status NOT NULL DEFAULT 'interviewing',
  app_type            TEXT CHECK (app_type IN ('business', 'idea')),
  business_name       TEXT,
  primary_language    TEXT DEFAULT 'en',                     -- ISO 639-1
  region              TEXT DEFAULT 'ap-southeast-1',         -- Railway region

  -- ── Freedom World identity ───────────────────────────────
  freedom_user_id     TEXT,                                  -- Post-signup Cognito sub / FW ID
  freedom_org_id      TEXT,
  freedom_community_id TEXT,

  -- ── Infrastructure ───────────────────────────────────────
  railway_project_id  TEXT,
  railway_service_id  TEXT,
  github_repo_url     TEXT,

  -- ── Token economics ──────────────────────────────────────
  token_balance       INTEGER NOT NULL DEFAULT 0,
  token_used          INTEGER NOT NULL DEFAULT 0,

  -- ── Production ───────────────────────────────────────────
  production_url      TEXT,
  deployed_at         TIMESTAMPTZ,

  -- ── Full spec (JSONB — MerchantAppSpec) ──────────────────
  -- Everything else lives here: mood, colors, products,
  -- priorities, anti-prefs, audience, scraped data, features, etc.
  spec                JSONB NOT NULL DEFAULT '{}',

  -- ── Timestamps ───────────────────────────────────────────
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_merchant_apps_status        ON merchant_apps(status);
CREATE INDEX idx_merchant_apps_freedom_user  ON merchant_apps(freedom_user_id);
CREATE INDEX idx_merchant_apps_app_type      ON merchant_apps(app_type);
CREATE INDEX idx_merchant_apps_region        ON merchant_apps(region);
CREATE INDEX idx_merchant_apps_created       ON merchant_apps(created_at DESC);
CREATE INDEX idx_merchant_apps_slug          ON merchant_apps(slug);  -- unique index handles equality; this is belt-and-suspenders for LIKE queries
CREATE INDEX idx_merchant_apps_railway       ON merchant_apps(railway_project_id) WHERE railway_project_id IS NOT NULL;

-- GIN index for JSONB spec queries (mood, products, features, etc.)
CREATE INDEX idx_merchant_apps_spec_gin      ON merchant_apps USING GIN (spec);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER merchant_apps_updated_at
  BEFORE UPDATE ON merchant_apps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- TABLE: build_tasks
--
-- One row per Claude Code task dispatched via Railway SSH.
-- Created every time an interview answer triggers a build.
-- ============================================================

CREATE TABLE build_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES merchant_apps(id) ON DELETE CASCADE,

  trigger         build_trigger NOT NULL,
  status          build_task_status NOT NULL DEFAULT 'queued',

  -- The full prompt sent to: railway ssh ... -- claude -p "..."
  prompt          TEXT NOT NULL,

  -- Timing
  started_at      TIMESTAMPTZ,                               -- When SSH command fired
  completed_at    TIMESTAMPTZ,                               -- When claude exited
  duration_ms     INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN started_at IS NOT NULL AND completed_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (completed_at - started_at))::INTEGER * 1000
      ELSE NULL
    END
  ) STORED,

  error           TEXT,                                      -- Error message if failed

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_build_tasks_merchant    ON build_tasks(merchant_id);
CREATE INDEX idx_build_tasks_status      ON build_tasks(status);
CREATE INDEX idx_build_tasks_trigger     ON build_tasks(trigger);
CREATE INDEX idx_build_tasks_created     ON build_tasks(created_at DESC);

-- Composite: all active tasks for a merchant ordered by recency
CREATE INDEX idx_build_tasks_merchant_status ON build_tasks(merchant_id, status, created_at DESC);


-- ============================================================
-- TABLE: app_builder_sessions
--
-- One row per onboarding or iteration session.
-- Used for funnel analytics and drop-off tracking.
-- Session = one continuous browser/chat session.
-- ============================================================

CREATE TABLE app_builder_sessions (
  session_id      TEXT PRIMARY KEY,                          -- PostHog session_id when available; else UUID
  merchant_id     UUID REFERENCES merchant_apps(id) ON DELETE SET NULL,
                                                             -- NULL = pre-signup anonymous session

  phase           session_phase NOT NULL DEFAULT 'hook',
  funnel_stage    funnel_stage NOT NULL DEFAULT 'page_view',

  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Flexible metadata: UTM params, device type, browser, A/B variant, etc.
  metadata        JSONB NOT NULL DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_app_sessions_merchant      ON app_builder_sessions(merchant_id);
CREATE INDEX idx_app_sessions_phase         ON app_builder_sessions(phase);
CREATE INDEX idx_app_sessions_funnel        ON app_builder_sessions(funnel_stage);
CREATE INDEX idx_app_sessions_started       ON app_builder_sessions(started_at DESC);
CREATE INDEX idx_app_sessions_last_active   ON app_builder_sessions(last_active_at DESC);

-- Partial index: abandoned sessions (no merchant, no longer active)
CREATE INDEX idx_app_sessions_abandoned ON app_builder_sessions(started_at DESC)
  WHERE merchant_id IS NULL;


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE merchant_apps        ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_builder_sessions ENABLE ROW LEVEL SECURITY;

-- ── merchant_apps ──────────────────────────────────────────

-- Service role (server API, Vercel functions) bypasses RLS automatically.
-- Anon/authenticated: read own app by freedom_user_id from JWT.

CREATE POLICY "Users read own app" ON merchant_apps
  FOR SELECT
  USING (
    freedom_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
  );

CREATE POLICY "Users update own app" ON merchant_apps
  FOR UPDATE
  USING (
    freedom_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- ── build_tasks ────────────────────────────────────────────

CREATE POLICY "Users read own build tasks" ON build_tasks
  FOR SELECT
  USING (
    merchant_id IN (
      SELECT id FROM merchant_apps
      WHERE freedom_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    )
  );

-- ── app_builder_sessions ───────────────────────────────────

CREATE POLICY "Users read own sessions" ON app_builder_sessions
  FOR SELECT
  USING (
    merchant_id IN (
      SELECT id FROM merchant_apps
      WHERE freedom_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    )
    OR merchant_id IS NULL  -- Allow anonymous sessions to be read by the session owner via session_id knowledge
  );


-- ============================================================
-- VIEWS
-- ============================================================

-- Funnel conversion summary (for PostHog cross-reference)
CREATE OR REPLACE VIEW app_builder_funnel AS
SELECT
  date_trunc('day', started_at) AS day,
  COUNT(*)                                                          AS total_sessions,
  COUNT(*) FILTER (WHERE funnel_stage IN ('q1','q2','q3','q4','preview','signup','q5','q6','q7','q8','q9','q10','deploy','return'))
                                                                    AS reached_q1,
  COUNT(*) FILTER (WHERE funnel_stage IN ('preview','signup','q5','q6','q7','q8','q9','q10','deploy','return'))
                                                                    AS reached_preview,
  COUNT(*) FILTER (WHERE funnel_stage IN ('signup','q5','q6','q7','q8','q9','q10','deploy','return'))
                                                                    AS reached_signup,
  COUNT(*) FILTER (WHERE funnel_stage IN ('deploy','return'))       AS reached_deploy,
  COUNT(*) FILTER (WHERE funnel_stage = 'return')                   AS returned,
  COUNT(*) FILTER (WHERE merchant_id IS NULL)                       AS abandoned_pre_signup
FROM app_builder_sessions
GROUP BY date_trunc('day', started_at)
ORDER BY day DESC;

-- Build performance summary
CREATE OR REPLACE VIEW build_task_stats AS
SELECT
  trigger,
  status,
  COUNT(*)                                                          AS count,
  AVG(duration_ms)                                                  AS avg_duration_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms)         AS p50_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)        AS p95_duration_ms,
  MAX(duration_ms)                                                  AS max_duration_ms
FROM build_tasks
WHERE duration_ms IS NOT NULL
GROUP BY trigger, status
ORDER BY trigger, status;
