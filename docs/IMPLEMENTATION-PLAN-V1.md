# Implementation Plan V1 — Freedom World App Builder
## March 10, 2026

Based on PRD v1.1. This is the complete technical implementation plan covering every component, API, data flow, and integration needed to ship the POC.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Data Layer: MerchantAppSpec](#2-data-layer-merchantappspec)
3. [Vault Writer](#3-vault-writer)
4. [AVA Interview Rewrite](#4-ava-interview-rewrite)
5. [Railway Integration](#5-railway-integration)
6. [Live Preview System](#6-live-preview-system)
7. [Build Task Dispatcher](#7-build-task-dispatcher)
8. [Onboarding Frontend Changes](#8-onboarding-frontend-changes)
9. [Deploy & Go-Live Flow](#9-deploy--go-live-flow)
10. [Iteration Flow](#10-iteration-flow)
11. [Freedom Sync](#11-freedom-sync)
12. [API Route Inventory](#12-api-route-inventory)
13. [Database Schema](#13-database-schema)
14. [Security Model](#14-security-model)
15. [File Manifest](#15-file-manifest)
16. [Implementation Order](#16-implementation-order)
17. [Testing Plan](#17-testing-plan)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Onboarding App (Vercel) — onboarding.freedom.world             │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ AVA Chat     │  │ Vault Writer │  │ Build Dispatcher   │    │
│  │ (chat-engine)│→│ (spec→files) │→│ (tasks→Railway SSH)  │  │
│  └──────────────┘  └──────────────┘  └────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ OnboardingContext (React state)                            │   │
│  │ ├── messages[]                                            │   │
│  │ ├── merchantAppSpec: MerchantAppSpec                      │   │
│  │ ├── vmState: { projectId, serviceId, devUrl, status }     │   │
│  │ └── buildQueue: BuildTask[]                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Railway: Merchant App Service (per-second billing)               │
│                                                                  │
│  ├── /workspace/                  ← Cloned template repo         │
│  │   ├── CLAUDE.md                ← Static                      │
│  │   ├── context/                 ← Written by Vault Writer      │
│  │   ├── design/theme.json        ← Written by Vault Writer      │
│  │   ├── skills/                  ← Static                      │
│  │   ├── src/                     ← Modified by Claude Code      │
│  │   └── public/assets/           ← Photos from scraper          │
│  │                                                               │
│  ├── Next.js dev server (npm run dev) ← HMR live reload         │
│  │   └── Exposed URL → iframe in onboarding app                 │
│  │                                                               │
│  ├── Claude Code CLI (via `railway ssh`)                         │
│  │   └── Reads CLAUDE.md → modifies /src → HMR picks up         │
│  │                                                               │
│  └── After deploy: switches to npm run start (production)        │
│      └── {slug}.app.freedom.world                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Layer: MerchantAppSpec

The single source of truth for all interview data. Lives in React state on the frontend, persisted to Supabase, and used by the Vault Writer to generate files.

### Interface

```typescript
// types/app-builder.ts

interface ProductItem {
  name: string;
  description?: string;
  price?: string;
  category?: string;
  photo?: string;          // URL or /public/assets/gallery/photo-N.jpg
}

interface MerchantAppSpec {
  // Identity
  merchantId: string;       // Generated on session start
  status: 'interviewing' | 'building' | 'deployed' | 'iterating';

  // Q1: Business type
  businessType: string;     // "restaurant" | "cafe" | "retail" | "salon" | "gym" | "pet_shop" | "other"
  category: string;         // Maps to build recipe: "restaurant-food" | "retail-catalog" | "service-booking"

  // Q2: Scraped data
  businessName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  operatingHours?: string;
  phone?: string;
  website?: string;
  socialLinks?: string[];
  rating?: number;
  scrapedBio?: string;
  scrapedProducts?: string[];
  photos: string[];         // Resolved photo URLs (lh3.googleusercontent.com or uploaded)
  logoUrl?: string;         // First photo or uploaded
  bannerUrl?: string;       // Second photo or uploaded

  // Q3: Mood
  mood?: string;            // "warm" | "bold" | "minimal" | "playful" | "elegant"
  moodKeywords?: string[];  // ["cozy", "inviting", "homey"]
  moodReason?: string;      // Owner's own words about the feel

  // Q4: Color
  primaryColor?: string;    // Hex "#e85d04"

  // Q5: Products
  products: ProductItem[];

  // Q6: Priorities
  appPriorities?: string[]; // ["menu", "gallery", "booking", "contact"] in order

  // Q7: Anti-preferences
  antiPreferences?: string[]; // ["no dark theme", "no corporate feel", "no stock photos"]

  // Q8: Audience
  audienceDescription?: string;
  primaryLanguage?: string; // "th" | "en"

  // Infrastructure (set during provisioning)
  railwayProjectId?: string;
  railwayServiceId?: string;
  railwayDevUrl?: string;   // Live dev server URL for iframe
  githubRepoUrl?: string;
  productionUrl?: string;   // yourshop.freedom.world

  // Freedom (set after signup)
  freedomUserId?: string;
  freedomOrgId?: string;
  freedomCommunityId?: string;

  // Timestamps
  createdAt: string;
  lastBuildAt?: string;
  deployedAt?: string;
}
```

### Persistence

```sql
-- Supabase table: merchant_apps
CREATE TABLE merchant_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id TEXT UNIQUE NOT NULL,
  spec JSONB NOT NULL,                    -- Full MerchantAppSpec
  railway_project_id TEXT,
  github_repo_url TEXT,
  production_url TEXT,
  freedom_org_id TEXT,
  freedom_community_id TEXT,
  status TEXT DEFAULT 'interviewing',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Vault Writer

Deterministic function (NO AI) that maps `MerchantAppSpec` fields to vault markdown files.

### Location

```
lib/app-builder/vault-writer.ts
```

### Core Function

```typescript
interface VaultFile {
  path: string;      // Relative to workspace root
  content: string;   // File content
}

function generateVaultFiles(spec: MerchantAppSpec): VaultFile[] {
  const files: VaultFile[] = [];

  // Always generate these (overwrite on each update)
  files.push({ path: 'context/brand.md', content: generateBrandMd(spec) });
  files.push({ path: 'context/business.md', content: generateBusinessMd(spec) });
  files.push({ path: 'context/audience.md', content: generateAudienceMd(spec) });
  files.push({ path: 'design/theme.json', content: generateThemeJson(spec) });
  files.push({ path: 'skills/_active.md', content: generateActiveSkill(spec) });

  // Only generate if mood is set
  if (spec.mood) {
    files.push({
      path: 'context/decisions/001-visual-mood.md',
      content: generateMoodDecisionMd(spec),
    });
    files.push({
      path: 'context/decisions/_index.md',
      content: generateDecisionIndex(spec),
    });
  }

  return files;
}
```

### File Generators

```typescript
function generateBrandMd(spec: MerchantAppSpec): string {
  return `---
type: context
domain: brand
updated: ${new Date().toISOString()}
---

# Brand Identity: ${spec.businessName || '(pending)'}

## Visual Mood
${spec.mood ? `**Mood:** ${spec.mood}` : '**Mood:** (not set yet — using template defaults)'}
${spec.moodKeywords?.length ? `**Keywords:** ${spec.moodKeywords.join(', ')}` : ''}
${spec.moodReason ? `> "${spec.moodReason}"` : ''}

## Anti-Preferences
${spec.antiPreferences?.length
    ? spec.antiPreferences.map(p => `- ❌ ${p}`).join('\n')
    : '(none specified yet)'}

## Colors
- **Primary:** ${spec.primaryColor || '#e85d04'}

## Typography
- **Language:** ${spec.primaryLanguage || 'th'}
- **Heading font:** (from theme)
- **Body font:** (from theme)

## Photos
${spec.logoUrl ? `- Logo: /public/assets/logo.png` : '- Logo: (not set)'}
${spec.bannerUrl ? `- Banner: /public/assets/banner.jpg` : '- Banner: (not set)'}
${spec.photos.length > 0
    ? `- Gallery: ${spec.photos.length} photos in /public/assets/gallery/`
    : '- Gallery: (no photos yet)'}

## Social
${spec.website ? `- Website: ${spec.website}` : ''}
${spec.socialLinks?.map(l => `- ${l}`).join('\n') || ''}
`;
}

function generateBusinessMd(spec: MerchantAppSpec): string {
  return `---
type: context
domain: business
updated: ${new Date().toISOString()}
---

# Business: ${spec.businessName || '(pending)'}

## Overview
- **Type:** ${spec.businessType || '(pending)'}
- **Category:** ${spec.category || '(pending)'}
${spec.address ? `- **Address:** ${spec.address}` : ''}
${spec.operatingHours ? `- **Hours:** ${spec.operatingHours}` : ''}
${spec.phone ? `- **Phone:** ${spec.phone}` : ''}
${spec.website ? `- **Website:** ${spec.website}` : ''}
${spec.rating ? `- **Rating:** ${spec.rating}/5` : ''}

## About
${spec.scrapedBio || '(no description yet)'}

## Products / Services
${spec.products.length > 0
    ? spec.products.map(p => {
        let line = `### ${p.name}`;
        if (p.description) line += `\n${p.description}`;
        if (p.price) line += `\n**Price:** ${p.price}`;
        if (p.category) line += `\n**Category:** ${p.category}`;
        return line;
      }).join('\n\n')
    : spec.scrapedProducts?.length
      ? spec.scrapedProducts.map(p => `- ${p}`).join('\n')
      : '(no products listed yet)'}

## App Priorities
${spec.appPriorities?.length
    ? spec.appPriorities.map((p, i) => `${i + 1}. ${p}`).join('\n')
    : '(not set yet — will use category defaults)'}
`;
}

function generateAudienceMd(spec: MerchantAppSpec): string {
  return `---
type: context
domain: audience
updated: ${new Date().toISOString()}
---

# Target Audience: ${spec.businessName || '(pending)'}

## Primary Customers
${spec.audienceDescription || '(not defined yet — will use category defaults)'}

## Language
- Primary: ${spec.primaryLanguage || 'th'}
`;
}

function generateThemeJson(spec: MerchantAppSpec): string {
  const primary = spec.primaryColor || '#e85d04';

  // Mood → variant mapping
  const moodVariants: Record<string, {
    heroVariant: string;
    productCardVariant: string;
    navVariant: string;
    contactVariant: string;
    galleryVariant: string;
    footerVariant: string;
    ctaVariant: string;
    borderRadius: string;
    shadowStyle: string;
  }> = {
    warm:    { heroVariant: 'soft', productCardVariant: 'rounded', navVariant: 'bottom-tabs', contactVariant: 'card', galleryVariant: 'grid', footerVariant: 'branded', ctaVariant: 'banner', borderRadius: '0.75rem', shadowStyle: 'soft' },
    bold:    { heroVariant: 'bold', productCardVariant: 'sharp', navVariant: 'top-bar', contactVariant: 'split', galleryVariant: 'masonry', footerVariant: 'detailed', ctaVariant: 'banner', borderRadius: '0.25rem', shadowStyle: 'sharp' },
    minimal: { heroVariant: 'minimal', productCardVariant: 'minimal', navVariant: 'top-bar', contactVariant: 'list', galleryVariant: 'grid', footerVariant: 'simple', ctaVariant: 'card', borderRadius: '0.5rem', shadowStyle: 'none' },
    playful: { heroVariant: 'bold', productCardVariant: 'rounded', navVariant: 'bottom-tabs', contactVariant: 'card', galleryVariant: 'carousel', footerVariant: 'branded', ctaVariant: 'floating', borderRadius: '1rem', shadowStyle: 'soft' },
    elegant: { heroVariant: 'split', productCardVariant: 'sharp', navVariant: 'top-bar', contactVariant: 'split', galleryVariant: 'masonry', footerVariant: 'simple', ctaVariant: 'card', borderRadius: '0.125rem', shadowStyle: 'sharp' },
  };

  const variants = moodVariants[spec.mood || 'warm'] || moodVariants.warm;

  const theme = {
    colors: {
      primary,
      primaryForeground: '#ffffff',
      secondary: lightenColor(primary, 0.9),
      background: '#ffffff',
      foreground: '#1a1a1a',
      muted: '#f5f5f5',
      accent: lightenColor(primary, 0.7),
    },
    fonts: {
      heading: spec.primaryLanguage === 'en' ? 'Plus Jakarta Sans' : 'Noto Sans Thai',
      body: spec.primaryLanguage === 'en' ? 'Inter' : 'Noto Sans Thai',
    },
    borderRadius: variants.borderRadius,
    mood: spec.mood || 'warm',
    variants: {
      hero: variants.heroVariant,
      productCard: variants.productCardVariant,
      navigation: variants.navVariant,
      contact: variants.contactVariant,
      gallery: variants.galleryVariant,
      footer: variants.footerVariant,
      cta: variants.ctaVariant,
    },
  };

  return JSON.stringify(theme, null, 2);
}

function generateMoodDecisionMd(spec: MerchantAppSpec): string {
  return `---
type: decision
number: 1
domain: design
source: onboarding-interview
---

# Decision: Visual Mood → ${spec.mood}

## What
The app's visual mood is **${spec.mood}**.

## Why
${spec.moodReason
    ? `Owner described their business as: "${spec.moodReason}"`
    : `Selected "${spec.mood}" during onboarding interview.`}
Keywords: ${spec.moodKeywords?.join(', ') || spec.mood}

## Implications
- Hero variant: ${spec.mood === 'warm' ? 'soft' : spec.mood === 'bold' ? 'bold' : spec.mood === 'minimal' ? 'minimal' : spec.mood === 'elegant' ? 'split' : 'bold'}
- ProductCard variant: ${spec.mood === 'warm' ? 'rounded' : spec.mood === 'bold' ? 'sharp' : 'minimal'}
- Border radius: ${spec.mood === 'warm' ? '0.75rem' : spec.mood === 'bold' ? '0.25rem' : spec.mood === 'elegant' ? '0.125rem' : '0.5rem'}
- Shadow style: ${spec.mood === 'minimal' ? 'none' : spec.mood === 'bold' || spec.mood === 'elegant' ? 'sharp' : 'soft'}
`;
}

function generateActiveSkill(spec: MerchantAppSpec): string {
  return `---
type: skill-pointer
---

# Active Build Skill
→ skills/build/${spec.category || 'restaurant-food'}.md
`;
}

function generateDecisionIndex(spec: MerchantAppSpec): string {
  return `---
type: map-of-content
domain: decisions
---

# Decision Log: ${spec.businessName || '(pending)'}

## Decisions
- [[001-visual-mood.md]] — Visual mood: ${spec.mood || '(pending)'}
`;
}

// Utility: lighten a hex color
function lightenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * factor);
  const lg = Math.round(g + (255 - g) * factor);
  const lb = Math.round(b + (255 - b) * factor);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}
```

### Incremental Updates

The Vault Writer always regenerates FULL files (not patches). This is simpler and safer — if the merchant changes their mood, the entire `theme.json` is rebuilt. Files are small (<2KB each), so overwrites are cheap.

```typescript
// Called after each interview step
async function updateVaultOnVM(
  vmUrl: string,
  spec: MerchantAppSpec,
): Promise<void> {
  const files = generateVaultFiles(spec);
  await fetch(`${vmUrl}:4000/api/write-files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${VM_SECRET}` },
    body: JSON.stringify({ files }),
  });
}
```

---

## 4. AVA Interview Rewrite

### New System Prompt Architecture

The merchant interview prompt replaces the current `MERCHANT_SYSTEM_PROMPT`. It's split into two phases:

**Phase 1a (Hook, pre-signup):** Q1-Q4 — enough to get a visual preview running
**Phase 1b (Depth, post-signup):** Q5-Q9 — detailed product/priority/audience info

### Extraction Method

AVA continues to use `[[TAG:value]]` extraction tags. The onboarding frontend parses these and updates `MerchantAppSpec` fields.

New/updated tags:

```
[[BUSINESS_TYPE:restaurant]]        → spec.businessType + spec.category
[[SCRAPE_URL:url]]                  → triggers scraper, populates scrape fields
[[NAME:Business Name]]              → spec.businessName
[[MOOD:warm]]                       → spec.mood
[[MOOD_KEYWORDS:cozy,inviting]]     → spec.moodKeywords
[[MOOD_REASON:it's a place where...]] → spec.moodReason
[[PRODUCTS_DETAIL:json]]            → spec.products (JSON array of ProductItem)
[[PRIORITIES:menu,gallery,contact]] → spec.appPriorities
[[ANTI_PREFS:no dark,no corporate]] → spec.antiPreferences
[[AUDIENCE:young professionals...]] → spec.audienceDescription
[[LANGUAGE:th]]                     → spec.primaryLanguage
[[STEP:phase1a_complete]]           → triggers signup wall
[[STEP:phase1b_complete]]           → triggers finalize
```

### Extraction Logic Update

```typescript
// lib/app-builder/extract-spec.ts

function updateSpecFromExtractions(
  spec: MerchantAppSpec,
  rawAiResponse: string,
  scrapedData?: ScrapedBrandContext,
): MerchantAppSpec {
  const updated = { ...spec };

  // Business type
  const typeMatch = rawAiResponse.match(/\[\[BUSINESS_TYPE:([^\]]+)\]\]/i);
  if (typeMatch) {
    updated.businessType = typeMatch[1].trim();
    updated.category = mapTypeToCategory(updated.businessType);
  }

  // Name
  const nameMatch = rawAiResponse.match(/\[\[NAME:([^\]]+)\]\]/i);
  if (nameMatch) updated.businessName = nameMatch[1].trim();

  // Mood
  const moodMatch = rawAiResponse.match(/\[\[MOOD:([^\]]+)\]\]/i);
  if (moodMatch) updated.mood = moodMatch[1].trim();

  const moodKwMatch = rawAiResponse.match(/\[\[MOOD_KEYWORDS:([^\]]+)\]\]/i);
  if (moodKwMatch) updated.moodKeywords = moodKwMatch[1].split(',').map(s => s.trim());

  const moodReasonMatch = rawAiResponse.match(/\[\[MOOD_REASON:([^\]]+)\]\]/i);
  if (moodReasonMatch) updated.moodReason = moodReasonMatch[1].trim();

  // Products
  const productsMatch = rawAiResponse.match(/\[\[PRODUCTS_DETAIL:([^\]]+)\]\]/i);
  if (productsMatch) {
    try { updated.products = JSON.parse(productsMatch[1]); } catch {}
  }

  // Priorities
  const prioMatch = rawAiResponse.match(/\[\[PRIORITIES:([^\]]+)\]\]/i);
  if (prioMatch) updated.appPriorities = prioMatch[1].split(',').map(s => s.trim());

  // Anti-preferences
  const antiMatch = rawAiResponse.match(/\[\[ANTI_PREFS:([^\]]+)\]\]/i);
  if (antiMatch) updated.antiPreferences = antiMatch[1].split(',').map(s => s.trim());

  // Audience
  const audMatch = rawAiResponse.match(/\[\[AUDIENCE:([^\]]+)\]\]/i);
  if (audMatch) updated.audienceDescription = audMatch[1].trim();

  // Language
  const langMatch = rawAiResponse.match(/\[\[LANGUAGE:([^\]]+)\]\]/i);
  if (langMatch) updated.primaryLanguage = langMatch[1].trim();

  // Merge scraped data if provided
  if (scrapedData) {
    updated.businessName = updated.businessName || scrapedData.businessName;
    updated.address = scrapedData.address;
    updated.latitude = scrapedData.latitude;
    updated.longitude = scrapedData.longitude;
    updated.operatingHours = scrapedData.operatingHours;
    updated.phone = scrapedData.phone;
    updated.website = scrapedData.website;
    updated.rating = scrapedData.rating;
    updated.scrapedBio = scrapedData.bio;
    updated.scrapedProducts = scrapedData.products;
    updated.photos = scrapedData.photos || [];
    if (updated.photos.length > 0) updated.logoUrl = updated.photos[0];
    if (updated.photos.length > 1) updated.bannerUrl = updated.photos[1];
  }

  return updated;
}

function mapTypeToCategory(type: string): string {
  const map: Record<string, string> = {
    restaurant: 'restaurant-food',
    cafe: 'restaurant-food',
    bakery: 'restaurant-food',
    bar: 'restaurant-food',
    food_truck: 'restaurant-food',
    retail: 'retail-catalog',
    shop: 'retail-catalog',
    pet_shop: 'retail-catalog',
    boutique: 'retail-catalog',
    salon: 'service-booking',
    spa: 'service-booking',
    gym: 'service-booking',
    clinic: 'service-booking',
    studio: 'service-booking',
  };
  return map[type.toLowerCase()] || 'restaurant-food'; // default
}
```

### New AVA System Prompt (outline)

```
lib/app-builder/ava-prompt.ts
```

Key changes from current MERCHANT_SYSTEM_PROMPT:

1. **Phase awareness** — AVA knows about Phase 1a (hook) and Phase 1b (depth)
2. **Live build mentions** — AVA tells merchant to "watch the preview" as things build
3. **Richer mood capture** — Not just "pick a vibe" but "how does walking into your shop feel?"
4. **Anti-preferences** — Explicitly asked in Phase 1b
5. **Priority ordering** — "What's the MOST important page for your customers?"
6. **Audience** — Brief question about typical customer
7. **New tags** — MOOD_KEYWORDS, MOOD_REASON, PRIORITIES, ANTI_PREFS, AUDIENCE, LANGUAGE
8. **Signup wall trigger** — `[[STEP:phase1a_complete]]` after Q4

---

## 5. Railway Integration

### API Client

```
lib/app-builder/railway.ts
```

Uses Railway's GraphQL API (`https://backboard.railway.com/graphql/v2`).

### Environment

```
RAILWAY_API_TOKEN=<pro account token>
RAILWAY_TEMPLATE_REPO=freedom-world/app-template  # GitHub template repo
```

### Key Operations

```typescript
// 1. Create project for merchant
async function createMerchantProject(merchantId: string): Promise<{
  projectId: string;
  serviceId: string;
}> {
  // GraphQL: projectCreate
  const project = await railway.mutation(`
    mutation {
      projectCreate(input: {
        name: "fw-app-${merchantId}"
        description: "Freedom World merchant app"
      }) { id }
    }
  `);

  // GraphQL: serviceCreate (the dev/build VM)
  const service = await railway.mutation(`
    mutation {
      serviceCreate(input: {
        projectId: "${project.id}"
        name: "builder"
        source: { repo: "${RAILWAY_TEMPLATE_REPO}" }
      }) { id }
    }
  `);

  return { projectId: project.id, serviceId: service.id };
}

// 2. Set environment variables
async function setEnvVars(serviceId: string, vars: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(vars)) {
    await railway.mutation(`
      mutation {
        variableUpsert(input: {
          serviceId: "${serviceId}"
          name: "${key}"
          value: "${value}"
        })
      }
    `);
  }
}

// 3. Get service domain (dev server URL)
async function getServiceUrl(serviceId: string): Promise<string> {
  // Railway auto-assigns a domain or we create one
  const result = await railway.query(`
    query {
      service(id: "${serviceId}") {
        domains { domain }
      }
    }
  `);
  return `https://${result.domains[0].domain}`;
}

// 4. Deploy production service (after build is done)
async function createProductionService(
  projectId: string,
  merchantSlug: string,
): Promise<string> {
  // Create a new Autoscale service for production
  const service = await railway.mutation(`
    mutation {
      serviceCreate(input: {
        projectId: "${projectId}"
        name: "production"
      }) { id }
    }
  `);

  // Set custom domain
  await railway.mutation(`
    mutation {
      customDomainCreate(input: {
        serviceId: "${service.id}"
        domain: "${merchantSlug}.freedom.world"
      })
    }
  `);

  return `https://${merchantSlug}.freedom.world`;
}
```

### VM Task Server

Build tasks are sent to the Railway service via `railway ssh`. The onboarding backend runs commands inside the merchant's Railway container.

```
vm-task-server/
├── server.ts          ← Express on port 4000
├── routes/
│   ├── write-files.ts ← Receives vault files, writes to disk
│   ├── write-assets.ts ← Receives photo URLs, downloads to /public/assets
│   ├── run-claude.ts  ← Runs `claude -p "task"` and streams status
│   └── health.ts      ← Health check
└── package.json
```

```typescript
// vm-task-server/routes/run-claude.ts

import { exec } from 'child_process';

app.post('/api/run-claude', auth, async (req, res) => {
  const { task } = req.body;

  const cmd = [
    'claude', '-p',
    `"${task}"`,
    '--dangerously-skip-permissions',
    '--tools', '"Read" "Write" "Edit" "Bash(npm *)" "Bash(npx *)" "Bash(node *)"',
    '--disallowedTools', '"Bash(rm -rf *)" "Bash(curl *)" "Bash(wget *)"',
    '--max-turns', '50',
    '--cwd', '/workspace',
  ].join(' ');

  const child = exec(cmd, { cwd: '/workspace', timeout: 120000 });

  // Stream status updates
  child.stdout?.on('data', (data) => {
    // Could send via WebSocket to frontend for progress
    console.log('[claude]', data.toString());
  });

  child.on('exit', (code) => {
    res.json({ success: code === 0, exitCode: code });
  });
});
```

### Railway Service Setup

No custom Docker image needed. Railway deploys from the GitHub template repo directly. The service runs `npm run dev` during build phase (HMR enabled), then switches to `npm run start` for production.

**Claude Code access:** Via `railway ssh` — opens a shell inside the running container. Our backend runs:
```bash
RAILWAY_TOKEN=xxx railway ssh \
  --project $PROJECT_ID \
  --service app \
  -- claude -p "Read CLAUDE.md. Build the homepage."
```

**Vault file updates:** Also via `railway ssh`:
```bash
RAILWAY_TOKEN=xxx railway ssh \
  --project $PROJECT_ID \
  --service app \
  -- bash -c 'cat > /workspace/context/brand.md << EOF
(vault file content)
EOF'
```

No task server needed. SSH gives us full shell access.

---

## 6. Live Preview System

### Frontend: iframe in onboarding app

The current `PreviewSidebar.tsx` (420px, right side) gets replaced with an iframe that points to the Railway dev server.

```typescript
// components/onboarding/LivePreview.tsx

interface LivePreviewProps {
  devUrl: string | null;
  isLoading: boolean;
  status: 'provisioning' | 'starting' | 'ready' | 'building' | 'error';
}

export function LivePreview({ devUrl, isLoading, status }: LivePreviewProps) {
  if (status === 'provisioning' || status === 'starting') {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-sm text-gray-500">
            {status === 'provisioning'
              ? 'Setting up your workspace...'
              : 'Starting your app preview...'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'building') {
    return (
      <div className="relative h-full">
        <iframe src={devUrl!} className="w-full h-full border-0" />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
          <Spinner size="sm" />
          Building...
        </div>
      </div>
    );
  }

  if (devUrl) {
    return <iframe src={devUrl} className="w-full h-full border-0" />;
  }

  return null;
}
```

### Refresh Strategy

HMR handles most updates automatically. For major changes (new pages, theme overhaul), the iframe gets a forced refresh:

```typescript
function refreshPreview() {
  const iframe = document.getElementById('live-preview') as HTMLIFrameElement;
  if (iframe) {
    iframe.src = iframe.src; // Force reload
  }
}
```

### Mobile Layout

On mobile (<768px), the live preview becomes a bottom sheet or toggle:

```
┌─────────────────────┐
│  AVA Chat            │
│  (full width)        │
│                      │
├─────────────────────┤
│  [Preview] [Chat]   │  ← toggle tabs
│  or swipe up sheet  │
└─────────────────────┘
```

---

## 7. Build Task Dispatcher

Orchestrates the flow: interview answer → vault update → Claude Code task → status back to frontend.

```
lib/app-builder/build-dispatcher.ts
```

```typescript
type BuildTrigger =
  | 'scrape_complete'
  | 'mood_selected'
  | 'color_changed'
  | 'products_added'
  | 'priorities_set'
  | 'anti_prefs_set'
  | 'audience_defined'
  | 'ad_hoc_request';

interface BuildTask {
  trigger: BuildTrigger;
  claudePrompt: string;
  priority: number;        // Lower = higher priority
}

const TASK_TEMPLATES: Record<BuildTrigger, string> = {
  scrape_complete:
    'Read CLAUDE.md and orient yourself. Context files have been updated with business info and photos are in /public/assets/. Build the homepage following the active build skill. Include hero with banner, navigation with business name, and footer with address.',

  mood_selected:
    'The visual mood has been updated. Re-read context/brand.md and design/theme.json. Update all component variants to match the new mood. Update border-radius and shadow styles. The preview should feel completely different after this change.',

  color_changed:
    'Primary color has been updated in design/theme.json. Update the CSS theme variables. All components using theme colors should reflect the new primary.',

  products_added:
    'Products have been added to context/business.md. Build a products/menu section on the homepage using ProductCard components. Use real product names, descriptions, and prices from the context file.',

  priorities_set:
    'App priorities have been set in context/business.md. Create the additional pages listed in priorities order. Add them to the navigation. Follow the active build skill for page structure.',

  anti_prefs_set:
    'Anti-preferences have been added to context/brand.md. Review all existing pages and components. Remove or adjust anything that violates the anti-preferences.',

  audience_defined:
    'Audience has been defined in context/audience.md. Review all copy and messaging across pages. Adjust tone and language to match the target audience.',

  ad_hoc_request:
    '', // Filled dynamically from merchant's message
};

async function dispatchBuildTask(
  merchantId: string,
  trigger: BuildTrigger,
  spec: MerchantAppSpec,
  adHocMessage?: string,
): Promise<{ success: boolean; error?: string }> {
  const vmUrl = spec.railwayDevUrl;
  if (!vmUrl) return { success: false, error: 'VM not ready' };

  // 1. Update vault files on VM
  await updateVaultOnVM(vmUrl, spec);

  // 2. If photos need syncing
  if (trigger === 'scrape_complete' && spec.photos.length > 0) {
    await syncAssetsToVM(vmUrl, spec);
  }

  // 3. Get Claude prompt
  const prompt = trigger === 'ad_hoc_request'
    ? `Merchant request: "${adHocMessage}". Read context files for full context. Make the requested change while maintaining brand consistency.`
    : TASK_TEMPLATES[trigger];

  // 4. Run Claude Code on VM
  const result = await fetch(`${vmUrl}:4000/api/run-claude`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${VM_SECRET}` },
    body: JSON.stringify({ task: prompt }),
  });

  return result.json();
}
```

### Task Queue

Tasks can arrive faster than Claude processes them. Simple FIFO queue per merchant:

```typescript
class MerchantBuildQueue {
  private queues: Map<string, BuildTask[]> = new Map();
  private running: Map<string, boolean> = new Map();

  async enqueue(merchantId: string, task: BuildTask): Promise<void> {
    const queue = this.queues.get(merchantId) || [];
    queue.push(task);
    this.queues.set(merchantId, queue);

    if (!this.running.get(merchantId)) {
      await this.processNext(merchantId);
    }
  }

  private async processNext(merchantId: string): Promise<void> {
    const queue = this.queues.get(merchantId);
    if (!queue?.length) {
      this.running.set(merchantId, false);
      return;
    }

    this.running.set(merchantId, true);
    const task = queue.shift()!;

    await dispatchBuildTask(merchantId, task.trigger, /* spec */, task.claudePrompt);

    await this.processNext(merchantId);
  }
}
```

---

## 8. Onboarding Frontend Changes

### Updated OnboardingContext

```typescript
// context/AppBuilderContext.tsx

interface AppBuilderState {
  // Interview
  messages: ChatMessage[];
  merchantAppSpec: MerchantAppSpec;
  interviewPhase: 'phase1a' | 'phase1b' | 'complete';

  // VM
  vmStatus: 'idle' | 'provisioning' | 'starting' | 'ready' | 'error';
  vmDevUrl: string | null;

  // Build
  buildStatus: 'idle' | 'building' | 'done';
  currentBuildTask: string | null;

  // Auth
  isAnonymous: boolean;
  showSignupWall: boolean;

  // Persistence
  sessionId: string;
}
```

### Layout Change

```
Current:
┌──────────────────────────┬───────────────────┐
│  Chat (flex-1)           │  PreviewSidebar   │
│                          │  (420px static)   │
└──────────────────────────┴───────────────────┘

New:
┌──────────────────────────┬───────────────────┐
│  Chat (flex-1)           │  LivePreview      │
│                          │  (iframe to       │
│  AVA interview +         │  Railway dev      │
│  build status updates    │  server)          │
│                          │  (420px or wider) │
└──────────────────────────┴───────────────────┘
```

### Interview Flow State Machine

```
Q1 (business type)
│ → Start VM provisioning in background
│ → spec.businessType set
▼
Q2 (scrape link)
│ → Run scraper
│ → Update spec with scraped data
│ → Vault Writer → push to VM
│ → Dispatch: scrape_complete
│ → iframe shows: app shell with real photos
▼
Q3 (mood)
│ → spec.mood set
│ → Vault Writer → push to VM
│ → Dispatch: mood_selected
│ → iframe shows: visual style shift
▼
Q4 (color picker)
│ → spec.primaryColor set
│ → Vault Writer → push to VM
│ → Dispatch: color_changed
│ → iframe shows: color update
│
│ === SIGNUP WALL ===
│
▼
Q5 (products)
│ → spec.products set
│ → Vault Writer → push to VM
│ → Dispatch: products_added
│ → iframe shows: product section
▼
Q6 (priorities)
│ → spec.appPriorities set
│ → Vault Writer → push to VM
│ → Dispatch: priorities_set
│ → iframe shows: new pages in nav
▼
Q7 (anti-preferences)
│ → spec.antiPreferences set
│ → Vault Writer → push to VM
│ → Dispatch: anti_prefs_set
│ → iframe shows: adjustments
▼
Q8 (audience)
│ → spec.audienceDescription set
│ → Vault Writer → push to VM
│ → Dispatch: audience_defined
│ → iframe shows: copy/tone updates
▼
Q9 (review + tweaks)
│ → Free-form changes via ad_hoc_request
│ → Each request → Dispatch: ad_hoc_request
│ → iframe shows: changes live
▼
FINALIZE
│ → Deploy flow
```

---

## 9. Deploy & Go-Live Flow

After the merchant approves the app:

```typescript
// lib/app-builder/deploy.ts

async function deployMerchantApp(
  merchantId: string,
  spec: MerchantAppSpec,
): Promise<string> {
  const vmUrl = spec.railwayDevUrl!;

  // 1. Run production build on VM
  await fetch(`${vmUrl}:4000/api/run-command`, {
    method: 'POST',
    body: JSON.stringify({ command: 'cd /workspace && npm run build' }),
  });

  // 2. Push to GitHub
  await fetch(`${vmUrl}:4000/api/run-command`, {
    method: 'POST',
    body: JSON.stringify({
      command: 'cd /workspace && git add -A && git commit -m "deploy: production build" && git push',
    }),
  });

  // 3. Create production service on Railway (Autoscale)
  const productionUrl = await createProductionService(
    spec.railwayProjectId!,
    slugify(spec.businessName!),
  );

  // 4. Update spec
  spec.productionUrl = productionUrl;
  spec.status = 'deployed';
  spec.deployedAt = new Date().toISOString();

  // 5. Persist to Supabase
  await saveMerchantApp(merchantId, spec);

  // 6. Stop builder VM (save costs)
  await stopBuilderService(spec.railwayServiceId!);

  return productionUrl;
}
```

---

## 10. Iteration Flow

When a merchant returns to make changes:

```typescript
async function startIterationSession(merchantId: string): Promise<string> {
  const spec = await loadMerchantApp(merchantId);

  // 1. Restart builder VM
  await restartBuilderService(spec.railwayServiceId!);

  // 2. Wait for dev server to be ready
  const devUrl = await waitForDevServer(spec.railwayServiceId!);

  // 3. Update spec
  spec.vmDevUrl = devUrl;
  spec.status = 'iterating';

  return devUrl;
}
```

Iteration uses the same build dispatcher — merchant types requests, they become `ad_hoc_request` tasks.

---

## 11. Freedom Sync

After deploy, sync community data to Freedom backend (existing flow, adapted):

```typescript
async function syncToFreedom(spec: MerchantAppSpec): Promise<void> {
  // 1. Create community (existing sync-community logic)
  const { orgId, communityId } = await createCommunityV2({
    name: spec.businessName!,
    description: spec.scrapedBio,
    banner: spec.bannerUrl,
    logo: spec.logoUrl,
    category: mapCategoryToFreedom(spec.category),
  });

  // 2. Create POI (location)
  if (spec.latitude && spec.longitude) {
    await createPOI(orgId, communityId, {
      name: spec.businessName!,
      address: spec.address!,
      latitude: spec.latitude,
      longitude: spec.longitude,
      images: spec.photos.slice(0, 4),
    });
  }

  // 3. Create first post
  await createPost(orgId, {
    content: `Welcome to ${spec.businessName}! Check out our new app: ${spec.productionUrl}`,
  });

  // 4. Publish community
  await publishCommunity(orgId, communityId);

  // 5. Update spec
  spec.freedomOrgId = orgId;
  spec.freedomCommunityId = communityId;
}
```

---

## 12. API Route Inventory

### New API routes (onboarding backend)

| Route | Method | Purpose |
|---|---|---|
| `/api/apps/provision` | POST | Create Railway project + VM for merchant |
| `/api/apps/update-vault` | POST | Push vault files to VM |
| `/api/apps/update-assets` | POST | Push photos to VM |
| `/api/apps/build` | POST | Dispatch Claude Code task to VM |
| `/api/apps/build-status` | GET | Poll build status / WebSocket |
| `/api/apps/deploy` | POST | Production build + deploy |
| `/api/apps/vm-status` | GET | Check if VM is ready |
| `/api/apps/start-iteration` | POST | Wake up VM for returning merchant |
| `/api/apps/stop-vm` | POST | Kill VM (abandon / done) |

### Build task routes (via railway ssh)

| Route | Method | Purpose |
|---|---|---|
| `/api/write-files` | POST | Write vault/context files to disk |
| `/api/write-assets` | POST | Download photos to /public/assets |
| `/api/run-claude` | POST | Execute Claude Code CLI task |
| `/api/run-command` | POST | Run shell command (build, git) |
| `/api/health` | GET | Health check |

---

## 13. Database Schema

### Supabase additions

```sql
-- Merchant apps (main table)
CREATE TABLE merchant_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id TEXT UNIQUE NOT NULL,
  spec JSONB NOT NULL,
  status TEXT DEFAULT 'interviewing',
  railway_project_id TEXT,
  railway_builder_service_id TEXT,
  railway_production_service_id TEXT,
  github_repo_url TEXT,
  production_url TEXT,
  freedom_org_id TEXT,
  freedom_community_id TEXT,
  freedom_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deployed_at TIMESTAMPTZ,
  last_iteration_at TIMESTAMPTZ
);

-- Build history
CREATE TABLE build_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id TEXT NOT NULL REFERENCES merchant_apps(merchant_id),
  trigger TEXT NOT NULL,
  claude_prompt TEXT NOT NULL,
  status TEXT DEFAULT 'queued',      -- queued | running | success | failed
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session tracking (for analytics / funnel)
CREATE TABLE app_builder_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  merchant_id TEXT REFERENCES merchant_apps(merchant_id),
  phase TEXT DEFAULT 'phase1a',      -- phase1a | phase1b | building | deployed
  interview_data JSONB,              -- Partial MerchantAppSpec snapshots
  started_at TIMESTAMPTZ DEFAULT NOW(),
  signup_at TIMESTAMPTZ,
  deployed_at TIMESTAMPTZ,
  abandoned_at TIMESTAMPTZ,
  channel TEXT                       -- organic | referral | ad | etc.
);

-- Indexes
CREATE INDEX idx_merchant_apps_status ON merchant_apps(status);
CREATE INDEX idx_build_tasks_merchant ON build_tasks(merchant_id);
CREATE INDEX idx_sessions_phase ON app_builder_sessions(phase);
```

---

## 14. Security Model

### VM Isolation
- Each merchant = own Railway project (network-isolated)
- VM secret token for task server auth (per-project, rotated)
- No cross-merchant API access

### Claude Code Sandboxing
```
--tools "Read" "Write" "Edit" "Bash(npm *)" "Bash(npx *)" "Bash(node *)" "Bash(git *)"
--disallowedTools "Bash(rm -rf *)" "Bash(curl *)" "Bash(wget *)" "Bash(apt *)" "Bash(pip *)"
--max-turns 50
--append-system-prompt "SECURITY: You may only modify files in /workspace/src/ and /workspace/public/. Never read or modify files outside /workspace. Never make network requests. Never install packages not in package.json."
```

### Input Sanitization
- Merchant text (business name, products, etc.) passes through `MerchantAppSpec` — typed, validated
- No raw merchant input flows to Claude Code prompts — always structured via task templates
- Ad-hoc requests are wrapped: `Merchant request: "${sanitized}". Read context files for full context.`

### Secrets
```
RAILWAY_API_TOKEN     — Railway Pro account
CLAUDE_API_KEY        — For Claude Max (or session auth)
VM_SECRET             — Per-merchant task server auth
GITHUB_TOKEN          — For repo creation
FREEDOM_API_KEY       — For community sync
```

---

## 15. File Manifest

### New files to create (in freedom-onboarding repo)

```
lib/app-builder/
├── types.ts                 ← MerchantAppSpec, BuildTask, etc.
├── vault-writer.ts          ← Spec → vault file generators
├── extract-spec.ts          ← AI response → spec field updates
├── ava-prompt.ts            ← New AVA system prompt (app builder version)
├── railway.ts               ← Railway GraphQL API client
├── build-dispatcher.ts      ← Task queue + dispatch logic
├── deploy.ts                ← Production deploy flow
├── freedom-sync.ts          ← Sync to Freedom backend
└── utils.ts                 ← slugify, lightenColor, etc.

app/api/apps/
├── provision/route.ts       ← POST: create Railway project
├── update-vault/route.ts    ← POST: push vault files to VM
├── update-assets/route.ts   ← POST: push photos to VM
├── build/route.ts           ← POST: dispatch Claude Code task
├── build-status/route.ts    ← GET: build progress
├── deploy/route.ts          ← POST: go live
├── vm-status/route.ts       ← GET: VM readiness
├── start-iteration/route.ts ← POST: wake VM
└── stop-vm/route.ts         ← POST: kill VM

components/onboarding/
├── LivePreview.tsx           ← iframe to Railway dev server
├── BuildStatusIndicator.tsx  ← "Building..." overlay
└── AppBuilderLayout.tsx      ← Split layout (chat + preview)

context/
└── AppBuilderContext.tsx     ← React context for app builder state
```

### New repo: vm-task-server

```
vm-task-server/
├── server.ts
├── routes/
│   ├── write-files.ts
│   ├── write-assets.ts
│   ├── run-claude.ts
│   ├── run-command.ts
│   └── health.ts

├── package.json
└── tsconfig.json
```

### Existing files to modify

```
lib/onboarding/chat-engine.ts          ← Add app builder mode
components/onboarding/OnboardingChat.tsx ← Wire to AppBuilderContext
components/onboarding/PreviewSidebar.tsx ← Replace with LivePreview
context/OnboardingContext.tsx            ← Integrate MerchantAppSpec
app/start/page.tsx                      ← New layout for app builder mode
```

---

## 16. Implementation Order

### Week 1 (done)
- [x] Template repo with components + vault structure
- [x] Skills (component-design, code-quality, restaurant-food)
- [x] PRD + implementation plan

### Week 2: Core Infrastructure
**Day 1-2: Data layer**
1. Create `lib/app-builder/types.ts` — MerchantAppSpec interface
2. Create `lib/app-builder/vault-writer.ts` — all file generators
3. Create `lib/app-builder/extract-spec.ts` — extraction logic
4. Create Supabase migrations (merchant_apps, build_tasks, sessions)
5. Unit test vault writer — verify generated files are valid

**Day 3-4: Railway integration**
6. Create `lib/app-builder/railway.ts` — GraphQL client
7. Create `app/api/apps/provision/route.ts` — project creation
8. Create `app/api/apps/vm-status/route.ts` — readiness check
9. Create vm-task-server (write-files, run-claude, health endpoints)
10. Test railway ssh integration for Claude Code execution
11. Test: provision project → VM starts → dev server accessible

**Day 5: Live preview**
12. Create `components/onboarding/LivePreview.tsx` — iframe component
13. Create `components/onboarding/AppBuilderLayout.tsx` — split layout
14. Wire iframe to Railway dev URL
15. Test: iframe loads dev server → HMR works when files change

### Week 3: Interview + Build Pipeline
**Day 1-2: Build pipeline**
16. Create `lib/app-builder/build-dispatcher.ts` — task queue
17. Create `app/api/apps/build/route.ts` — dispatch endpoint
18. Create `app/api/apps/update-vault/route.ts` — vault push
19. Create `app/api/apps/update-assets/route.ts` — photo push
20. Test: push vault files → run Claude Code → HMR updates preview

**Day 3-4: Interview rewrite**
21. Create `lib/app-builder/ava-prompt.ts` — new system prompt
22. Update `OnboardingChat.tsx` — wire to AppBuilderContext
23. Implement Phase 1a flow (Q1-Q4 → signup wall)
24. Implement Phase 1b flow (Q5-Q9 → finalize)
25. Each step: extraction → spec update → vault write → dispatch
26. Test: full interview → app builds live in preview

**Day 5: Signup + Freedom sync**
27. Wire signup wall after Phase 1a
28. Create `lib/app-builder/freedom-sync.ts`
29. Test: signup → Freedom account → community created

### Week 4: Deploy + Polish
**Day 1-2: Deploy flow**
30. Create `lib/app-builder/deploy.ts`
31. Create `app/api/apps/deploy/route.ts`
32. Implement subdomain routing on Railway
33. Test: "Go live" → production deploy → accessible URL

**Day 3-4: Iteration flow**
34. Create `app/api/apps/start-iteration/route.ts`
35. Implement ad-hoc request handling (merchant types change → Claude builds)
36. Test: returning merchant → VM wakes → make changes → redeploy

**Day 5: End-to-end testing**
37. Full flow test with real business (Peta Pet Shop or similar)
38. Fix issues, polish transitions
39. Mobile layout testing (preview as bottom sheet)

---

## 17. Testing Plan

### Unit Tests
- Vault Writer: each generator produces valid markdown/JSON
- Extract Spec: all tag patterns correctly parsed
- Theme JSON: mood→variant mapping is correct
- lightenColor: produces valid hex

### Integration Tests
- Railway API: create project → get URL → delete project
- VM Task Server: write files → verify on disk
- Claude Code: run simple task → verify file changed
- HMR: modify file → iframe detects change

### E2E Tests
- Full interview (simulated answers) → app builds → deploy → accessible
- Abandon at Q3 → VM killed within timeout
- Return iteration → VM starts → make change → redeploy
- Mobile layout → toggle between chat and preview

### Quality Tests (manual)
- Run 5 different restaurant businesses through the flow
- Rate each output: does it feel unique? Does it feel branded?
- Check anti-preferences are respected
- Check mood is consistent across all pages
- Check mobile responsiveness at 375px
