# PRD: Freedom World App Builder
## Version 1.3 — March 10, 2026

**Owner:** Kevin Heng
**Status:** In Development (POC)
**Last Updated:** 2026-03-10 17:43 UTC

---

## 1. Vision

Freedom World becomes the platform where non-technical business owners build, host, and run custom apps — with payments, gamification, social, and marketing tools already wired in.

The merchant describes their business. AVA interviews them. Minutes later, they have a live, branded app that feels uniquely theirs. They never touch code, never see infrastructure, never configure an API.

**One-liner:** "Tell us about your business. We'll build your app."

---

## 2. Problem Statement

### For merchants:
- Want a custom app but can't code and can't afford a developer
- Existing app builders (Replit, Base44, etc.) require technical knowledge
- Even AI-built apps need someone to handle hosting, deployment, databases, domains
- No existing platform connects app building with a ready-made business ecosystem (payments, tokens, loyalty, community)

### For Freedom World:
- Need acquisition beyond community onboarding (which requires understanding Freedom first)
- Need lock-in mechanism that makes merchants stay (current community features alone aren't sticky enough)
- Need revenue model beyond community subscriptions
- 349 imported merchants, 0 real signups — need a compelling "first touch"

### The insight:
> "95-99% of the population are not technical. That's the biggest market. They just prompt something up and we have the entire ecosystem connected through payment, gamification, and social media already." — Kevin

---

## 3. Target Users

### Primary: Non-technical small business owners (Thailand-first)
- Restaurant/café owners
- Retail shop owners
- Service providers (salon, gym, spa, clinic)
- Solo entrepreneurs / freelancers
- Age: 25-55
- Tech literacy: Can use LINE and social media, cannot code
- Language: Thai-first, some English

### Secondary: Technical entrepreneurs
- Vibe coders who want a pre-wired ecosystem
- Developers who want to skip DevOps and jump to building
- Community owners who want custom features

---

## 4. User Journey

### Phase 1: Interview + Live Build (simultaneous, 10-15 minutes)

The interview and app building happen AT THE SAME TIME. The merchant watches their app being built live in a split-screen view — like Replit — as they answer AVA's questions. Each answer triggers Claude Code (running inside their Railway service via SSH) to modify the app, and Next.js HMR updates the preview instantly — changes appear in under 1 second.

```
┌─────────────────────────┬──────────────────────────────┐
│  AVA Chat (left)        │  Live App Preview (right)     │
│                         │  iframe → Railway dev server  │
│  Conversational         │  HMR: <1 second per change    │
│  interview              │                               │
│                         │  Claude Code runs INSIDE      │
│  Each answer triggers   │  the Railway service via SSH  │
│  vault file updates     │  → modifies src/ files        │
│  + Claude Code task     │  → Next.js HMR picks up       │
│                         │  → iframe refreshes instantly │
└─────────────────────────┴──────────────────────────────┘
```

#### Phase 1a: Hook (3-4 exchanges, pre-signup)

```
Q1: "What kind of business do you have?"
    → Business type captured
    → Provisioning starts in background:
      GitHub repo from template + Railway project (dev server + Claude Code ready)

Q2: "Drop your Google Maps / website / social link"
    → Scraper runs → photos, name, location, hours, products
    → SSH into Railway service: write vault files + run claude -p "build homepage"
    → LIVE: App shell appears with their banner, name, real photos

Q3: "How does your business feel?"
    → Mood/tone captured → vault updated
    → SSH into Railway service: run claude -p "mood updated, update variants"
    → LIVE: Entire visual style shifts (rounded corners, warm colors, etc.)

Q4: Color picker interaction
    → Primary color set
    → SSH into Railway service: run claude -p "primary color changed, update theme"
    → LIVE: All accents, buttons, headers recolor instantly
```

At this point the merchant sees a real app with their name, their photos, their colors, their mood. The signup wall appears.

```
SIGNUP WALL
"This is YOUR app. Create a Freedom account to keep building."
└── Email/password or LINE Login
```

#### Phase 1b: Depth (4-5 exchanges, post-signup)

```
Q5: "What do you sell? Tell me about your products/services"
    → Products captured
    → SSH into Railway service: run claude -p "build product section"
    → LIVE: Product grid appears with real items

Q6: "What's most important for your app?"
    → Menu first? Booking? Gallery? Contact?
    → SSH into Railway service: run claude -p "build priority pages"
    → LIVE: New pages appear in navigation

Q7: "Anything you DON'T want?"
    → Anti-preferences captured
    → SSH into Railway service: run claude -p "apply anti-preferences"
    → LIVE: Changes reflect immediately

Q8: "Who are your main customers?"
    → Audience context for copy/tone
    → SSH into Railway service: run claude -p "adjust copy for audience"

Q9: Review + any tweaks
    → "Can you make the header bigger?" "Change the menu layout"
    → SSH into Railway service: run claude -p "{merchant request}"
    → LIVE: Changes in <15 seconds
```

#### Phase 1 Output
- Complete vault (CLAUDE.md + context/ + design/ + skills/ + history/)
- Working app running on Railway dev server (Next.js HMR active)
- Freedom account created + community provisioned with scraped data

### Phase 2: Finalize & Deploy

```
"Your app looks great! Ready to go live?"
├── SSH: npm run build (verify no errors)
├── Switch Railway service: dev mode → production mode (npm run start)
├── Assign custom domain: {slug}.app.freedom.world
├── Freedom community synced (cover, location, first post, publish)
└── "Your app is live! 🎉 Share it with your customers."
```

### Phase 3: Iteration (ongoing)

```
Merchant returns to chat or console:
"Can you add a booking page?"
        │
        ▼
Railway service wakes up (or is already running)
├── SSH into service: Claude Code reads vault + build history
├── Knows the entire context from previous sessions
├── Builds new page consistent with everything before
├── Next.js HMR or production restart
├── Merchant sees updated live URL
├── "Looks good? I'll deploy it."
└── Service stays running (per-second billing — idle ≈ $0)

Free tier: {{NEED INPUT: how many iterations free?}}
Paid: unlimited iterations
```

### Phase 4: Growth (upsell)

```
Freedom Console shows:
├── App performance dashboard (acquisition funnel)
├── "Unlock missions" → paid feature
├── "Add loyalty tokens" → paid feature
├── "Enable online ordering" → paid feature
└── "Add spin wheel game" → paid feature
```

---

## 5. Technical Architecture

### Stack

| Layer | Technology | Cost |
|---|---|---|
| Frontend (onboarding) | Next.js on Vercel (existing) | Existing |
| App building | Railway service — `railway ssh` → Claude Code CLI modifies files | Per-second billing (~$0.03/build) |
| Live preview | iframe → Railway dev server (Next.js HMR, <1 second) | Included in Railway Pro |
| App hosting (production) | Same Railway service, switched to production mode | Included in Railway Pro |
| Custom domains | `{slug}.app.freedom.world` via Railway custom domain | Included in Railway Pro |
| Code storage | GitHub (one repo per merchant, from category template) | Free tier |
| AI engine | Claude Max subscription (parallel builds via parallel SSH sessions) | $100/mo |
| Infrastructure | Railway Pro (Singapore region — build + host everything) | $20/mo |
| Database | Supabase (merchant data, app registry) | Existing |
| Design system | shadcn/ui + custom variant wrappers | N/A |
| Freedom APIs | gateway.freedom.world | Existing |

**Total fixed cost: $120/mo** (Railway Pro $20 + Claude Max $100)

> **Note:** The onboarding frontend (onboarding.freedom.world) stays on Vercel as-is. Railway is used exclusively for merchant app services — build, preview, and production hosting.

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  onboarding.freedom.world (Vercel — existing, unchanged)      │
│  ┌──────────────────┬───────────────────────────────────┐    │
│  │ AVA Chat (left)  │ Live Preview iframe (right)        │    │
│  │                  │ → Railway dev server URL            │    │
│  │ Interview        │ → HMR: reflects in <1 second        │    │
│  └──────────────────┴───────────────────────────────────┘    │
└────────────────────┬─────────────────────────────────────────┘
                     │ SSH via Railway API
                     │ (each interview answer → vault write + claude task)
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  Railway: Merchant App Service (isolated, per-merchant)        │
│  Project: fw-app-{merchantId}  /  Service: builder             │
│  Region: Singapore (ap-southeast-1)                            │
│                                                               │
│  ├── /workspace/              ← Merchant GitHub repo           │
│  │   ├── CLAUDE.md            ← Static (category rules)       │
│  │   ├── context/             ← Written by Vault Writer        │
│  │   ├── design/theme.json    ← Written by Vault Writer        │
│  │   ├── skills/              ← Static                        │
│  │   └── src/                 ← Modified by Claude Code        │
│  │                                                             │
│  ├── npm run dev              ← Next.js dev server (HMR)      │
│  │   └── Public URL: {service}.railway.app (for iframe)        │
│  │                                                             │
│  ├── Claude Code CLI                                           │
│  │   └── Invoked via: railway ssh --service builder            │
│  │                    -- claude -p "task"                      │
│  │   └── Reads CLAUDE.md → modifies /src → HMR picks up       │
│  │                                                             │
│  └── On deploy: switch to npm run start (production mode)     │
│      └── Assign domain: {slug}.app.freedom.world              │
└──────────────────────────────────────────────────────────────┘
                     │
                     ▼
 Freedom APIs (gateway.freedom.world)
 Payments • Tokens • Missions • Auth • Shop
```

**How live building works (the Replit-like dream):**
```
Merchant answers question
    → Vault Writer updates context files
    → SSH into Railway service: write vault files + run claude -p "task"
    → Claude Code modifies src/ files
    → Next.js HMR picks up changes instantly
    → iframe (pointing to Railway dev server URL) refreshes in <1 second
    → Merchant sees changes live
```

**Deploy flow:**
```
Interview complete → "Go live?"
    → SSH: npm run build (verify no errors)
    → Switch Railway service to production mode (npm run start)
    → Assign domain: {slug}.app.freedom.world
    → Done — app is live on Railway
```

### Concurrency Model

Multiple merchants can build simultaneously. Each gets their own Railway project with their own service running their own Claude Code CLI process via SSH.

```
Merchant A interview → Railway project A (SSH) → claude -p "build homepage" ─┐
Merchant B interview → Railway project B (SSH) → claude -p "add menu page"  ─┤ all parallel
Merchant C interview → Railway project C (SSH) → claude -p "update theme"   ─┘
```

| Scale | Approach | Cost |
|---|---|---|
| POC (1-10 concurrent) | 1 Claude Max account ($100/mo) + Railway Pro ($20/mo) | ~$120/mo total |
| Growth (10-50 concurrent) | Multiple Max accounts | $200-500/mo |
| Scale (50+) | Anthropic API (usage-based) | Variable |

Claude Max supports multiple parallel `claude -p` sessions. Each merchant's Railway project is fully isolated — no shared resources. Railway per-second billing means idle services cost essentially nothing.

### Isolation Model

Each merchant = their own isolated Railway project. Full container isolation.

**Per-merchant isolation (Railway project):**
- Each merchant app runs in its own Railway project (separate container)
- Container only sees the merchant's own GitHub repo
- Claude Code has no access to other merchants' data
- Even if prompt injection succeeds, damage is contained to the merchant's own project
- No cross-tenant access possible

**Within the service:**
- Read-only CLAUDE.md (can't modify its own instructions)
- Claude Code scoped to /workspace/src/ and /workspace/public/
- Resource limits (CPU/RAM cap via Railway service config)

### Builder Service Security

Claude Code CLI runs inside the Railway service via SSH with:
- `--dangerously-skip-permissions` (automated, no human in loop)
- `--tools` whitelist: Read, Write, Edit, Bash(npm *), Bash(git *), Bash(node *), Bash(npx *)
- `--disallowedTools` blacklist: Bash(rm -rf /), Bash(curl *), Bash(wget *)
- `--max-turns 100` (cap iterations)
- `--append-system-prompt` with security rules
- **SSH access controlled by our Railway API token** — merchants never get SSH access
- Merchant input never flows directly — sanitized through structured tasks

**SSH command pattern:**
```bash
railway ssh --service builder --project {projectId} -- \
  claude -p "task prompt" \
  --dangerously-skip-permissions \
  --max-turns 100
```

---

## 6. The Vault (Knowledge Graph per Merchant)

Every merchant workspace contains a linked markdown vault — the "exosuit" that Claude puts on each session.

### CLAUDE.md = The `.replit` of Freedom World

CLAUDE.md is **100% static** — identical for every merchant in the same category. It is never modified during the interview. It defines:

- **How to work:** Read context files first, follow skills, use component catalog
- **What tools to use:** Component library, theme system, Freedom SDK
- **Boundaries:** Don't modify core libs, don't hardcode colors, mobile-first
- **Quality gates:** No placeholders, log decisions, test at 375px and 1280px

Think of it as infrastructure config (like `.replit`), not content. The differentiation between merchants comes entirely from `context/` files and `design/theme.json`.

### File Classification

**Static files (same for all merchants in a category, never touched during interview):**
```
CLAUDE.md                           ← Workspace rules (the ".replit")
skills/core/component-design.md     ← Visual quality rules
skills/core/code-quality.md         ← Code standards
skills/build/{category}.md          ← Build recipe
design/system.md                    ← Spacing, typography scale
design/components.md                ← Component catalog (all variants)
design/layouts.md                   ← Layout options
freedom/api.md, sdk.md              ← SDK docs
src/lib/design/components/*         ← Component source code (all variants)
src/lib/design/theme.tsx            ← Theme provider
```

**Merchant-specific files (written/updated during interview):**
```
context/brand.md                    ← Visual identity, mood, anti-preferences
context/business.md                 ← Name, products, location, hours, priorities
context/audience.md                 ← Target customers
context/decisions/001-visual-mood.md ← Mood choice + reasoning
design/theme.json                   ← Colors, fonts, border radius (from mood + color picker)
skills/_active.md                   ← Points to detected category recipe
public/assets/*                     ← Scraped/uploaded photos
history/build-log.md                ← Updated by Claude Code after each task
```

### Interview → File Mapping

Each interview answer writes to specific vault files. Claude Code reads the updated files on its next task.

| Interview Step | Files Written | Claude Code Task |
|---|---|---|
| Q1: Business type | `skills/_active.md` | (provisioning starts, no build yet) |
| Q2: Scrape link | `context/business.md`, `context/brand.md`, `public/assets/*` | **First build:** "Read CLAUDE.md. Build the homepage." |
| Q3: Mood/vibe | `context/brand.md` (mood), `context/decisions/001-visual-mood.md`, `design/theme.json` (variants) | "Mood updated. Re-read theme.json, update component variants." |
| Q4: Color picker | `design/theme.json` (primary color) | "Primary color changed. Update theme across all pages." |
| Q5: Products | `context/business.md` (products detail) | "Products added. Build product section." |
| Q6: Priorities | `context/business.md` (priorities) | "Build priority pages (menu/booking/gallery)." |
| Q7: Anti-prefs | `context/brand.md` (anti-preferences) | "Anti-preferences set. Review and adjust." |
| Q8: Audience | `context/audience.md` | "Audience defined. Adjust copy and tone." |

### Key Principles
1. **Atomic notes** linked via wikilinks — Claude traverses what it needs
2. **Decisions capture reasoning** — WHY not just WHAT
3. **Vault compounds** — each session adds knowledge
4. **Self-improving** — Claude logs friction, proposes structural changes
5. **Vault IS the lock-in** — compounding knowledge makes migration costly
6. **CLAUDE.md is infrastructure** — never content, never merchant-specific

Full blueprint: `/docs/vault-blueprint.md`
Philosophy reference: `/memory/vault-philosophy-arscontexta.md`

---

## 7. Design System

### Foundation: shadcn/ui
Pre-built, production-quality components based on Radix UI + Tailwind CSS.

### Variant Wrapper System
Each component has multiple visual variants mapped to mood/tone:

| Component | Variants | Mood Mapping |
|---|---|---|
| Hero | bold, soft, minimal, split | warm→soft, modern→minimal, bold→bold |
| ProductCard | sharp, rounded, minimal | warm→rounded, modern→sharp, clean→minimal |
| Navigation | top-bar, bottom-tabs, sidebar | mobile-first→bottom-tabs, desktop→top-bar |
| ContactSection | card, split, list | warm→card, minimal→list |
| Gallery | grid, carousel, masonry | depends on photo count |
| Footer | simple, detailed, branded | depends on content amount |
| CTA | banner, card, floating | depends on page context |

### Theme System
- `design/theme.json` contains all tokens (colors, fonts, radius, shadows)
- CSS variables set on `:root` by ThemeProvider
- All components reference CSS vars — never hardcoded colors
- Primary color extracted from brand during onboarding

### Quality Rules (component-design skill)
- No AI slop — every output must feel deliberately designed
- No generic gradients, stock photos, placeholder text
- Mobile-first (375px), responsive to desktop (1280px)
- Real content from context/business.md, real photos from /assets
- Mood consistency enforced through selected variants

---

## 8. Business Categories (POC)

### V1: Restaurant / Food
- Homepage with hero + featured dishes
- Menu page with categories and prices
- About page with story + gallery
- Contact page with LINE + Google Maps
- Bottom-tab mobile navigation

### V2: Retail / Shop
- Homepage with hero + featured products
- Product catalog with filters
- Product detail pages
- About + Contact
- Freedom Shop SDK integration

### V3: Services (Salon, Gym, Spa)
- Homepage with services overview
- Services detail pages
- Booking/contact page
- Testimonials
- About + Contact

**Each category built one at a time, tested thoroughly before moving to next.**

---

## 9. Revenue Model

### Free Tier (acquisition hook)
- AVA interview + brand scraping ✅
- Preview of what the app would look like ✅
- First app build (one-time) ✅
- Live URL on freedom.world subdomain ✅
- {{NEED INPUT: X}} free iterations after initial build
- Basic hosting (Railway idle ≈ $0/mo for us at low traffic)

### Paid Tier (subscription after hook)
- Unlimited iterations / changes
- Custom domain support
- Freedom features unlock:
  - Missions / loyalty program
  - Token rewards
  - Online shop / ordering
  - Gamification (gacha, spin wheel)
  - Marketing console access
- Priority build queue
- App analytics dashboard (acquisition funnel per app)

### Pricing
{{NEED INPUT: What price point?}}
- Option A: Flat monthly (e.g., ฿499/mo or $15/mo)
- Option B: Usage-based (pay for what the app uses)
- Option C: Freemium + transaction fee (% on Freedom payments)

### Unit Economics (estimated)
| Item | Cost to us |
|---|---|
| Hook phase (5 min Railway service) | ~$0.01 |
| Full build session (15 min Railway service) | ~$0.03 |
| Non-converter session (abandon) | ~$0.02-0.03 (service killed on abandon) |
| Hosting idle app | ~$0/mo (near zero at low traffic, Railway per-second) |
| Hosting active app | ~$1-3/mo |
| Iteration session (5-10 min) | ~$0.02-0.05 per session |
| Claude Max subscription | $100/mo (shared, parallel sessions) |
| Railway Pro | $20/mo (covers all build + hosting) |

**Break-even: ~25 paying merchants at $5/mo covers infrastructure.**
**Key insight:** Per-second billing means non-converters cost almost nothing. The service idles at near-zero cost.

---

## 10. Onboarding Interview — Data Requirements

What AVA must collect (maps to vault files):

| Data Point | Vault Destination | Collection Method |
|---|---|---|
| Business name | context/business.md | Direct question |
| Business type/category | skills/_active.md | AVA detects or asks |
| Google Maps link | Scraper → brand.md, business.md | User pastes |
| Website URL | Scraper → brand.md | User pastes |
| Social media links | Scraper → brand.md | User pastes |
| Products / services | context/business.md | Interview + scrape |
| Location + hours | context/business.md | Scrape + confirm |
| Primary color | design/theme.json | Color picker or auto-extract |
| Logo | /assets/logo.png | Scrape or upload |
| Photos | /assets/gallery/ | Scrape from Google Maps |
| Mood / tone | context/decisions/001-visual-mood.md | "How does your business feel?" |
| Anti-preferences | context/brand.md | "Anything you DON'T want?" |
| App priorities | context/business.md | "What's most important?" |
| Target audience | context/audience.md | Interview |
| Language preference | context/brand.md | Detect or ask |
| Contact info (LINE, phone) | context/business.md | Interview + scrape |

---

## 11. Metrics & Success Criteria

### POC Success (first 30 days)
- [ ] Template repo builds successfully with zero errors
- [ ] Vault generation from interview data produces complete context
- [ ] Claude Code CLI builds a restaurant app from template in <10 minutes via Railway SSH
- [ ] Built app looks unique, branded, not like a generic template
- [ ] End-to-end flow works: onboarding → provision Railway service → build via SSH → live URL on Railway
- [ ] {{NEED INPUT: how many test merchants?}} test merchants go through full flow

### Acquisition Funnel Metrics (tracked in existing funnel dashboard)
| Stage | What we measure |
|---|---|
| Page Views | Landed on onboarding |
| Started Chat | Sent first message to AVA |
| Completed Interview | Reached preview stage |
| Signed Up | Created Freedom account |
| App Built | First build completed |
| App Live | Deployed and accessible |
| First Return | Came back to iterate |
| Subscribed | Converted to paid |
| Active (30d) | Using app + console monthly |

### Quality Metrics
- Build success rate: >90% (builds that complete without errors)
- First-output satisfaction: {{how to measure — merchant rates it?}}
- Time to live app: <15 minutes from interview start
- Build cost per merchant: <$0.50

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Claude Code output quality inconsistent | Merchants see bad first impression, drop off | Tight vault constraints + component catalog + build recipes. Test extensively per category. |
| Claude Max rate limits | Builds slow during peak concurrent usage | Multiple parallel sessions under one account. Scale to additional accounts or API if throughput saturates. |
| Merchant prompt injection | Security breach, data leak | Full Railway project isolation per merchant. No cross-tenant access. SSH controlled by our API token. Tool whitelisting. |
| Railway costs scale faster than revenue | Burn money on free-tier users | Per-second billing (near zero at idle). Aggressive dormancy policy (suspend after 30d inactive). |
| Generic-looking apps | No hook, merchants don't pay | Mood/tone system + anti-slop skill + real photos + real content. The vault makes it personal. |
| Build failures / errors | Merchant gets broken app | `npm run build` check before switching to production. Retry logic. Human review queue for failures. |
| Template rigidity | All restaurant apps look the same | Multiple variants per component. Mood system creates visual diversity. Expand variants over time. |
| Live preview latency | Claude Code takes 10-30s per task, merchant waits | Keep tasks small and focused. Show "building..." indicator. Parallel tasks where possible. HMR is instant once files save. |
| Railway service spin-up time | Merchant waits for Railway service to start | Start provisioning at Q1 (business type), before they even paste a link. Service ready by Q2. |
| Abandoned sessions waste compute | Services running for non-converters | Per-second billing + aggressive timeout (suspend service after 5min inactivity). Cost per abandon: ~$0.02-0.03. |
| Railway build queue delays | Slow initial service deploy during Railway congestion | Observed during POC (Railway-wide issue, not plan-specific). Mitigate: start provisioning early (Q1), use Singapore region for Thai users. |
| Next.js 16 "use client" requirement | Design components fail to render, build errors | Verified fix: all design components need "use client" directive. Applied to template. |

---

## 13. Implementation Phases

### Phase 0: Foundation (current — Week 1) ✅
- [x] Architecture decided (Railway + Claude Code CLI via SSH + vault)
- [x] Vault blueprint designed (arscontexta knowledge graph)
- [x] Skills written (component-design, code-quality, restaurant-food)
- [x] Template repo scaffolded (`/clawd/bd/freedom-app-template/`)
- [x] Component variants built (Hero ×4, ProductCard ×3, Nav ×3, Contact ×3, Gallery ×3, Footer ×3, CTA ×3)
- [x] Theme provider working (CSS vars from theme.json)
- [x] PRD v1.3 written

### Phase 1: Live Preview Infrastructure (Week 2)
- [ ] Railway API integration: programmatic project + service creation (12s provisioning confirmed in POC)
- [ ] Railway service starts with `npm run dev` (Next.js dev server + HMR)
- [ ] iframe integration: onboarding app embeds Railway dev server URL
- [ ] SSH-based build dispatch: `railway ssh --service builder -- claude -p "task"`
- [ ] Vault injection: write context files into Railway service via SSH before each Claude task
- [ ] HMR verification: confirm changes reflect in iframe within 1 second

### Phase 2: Interview + Live Build (Week 2-3)
- [ ] Rewrite AVA interview for extended flow (hook phase + depth phase)
- [ ] Wire interview extractions to vault file generation
- [ ] Each interview answer triggers SSH → vault write → Claude Code task on Railway service
- [ ] Signup wall appears after Phase 1a (hook — 3-4 exchanges)
- [ ] Post-signup continues deeper interview + building
- [ ] Live preview shows real app updating as merchant answers

### Phase 3: Deploy & Freedom Sync (Week 3)
- [ ] "Go live" flow: SSH → `npm run build` → switch service to production mode (`npm run start`)
- [ ] Domain assignment: `{slug}.app.freedom.world` via Railway custom domain API
- [ ] Wildcard DNS: `*.app.freedom.world → CNAME` to Railway
- [ ] Freedom account creation + community provisioning
- [ ] Sync cover, location, first post, publish (existing flow)

### Phase 4: Iteration Loop (Week 4)
- [ ] "Make changes" flow: merchant returns → Railway service resumes → live editing via SSH
- [ ] Vault persistence: all context survives between sessions (committed to GitHub repo)
- [ ] Build history tracking in history/build-log.md
- [ ] Ad-hoc requests: "make the header bigger" → SSH → Claude Code → HMR → done
- [ ] Redeploy after changes: switch back to production mode

### Phase 5: Billing & Scaling (Week 5-6)
- [ ] Usage tracking per merchant Railway project
- [ ] Free tier limits enforcement
- [ ] Subscription payment integration
- [ ] Multiple Claude Max accounts for concurrent capacity
- [ ] Dormancy policy for inactive apps (suspend Railway service after 30d)

---

## 13.5. POC Results

**Validated during POC (March 2026):**

| Test | Result |
|---|---|
| Vault → App | ✅ Validated. Sonnet built 4 Thai restaurant pages in ~10 minutes from vault context. Output was uniquely branded, not generic. |
| Railway API provisioning | ✅ Working. Project + service creation: ~12 seconds. Build queue was slow during test (Railway-wide congestion, not plan-specific). |
| Railway SSH | ✅ Confirmed. `railway ssh` opens shell into running container via WebSocket. No SSH daemon needed. Enables live Claude Code execution with HMR. This IS the Replit-like architecture. |
| Template fix | ⚠️ Required fix: design components need `"use client"` directive for Next.js 16. Applied to template. |
| HMR | ✅ Next.js dev server picks up file changes in <1 second. iframe updates in real time. |

**Architecture validation:** The Railway SSH + Claude Code + HMR combination delivers the original "Replit-like live building" vision from the PRD. The merchant sees their app change as they answer questions — no deploy lag, no page reload.

---

## 14. Open Questions

{{Items I need K's input on:}}

**Q1: LINE Login for signup?**
Thai merchants heavily use LINE. Should the signup wall support LINE Login for POC, or just email/password to start?

**Q2: How many free iterations?**
After the initial build, how many "make changes" requests before they need to pay? Options: 3, 5, unlimited for 7 days, or just the initial build.

**Q3: Pricing for paid tier?**
What's the target price point? Needs to be cheap enough that a Thai SME solopreneur doesn't think twice.

**Q4: Custom domain in POC?**
Do we support custom domains from the start, or only freedom.world subdomains for POC?

**Q5: How do we measure first-output satisfaction?**
After the app is built, do we ask the merchant to rate it? Thumbs up/down? Or just track whether they come back?

**Q6: Test merchants for POC — who?**
Do we use the 349 Pipedrive-imported merchants? Or onboard fresh test businesses?

**Q7: Mobile app vs web app?**
The built apps are web apps (Next.js). Is that clear to merchants, or will they expect a native app they can download?

**Q8: Language of the build skill — Thai or English?**
The build recipes and CLAUDE.md are in English. Claude Code operates in English. But the app content should be Thai. Is that fine, or should the vault itself be bilingual?

---

## 15. References

- Vault Blueprint: `/clawd/bd/freedom-onboarding/docs/vault-blueprint.md`
- Component Design Skill: `/clawd/bd/freedom-onboarding/docs/skills/core/component-design.md`
- Code Quality Skill: `/clawd/bd/freedom-onboarding/docs/skills/core/code-quality.md`
- Vault Philosophy: `/clawd/atlas/memory/vault-philosophy-arscontexta.md`
- Meeting Transcript: Kevin/Laurent/Alex — March 10, 2026 (98 min)
- Memory Checkpoint: `/clawd/atlas/memory/2026-03-10.md`
- Template Repo: `/clawd/bd/freedom-app-template/` (built, compiles clean)
