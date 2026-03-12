---
name: component-design
type: core-skill
always-active: true
source: merged from frontend-design skill + brand-constrained ui-design
linked:
  - "[[context/brand.md]]"
  - "[[context/decisions/001-visual-mood.md]]"
  - "[[design/system.md]]"
  - "[[design/components.md]]"
  - "[[design/theme.json]]"
---

# Core Skill: Component Design

This is your primary visual skill. It governs every component you use, every page you compose, every pixel you place.

> You are building a merchant's unique app — not a generic template.
> Every visual decision traces back to [[context/brand.md]].
> Every component comes from [[design/components.md]].

---

## 1. Design Thinking (Before Every Page)

Before writing ANY code for a new page or component:

1. **Re-read** [[context/brand.md]] — mood, anti-preferences, personality
2. **Check** [[design/components.md]] — selected variants for this app
3. **Check** [[context/decisions/_index.md]] — prior decisions affecting this page
4. **Decide** composition and layout → log the decision in [[context/decisions/]]

### Questions to answer:
- What is the ONE thing a user should notice first on this page?
- How does this page make the merchant's business FEEL?
- Which components from the catalog compose this page?
- Does this feel like THEIR app, or like any generic template?

---

## 2. Component Selection Rules

### Always use the catalog first
The component catalog in [[design/components.md]] contains pre-built, tested components with mood-matched variants already selected for this merchant.

**Decision tree:**
```
Need a UI pattern?
  │
  ├── Exists in [[design/components.md]] with right variant?
  │   └── USE IT. Import from /src/lib/design/components/
  │
  ├── Exists but variant doesn't quite fit?
  │   └── Use closest variant + Tailwind adjustments
  │       Log the adjustment in [[context/decisions/]]
  │
  ├── Doesn't exist but is a standard pattern?
  │   └── Build it in /src/components/ following the design system
  │       Log the new component in [[context/decisions/]]
  │
  └── Truly unique to this business?
      └── Build it in /src/components/
          Log WHY it's unique in [[context/decisions/]]
```

### Component composition
Pages are composed from components. Think of each page as an assembly:

```tsx
// Homepage example
<Layout>
  <Hero variant="soft" />           ← from catalog
  <ProductGrid variant="rounded" /> ← from catalog
  <AboutSnippet />                  ← custom, uses theme
  <ContactQuick />                  ← custom, uses theme
  <CTA variant="banner" />         ← from catalog
  <Footer variant="branded" />     ← from catalog
</Layout>
```

---

## 3. Visual Quality Standards

### Typography
- Use ONLY fonts from [[design/theme.json]]
- Follow the type scale in [[design/system.md]]
- Thai text: line-height 1.6+ (Thai script needs breathing room)
- Pair heading font (display) with body font (reading)
- Never fall back to generic fonts (Arial, Roboto, system-ui)

### Color
- ALL colors from [[design/theme.json]] — zero hardcoded values
- Primary: CTAs, headers, accents, interactive elements
- Use opacity variants for subtle backgrounds (`bg-primary/5`, `bg-primary/10`)
- Contrast ratio: 4.5:1 minimum for text
- The merchant's primary color should feel intentional everywhere, not overwhelming

### Composition
- One clear focal point per section
- Visual hierarchy through size, weight, and color — not through clutter
- Generous whitespace — let content breathe
- Align everything to the spacing scale (4, 8, 12, 16, 24, 32, 48, 64)
- Mobile-first: design at 375px, then expand

### Photography
- Merchant's real photos ONLY — never placeholders
- Photos are the soul of the app. Treat them with care.
- Consistent border-radius from theme
- Proper aspect ratios (16:9 banners, 1:1 products, 4:3 gallery)
- Always use next/image with proper sizing and alt text

### Motion & Interaction
- Subtle, purposeful transitions (150-200ms ease)
- Hover states on ALL interactive elements
- Loading states for async content
- No gratuitous animations — every motion should have a reason

---

## 4. What Makes It THEIR App (The Most Important Section)

This is the difference between a template and an app someone is proud of:

- **Real name** — their business name everywhere, not "Your Business"
- **Real content** — their products, their descriptions, their story
- **Real photos** — the hero should feel like walking into their shop
- **Real language** — Thai-first if Thai business, proper colloquial tone
- **Real mood** — if they said "cozy," every element should feel warm
- **Real details** — favicon from their logo, page titles with their name, their LINE ID on the contact button

The merchant should look at this and feel: *"How did it know exactly what I wanted?"*

The answer is: because you read [[context/brand.md]] and [[context/decisions/]] and you built EVERYTHING from that understanding.

---

## 5. Anti-Patterns (NEVER)

- ❌ Generic gradient backgrounds (especially purple/blue on white)
- ❌ Stock photography or placeholder images
- ❌ Lorem ipsum or "Your description here"
- ❌ Cookie-cutter layouts that look like every other AI site
- ❌ Overused fonts (Inter, Roboto, unless merchant specifically chose them)
- ❌ Inconsistent spacing or arbitrary padding values
- ❌ Hardcoded colors instead of theme tokens
- ❌ Desktop-first layouts that break on mobile
- ❌ Dark mode (not supported yet)
- ❌ Components created from scratch when a catalog variant exists
- ❌ Ignoring the merchant's mood/tone in favor of "what looks cool"

---

## 6. Quality Checklist (After Every Page)

Run this after completing any page:

- [ ] All colors from theme — grep for hardcoded hex values
- [ ] All fonts from theme — no generic fallbacks
- [ ] Mobile (375px) — looks correct, nothing overflows
- [ ] Desktop (1280px) — looks correct, proper max-width
- [ ] All images use next/image with alt text
- [ ] No placeholder text — all real merchant content
- [ ] Hover states on buttons and links
- [ ] Page title includes business name
- [ ] Spacing follows the scale (no arbitrary values)
- [ ] Mood is consistent with [[context/brand.md]]
- [ ] Components imported from catalog where possible
- [ ] Any new decisions logged in [[context/decisions/]]

---

## 7. Evolving the Design

As the app grows through iterations:
- New pages should feel like natural extensions of existing ones
- If a new feature needs a component that doesn't exist, build it following the established mood
- If you notice the design system is creating friction, log it in [[history/friction.md]]
- The design compounds — session 5 should be MORE consistent than session 1, not less
