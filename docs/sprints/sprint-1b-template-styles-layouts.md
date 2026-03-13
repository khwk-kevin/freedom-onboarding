# Sprint 1B: Add UI Styles + Business Type Layouts to Template

## Objective
Expand the app template with 5 UI design styles and 5 new business-type build skills (6 total including existing restaurant).

## Working Directory
`/clawd/bd/freedom-app-template/`

## Context
The template at `/clawd/bd/freedom-app-template/` is a Next.js app with shadcn/ui components. It has:
- 7 component variants (Hero ×4, ProductCard ×3, Nav ×3, Contact ×3, Gallery ×3, Footer ×3, CTA ×3)
- Theme system: `design/theme.json` → CSS variables → ThemeProvider (`src/lib/design/theme.tsx`)
- 1 build skill: `skills/build/restaurant-food.md`

We need to add:
1. **5 UI design styles** that change the visual treatment of every component
2. **5 new business-type build skills** for Claude Code to follow when building apps

## Part A: UI Design Styles

### The 5 styles

| Style | CSS Approach | Visual Characteristics |
|---|---|---|
| `glass` | `backdrop-filter: blur()`, semi-transparent backgrounds, `bg-white/10` | Frosted glass cards, blur backgrounds, iOS-like, premium feel |
| `bold` | Solid fills, `shadow-xl`, `font-bold` on everything, large padding | Chunky buttons, strong shadows, high contrast, Uber/Nike-style |
| `outlined` | `border` on everything, minimal fills, lots of whitespace | Thin borders, open layouts, Airbnb/Notion-style, clean |
| `gradient` | `bg-gradient-to-*` on cards and sections, colorful transitions | Gradient backgrounds, colorful, Instagram/Discord-style |
| `neumorphic` | `box-shadow` inset + outset, soft raised surfaces | Raised buttons, inset inputs, tactile feel, smart-home style |

### Implementation

1. **Add `uiStyle` field to `design/theme.json`:**
```json
{
  "uiStyle": "bold",
  "colors": { ... },
  "fonts": { ... }
}
```

2. **Create style utility file: `src/lib/design/styles.ts`:**
- Export a function `getStyleClasses(uiStyle: string, component: string)` that returns Tailwind classes
- Map each component × style combination to specific Tailwind classes
- Components to style: card, button, input, section, hero, nav, badge, avatar

3. **Update each component** in `src/lib/design/components/` to:
- Import `getStyleClasses`
- Read `uiStyle` from theme context or props
- Apply style-specific classes alongside existing variant classes

4. **Update ThemeProvider** (`src/lib/design/theme.tsx`):
- Read `uiStyle` from `theme.json`
- Set CSS custom property `--ui-style` on `:root`
- Provide `uiStyle` in context

### Style × Component matrix (key classes):

**Hero:**
- glass: `bg-white/5 backdrop-blur-xl border border-white/10`
- bold: `bg-primary shadow-2xl rounded-none p-12`
- outlined: `border-2 border-gray-200 bg-transparent`
- gradient: `bg-gradient-to-br from-primary/80 to-secondary/60`
- neumorphic: `bg-gray-100 shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff] rounded-2xl`

**Card (ProductCard, etc.):**
- glass: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl`
- bold: `bg-white shadow-xl rounded-lg border-l-4 border-primary`
- outlined: `border border-gray-300 rounded-md bg-transparent hover:border-primary`
- gradient: `bg-gradient-to-b from-white to-gray-50 shadow-md rounded-xl`
- neumorphic: `bg-gray-100 shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] rounded-xl`

**Button:**
- glass: `bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30`
- bold: `bg-primary text-white font-bold py-4 px-8 shadow-lg hover:shadow-xl uppercase tracking-wider`
- outlined: `border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white`
- gradient: `bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:shadow-lg`
- neumorphic: `bg-gray-100 shadow-[3px_3px_6px_#d1d1d1,-3px_-3px_6px_#ffffff] hover:shadow-[inset_3px_3px_6px_#d1d1d1,inset_-3px_-3px_6px_#ffffff]`

Apply similar patterns for Navigation, ContactSection, Gallery, FooterSection, CTASection.

## Part B: Business Type Build Skills

### Existing
- `skills/build/restaurant-food.md` ✅

### New skills to create

Read the existing `restaurant-food.md` first to understand the format and level of detail. Then create 5 new skills following the same pattern but adapted for each business type:

**1. `skills/build/retail.md`**
- Product catalog with category filters
- Product detail pages
- Cart/wishlist quick actions
- Featured products hero
- Nav: Home, Shop, Cart, Account
- Quick actions: Browse, Cart, Wishlist, Track Order

**2. `skills/build/fitness.md`**
- Class/session schedule (weekly grid or list)
- Trainer/instructor profiles
- Progress/stats dashboard concept
- Membership tiers display
- Nav: Home, Classes, Progress, Profile
- Quick actions: Book Class, Schedule, Progress, Community

**3. `skills/build/entertainment.md`**
- Content grid (movies, shows, games, events)
- Category/genre browsing
- Ratings and reviews
- Trending/featured section
- Nav: Home, Discover, Saved, Profile
- Quick actions: Discover, Watchlist, Rate, Share

**4. `skills/build/community.md`**
- Feed/timeline layout
- Events calendar
- Members directory
- Discussion/chat concept
- Nav: Feed, Events, Members, Chat
- Quick actions: Post, Events, Members, Chat

**5. `skills/build/services.md`**
- Portfolio/work gallery
- Service tiers with pricing
- Booking/quote request form
- Testimonials/reviews section
- Nav: Home, Services, Book, Profile
- Quick actions: Book, Get Quote, Portfolio, Reviews

### Skill format
Each skill should include:
1. **Section order** (which sections to build, in what order)
2. **Component selection** (which variant to use for Hero, ProductCard, etc.)
3. **Content mapping** (where to get data from context files)
4. **Navigation structure** (tabs, labels, icons)
5. **Quick actions** (icon, label, action name)
6. **Design guidance** (type-specific visual rules)

### Update `skills/_active.md`
Document how the build system selects the right skill based on `businessType` from the AppSpec.

## Part C: Static Export Configuration

Update `next.config.js` (or `next.config.mjs`) to support static export:

```js
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Required for static export
  },
};
```

Verify all pages work with static export:
- No `getServerSideProps`
- No API routes in the template (merchant apps don't have their own API)
- No dynamic routes that can't be statically determined
- `next/image` with `unoptimized: true`

Run `npm run build` to verify static export works.

## Constraints
- Do NOT modify the original `/clawd/bd/freedom-onboarding/` files — only work in `/clawd/bd/freedom-app-template/`
- Keep existing component variants working — styles are additive
- All style classes must use Tailwind (no custom CSS files)
- Components must work with `"use client"` directive (Next.js 16 requirement — already applied)
- Theme system must remain backward-compatible (apps without `uiStyle` default to `outlined`)

## Output
- Updated template with 5 UI styles applied to all 7 component families
- 5 new build skill files
- Static export working (`npm run build` succeeds with `output: 'export'`)
