/**
 * Freedom World App Builder — Core Types
 * Sprint 1.1 — Data Layer
 *
 * This file is the single source of truth for all app builder data structures.
 * Everything (Railway, Vault Writer, AVA, PostHog) flows through these types.
 */

// ============================================================
// ENUMS & UNIONS
// ============================================================

/** How the app was originated */
export type AppType = 'business' | 'idea';

/** Lifecycle state of the merchant's app */
export type AppStatus =
  | 'interviewing' // AVA interview in progress
  | 'building'     // Claude Code actively building
  | 'deployed'     // Live on {slug}.app.freedom.world
  | 'iterating'    // Post-deploy edits in progress
  | 'suspended';   // Paused / token budget exhausted

/** What triggered a build task */
export type BuildTrigger =
  | 'scrape_complete'    // Q2: scraper returned business data
  | 'idea_described'     // Q2: idea path — description captured
  | 'mood_selected'      // Q3: mood/vibe chosen
  | 'color_changed'      // Q4: primary color set via picker
  | 'products_added'     // Q5: products/services captured
  | 'priorities_set'     // Q6: app priority order defined
  | 'anti_prefs_set'     // Q7: anti-preferences captured
  | 'audience_defined'   // Q8: target audience described
  | 'features_selected'  // Q9: Freedom features chosen
  | 'ad_hoc_request';    // Q10 / iteration: freeform merchant request

/** Build task lifecycle */
export type BuildTaskStatus = 'queued' | 'running' | 'success' | 'failed';

/** Railway VM lifecycle */
export type VMStatus =
  | 'provisioning' // Railway project/service being created
  | 'starting'     // Container starting, dev server booting
  | 'ready'        // Dev server live, HMR active, SSH reachable
  | 'building'     // Claude Code task running
  | 'error'        // Failed state
  | 'stopped';     // Shut down (timeout / suspended)

/** Interview funnel stages — maps 1:1 to PostHog drop-off funnel */
export type FunnelStage =
  | 'page_view'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'q4'
  | 'preview'
  | 'signup'
  | 'q5'
  | 'q6'
  | 'q7'
  | 'q8'
  | 'q9'
  | 'q10'
  | 'deploy'
  | 'return';

/** App builder session phases */
export type SessionPhase =
  | 'hook'         // Phase 1a: Q1–Q4, pre-signup
  | 'depth'        // Phase 1b: Q5–Q10, post-signup
  | 'deploy'       // Phase 2: finalise + deploy
  | 'iteration';   // Phase 3: post-deploy console edits

// ============================================================
// SCRAPED DATA
// ============================================================

/** Data returned from the Google Maps / website scraper */
export interface ScrapedBusinessData {
  name?: string;
  address?: string;
  lat?: number;                    // Latitude (from Google Maps / geocoding)
  lng?: number;                    // Longitude (from Google Maps / geocoding)
  phone?: string;
  website?: string;
  googleMapsUrl?: string;
  rating?: number;
  reviewCount?: number;
  hours?: Record<string, string>; // { "Monday": "09:00–22:00", ... }
  photos?: string[];               // URLs
  categories?: string[];           // Google category tags
  description?: string;
  priceLevel?: 1 | 2 | 3 | 4;    // $ to $$$$
  latitude?: number;               // GPS latitude (from Google Maps)
  longitude?: number;              // GPS longitude (from Google Maps)
  rawHtml?: string;                // Optional: scraped page HTML (for re-processing)
  scrapedAt?: string;              // ISO timestamp
}

// ============================================================
// PRODUCT / CONTENT ITEM
// ============================================================

export interface ProductItem {
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  category?: string;
  isAvailable?: boolean;
}

// ============================================================
// MERCHANT APP SPEC — Single source of truth
// ============================================================

/**
 * MerchantAppSpec is stored in `merchant_apps.spec` (JSONB)
 * and also as individual indexed columns for key fields.
 *
 * This is the full knowledge graph for one merchant's app.
 * Every phase of the interview adds to it. Never replaces it.
 */
export interface MerchantAppSpec {
  // ── Identity ──────────────────────────────────────────────
  id: string;                        // UUID — matches merchant_apps.id
  slug: string;                      // {slug}.app.freedom.world
  region: string;                    // Railway region — e.g. 'ap-southeast-1'

  // ── App classification ────────────────────────────────────
  appType: AppType;                  // Detected from Q1 (not user-chosen)
  businessType?: string;             // 'restaurant' | 'retail' | 'salon' | 'gym' | etc.
  category?: string;                 // More specific: 'thai_restaurant' | 'coffee_shop' | etc.
  businessName?: string;             // Real name (from scrape or Q2 description)
  ideaDescription?: string;          // Q2 idea path: freeform description of app concept

  // ── Mood & visual identity ────────────────────────────────
  mood?: string;                     // e.g. 'warm and inviting', 'clean and minimal'
  moodKeywords?: string[];           // Extracted mood tokens: ['warm', 'inviting', 'earthy']
  primaryColor?: string;             // Hex: '#FF6B35'
  secondaryColor?: string;           // Hex: '#2D3748'

  // ── Products & content ───────────────────────────────────
  products?: ProductItem[];          // Q5: products, services, or content items

  // ── Priorities & preferences ─────────────────────────────
  appPriorities?: string[];          // Q6: ordered list ['menu', 'booking', 'gallery', 'contact']
  antiPreferences?: string[];        // Q7: ['no dark theme', 'no corporate feel']

  // ── Audience ─────────────────────────────────────────────
  audienceDescription?: string;      // Q8: freeform audience description

  // ── Language ─────────────────────────────────────────────
  primaryLanguage: string;           // ISO 639-1: 'en' | 'th' | 'ja' | 'zh' | 'ko' | etc.

  // ── Freedom features selected ────────────────────────────
  selectedFeatures?: string[];       // Q9: ['ordering', 'booking', 'loyalty', 'gallery', 'contact']

  // ── Scraped data ─────────────────────────────────────────
  scrapedData?: ScrapedBusinessData; // Populated on Q2 scrape path only

  // ── Railway / Infrastructure ──────────────────────────────
  railwayProjectId?: string;         // fw-app-{merchantId}
  railwayServiceId?: string;         // The service running the merchant app
  githubRepoUrl?: string;            // One repo per merchant

  // ── Freedom World identity ───────────────────────────────
  freedomUserId?: string;            // Freedom platform user ID (post-signup)
  freedomOrgId?: string;             // Freedom org (community) ID
  freedomCommunityId?: string;       // Community provisioned at signup wall

  // ── Token economics ──────────────────────────────────────
  tokenBalance: number;              // Remaining tokens (decrements with each build)
  tokenUsed: number;                 // Total tokens consumed

  // ── Deployment ───────────────────────────────────────────
  status: AppStatus;
  productionUrl?: string;            // https://{slug}.app.freedom.world
  deployedAt?: string;               // ISO timestamp

  // ── Timestamps ───────────────────────────────────────────
  createdAt: string;                 // ISO timestamp
  updatedAt: string;                 // ISO timestamp
}

// ============================================================
// BUILD TASK
// ============================================================

/**
 * One Claude Code task dispatched via Railway SSH.
 * Created for every interview answer that triggers a build.
 */
export interface BuildTask {
  id: string;                        // UUID
  merchantId: string;                // FK → merchant_apps.id
  trigger: BuildTrigger;             // What caused this build
  status: BuildTaskStatus;           // queued | running | success | failed
  prompt: string;                    // Full prompt sent to `claude -p "..."`
  startedAt?: string;                // ISO timestamp — when SSH command fired
  completedAt?: string;              // ISO timestamp — when claude exited
  durationMs?: number;               // completedAt - startedAt
  error?: string;                    // Error message if failed
  createdAt: string;                 // ISO timestamp
}

// ============================================================
// VAULT FILE
// ============================================================

/**
 * A single file to be written into the merchant's Railway workspace.
 * Used by the Vault Writer to batch context file updates via SSH.
 */
export interface VaultFile {
  path: string;    // Relative to /workspace/ — e.g. 'context/brand.md'
  content: string; // Full file content (UTF-8)
}

// ============================================================
// BUILD RESULT
// ============================================================

/**
 * Result returned by dispatchBuildTask after a Claude Code SSH task completes.
 */
export interface BuildResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  error?: string;
}

// ============================================================
// APP BUILDER SESSION
// ============================================================

/**
 * Tracks one onboarding or iteration session.
 * Sessions can span multiple browser sessions (vault persists state).
 */
export interface AppBuilderSession {
  sessionId: string;      // UUID — matches PostHog session ID when possible
  merchantId: string;     // FK → merchant_apps.id (null pre-signup → anonymous)
  phase: SessionPhase;    // Current phase in the interview/build flow
  startedAt: string;      // ISO timestamp
  lastActiveAt: string;   // ISO timestamp — updated on every message
  funnelStage: FunnelStage; // Granular funnel position for drop-off tracking
}

// ============================================================
// POSTHOG EVENTS
// ============================================================

/**
 * Typed PostHog event union.
 * Usage:
 *   posthog.capture(event.event, event.properties)
 *
 * All events include the base properties automatically via PostHog person/group.
 */

interface PostHogBaseProperties {
  merchantId?: string;
  sessionId?: string;
  appType?: AppType;
  funnelStage?: FunnelStage;
}

export type PostHogEvent =
  | {
      event: 'onboarding_started';
      properties: PostHogBaseProperties & {
        source?: string;    // UTM source
        referrer?: string;
      };
    }
  | {
      event: 'q1_answered';
      properties: PostHogBaseProperties & {
        appType: AppType;
        businessType?: string;
        detectedLanguage?: string;
      };
    }
  | {
      event: 'q2_scrape_success';
      properties: PostHogBaseProperties & {
        hasPhotos: boolean;
        hasHours: boolean;
        hasProducts: boolean;
        rating?: number;
      };
    }
  | {
      event: 'q2_scrape_skip';
      properties: PostHogBaseProperties & {
        reason?: 'no_url' | 'scrape_failed' | 'idea_path';
      };
    }
  | {
      event: 'q2_idea_described';
      properties: PostHogBaseProperties & {
        descriptionLength: number;
      };
    }
  | {
      event: 'q3_mood_selected';
      properties: PostHogBaseProperties & {
        mood: string;
        moodKeywords: string[];
      };
    }
  | {
      event: 'q4_color_selected';
      properties: PostHogBaseProperties & {
        primaryColor: string;
        method: 'picker' | 'suggested' | 'typed';
      };
    }
  | {
      event: 'first_preview_shown';
      properties: PostHogBaseProperties & {
        buildDurationMs: number;
        trigger: BuildTrigger;
      };
    }
  | {
      event: 'signup_wall_shown';
      properties: PostHogBaseProperties;
    }
  | {
      event: 'signup_completed';
      properties: PostHogBaseProperties & {
        freedomUserId: string;
      };
    }
  | {
      event: 'community_created';
      properties: PostHogBaseProperties & {
        freedomCommunityId: string;
        freedomOrgId: string;
      };
    }
  | {
      event: 'q5_products_added';
      properties: PostHogBaseProperties & {
        productCount: number;
      };
    }
  | {
      event: 'q6_priorities_set';
      properties: PostHogBaseProperties & {
        priorities: string[];
      };
    }
  | {
      event: 'q7_anti_prefs_set';
      properties: PostHogBaseProperties & {
        antiPrefCount: number;
      };
    }
  | {
      event: 'q8_audience_defined';
      properties: PostHogBaseProperties & {
        descriptionLength: number;
      };
    }
  | {
      event: 'q9_features_selected';
      properties: PostHogBaseProperties & {
        features: string[];
        featureCount: number;
      };
    }
  | {
      event: 'q10_tweaks_done';
      properties: PostHogBaseProperties & {
        tweakCount: number;
      };
    }
  | {
      event: 'app_build_started';
      properties: PostHogBaseProperties & {
        taskId: string;
        trigger: BuildTrigger;
        prompt: string;
      };
    }
  | {
      event: 'app_build_completed';
      properties: PostHogBaseProperties & {
        taskId: string;
        trigger: BuildTrigger;
        durationMs: number;
      };
    }
  | {
      event: 'app_build_failed';
      properties: PostHogBaseProperties & {
        taskId: string;
        trigger: BuildTrigger;
        error: string;
        durationMs?: number;
      };
    }
  | {
      event: 'app_deployed';
      properties: PostHogBaseProperties & {
        productionUrl: string;
        slug: string;
        totalBuildDurationMs?: number;
      };
    }
  | {
      event: 'iteration_started';
      properties: PostHogBaseProperties & {
        daysSinceDeploy?: number;
      };
    }
  | {
      event: 'token_limit_reached';
      properties: PostHogBaseProperties & {
        tokenUsed: number;
        tokenBalance: number;
      };
    }
  | {
      event: 'upgrade_prompt_shown';
      properties: PostHogBaseProperties & {
        triggerReason: 'token_limit' | 'feature_gate' | 'ad_hoc';
      };
    }
  | {
      event: 'upgraded_to_paid';
      properties: PostHogBaseProperties & {
        plan: string;
        source: 'token_limit' | 'feature_gate' | 'manual';
      };
    }
  | {
      event: 'session_abandoned';
      properties: PostHogBaseProperties & {
        lastFunnelStage: FunnelStage;
        sessionDurationMs: number;
        vmKilled: boolean;
      };
    };

// ============================================================
// VM STATE (for Railway SSH connection management)
// ============================================================

export interface VMState {
  merchantId: string;
  status: VMStatus;
  railwayProjectId?: string;
  railwayServiceId?: string;
  devServerUrl?: string;          // http://... Railway dev server URL for iframe
  sshConnectionString?: string;   // railway ssh --project {id} --service {id}
  provisionedAt?: string;         // ISO timestamp
  lastBuildAt?: string;           // ISO timestamp
  timeoutAt?: string;             // ISO timestamp — when idle VM will be killed
}
