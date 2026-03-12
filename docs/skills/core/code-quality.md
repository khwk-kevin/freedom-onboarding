---
name: code-quality
type: core-skill
always-active: true
---

# Core Skill: Code Quality Standards

This skill governs HOW you write code. Applies to all files in /src.

## Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui base + custom variants in /src/lib/design/
- **Images:** next/image (always)
- **State:** React hooks (useState, useEffect) — no external state library needed
- **Data:** Freedom SDK in /src/lib/freedom/

## File Organization
```
src/
├── app/                    ← Pages (Next.js App Router)
│   ├── page.tsx            ← Homepage
│   ├── layout.tsx          ← Root layout (nav, footer, theme)
│   ├── menu/page.tsx       ← Example sub-page
│   └── globals.css         ← Global styles + Tailwind imports
├── components/             ← App-specific components (Claude creates these)
│   ├── MenuSection.tsx
│   └── ...
├── lib/
│   ├── design/             ← READ-ONLY: Pre-built component library
│   │   ├── components/     ← Hero, Card, Nav, Footer, etc.
│   │   ├── layouts/        ← Page layouts
│   │   └── theme.ts        ← Theme provider
│   ├── freedom/            ← READ-ONLY: Freedom SDK
│   └── utils.ts            ← Utility functions
└── public/
    └── assets/             ← Merchant photos
```

## TypeScript Rules
- No `any` types — always specify types
- Use interfaces for component props
- Export types from a `types.ts` file if shared
- Prefer `const` over `let`

## Component Rules
- One component per file
- Props interface at top of file
- Default exports for page components
- Named exports for reusable components
- Destructure props in function signature

```tsx
// ✅ Good
interface MenuItemProps {
  name: string;
  price: number;
  image?: string;
  description?: string;
}

export function MenuItem({ name, price, image, description }: MenuItemProps) {
  return (/* ... */);
}
```

## Tailwind Rules
- Use theme tokens via CSS variables (set by theme provider)
- Prefer Tailwind classes over inline styles
- Use `cn()` utility for conditional classes
- Responsive: `sm:`, `md:`, `lg:` prefixes (mobile-first)
- No `@apply` in CSS files — keep styles in JSX

## Image Rules
```tsx
// ✅ Always use next/image
import Image from 'next/image';

<Image
  src="/assets/gallery/photo-1.jpg"
  alt="Descriptive alt text"
  width={800}
  height={600}
  className="rounded-xl"
/>
```

## Performance
- No unnecessary client components — default to server components
- Add `'use client'` only when needed (interactivity, hooks)
- Lazy load below-fold images
- Keep bundle size small — no unnecessary dependencies

## Accessibility
- Semantic HTML (nav, main, section, article, footer)
- Alt text on all images
- Keyboard navigable interactive elements
- Sufficient color contrast (4.5:1)
- Language attribute on html tag

## Before Committing
1. Run `npm run build` — zero errors
2. Run `npm run lint` — zero warnings
3. Check all pages render at 375px and 1280px
4. Verify no TypeScript errors in IDE
