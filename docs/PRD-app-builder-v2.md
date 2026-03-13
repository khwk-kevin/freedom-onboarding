# PRD: Freedom World App Builder
## Version 2.0 — March 12, 2026

**Owner:** Kevin Heng
**Status:** In Development
**Last Updated:** 2026-03-12 18:50 UTC
**Changelog:** v2.0 — Major architecture revision: Vercel+Railway hybrid, Cloudflare DNS, static frontends, tiered containers, Anthropic OAuth, UI style personalization

---

## 1. Vision

Freedom World becomes the platform where anyone builds, hosts, and runs custom apps — from restaurant menus to movie aggregators to fitness trackers to games. No code, no infrastructure, no APIs to configure.

The user describes what they want. AVA interviews them. Minutes later, they have a live, branded app that feels uniquely theirs — not a template.

**One-liner:** "Tell us about your business. We'll build your app."

---

## 2. Problem Statement

### For users:
- Want a custom app but can't code and can't afford a developer
- Existing AI builders produce generic, template-feeling output
- Even AI-built apps need someone to handle hosting, deployment, domains
- No platform connects app building with a ready-made ecosystem (payments, tokens, loyalty, community)

### For Freedom World:
- Need acquisition beyond community onboarding
- Need lock-in mechanism (compounding app customization)
- Need revenue model beyond community subscriptions
- 349 imported merchants, 0 real signups — need a compelling "first touch"

### The insight:
> "The connection of them giving their feedback and the app being very close to what they have in their head being manifested in front of their eyes — that will hook them to stay and pay a subscription." — Kevin

---

## 3. Target Users

### Primary: Non-technical business owners (Thailand-first, global ambition)
- Restaurant/café owners, retail shops, salons, gyms, freelancers
- Age: 25-55, Thai-first, can use LINE/social media, cannot code

### Secondary: Anyone who wants an app
- Entertainment/media curators (What2watch-style apps)
- Community builders, clubs, online groups
- Game creators, service marketplaces
- Vibe coders who want a pre-wired ecosystem

### Expanded business types (12 categories):
🍽 Restaurant/Café · 🛒 Retail · 💇 Salon/Spa · 💪 Fitness · 📸 Photography · 🐾 Pet · 🔧 Home Services · 👥 Online Community · 🎮 Games/Entertainment · 🎓 Education/Coaching · 💼 Professional Services · 💡 Other

---

## 4. User Journey

### Phase 1a: Hook (3-5 exchanges, pre-signup)

```
Q1: Business type picker (12 options, tap to select)

Q2: Brand reference (MANDATORY — URL, Instagram, Google Maps, competitor, or image)
    → Scraper extracts: name, colors, fonts, photos, description, products
    → Live preview appears on right panel with their actual brand data

Q3: Hero Feature — "What's the #1 thing your app must do?"
    → Tailored options per business type (multi-select for actions)
    → Preview restructures: layout changes based on business type + feature choice

Q4: UI Design Style picker (NEW in v2.0):
    "Pick your app's design style:"
    1️⃣ Glass & Blur — frosted glass, semi-transparent, iOS-style
    2️⃣ Bold Cards — solid fills, strong shadows, Uber/Nike-style
    3️⃣ Outlined & Clean — thin borders, whitespace, Airbnb/Notion-style
    4️⃣ Gradient Flow — gradient cards, colorful, Instagram/Discord-style
    5️⃣ Neumorphic Soft — raised surfaces, tactile, smart home-style
    → Every card, button, and section in the preview changes immediately

Q5: Color + final confirmation → SIGNUP WALL
```

### Phase 1b: Depth (post-signup, 3-4 exchanges)
- Products/services detail
- User flow (how customers use the app)
- Differentiator (what makes them unique)
- Audience description

### Phase 2: Build & Deploy
- Claude Code builds the full app from AppSpec
- Static frontend exported → deployed to Vercel
- Live at `{slug}.app.freedom.world`

### Phase 3: Iteration (ongoing)
- Merchant returns → requests changes via chat
- Claude Code modifies → redeploy

### Phase 4: Growth (upsell)
- Unlock Pro features: custom backend container, custom domain, advanced features

---

## 5. Technical Architecture (v2.0)

### Architecture: Vercel + Railway + Cloudflare Hybrid

```
┌─────────────────────────────────────────────────────────┐
│                    CLOUDFLARE                            │
│              DNS management (free tier)                  │
│          Per-merchant CNAME records via API              │
│                                                         │
│   freedom.world              → Vercel                   │
│   onboarding.freedom.world   → Vercel                   │
│   dashboard.freedom.world    → Vercel                   │
│   api.freedom.world          → Railway                  │
│   {slug}.app.freedom.world   → Vercel (per-merchant)    │
│   {slug}-api.app.freedom.world → Railway (Pro tier only)│
└─────────────────────────────────────────────────────────┘
           │                              │
    ┌──────▼──────────┐          ┌────────▼──────────┐
    │     VERCEL      │          │     RAILWAY       │
    │  (All Frontend) │   API    │  (All Backend)    │
    │                 │  calls   │                   │
    │ • Landing page  ├─────────►│ • Chat API        │
    │ • Onboarding UI │          │   (Anthropic OAuth)│
    │ • Dashboard     │          │ • Build pipeline  │
    │ • ALL merchant  │          │ • Scraper         │
    │   app frontends │          │ • Shared API      │
    │   (static/SSG)  │          │   (free tier)     │
    │                 │          │ • Per-merchant     │
    │ Global edge CDN │          │   containers      │
    │ <50ms worldwide │          │   (Pro tier)      │
    └─────────────────┘          └───────────────────┘
```

### Key Architecture Decisions (v2.0)

| Decision | Rationale |
|---|---|
| **All frontends on Vercel** | Global edge CDN, <50ms worldwide, free hosting, ISR, next/image optimization. Merchant apps are static exports — no server needed for frontend. |
| **Backend API on Railway** | Long-running AI calls (no 60s timeout), SSH for Claude Code, persistent processes, WebSockets. |
| **Cloudflare for DNS** | Free, API-driven per-merchant CNAME creation. No wildcard needed (Vercel doesn't support it on free/pro). Per-merchant control (delete, redirect individually). |
| **No wildcard DNS** | Per-merchant DNS records via Cloudflare API. More control, works with Vercel, scales to 10k+ merchants. |
| **Anthropic OAuth for chat** | Uses Claude Max subscription — $0 per API call. Token: `sk-ant-oat01-*` (itadmin profile). Switch to API key billing when scaling beyond subscription limits. |
| **Static export for merchant apps** | `next build && next export` → HTML/CSS/JS. No server needed for frontend. Dynamic features via shared or dedicated backend API. |
| **6 business-type layouts** | Not one generic template. Food, Retail, Fitness, Entertainment, Community, Services — each with unique sections, icons, actions, nav tabs. |
| **UI Style personalization** | User chooses Glass/Bold/Outlined/Gradient/Neumorphic. Changes every card, button, section. Makes each app feel designed, not templated. |

### Stack

| Layer | Technology | Host | Cost |
|---|---|---|---|
| Frontend (our product) | Next.js | Vercel | Free tier |
| Merchant app frontends | Next.js static export | Vercel | Free (per project) |
| Backend API | Next.js API routes or Express | Railway (Singapore) | $20/mo Pro |
| AI chat | Anthropic SDK + OAuth token | Railway | $0 (subscription) |
| App building | Claude Code CLI via Railway SSH | Railway | Per-second billing |
| DNS | Cloudflare API | Cloudflare | Free |
| Database | Supabase | Supabase | Existing |
| Code storage | GitHub (1 repo per merchant) | GitHub | Free |
| Monitoring | PostHog | PostHog | Existing |

### Tier Model

```
┌──────────────────────────────────────────────────────┐
│                   ALL TIERS                          │
│            Frontend on Vercel (global edge)          │
│            {slug}.app.freedom.world                  │
│            $0 frontend hosting                       │
└──────────────┬───────────────────────┬───────────────┘
               │                       │
        ┌──────▼──────┐        ┌───────▼───────┐
        │  FREE TIER  │        │   PRO TIER    │
        │             │        │               │
        │ Shared API  │        │ Own container │
        │ backend     │        │ on Railway    │
        │ (Railway)   │        │               │
        │             │        │ Own database  │
        │ Standard    │        │ WebSockets    │
        │ features:   │        │ Custom backend│
        │ • Menu      │        │ Game server   │
        │ • Booking   │        │ AI features   │
        │ • Loyalty   │        │               │
        │ • Gallery   │        │ Custom domain │
        │ • Contact   │        │ support       │
        │             │        │               │
        │ $0/mo       │        │ $X/mo         │
        └─────────────┘        └───────────────┘
```

### Merchant App Provisioning Pipeline

```
Interview complete → "Go live!"
    │
    ├── 1. GitHub: Clone template → khwk-kevin/fw-app-{slug}
    │
    ├── 2. Claude Code: Customize app from AppSpec
    │      (runs in Railway build service via SSH)
    │      - Applies business type layout
    │      - Applies UI style (glass/bold/outlined/gradient/neumorphic)
    │      - Injects products, colors, fonts, images
    │      - Writes all pages from interview data
    │
    ├── 3. Build: next build (static export)
    │
    ├── 4. Vercel API: Create project from GitHub repo
    │      - Assign domain: {slug}.app.freedom.world
    │
    ├── 5. Cloudflare API: Add CNAME record
    │      - {slug}.app.freedom.world → cname.vercel-dns.com
    │
    ├── 6. Supabase: Write to merchant_apps table
    │
    └── 7. Live! 🎉
```

### Multi-Region Scaling (future)

```
Phase 1 (now):     Railway Singapore + Vercel global edge
Phase 2 (growth):  Add Railway us-west1 + europe-west1
Phase 3 (scale):   Cloudflare geo-routes API calls to nearest Railway region

Merchant frontends are ALWAYS global (Vercel edge).
Only backend API latency varies by region.
```

### Custom Domain Support (Pro tier upsell)

```
Phase 1: {slug}.app.freedom.world (free, automatic)
Phase 2: app.baankhunmae.com → CNAME → {slug}.app.freedom.world (Pro tier)
         Vercel handles SSL automatically for custom domains
```

---

## 6. App Personalization System

### 6 Business-Type Layouts

Each business type gets a fundamentally different app structure:

| Layout | Types | Key Sections | Quick Actions | Nav Tabs |
|---|---|---|---|---|
| 🍽 Food | restaurant, cafe | Menu grid, loyalty stamps | Order, Book, Delivery, Visit | Home, Menu, Rewards, Profile |
| 🛒 Retail | retail | Product catalog, category chips | Browse, Cart, Wishlist, Track | Home, Shop, Cart, Account |
| 💪 Fitness | fitness, salon | Class schedule, progress stats | Book Class, Schedule, Progress, Community | Home, Classes, Progress, Profile |
| 🎬 Entertainment | tech/entertainment | Content grid, ratings, trending | Discover, Watchlist, Rate, Share | Home, Discover, Saved, Profile |
| 👥 Community | community, online | Feed, events, member stats | Post, Events, Members, Chat | Feed, Events, Members, Chat |
| 🔧 Services | service, photography | Portfolio, pricing tiers, timeline | Book, Get Quote, Portfolio, Reviews | Home, Services, Book, Profile |

Smart detection: business type + category keywords + heroFeature inference.

### 5 UI Design Styles

User picks during interview. Changes every card, button, and section:

| Style | Visual | Best For |
|---|---|---|
| 🪟 Glass & Blur | Frosted glass, semi-transparent, blur backgrounds | Modern, premium, creative |
| 💪 Bold Cards | Solid fills, strong shadows, chunky buttons | Action-heavy (ordering, booking) |
| ✏️ Outlined & Clean | Thin borders, open whitespace, minimal fills | Content-rich, professional |
| 🌈 Gradient Flow | Gradient card backgrounds, colorful transitions | Creative, social, entertainment |
| 🫧 Neumorphic Soft | Raised surfaces, inset shadows, tactile feel | Premium dashboards, wellness |

### Interview Data → Visual Impact

Every answer must visibly change the preview:

| Interview Answer | What Changes in Preview |
|---|---|
| Business type | Entire layout restructures (different sections, icons, nav) |
| URL scrape | Colors, fonts, bg, images, name, description, products appear |
| Hero Feature | Primary CTA button in hero (Order Now / Discover / Book) |
| Primary Actions | Quick action grid replaces defaults with user's choices |
| UI Style | Every card/button/section changes shape (glass, bold, etc.) |
| User Flow | Section order rearranges to match described journey |
| Differentiator | Prominent banner with Award icon near top of app |
| Audience | Persona card with Heart icon |
| Products | Menu/catalog/schedule populates with real items |
| Color | All accents, buttons, gradients recolor |
| Vibe | Hero badge, overall mood/tone |

### Live Preview Animations

- **Entrance**: Phone frame scales up with blur dissolve when first data arrives
- **Per-section**: Skeleton shimmer → slide-up reveal for each new section
- **Glow pulse**: Phone border glows with brand color on every update
- **Mobile auto-peek**: Preview slides up 40vh for 3.5s on every data change

---

## 7. Auth & AI Cost Model

### Current (testing/POC):
- Anthropic OAuth token (Claude Max subscription, itadmin profile)
- `sk-ant-oat01-*` with `user:inference` scope
- $0 per API call — covered by subscription
- Set as `ANTHROPIC_OAUTH_TOKEN` on Vercel env vars

### At scale:
- Switch to Anthropic API key with usage-based billing
- Use Haiku for interview chat (~$0.001 per conversation)
- Use Sonnet only for complex extraction/build tasks
- Rate limiting + session auth gating on API endpoints

---

## 8. Metrics & Success Criteria

### POC Success
- [ ] End-to-end flow: interview → preview → build → live URL
- [ ] 6 business type layouts rendering correctly
- [ ] UI style picker changes visible in both preview and final app
- [ ] Multi-select working for "Pick 2-3" questions
- [ ] Mobile preview auto-peek working
- [ ] Cloudflare DNS provisioning automated
- [ ] Vercel project creation automated
- [ ] 10 test apps built across different business types

### Acquisition Funnel
| Stage | Metric |
|---|---|
| Page Views | Landed on onboarding |
| Started Chat | Sent first message |
| Reference Given | Shared URL/image |
| Preview Seen | Live preview had data |
| Signed Up | Created account |
| App Built | Build completed |
| App Live | Deployed + accessible |
| First Return | Came back to iterate |
| Subscribed | Converted to paid |

---

## 9. Open Questions

1. **Pricing for Pro tier?** Target price point for Thai SMEs?
2. **Free iteration limit?** How many "make changes" requests before paywall?
3. **LINE Login?** Thai merchants use LINE heavily. Support for POC or later?
4. **Test merchants?** Use Pipedrive imports or fresh test businesses?
5. **Cloudflare account setup?** Need K to create account + add freedom.world domain
6. **Railway team workspace?** Confirm workspace ID for merchant container provisioning
