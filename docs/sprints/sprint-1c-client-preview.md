# Sprint 1C: Client-Side Preview + UI Style Picker

## Objective
Replace the Railway iframe-based preview with a client-side React preview that renders from AppSpec data. Add UI style picker component and preview animations.

## Working Directory
`/clawd/bd/freedom-onboarding/` (the Vercel frontend app)

## Context
Currently, the live preview (`components/onboarding/LivePreview.tsx`) renders an iframe pointing to a Railway dev server URL. This requires:
- Railway service to be provisioned before preview shows
- Network round-trip to Railway Singapore for every update
- Railway per-second billing during preview

**New approach:** Render the preview client-side from the AppSpec data. No Railway needed. Preview updates instantly as the user answers questions. Railway is only used later for the actual Claude Code build.

## Tasks

### 1. Build client-side preview renderer

Create: `components/onboarding/preview/AppPreview.tsx`

This component takes an `AppSpec` object and renders a phone-frame preview of the merchant's app. It should look like a real mobile app, not a wireframe.

**Input:** The `MerchantAppSpec` type from `lib/app-builder/types.ts` — read this file to understand the shape.

**What to render based on AppSpec data:**

```
AppSpec.identity.type → determines layout (food/retail/fitness/entertainment/community/services)
AppSpec.identity.name → app name in header
AppSpec.brand.primaryColor → accent color throughout
AppSpec.brand.vibe → tone/mood
AppSpec.brand.uiStyle → visual treatment (glass/bold/outlined/gradient/neumorphic)
AppSpec.brand.logoUrl → logo in header
AppSpec.brand.bannerUrl → hero background image
AppSpec.products → product cards in grid
AppSpec.features.heroFeature → primary CTA button text
AppSpec.features.primaryActions → quick action grid
AppSpec.audience.description → used for copy tone
AppSpec.content.sections → which sections to show
```

**Preview sections (rendered in order based on business type):**

1. **Header bar** — app name, logo, notification bell icon
2. **Hero section** — banner image (or gradient fallback), tagline, CTA button
3. **Quick actions grid** — 4 circular icons with labels (type-specific)
4. **Content sections** — varies by type:
   - Food: menu grid, specials, gallery
   - Retail: featured products, categories
   - Fitness: class schedule, trainers
   - Entertainment: content grid, trending
   - Community: feed preview, events
   - Services: portfolio, pricing tiers
5. **Bottom navigation** — 4 tabs (type-specific icons + labels)

**Visual fidelity:**
- Render inside a phone frame (rounded rect with notch)
- Use real Tailwind styling — this should look like a real app screenshot
- Apply the `uiStyle` to all cards/buttons/sections (glass, bold, outlined, gradient, neumorphic)
- Use the primary color from AppSpec for accents
- Show real product names/prices if available, placeholder skeleton blocks if not
- Images: use `bannerUrl`/`logoUrl` if available, gradient fallback if not

### 2. Phone frame component

Create: `components/onboarding/preview/PhoneFrame.tsx`

- iPhone-style frame (rounded corners, notch, status bar with time)
- Scrollable content area inside
- Glow effect: border glows with `primaryColor` on updates
- Scale: fits within the right panel (max-width ~375px, auto-height)

### 3. Preview animations

**Entrance animation** (first data arrives):
- Phone frame scales from 0.8 → 1.0 with `backdrop-filter: blur(20px)` dissolving to clear
- Duration: 600ms, ease-out

**Section reveal** (new section added):
- Skeleton shimmer (gray pulsing block) → slide-up reveal with content
- Stagger: each section 100ms after previous
- Duration: 400ms per section

**Glow pulse** (data update):
- Phone border briefly pulses with brand color (`primaryColor`)
- `box-shadow: 0 0 20px {primaryColor}40` → fade out
- Duration: 800ms

**Mobile auto-peek** (viewport < 768px):
- When new data arrives, preview slides up from bottom to 40vh
- Stays for 3.5 seconds, then slides back down
- User can tap to keep it open

Use `framer-motion` (already in dependencies) for all animations.

### 4. UI Style Picker component

Create: `components/onboarding/UIStylePicker.tsx`

Interactive card selector shown during interview Q4. User picks one of 5 styles.

Each card shows:
- Style name + emoji icon
- 3-4 word description
- Mini visual preview (small colored rectangles showing the style's treatment)

Cards layout: horizontal scroll on mobile, grid on desktop.

**Selection behavior:**
- Tap to select (highlighted border + checkmark)
- Selection emits to AppBuilderContext → updates `merchantAppSpec.brand.uiStyle`
- Preview immediately reflects the change

Style options:
```
🪟 Glass & Blur — "Frosted, translucent, premium"
💪 Bold Cards — "Strong, solid, impactful"  
✏️ Outlined & Clean — "Minimal, airy, professional"
🌈 Gradient Flow — "Colorful, dynamic, creative"
🫧 Neumorphic Soft — "Tactile, raised, gentle"
```

### 5. Integrate into AppBuilderLayout

Update: `components/onboarding/AppBuilderLayout.tsx`

- Replace iframe-based `LivePreview` with new `AppPreview` component
- Pass current `merchantAppSpec` from context
- Show `UIStylePicker` when interview reaches style selection step
- Wire animations to spec change events

### 6. Update AppBuilderContext

Update: `context/AppBuilderContext.tsx`

- Add `uiStyle` to `MerchantAppSpec` type handling
- When `[[UI_STYLE:glass]]` extraction tag is received, update spec
- When UIStylePicker selection changes, update spec
- Preview re-renders automatically via React state

## Design Reference

Read these files in the template repo to understand the component variants and theme system:
- `/clawd/bd/freedom-app-template/design/components.md`
- `/clawd/bd/freedom-app-template/design/system.md`
- `/clawd/bd/freedom-app-template/design/theme.json`
- `/clawd/bd/freedom-app-template/src/lib/design/theme.tsx`
- `/clawd/bd/freedom-app-template/src/lib/design/components/Hero.tsx`
- `/clawd/bd/freedom-app-template/src/lib/design/components/ProductCard.tsx`
- `/clawd/bd/freedom-app-template/src/lib/design/components/Navigation.tsx`

## Constraints
- Do NOT create or modify files in `/clawd/bd/freedom-api/` or `/clawd/bd/freedom-app-template/`
- Only work in `/clawd/bd/freedom-onboarding/` (the Vercel frontend)
- Use existing dependencies only: `framer-motion`, `lucide-react`, `tailwindcss`
- Preview must be fully client-side — no API calls, no iframe, no external URLs
- Phone frame must look premium — this is the first thing merchants see
- Mobile-responsive: preview works on both desktop (side panel) and mobile (peek-up)
- All components must have `"use client"` directive

## Output
- Client-side preview renderer that updates in real-time from AppSpec
- Phone frame with entrance/update animations
- UI style picker component
- Updated AppBuilderLayout integration
- Zero Railway dependency for preview phase
