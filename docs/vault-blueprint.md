# Merchant Workspace Vault Blueprint
## Freedom World App Builder — Template Architecture

> This document defines the folder structure, file contents, link patterns,
> and generation rules for every merchant app workspace.

---

## Folder Structure

```
merchant-workspace/
│
├── CLAUDE.md                          ← Entry point: "Put on the exosuit"
│
├── context/                           ← Knowledge about this merchant
│   ├── brand.md                       ← Visual identity, mood, tone, personality
│   ├── business.md                    ← What they do, products, services, location
│   ├── audience.md                    ← Who their customers are
│   └── decisions/                     ← Decision log (one file per major decision)
│       ├── _index.md                  ← Map of all decisions
│       ├── 001-visual-mood.md         ← "Why we chose warm & cozy"
│       ├── 002-layout-choice.md       ← "Why single-page scroll vs multi-page"
│       └── 003-feature-priority.md    ← "Why menu page comes before booking"
│
├── design/                            ← Design system for this app
│   ├── system.md                      ← Design rules, spacing, typography
│   ├── components.md                  ← Component catalog with variant options
│   ├── layouts.md                     ← Available layout patterns
│   └── theme.json                     ← Generated theme tokens (colors, fonts, etc)
│
├── skills/                            ← Build recipes & quality skills
│   ├── _active.md                     ← Points to the active build recipe
│   ├── core/                          ← Skills that ALWAYS apply
│   │   ├── component-design.md        ← Component selection, visual quality, brand consistency
│   │   └── code-quality.md            ← TypeScript, Next.js, Tailwind standards
│   ├── build/                         ← Category-specific build recipes
│   │   ├── restaurant-food.md
│   │   ├── retail-catalog.md
│   │   └── service-booking.md
│   └── freedom/                       ← Freedom integration skills
│       ├── auth-setup.md
│       ├── shop-integration.md
│       └── mission-setup.md
│
├── freedom/                           ← Freedom World integration context
│   ├── api.md                         ← Available Freedom APIs and how to use them
│   ├── sdk.md                         ← Freedom SDK reference (pre-installed)
│   └── features.md                    ← Paid features available for upsell
│
├── history/                           ← Compounding knowledge
│   ├── build-log.md                   ← Every build session: what, when, why
│   ├── feedback.md                    ← Merchant feedback and preferences
│   └── friction.md                    ← Observations, contradictions, improvement notes
│
├── assets/                            ← Merchant's brand assets
│   ├── logo.png
│   ├── banner.jpg
│   └── gallery/
│       ├── photo-1.jpg
│       ├── photo-2.jpg
│       └── ...
│
├── src/                               ← The actual app code (Claude builds here)
│   ├── app/                           ← Next.js app directory
│   ├── components/                    ← App-specific components
│   ├── lib/
│   │   ├── design/                    ← Pre-built component library
│   │   │   ├── components/            ← Hero, Card, Nav, Footer, etc.
│   │   │   ├── layouts/               ← SinglePage, MultiPage, AppShell
│   │   │   └── theme.ts              ← Theme provider (reads theme.json)
│   │   └── freedom/                   ← Freedom SDK integration
│   └── public/
│       └── assets/ → symlink to /assets
│
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## File Specifications

### CLAUDE.md — The Entry Point

```markdown
---
type: entry
updated: {{timestamp}}
merchant: {{merchantId}}
app: {{appName}}
---

# This vault is your exosuit.

When you join this session, you put on the accumulated knowledge
of {{businessName}} and everything decided so far.

You are not an assistant. You are the builder of this merchant's app.

## Before ANY task, orient yourself:

1. [[context/brand.md]] — Who this business is visually
2. [[context/business.md]] — What they do and what they need
3. [[context/decisions/_index.md]] — Every decision made and WHY
4. [[design/system.md]] — How to build visually
5. [[history/build-log.md]] — What's been built so far

## Your current build skill:
→ [[skills/_active.md]]

## Rules of this workspace:

### Core Skills (always active)
These govern HOW you build. Read them before your first task:
- [[skills/core/component-design.md]] — Component selection, visual quality, brand consistency
- [[skills/core/code-quality.md]] — TypeScript, Next.js, Tailwind standards

### Current Build Skill
This governs WHAT you build (step-by-step recipe):
→ [[skills/_active.md]]

### Building
- Follow the active build skill step by step
- Follow core skills on EVERY page you build
- ALWAYS use components from [[design/components.md]]
- NEVER create custom components for standard UI patterns
- All styling through Tailwind using tokens from [[design/theme.json]]
- Mobile-first. Everything must work at 375px.

### Knowledge
- Every decision you make → log in [[context/decisions/]] with WHY
- Never contradict a prior decision without explicitly flagging it
- After completing a task → update [[history/build-log.md]]
- If something feels wrong or inconsistent → note in [[history/friction.md]]

### Boundaries
- Only modify files in /src and /assets
- Do not modify CLAUDE.md or /context files (those are source of truth)
- Do not modify /lib/design core components (use them, don't change them)
- Freedom SDK integration follows [[freedom/sdk.md]] exactly

### Quality
- No placeholder text — use real content from [[context/business.md]]
- No stock images — use merchant's photos from /assets
- No hardcoded colors — always reference theme
- Test every page at mobile (375px) and desktop (1280px)
```

**Generated at:** Onboarding completion
**Updated by:** Never by Claude (source of truth)

---

### context/brand.md

```markdown
---
type: context
domain: brand
source: onboarding-interview
created: {{timestamp}}
---

# Brand Identity: {{businessName}}

## Visual Mood
> "{{ownerQuote about how their business feels}}"

**Mood keywords:** {{mood tags, e.g. "warm, cozy, friendly, natural"}}
**Anti-mood:** {{what they DON'T want, e.g. "corporate, cold, minimal"}}

→ Mood guides component variant selection in [[design/components.md]]

## Colors
- **Primary:** {{primaryColor}} — {{why this color, e.g. "extracted from their logo"}}
- **Secondary:** {{secondaryColor or "derived from primary"}}
- **Background:** {{light/dark preference}}
- **Accent:** {{accentColor}}

Full token set in [[design/theme.json]]

## Typography
- **Heading font:** {{font}}
- **Body font:** {{font}}
- **Language:** {{primary language, e.g. "Thai-first, English secondary"}}

## Logo & Photos
- Logo: `/assets/logo.png` — {{description, e.g. "green leaf icon, round"}}
- Banner: `/assets/banner.jpg` — {{description}}
- Gallery: {{count}} photos in `/assets/gallery/`
- Photo style: {{observation, e.g. "warm lighting, close-up food shots"}}

## Brand Personality
- Tone of voice: {{e.g. "friendly and casual, uses Thai colloquial"}}
- Values: {{e.g. "family-run, quality ingredients, neighborhood feel"}}

## References
- {{If merchant mentioned any website/app they admire}}
- {{Google Maps listing URL}}
- {{Social media links}}
```

**Generated at:** Onboarding (from scraper + interview)
**Updated by:** Only through merchant feedback

---

### context/business.md

```markdown
---
type: context
domain: business
source: onboarding-interview
created: {{timestamp}}
---

# Business: {{businessName}}

## Overview
- **Type:** {{e.g. "Restaurant — Thai street food"}}
- **Location:** {{address}}
- **Coordinates:** {{lat}}, {{lng}}
- **Hours:** {{operating hours if known}}
- **Contact:** {{phone, LINE ID, email}}

## Products / Services
{{List of main products or services with descriptions}}

## What the owner wants from this app
> "{{owner's own words about what they want}}"

Key priorities (ordered):
1. {{e.g. "Show the menu with photos"}}
2. {{e.g. "Let customers contact via LINE"}}
3. {{e.g. "Show location and hours"}}

## What's working for them today
- {{e.g. "Most orders come through LINE"}}
- {{e.g. "Google Maps brings most new customers"}}

## Business goals
- {{e.g. "Get more walk-in customers from the area"}}
- {{e.g. "Build a loyal customer base"}}

→ Goals inform feature priority in [[skills/_active.md]]
→ Location data used for [[freedom/api.md]] POI integration
```

**Generated at:** Onboarding (from scraper + interview)

---

### context/audience.md

```markdown
---
type: context
domain: audience
source: onboarding-interview
created: {{timestamp}}
---

# Target Audience: {{businessName}}

## Primary customers
- {{e.g. "Office workers in Sukhumvit area, 25-40, Thai"}}
- {{e.g. "Pet owners in the neighborhood"}}

## How customers find them
- {{e.g. "Google Maps, walk-by, LINE referral"}}

## What customers care about
- {{e.g. "Quick ordering, menu photos, prices"}}

## Language
- **Primary:** {{e.g. "Thai"}}
- **Secondary:** {{e.g. "English (for tourists)"}}

→ Language affects all copy in the app
→ Audience informs UI decisions in [[design/system.md]]
```

**Generated at:** Onboarding interview
**Can be thin initially** — grows as merchant provides feedback

---

### context/decisions/_index.md

```markdown
---
type: map-of-content
domain: decisions
---

# Decision Log

Every major decision made for {{businessName}}'s app, with reasoning.

## Decisions
{{Dynamically updated list}}
- [[001-visual-mood.md]] — Visual mood: {{chosen mood}}
- [[002-layout-choice.md]] — Layout: {{chosen layout}}
- [[003-feature-priority.md]] — Feature priority order

## Rules
- New decisions get the next sequential number
- Always include: WHAT was decided, WHY, WHAT was rejected
- Reference the source (interview, feedback, build observation)
- If a new decision contradicts an old one, link both and explain
```

---

### context/decisions/001-visual-mood.md (example)

```markdown
---
type: decision
number: 1
domain: design
created: {{timestamp}}
source: onboarding-interview
---

# Decision: Visual Mood → {{chosen mood}}

## What
The app's visual mood is **{{e.g. "warm & cozy"}}**.

## Why
Owner described their business as: "{{direct quote}}"
Keywords extracted: {{mood tags}}
This maps to component variants: {{e.g. "rounded corners, warm shadows, soft palette"}}

## Rejected alternatives
- {{e.g. "Modern & minimal — too cold for a neighborhood food shop"}}
- {{e.g. "Bold & energetic — doesn't match their calm, friendly vibe"}}

## Implications
- Hero variant: {{e.g. "soft"}} (see [[design/components.md#hero]])
- Card variant: {{e.g. "rounded"}} (see [[design/components.md#cards]])
- Corner radius: 12px+ (not sharp)
- Shadows: soft, warm-tinted
```

---

### design/system.md

```markdown
---
type: design
domain: system
linked: [[context/brand.md]], [[design/theme.json]]
---

# Design System: {{businessName}}

## Foundation
Based on mood: **{{mood}}** (see [[context/decisions/001-visual-mood.md]])
Theme tokens: [[design/theme.json]]

## Spacing Scale
4, 8, 12, 16, 24, 32, 48, 64, 96 (px)

## Border Radius
{{Based on mood — e.g. "12px default, 16px cards, full for avatars"}}

## Shadows
{{Based on mood — e.g. "Soft: 0 2px 8px rgba(primary, 0.08)"}}

## Typography Scale
- Display: 36/40px — page titles
- H1: 28/32px — section headers
- H2: 22/28px — subsection headers  
- Body: 16/24px — main text
- Small: 14/20px — captions, metadata
- Tiny: 12/16px — labels, badges

## Image Treatment
- Border radius: matches card radius
- Aspect ratios: 16:9 (banners), 1:1 (products), 4:3 (gallery)
- Always use next/image with proper width/height

## Layout Rules
- Max width: 1200px
- Mobile: single column, 16px padding
- Tablet: 2-column where appropriate
- Desktop: content centered, max-width applied

## Interaction
- Button hover: darken primary 10%
- Link color: primary
- Focus: 2px ring in primary color
- Transitions: 150ms ease
```

---

### design/components.md

```markdown
---
type: design
domain: components
linked: [[design/system.md]], [[context/decisions/001-visual-mood.md]]
---

# Component Catalog

All components are in `/src/lib/design/components/`.
ALWAYS import from here. NEVER recreate standard patterns.

## Selected variants for this app
Based on mood **{{mood}}** → variant set: **{{variant set name}}**

## Hero
File: `Hero.tsx`
Variants:
- `bold` — full-bleed image, overlay text, strong contrast
- `soft` — image with rounded edges, text beside, gentle shadow ← {{SELECTED if warm}}
- `minimal` — text-focused, small accent image, lots of whitespace
- `split` — 50/50 image and text side by side

Usage: `<Hero variant="soft" image="/assets/banner.jpg" title="..." subtitle="..." />`

## ProductCard
File: `ProductCard.tsx`  
Variants:
- `sharp` — square corners, minimal padding, dense
- `rounded` — rounded corners, generous padding, shadow ← {{SELECTED if warm}}
- `minimal` — no border, text-only, clean

Usage: `<ProductCard variant="rounded" image="..." name="..." price="..." />`

## Navigation
File: `Navigation.tsx`
Variants:
- `top-bar` — standard horizontal top navigation
- `bottom-tabs` — mobile app-style bottom tabs ← {{SELECTED for mobile-first}}
- `sidebar` — left sidebar navigation (desktop-heavy apps)

## ContactSection
File: `ContactSection.tsx`
Variants:
- `card` — all contact info in one card with map
- `split` — map on one side, details on other
- `list` — simple vertical list of contact methods

## Gallery
File: `Gallery.tsx`
Variants:
- `grid` — 2x2 or 3x3 photo grid
- `carousel` — swipeable photo carousel
- `masonry` — Pinterest-style layout

## Footer
File: `Footer.tsx`
Variants:
- `simple` — one line: copyright + social links
- `detailed` — columns: links, contact, hours, social
- `branded` — logo + tagline + minimal links

## CTA
File: `CTA.tsx`
Variants:
- `banner` — full-width colored banner with button
- `card` — centered card with action
- `floating` — sticky bottom bar with action button

---

**Adding new components:**
If a pattern doesn't exist here, check if a variant of an existing component works first.
Only create a new component if truly unique to this business.
Log the decision in [[context/decisions/]].
```

---

### skills/_active.md

```markdown
---
type: skill
active: true
category: {{detected category}}
---

# Active Build Skill

This app follows the **{{category}}** build recipe.

→ [[{{category}}.md]]
```

---

### skills/restaurant-food.md (example)

```markdown
---
type: skill
category: restaurant-food
version: 1.0
---

# Build Skill: Restaurant / Food Business

## Prerequisites
Before building, confirm you've read:
- [[context/brand.md]] — especially photos and menu items
- [[context/business.md]] — especially products list and priorities
- [[design/components.md]] — know your selected variants
- [[design/theme.json]] — colors are configured

## Build Steps

### Step 1: Homepage
Create `src/app/page.tsx`
1. Hero — banner photo, business name, tagline
2. Featured items — 3-4 top products using ProductCard
3. About snippet — 2-3 sentences from [[context/business.md]]
4. Contact quick-access — phone, LINE, hours
5. CTA — "View Full Menu" button

Log: [[history/build-log.md]] ← "Homepage complete"

### Step 2: Menu Page
Create `src/app/menu/page.tsx`
1. Grouped by category (from [[context/business.md]] products)
2. Each item: photo (if available), name, description, price
3. Use PriceList or ProductCard depending on photo availability
4. If menu has 20+ items: add category tabs/filter

Log: [[history/build-log.md]] ← "Menu page complete"

### Step 3: About Page
Create `src/app/about/page.tsx`
1. Business story (from [[context/business.md]])
2. Gallery of photos from /assets/gallery/
3. Location map (if coordinates available)
4. Opening hours

### Step 4: Contact Page
Create `src/app/contact/page.tsx`
1. ContactSection component with all methods
2. LINE button (prominent — see [[context/business.md]] for LINE ID)
3. Google Maps embed or link
4. Address and directions

### Step 5: Navigation & Layout
1. Apply layout from [[design/layouts.md]]
2. Bottom tabs for mobile: Home, Menu, About, Contact
3. Top nav for desktop
4. Footer with business info

### Step 6: Final Check
1. Run `npm run build` — fix any errors
2. Check every page at 375px width
3. Verify all images load
4. Verify theme colors applied consistently
5. Verify no placeholder text remains

Log: [[history/build-log.md]] ← "Build complete, all steps done"

## Freedom Integration (post-launch)
These require merchant subscription:
- [[freedom/features.md#missions]] — loyalty program
- [[freedom/features.md#shop]] — online ordering
- [[freedom/features.md#tokens]] — reward tokens
```

---

### freedom/api.md

```markdown
---
type: reference
domain: freedom-integration
---

# Freedom World API Reference

Base URL: `gateway.freedom.world/api`

## Pre-configured
These are already set up in this workspace via environment variables:
- `FREEDOM_API_KEY` — merchant's API key
- `FREEDOM_ORG_ID` — organization ID
- `FREEDOM_COMMUNITY_ID` — community ID

## Available APIs
See Freedom SDK in `/src/lib/freedom/` for typed wrappers.

### Community Info
`GET /fdw-console/v1/organizations/{orgId}/info`

### Shop / Products
`GET /freedom-community-shop/v1/organizations/{orgId}/products`

### Feed / Posts
`POST /fdw-console/v1/organizations/{orgId}/feed`

### POI / Location
`POST /fdw-console/v1/organizations/{orgId}/community/{communityId}/poi/requests`

→ Full endpoint list in [[freedom/sdk.md]]
```

---

### history/build-log.md

```markdown
---
type: history
domain: builds
---

# Build Log: {{businessName}}

## Session 1 — Initial Build
**Date:** {{timestamp}}
**Skill:** [[skills/{{category}}.md]]
**Duration:** ~{{X}} minutes

### Completed
- [ ] Step 1: Homepage
- [ ] Step 2: Menu Page
- [ ] Step 3: About Page
- [ ] Step 4: Contact Page
- [ ] Step 5: Navigation & Layout
- [ ] Step 6: Final Check

### Notes
{{Claude adds observations here during build}}

---

## Session 2 — {{future iteration}}
**Date:** 
**Requested:** 
**Changes:**

```

---

### history/friction.md

```markdown
---
type: history
domain: observations
---

# Friction & Observations

Things noticed during builds that might need attention.
When enough observations accumulate, propose changes.

## Template
- **Date:** 
- **Observation:** 
- **Severity:** low / medium / high
- **Suggestion:** 
- **Related:** [[link to relevant context file]]
```

---

## Generation Rules

### What's generated at onboarding (by our backend):
| File | Source |
|---|---|
| CLAUDE.md | Template + merchant data |
| context/brand.md | Scraper + interview |
| context/business.md | Scraper + interview |
| context/audience.md | Interview (can be thin) |
| context/decisions/001-visual-mood.md | Interview mood selection |
| design/theme.json | Primary color + font + mood calculations |
| design/system.md | Template + mood-based rules |
| design/components.md | Template + mood-based variant selection |
| skills/_active.md | Detected business category |
| skills/core/component-design.md | Standard (same for all, merged frontend-design + brand rules) |
| skills/core/code-quality.md | Standard (same for all) |
| skills/build/{category}.md | Matched to detected business category |
| skills/freedom/*.md | Standard (same for all) |
| freedom/api.md | Standard (same for all) |
| freedom/sdk.md | Standard (same for all) |
| history/build-log.md | Empty template |
| assets/* | Scraped photos from Google Maps / website |

### What Claude generates during builds:
| File | When |
|---|---|
| context/decisions/002+.md | When making significant choices |
| history/build-log.md entries | After each build step |
| history/friction.md entries | When noticing issues |
| All files in src/ | The actual app code |

### What's NEVER modified by Claude:
| File | Why |
|---|---|
| CLAUDE.md | Source of truth, only updated by system |
| context/brand.md | Only updated via merchant feedback |
| context/business.md | Only updated via merchant feedback |
| design/theme.json | Only updated via merchant color picker |
| /src/lib/design/* | Core component library, read-only |
| /src/lib/freedom/* | Freedom SDK, read-only |

---

## Link Map

```
CLAUDE.md
├── → context/brand.md
│     └── → design/system.md
│     └── → design/components.md
├── → context/business.md
│     └── → context/audience.md
│     └── → freedom/api.md
├── → context/decisions/_index.md
│     └── → context/decisions/001-*.md
│     └── → context/decisions/002-*.md
├── → design/system.md
│     └── → design/theme.json
│     └── → design/components.md
│     └── → design/layouts.md
├── → skills/_active.md
│     └── → skills/{category}.md
│           └── → (references all context + design files)
├── → history/build-log.md
├── → history/friction.md
└── → freedom/sdk.md
      └── → freedom/api.md
      └── → freedom/features.md
```
