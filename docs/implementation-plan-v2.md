# Implementation Plan v2.0 — Freedom World App Builder
## March 12, 2026

**Architecture:** Vercel (all frontends) + Railway (all backends) + Cloudflare (DNS)
**Goal:** Production-ready end-to-end flow: interview → build → deploy → live app

---

## Current State Audit

### ✅ What exists and works

| Component | Status | Location |
|---|---|---|
| **AVA interview chat** | ✅ Working | `app/api/apps/chat/route.ts` — Anthropic SDK, OAuth token, 10-step interview |
| **AVA system prompt** | ✅ Working | `lib/app-builder/ava-prompt.ts` — extraction tags, phase awareness |
| **Spec extraction** | ✅ Working | `lib/app-builder/extract-spec.ts` — parses [[TAG:value]] from AVA responses |
| **AppBuilder UI** | ✅ Working | `components/onboarding/AppBuilderClientPage.tsx` — split layout, chat + preview |
| **Live preview iframe** | ✅ Working | `components/onboarding/LivePreview.tsx` — shows app preview |
| **Signup wall** | ✅ Working | `components/onboarding/SignupWall.tsx` — appears after phase 1a |
| **GitHub repo creation** | ✅ Working | `lib/app-builder/github.ts` — clones template repo per merchant |
| **Railway project provisioning** | ✅ Working | `lib/app-builder/railway.ts` — creates project + service + env vars |
| **Railway SSH exec** | ✅ Working | `lib/app-builder/railway.ts` — `sshExecCommand()`, `sshWriteFile()` |
| **Build dispatcher + queue** | ✅ Working | `lib/app-builder/build-dispatcher.ts` — FIFO queue, retry logic |
| **Vault writer** | ✅ Working | `lib/app-builder/vault-writer.ts` — generates context files from spec |
| **Deploy flow** | ✅ Working | `lib/app-builder/deploy.ts` — build → git push → prod mode → domain |
| **Token budget** | ✅ Working | `lib/app-builder/token-budget.ts` — per-merchant build limits |
| **Cost tracker** | ✅ Working | `lib/app-builder/cost-tracker.ts` — build duration + cost tracking |
| **Error handler** | ✅ Working | `lib/app-builder/error-handler.ts` — sanitized errors, retry logic |
| **App template repo** | ✅ Working | `/clawd/bd/freedom-app-template/` — Next.js + shadcn + vault structure |
| **Template components** | ✅ Working | Hero ×4, ProductCard ×3, Nav ×3, Contact ×3, Gallery ×3, Footer ×3, CTA ×3 |
| **Theme system** | ✅ Working | `design/theme.json` → CSS variables → ThemeProvider |
| **Supabase tables** | ✅ Working | `merchants`, `merchant_apps`, `build_tasks`, `app_builder_sessions` |
| **Railway env vars** | ✅ Set | `RAILWAY_API_TOKEN`, `RAILWAY_TEAM_TOKEN`, `RAILWAY_REGION`, `RAILWAY_WORKSPACE_ID` |
| **Wildcard DNS** | ✅ Verified | `*.app.freedom.world` → `cname.railway.app` (will be replaced) |
| **CRM dashboard** | ✅ Working | `app/crm/` — pipeline, funnel, analytics, merchant management |
| **Scraper** | ✅ Working | `app/api/apps/scrape/route.ts` + `lib/app-builder/scraper-adapter.ts` |
| **PostHog analytics** | ✅ Working | Event tracking throughout pipeline |
| **Anthropic OAuth token** | ✅ Set | `ANTHROPIC_OAUTH_TOKEN` — Claude Max subscription (itadmin profile) |

### ❌ What's missing / needs to change

| Component | Status | What needs to happen |
|---|---|---|
| **Build endpoint** | 🟡 Fake | `app/api/apps/build-app/route.ts` — SSE simulation with fake steps, returns hardcoded URL. Needs to call real build dispatcher |
| **Cloudflare DNS API** | ❌ Missing | No Cloudflare integration. Need: account setup, API token, per-merchant CNAME creation |
| **Vercel API for merchant deploys** | ❌ Missing | No Vercel project creation API. Need: programmatic project creation, domain assignment, static deploy |
| **Static export pipeline** | ❌ Missing | Current template is server-mode Next.js (`npm run dev` / `npm run start`). Need `output: 'export'` for static builds |
| **Deploy flow targets Railway** | 🟡 Wrong target | `deploy.ts` deploys to Railway (domain + start command). Needs to deploy static files to Vercel + CNAME via Cloudflare |
| **Backend API service (Railway)** | ❌ Missing | API routes (`/api/apps/*`) currently run inside the Vercel frontend. Need to extract to standalone Railway service |
| **Shared API for free-tier merchants** | ❌ Missing | No shared backend for free-tier merchant apps (ordering, booking, loyalty, contact form) |
| **UI style picker** | ❌ Missing | 5 design styles (glass/bold/outlined/gradient/neumorphic) — not in interview or template |
| **6 business-type layouts** | 🟡 Partial | Only restaurant-food build skill exists. Need: retail, fitness, entertainment, community, services |
| **Preview renders from Railway** | 🟡 Old design | Current preview points to Railway dev server iframe. New design: preview should render from AppSpec data client-side (no Railway needed for preview) |
| **Mobile auto-peek** | ❌ Missing | Preview slide-up animation on mobile |
| **Entrance animations** | ❌ Missing | Phone frame scale-up, skeleton shimmer, glow pulse |

---

## Implementation Plan

### Phase 1: Backend API Extraction (Railway)
**Goal:** Move all `/api/apps/*` routes to a standalone Railway service
**Time:** 3-4 days

| Task | Details | Files |
|---|---|---|
| 1.1 Create Railway API service | Express/Fastify app in `freedom-api/` directory. Handles all app builder endpoints. | New: `freedom-api/` |
| 1.2 Extract API routes | Move: `/api/apps/chat`, `/api/apps/scrape`, `/api/apps/provision`, `/api/apps/build-app`, `/api/apps/deploy`, `/api/apps/build-status`, `/api/apps/vm-status` | From `app/api/apps/*` → `freedom-api/routes/` |
| 1.3 Extract lib modules | Move: `lib/app-builder/*` (railway.ts, github.ts, build-dispatcher.ts, vault-writer.ts, deploy.ts, etc.) | From `lib/app-builder/` → `freedom-api/lib/` |
| 1.4 Deploy to Railway | Create Railway service for the API. Assign domain: `api.freedom.world` | Railway GraphQL API |
| 1.5 Update frontend fetch calls | All `fetch('/api/apps/...')` → `fetch('https://api.freedom.world/...')` | `context/AppBuilderContext.tsx` + all components |
| 1.6 CORS configuration | API service allows requests from `*.freedom.world` + `localhost` | `freedom-api/middleware/cors.ts` |
| 1.7 Env vars migration | Copy all Railway/GitHub/Anthropic env vars to the new Railway API service | Railway env vars |

**Deliverable:** API runs on Railway at `api.freedom.world`. Frontend on Vercel calls it. All existing functionality works.

---

### Phase 2: Cloudflare DNS Setup
**Goal:** Cloudflare manages all DNS for `freedom.world`, with API for per-merchant records
**Time:** 1-2 days

| Task | Details | Files |
|---|---|---|
| 2.1 Cloudflare account setup | K creates account, adds `freedom.world`, updates nameservers at registrar | Manual — K does this |
| 2.2 DNS records migration | Add existing records: `freedom.world` → Vercel, `onboarding.freedom.world` → Vercel, `api.freedom.world` → Railway | Cloudflare dashboard |
| 2.3 Cloudflare API client | Node.js module: `createDnsRecord(slug)`, `deleteDnsRecord(slug)`, `listDnsRecords()` | New: `freedom-api/lib/cloudflare.ts` |
| 2.4 API token env var | `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ZONE_ID` added to Railway API service | Railway env vars |

**Deliverable:** Cloudflare manages DNS. API can programmatically create `{slug}.app.freedom.world` CNAME records.

---

### Phase 3: Vercel Deploy Pipeline
**Goal:** Merchant app frontends deploy as static sites to Vercel via API
**Time:** 3-4 days

| Task | Details | Files |
|---|---|---|
| 3.1 Vercel API client | Node.js module: `createVercelProject(slug, repoUrl)`, `assignDomain(projectId, domain)`, `getDeploymentStatus(projectId)` | New: `freedom-api/lib/vercel.ts` |
| 3.2 Vercel token env var | Generate Vercel API token. Add `VERCEL_API_TOKEN` + `VERCEL_TEAM_ID` to Railway API service | Vercel dashboard + Railway env vars |
| 3.3 Template static export | Update `freedom-app-template/next.config.js` — add `output: 'export'` option. Ensure all components work with static export (no `getServerSideProps`, no API routes in template) | `freedom-app-template/next.config.js` |
| 3.4 Rewrite deploy.ts | New pipeline: (1) Claude Code builds in Railway build container → (2) `next build` (static export) → (3) git push → (4) Vercel auto-deploys from GitHub → (5) Cloudflare CNAME → (6) Vercel domain assignment | Rewrite: `freedom-api/lib/deploy.ts` |
| 3.5 Build container (Railway) | Temporary Railway service for running Claude Code builds. Spins up, builds, pushes to GitHub, then idles. NOT the merchant's production host. | `freedom-api/lib/build-service.ts` |
| 3.6 Update Supabase schema | Add columns: `vercel_project_id`, `vercel_deployment_url`, `cloudflare_record_id`, `hosting_tier` (free/pro) | Supabase migration |

**New deploy flow:**
```
Interview complete → "Go live!"
  1. Railway build container: Claude Code customizes template from AppSpec
  2. Railway build container: next build (static export, verify exit 0)
  3. Railway build container: git push to GitHub repo
  4. Vercel API: create project linked to GitHub repo (auto-deploys on push)
  5. Vercel API: assign domain {slug}.app.freedom.world
  6. Cloudflare API: create CNAME {slug}.app.freedom.world → cname.vercel-dns.com
  7. Supabase: update merchant_apps (status=deployed, vercel_project_id, etc.)
  8. Done — app live on Vercel global edge
```

**Deliverable:** Merchant apps deploy to Vercel as static sites with Cloudflare DNS. Global edge performance.

---

### Phase 4: Wire Real Build Pipeline
**Goal:** Replace fake SSE build simulation with real Claude Code builds
**Time:** 2-3 days

| Task | Details | Files |
|---|---|---|
| 4.1 Rewrite build-app endpoint | Replace SSE simulation with real flow: provision → vault write → Claude Code SSH → build → deploy | Rewrite: `freedom-api/routes/build-app.ts` |
| 4.2 SSE progress reporting | Real SSE events from actual build stages: provisioning → vault → building → deploying → live | Same file |
| 4.3 Build container pool | Pre-warm 1-2 Railway build containers (shared, not per-merchant). Claude Code runs here, pushes result to GitHub. Reduces cold start. | `freedom-api/lib/build-pool.ts` |
| 4.4 Timeout handling | Build container max 10 min. If timeout: send error SSE, clean up, notify. | `freedom-api/lib/build-service.ts` |
| 4.5 Error recovery | Build failure → auto-fix via Claude Code (existing logic in deploy.ts) → retry once → if still failing, notify user with helpful message | Existing: `error-handler.ts` |

**Deliverable:** Full real build pipeline. User interviews → app builds live → deploys to Vercel → live URL.

---

### Phase 5: UI Enhancements
**Goal:** UI style picker, business-type layouts, preview animations
**Time:** 4-5 days

| Task | Details | Files |
|---|---|---|
| 5.1 UI style picker component | Interactive cards: Glass, Bold, Outlined, Gradient, Neumorphic. Shows visual preview of each. | New: `components/onboarding/UIStylePicker.tsx` |
| 5.2 Template style variants | Each component in template supports 5 style variants. CSS variable switching. | Update: `freedom-app-template/src/lib/design/components/*.tsx` |
| 5.3 Business-type layouts | 6 layout templates with different section order, icons, nav tabs, quick actions per type | New: `freedom-app-template/skills/build/*.md` (retail, fitness, entertainment, community, services) |
| 5.4 Client-side preview | Replace Railway iframe preview with client-side React renderer. Reads AppSpec → renders preview directly. No Railway needed for preview. Faster, no provisioning required before preview. | Rewrite: `components/onboarding/LivePreview.tsx` |
| 5.5 Preview animations | Phone frame entrance (scale + blur dissolve), skeleton shimmer → slide-up per section, glow pulse on brand color, mobile auto-peek (40vh slide-up for 3.5s) | Update: `components/onboarding/LivePreview.tsx` + new animation CSS |
| 5.6 Multi-select interactions | Tap-to-select cards for business type, hero feature, primary actions. Multiple selection support. | New: `components/onboarding/InteractiveCards.tsx` (expand existing) |

**Deliverable:** Polished interview experience. Every answer visibly changes the preview. 5 design styles × 6 layouts = 30 unique combinations.

---

### Phase 6: Pro Tier Backend Containers
**Goal:** Pro merchants get their own Railway container for dynamic backend features
**Time:** 3-4 days (can be deferred)

| Task | Details | Files |
|---|---|---|
| 6.1 Pro tier provisioning | When merchant upgrades to Pro: create Railway service for their backend API | `freedom-api/lib/pro-tier.ts` |
| 6.2 Backend API subdomain | `{slug}-api.app.freedom.world` → Railway service | Cloudflare + Railway domain assignment |
| 6.3 Frontend API URL config | Pro merchant's frontend `fetch()` calls go to their own backend instead of shared API | Build-time env var: `NEXT_PUBLIC_API_URL` |
| 6.4 Shared API (free tier) | Multi-tenant API: ordering, booking, loyalty, contact forms. Merchant ID isolation. | New: `freedom-api/routes/merchant-api/` |
| 6.5 Upgrade flow | Dashboard button: "Upgrade to Pro" → payment → Railway container provisioned → backend migrated | `components/dashboard/UpgradeModal.tsx` |

**Deliverable:** Two-tier system working. Free tier on shared API, Pro tier on own container.

---

## Priority Sequence

```
Phase 1 (Backend extraction)     ← DO FIRST — separates concerns
    ↓
Phase 2 (Cloudflare DNS)         ← K sets up account, we write API client
    ↓
Phase 3 (Vercel deploy pipeline) ← The big architectural change
    ↓
Phase 4 (Wire real builds)       ← Makes it actually work end-to-end
    ↓
Phase 5 (UI enhancements)        ← Polish and differentiation
    ↓
Phase 6 (Pro tier)               ← Revenue, can defer
```

Phases 1-4 = **production-ready MVP** (2 weeks)
Phase 5 = **differentiation** (1 week)
Phase 6 = **revenue** (deferred until paying merchants exist)

---

## Environment Variables Needed

### New (to be created)

| Variable | Where | Purpose |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Railway API service | Cloudflare DNS record management |
| `CLOUDFLARE_ZONE_ID` | Railway API service | freedom.world zone ID |
| `VERCEL_API_TOKEN` | Railway API service | Create Vercel projects, assign domains |
| `VERCEL_TEAM_ID` | Railway API service | Vercel team/scope for project creation |

### Existing (move to Railway API service)

| Variable | Currently on | Move to |
|---|---|---|
| `ANTHROPIC_OAUTH_TOKEN` | Vercel | Railway API service |
| `RAILWAY_API_TOKEN` | Vercel | Railway API service |
| `RAILWAY_TEAM_TOKEN` | Vercel | Railway API service |
| `RAILWAY_REGION` | Vercel | Railway API service |
| `RAILWAY_WORKSPACE_ID` | Vercel | Railway API service |
| `GITHUB_TOKEN` | Vercel | Railway API service |
| `GITHUB_ORG` | Vercel | Railway API service |
| `GITHUB_TEMPLATE_REPO` | Vercel | Railway API service |
| `SUPABASE_URL` | Both | Both |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel | Railway API service |

### Keep on Vercel (frontend only)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client-side Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side Supabase |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host |
| `NEXT_PUBLIC_API_URL` | Points to `https://api.freedom.world` |

---

## Action Required from K

1. **Create Cloudflare account** (free) — add `freedom.world`, update nameservers at registrar
2. **Get Cloudflare API token** — Zone:DNS:Edit permission, scoped to freedom.world
3. **Get Cloudflare Zone ID** — shown in Cloudflare dashboard for freedom.world
4. **Generate Vercel API token** — Settings → Tokens → create with project creation scope
5. **Get Vercel Team ID** — Settings → General → Team ID (or personal account ID)
6. **Confirm:** Where is `freedom.world` currently registered? (for nameserver change to Cloudflare)

---

## Cost Projection

| Component | Monthly cost | Notes |
|---|---|---|
| Vercel (onboarding + merchant frontends) | $0 | Free tier, static sites |
| Railway (API service) | $5-10 | Single service, always-on |
| Railway (build container) | ~$2-5 | Per-second billing, only active during builds |
| Cloudflare | $0 | Free tier, unlimited DNS records |
| Anthropic (OAuth/subscription) | $0 | Covered by Claude Max subscription |
| Supabase | $0 | Existing free tier |
| GitHub | $0 | Free private repos |
| **Total** | **~$7-15/mo** | Until Pro tier revenue starts |

---

## File Structure After Implementation

```
freedom-onboarding/              ← Vercel (frontend only)
├── app/
│   ├── page.tsx                 ← Landing page
│   ├── start/page.tsx           ← App builder entry
│   ├── signup/page.tsx
│   ├── crm/                     ← CRM dashboard
│   └── api/                     ← REMOVED (moved to Railway)
├── components/
│   ├── onboarding/              ← App builder UI
│   │   ├── AppBuilderClientPage.tsx
│   │   ├── LivePreview.tsx      ← Client-side preview (no iframe)
│   │   ├── UIStylePicker.tsx    ← NEW
│   │   └── ...
│   └── ...
├── context/
│   └── AppBuilderContext.tsx     ← fetch() calls → api.freedom.world
└── lib/
    ├── analytics/
    └── supabase/

freedom-api/                      ← Railway (backend)
├── routes/
│   ├── chat.ts                  ← /chat (Anthropic SDK)
│   ├── scrape.ts                ← /scrape
│   ├── provision.ts             ← /provision (GitHub + build container)
│   ├── build-app.ts             ← /build-app (real build pipeline)
│   ├── deploy.ts                ← /deploy (Vercel + Cloudflare)
│   ├── build-status.ts
│   └── merchant-api/            ← Shared API for free-tier merchant apps
│       ├── orders.ts
│       ├── bookings.ts
│       ├── loyalty.ts
│       └── contact.ts
├── lib/
│   ├── railway.ts               ← Build container management
│   ├── github.ts
│   ├── vercel.ts                ← NEW — Vercel project creation API
│   ├── cloudflare.ts            ← NEW — DNS record management
│   ├── build-dispatcher.ts
│   ├── vault-writer.ts
│   ├── deploy.ts                ← REWRITTEN — targets Vercel + Cloudflare
│   ├── ava-prompt.ts
│   ├── app-spec.ts
│   ├── extract-spec.ts
│   └── ...
└── package.json

freedom-app-template/             ← GitHub template (cloned per merchant)
├── CLAUDE.md
├── context/                      ← Vault files (written by build dispatcher)
├── design/
├── skills/
│   └── build/
│       ├── restaurant-food.md    ← Existing
│       ├── retail.md             ← NEW
│       ├── fitness.md            ← NEW
│       ├── entertainment.md      ← NEW
│       ├── community.md          ← NEW
│       └── services.md           ← NEW
├── src/
│   ├── app/
│   └── lib/design/components/    ← All variants + 5 UI styles
└── next.config.js                ← output: 'export' (static)
```
