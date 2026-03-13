# Freedom World App Builder — Continuation Prompt

Copy-paste this to resume after session reset:

---

## Context

We're building the Freedom World App Builder — an AI-powered platform where non-technical users describe their business/idea and get a live custom app built for them.

### Architecture (decided 2026-03-12)
- **Vercel**: ALL frontends (our product + ALL merchant app frontends) — global edge CDN
- **Railway**: ALL backends (API service, build containers, Pro tier merchant containers)  
- **Cloudflare**: DNS management — per-merchant CNAME records via API

### Domain Structure
- `onboarding.freedom.world` → Vercel (chat UI frontend)
- `build.freedom.world` → Railway (app builder backend API)
- `api.freedom.world` → RESERVED for future public platform API
- `app.freedom.world` → AWS ELB (existing production — DO NOT TOUCH)
- `{slug}.app.freedom.world` → Vercel (per-merchant apps, created via Cloudflare API)

### What's been built (Sprints 1-3, all complete)

**Sprint 1A** — Backend extraction: `/clawd/bd/freedom-api/` standalone Express + TypeScript API. All 12 routes ported from Next.js. GitHub repo: `khwk-kevin/freedom-api` (public).

**Sprint 1B** — Template: `/clawd/bd/freedom-app-template/` — 5 UI styles (glass/bold/outlined/gradient/neumorphic) on all 7 components. 6 business-type build skills. Static export working.

**Sprint 1C** — Client preview: `/clawd/bd/freedom-onboarding/` — client-side AppPreview renderer, PhoneFrame with animations, UIStylePicker, mobile auto-peek. No iframe/Railway needed for preview.

**Sprint 2A** — API clients: `lib/cloudflare.ts` + `lib/vercel.ts` in freedom-api.

**Sprint 2B** — Deploy pipeline: `lib/deploy.ts` rewritten to target Vercel + Cloudflare. `lib/build-service.ts` for shared Railway build container.

**Sprint 2C** — Real build endpoint: `routes/build-app.ts` — real SSE pipeline replacing fake simulation.

**Sprint 3A** — Railway deployment:
- freedom-api service: `bbc414e1-1851-4bd7-af04-2b6a8df0bab2` in project `4e9b8175-1286-4e6e-b647-188e57e843d6`
- Custom domain: `build.freedom.world` (domain ID: `a988128f-60cb-4723-9f15-b2e2929d7a79`)
- Railway domain: `freedom-api-production-3c07.up.railway.app`
- build-container service: `60ce125a-d23e-4751-8205-21ff937fdd18` (sleep infinity)
- Environment ID: `5701d935-c3ec-420e-80e3-514eca985c12`
- Frontend `NEXT_PUBLIC_API_URL=https://build.freedom.world` set on Vercel + .env.local

### Key files
- PRD v2.0: `/clawd/bd/freedom-onboarding/docs/PRD-app-builder-v2.md`
- Implementation plan: `/clawd/bd/freedom-onboarding/docs/implementation-plan-v2.md`
- Sprint specs: `/clawd/bd/freedom-onboarding/docs/sprints/`
- Memory: `/clawd/atlas/memory/2026-03-13.md`

### Credentials (all in `/root/.openclaw/secrets.json`)
- `env/VERCEL_TOKEN`
- `env/CLOUDFLARE_API_TOKEN` (freedom.world zone)
- `env/CLOUDFLARE_ZONE_ID` (`9171f0eda45115773fef2c1a6ad1e9fc`)
- `env/CLOUDFLARE_API_TOKEN_WEEKIAT` (weekiat@gmail.com account, no zones)
- `env/GITHUB_TOKEN`
- `env/RAILWAY_API_TOKEN`
- `env/RAILWAY_TEAM_TOKEN`

### What remains
1. **Verify Railway is running**: `curl https://build.freedom.world/health` should return 200
2. **End-to-end test**: Run a real interview → build → deploy cycle
3. **UI polish**: Wire style picker into interview flow, test all 6 layouts
4. **Shared API**: Free-tier merchant backend (ordering, booking, loyalty)
5. **Pro tier**: Container provisioning for advanced merchant apps

### CRITICAL RULES
- **NEVER modify or delete existing DNS records, env vars, or infrastructure wiring without asking K first.** Only create NEW ones.
- Always spawn Sonnet agents for coding work — Opus is too expensive
- Always search memory before asking K for credentials
- Always save credentials to memory + encrypted secrets immediately
