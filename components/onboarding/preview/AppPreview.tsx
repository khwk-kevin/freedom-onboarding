'use client';

/**
 * AppPreview — Sprint 1C
 * Renders a realistic mobile app UI from MerchantAppSpec data.
 * No iframe, no Railway dependency — pure client-side React.
 *
 * Sections rendered in order:
 *   1. Header bar (app name, logo, notification bell)
 *   2. Hero section (banner/gradient, tagline, CTA)
 *   3. Quick actions grid (4 circular buttons, type-specific)
 *   4. Content sections (varies by business type)
 *   5. Bottom navigation (4 tabs, type-specific)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useRef } from 'react';
import type { MerchantAppSpec, UIStyle } from '@/lib/app-builder/types';

// ── Color helpers ─────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return [isNaN(r) ? 124 : r, isNaN(g) ? 58 : g, isNaN(b) ? 237 : b];
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const d = (v: number) => Math.max(0, Math.round(v * (1 - amount)));
  return `rgb(${d(r)},${d(g)},${d(b)})`;
}

// ── Business type categorization ──────────────────────────────────────────────

type BizCategory = 'food' | 'retail' | 'fitness' | 'entertainment' | 'community' | 'services' | 'generic';

function getBizCategory(spec: MerchantAppSpec): BizCategory {
  const bt = (spec.businessType ?? spec.category ?? '').toLowerCase();
  if (/restaurant|cafe|food|bakery|bar|coffee|bistro|thai|sushi|pizza|burger/.test(bt)) return 'food';
  if (/retail|shop|store|boutique|fashion|clothing|market|mall|gift/.test(bt)) return 'retail';
  if (/gym|fitness|yoga|sport|pilates|crossfit|swim|dance|martial/.test(bt)) return 'fitness';
  if (/entertain|cinema|theater|game|music|club|bar|lounge|concert/.test(bt)) return 'entertainment';
  if (/community|club|group|social|association|church|school/.test(bt)) return 'community';
  if (/salon|spa|barber|beauty|nail|massage|consult|service|agency|law|accounting/.test(bt)) return 'services';
  return 'generic';
}

// ── Style helpers (applies uiStyle to card/button/section) ────────────────────

interface StyleProps {
  className?: string;
  style?: React.CSSProperties;
}

function getCardStyle(uiStyle: UIStyle, primaryColor: string, isAccent = false): StyleProps {
  switch (uiStyle) {
    case 'glass':
      return {
        className: 'backdrop-blur-sm border',
        style: {
          background: isAccent ? rgba(primaryColor, 0.2) : 'rgba(255,255,255,0.55)',
          borderColor: isAccent ? rgba(primaryColor, 0.4) : 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        },
      };
    case 'bold':
      return {
        className: 'shadow-lg',
        style: {
          background: isAccent ? primaryColor : '#ffffff',
          color: isAccent ? '#ffffff' : '#111',
          boxShadow: isAccent ? `0 4px 14px ${rgba(primaryColor, 0.4)}` : '0 2px 8px rgba(0,0,0,0.08)',
        },
      };
    case 'outlined':
      return {
        className: '',
        style: {
          background: isAccent ? 'transparent' : '#ffffff',
          border: `2px solid ${isAccent ? primaryColor : '#e5e7eb'}`,
          color: isAccent ? primaryColor : '#111',
        },
      };
    case 'gradient':
      return {
        className: 'shadow-md',
        style: {
          background: isAccent
            ? `linear-gradient(135deg, ${primaryColor}, ${darken(primaryColor, 0.3)})`
            : `linear-gradient(135deg, #f9fafb, #f3f4f6)`,
          color: isAccent ? '#ffffff' : '#111',
        },
      };
    case 'neumorphic':
      return {
        className: '',
        style: {
          background: isAccent ? '#e8ecf0' : '#eef0f3',
          boxShadow: isAccent
            ? `inset 3px 3px 7px #cdd0d4, inset -3px -3px 7px #ffffff`
            : `6px 6px 12px #c8cbd0, -6px -6px 12px #ffffff`,
          color: isAccent ? primaryColor : '#444',
        },
      };
  }
}

function getButtonStyle(uiStyle: UIStyle, primaryColor: string): StyleProps {
  switch (uiStyle) {
    case 'glass':
      return {
        style: {
          background: rgba(primaryColor, 0.85),
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: '#fff',
          border: `1px solid ${rgba(primaryColor, 0.6)}`,
        },
      };
    case 'bold':
      return {
        style: {
          background: primaryColor,
          color: '#fff',
          boxShadow: `0 4px 14px ${rgba(primaryColor, 0.5)}`,
        },
      };
    case 'outlined':
      return {
        style: {
          background: 'transparent',
          border: `2px solid ${primaryColor}`,
          color: primaryColor,
        },
      };
    case 'gradient':
      return {
        style: {
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${darken(primaryColor, 0.25)} 100%)`,
          color: '#fff',
          boxShadow: `0 4px 14px ${rgba(primaryColor, 0.4)}`,
        },
      };
    case 'neumorphic':
      return {
        style: {
          background: '#e8ecf0',
          boxShadow: `4px 4px 8px #c5c8cd, -4px -4px 8px #ffffff`,
          color: primaryColor,
          border: 'none',
        },
      };
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

// Skeleton shimmer block
function Skeleton({ w, h, rounded = 'rounded-lg' }: { w: string; h: string; rounded?: string }) {
  return (
    <div
      className={`${w} ${h} ${rounded} animate-pulse`}
      style={{ background: 'rgba(0,0,0,0.08)' }}
    />
  );
}

// Section wrapper with reveal animation
function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

interface HeaderProps {
  appName: string;
  primaryColor: string;
  uiStyle: UIStyle;
  showCart?: boolean;
  showSearch?: boolean;
}

function AppHeader({ appName, primaryColor, uiStyle, showCart, showSearch }: HeaderProps) {
  const isGlass = uiStyle === 'glass';
  return (
    <div
      className="flex items-center justify-between px-4 py-3 sticky top-0 z-30"
      style={{
        background: isGlass ? rgba(primaryColor, 0.15) : '#ffffff',
        backdropFilter: isGlass ? 'blur(16px)' : undefined,
        WebkitBackdropFilter: isGlass ? 'blur(16px)' : undefined,
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Logo / name */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ background: primaryColor }}
        >
          {(appName?.[0] ?? 'A').toUpperCase()}
        </div>
        <span className="text-[15px] font-semibold text-gray-900 truncate max-w-[140px]">
          {appName || 'Your App'}
        </span>
      </div>

      {/* Right icons */}
      <div className="flex items-center gap-3">
        {showSearch && (
          <button className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: rgba(primaryColor, 0.1) }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: primaryColor }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        )}
        {showCart && (
          <button className="w-8 h-8 relative flex items-center justify-center rounded-full" style={{ background: rgba(primaryColor, 0.1) }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: primaryColor }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 13H4L5 9z" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ background: primaryColor }}>2</span>
          </button>
        )}
        <button className="w-8 h-8 relative flex items-center justify-center rounded-full" style={{ background: rgba(primaryColor, 0.1) }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: primaryColor }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{ background: primaryColor }} />
        </button>
      </div>
    </div>
  );
}

// ── Hero section ──────────────────────────────────────────────────────────────

interface HeroProps {
  title: string;
  tagline?: string;
  ctaText: string;
  bannerUrl?: string;
  primaryColor: string;
  uiStyle: UIStyle;
}

function HeroSection({ title, tagline, ctaText, bannerUrl, primaryColor, uiStyle }: HeroProps) {
  const btnStyle = getButtonStyle(uiStyle, primaryColor);
  const isGlass = uiStyle === 'glass';

  return (
    <div className="relative overflow-hidden mx-0" style={{ height: 180 }}>
      {/* Background */}
      {bannerUrl ? (
        <img
          src={bannerUrl}
          alt="Banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${darken(primaryColor, 0.35)} 60%, #1a1a2e 100%)`,
          }}
        />
      )}
      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: bannerUrl ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.15)' }} />

      {/* Glass shimmer for glass style */}
      {isGlass && (
        <div className="absolute inset-0" style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)`,
        }} />
      )}

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end px-4 pb-4">
        <h1 className="text-white text-xl font-bold leading-snug mb-1 drop-shadow-sm">
          {title || 'Welcome'}
        </h1>
        {tagline && (
          <p className="text-white/80 text-[12px] mb-3 leading-relaxed line-clamp-2">{tagline}</p>
        )}
        <button
          className="self-start px-5 py-2 rounded-full text-sm font-semibold"
          style={btnStyle.style}
        >
          {ctaText}
        </button>
      </div>
    </div>
  );
}

// ── Quick actions grid ────────────────────────────────────────────────────────

interface QuickAction {
  emoji: string;
  label: string;
}

function QuickActions({ actions, primaryColor, uiStyle }: { actions: QuickAction[]; primaryColor: string; uiStyle: UIStyle }) {
  return (
    <div className="px-4 py-4">
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action, i) => {
          const cardStyle = getCardStyle(uiStyle, primaryColor, false);
          return (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl cursor-pointer ${cardStyle.className ?? ''}`}
              style={cardStyle.style}
            >
              <span className="text-xl">{action.emoji}</span>
              <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">{action.label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Product / content card ────────────────────────────────────────────────────

interface CardItem {
  name: string;
  subtitle?: string;
  price?: string;
  imageUrl?: string;
  badge?: string;
}

function ProductCard({ item, primaryColor, uiStyle }: { item: CardItem; primaryColor: string; uiStyle: UIStyle }) {
  const cardStyle = getCardStyle(uiStyle, primaryColor, false);
  return (
    <div className={`rounded-2xl overflow-hidden ${cardStyle.className ?? ''}`} style={cardStyle.style}>
      {/* Image area */}
      <div className="relative h-24 overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-2xl"
            style={{ background: `linear-gradient(135deg, ${rgba(primaryColor, 0.15)}, ${rgba(primaryColor, 0.08)})` }}
          >
            🖼️
          </div>
        )}
        {item.badge && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-[9px] font-bold"
            style={{ background: primaryColor }}
          >
            {item.badge}
          </div>
        )}
      </div>
      {/* Info */}
      <div className="px-3 py-2">
        <p className="text-[12px] font-semibold text-gray-900 leading-tight truncate">{item.name}</p>
        {item.subtitle && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{item.subtitle}</p>}
        {item.price && (
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[12px] font-bold" style={{ color: primaryColor }}>{item.price}</span>
            <button
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: primaryColor }}
            >+</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ title, actionLabel, primaryColor }: { title: string; actionLabel?: string; primaryColor: string }) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2">
      <span className="text-[14px] font-bold text-gray-900">{title}</span>
      {actionLabel && (
        <span className="text-[12px] font-medium" style={{ color: primaryColor }}>{actionLabel}</span>
      )}
    </div>
  );
}

// ── Bottom navigation ─────────────────────────────────────────────────────────

interface NavTab {
  emoji: string;
  label: string;
  active?: boolean;
}

function BottomNav({ tabs, primaryColor, uiStyle }: { tabs: NavTab[]; primaryColor: string; uiStyle: UIStyle }) {
  const isGlass = uiStyle === 'glass';
  const isNeumorphic = uiStyle === 'neumorphic';

  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex items-center justify-around px-2 z-20"
      style={{
        height: 72,
        background: isGlass
          ? rgba(primaryColor, 0.1)
          : isNeumorphic
          ? '#eef0f3'
          : '#ffffff',
        backdropFilter: isGlass ? 'blur(20px)' : undefined,
        WebkitBackdropFilter: isGlass ? 'blur(20px)' : undefined,
        borderTop: isGlass
          ? `1px solid ${rgba(primaryColor, 0.25)}`
          : '1px solid rgba(0,0,0,0.07)',
        boxShadow: isNeumorphic
          ? `0 -4px 10px rgba(200,205,210,0.5), 0 -1px 4px rgba(255,255,255,0.8)`
          : '0 -1px 0 rgba(0,0,0,0.06)',
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.label}
          className="flex flex-col items-center gap-1 flex-1 py-2"
        >
          <span className="text-[18px]" style={{ filter: tab.active ? 'none' : 'grayscale(1) opacity(0.5)' }}>
            {tab.emoji}
          </span>
          <span
            className="text-[9px] font-medium"
            style={{ color: tab.active ? primaryColor : '#9ca3af' }}
          >
            {tab.label}
          </span>
          {tab.active && (
            <div className="absolute bottom-1 w-4 h-[3px] rounded-full" style={{ background: primaryColor }} />
          )}
        </button>
      ))}
    </div>
  );
}

// ── Business-type config ──────────────────────────────────────────────────────

interface BizConfig {
  quickActions: QuickAction[];
  navTabs: NavTab[];
  heroCtaText: string;
  featuredTitle: string;
  featuredAction: string;
  showCart: boolean;
  showSearch: boolean;
}

function getBizConfig(category: BizCategory): BizConfig {
  switch (category) {
    case 'food':
      return {
        quickActions: [
          { emoji: '🍽️', label: 'Menu' },
          { emoji: '📦', label: 'Order' },
          { emoji: '⭐', label: 'Loyalty' },
          { emoji: '📞', label: 'Contact' },
        ],
        navTabs: [
          { emoji: '🏠', label: 'Home', active: true },
          { emoji: '🍽️', label: 'Menu' },
          { emoji: '🛒', label: 'Order' },
          { emoji: '👤', label: 'Profile' },
        ],
        heroCtaText: 'Order Now',
        featuredTitle: "Today's Specials",
        featuredAction: 'View all',
        showCart: true,
        showSearch: false,
      };
    case 'retail':
      return {
        quickActions: [
          { emoji: '🛍️', label: 'Shop' },
          { emoji: '❤️', label: 'Wishlist' },
          { emoji: '📦', label: 'Orders' },
          { emoji: '💳', label: 'Rewards' },
        ],
        navTabs: [
          { emoji: '🏠', label: 'Home', active: true },
          { emoji: '🛍️', label: 'Shop' },
          { emoji: '🛒', label: 'Cart' },
          { emoji: '👤', label: 'Account' },
        ],
        heroCtaText: 'Shop Now',
        featuredTitle: 'New Arrivals',
        featuredAction: 'See all',
        showCart: true,
        showSearch: true,
      };
    case 'fitness':
      return {
        quickActions: [
          { emoji: '📅', label: 'Schedule' },
          { emoji: '👥', label: 'Trainers' },
          { emoji: '📊', label: 'Progress' },
          { emoji: '🏋️', label: 'Workouts' },
        ],
        navTabs: [
          { emoji: '🏠', label: 'Home', active: true },
          { emoji: '📅', label: 'Classes' },
          { emoji: '📊', label: 'Progress' },
          { emoji: '👤', label: 'Profile' },
        ],
        heroCtaText: 'Book a Class',
        featuredTitle: "Today's Classes",
        featuredAction: 'View all',
        showCart: false,
        showSearch: false,
      };
    case 'entertainment':
      return {
        quickActions: [
          { emoji: '▶️', label: 'Continue' },
          { emoji: '🔥', label: 'Trending' },
          { emoji: '⭐', label: 'Saved' },
          { emoji: '🆕', label: 'New' },
        ],
        navTabs: [
          { emoji: '🏠', label: 'Home', active: true },
          { emoji: '🔍', label: 'Discover' },
          { emoji: '⭐', label: 'Saved' },
          { emoji: '👤', label: 'Profile' },
        ],
        heroCtaText: 'Watch Now',
        featuredTitle: 'Trending Now',
        featuredAction: 'See all',
        showCart: false,
        showSearch: true,
      };
    case 'community':
      return {
        quickActions: [
          { emoji: '📰', label: 'Feed' },
          { emoji: '📅', label: 'Events' },
          { emoji: '👥', label: 'Members' },
          { emoji: '💬', label: 'Chat' },
        ],
        navTabs: [
          { emoji: '🏠', label: 'Home', active: true },
          { emoji: '📰', label: 'Feed' },
          { emoji: '📅', label: 'Events' },
          { emoji: '👤', label: 'Profile' },
        ],
        heroCtaText: 'Join Now',
        featuredTitle: 'Upcoming Events',
        featuredAction: 'See all',
        showCart: false,
        showSearch: false,
      };
    case 'services':
      return {
        quickActions: [
          { emoji: '💼', label: 'Services' },
          { emoji: '📅', label: 'Book' },
          { emoji: '💰', label: 'Pricing' },
          { emoji: '⭐', label: 'Reviews' },
        ],
        navTabs: [
          { emoji: '🏠', label: 'Home', active: true },
          { emoji: '📅', label: 'Book' },
          { emoji: '💼', label: 'Gallery' },
          { emoji: '📞', label: 'Contact' },
        ],
        heroCtaText: 'Book Now',
        featuredTitle: 'Our Services',
        featuredAction: 'View all',
        showCart: false,
        showSearch: false,
      };
    default:
      return {
        quickActions: [
          { emoji: '🌟', label: 'Featured' },
          { emoji: '🔍', label: 'Explore' },
          { emoji: '💬', label: 'Chat' },
          { emoji: '👤', label: 'Account' },
        ],
        navTabs: [
          { emoji: '🏠', label: 'Home', active: true },
          { emoji: '🔍', label: 'Explore' },
          { emoji: '❤️', label: 'Saved' },
          { emoji: '👤', label: 'Profile' },
        ],
        heroCtaText: 'Get Started',
        featuredTitle: 'Featured',
        featuredAction: 'See all',
        showCart: false,
        showSearch: true,
      };
  }
}

// ── Placeholder products for skeleton state ───────────────────────────────────

const PLACEHOLDER_PRODUCTS: CardItem[] = [
  { name: 'Featured Item', subtitle: 'Most popular', price: '$12.00', badge: '🔥 Hot' },
  { name: 'Special Pick', subtitle: 'Limited time', price: '$9.50' },
  { name: 'New Arrival', subtitle: 'Just added', price: '$15.00', badge: 'New' },
];

// ── AppPreview main component ─────────────────────────────────────────────────

interface AppPreviewProps {
  spec: MerchantAppSpec;
}

export function AppPreview({ spec }: AppPreviewProps) {
  const primaryColor = spec.primaryColor || '#7C3AED';
  const uiStyle: UIStyle = spec.uiStyle || 'glass';
  const appName = spec.businessName || 'Your App';
  const category = useMemo(() => getBizCategory(spec), [spec]);
  const config = useMemo(() => getBizConfig(category), [category]);

  // Build product cards from spec.products or use placeholders
  const productCards: CardItem[] = useMemo(() => {
    if (spec.products && spec.products.length > 0) {
      return spec.products.slice(0, 4).map(p => ({
        name: p.name,
        subtitle: p.description,
        price: p.price !== undefined
          ? `${p.currency ?? '$'}${p.price.toFixed(2)}`
          : undefined,
        imageUrl: p.imageUrl,
      }));
    }
    return PLACEHOLDER_PRODUCTS;
  }, [spec.products]);

  // Hero tagline from mood/audience
  const tagline = spec.audienceDescription
    ? `Made for ${spec.audienceDescription.slice(0, 60)}`
    : spec.mood
    ? `${spec.mood.charAt(0).toUpperCase() + spec.mood.slice(1)} experience for everyone`
    : 'Your community, your way';

  const bannerUrl = spec.scrapedData?.photos?.[0];
  const hasData = !!(spec.businessType || spec.businessName || spec.primaryColor);

  // App background color per uiStyle
  const appBg = uiStyle === 'neumorphic'
    ? '#eef0f3'
    : uiStyle === 'glass'
    ? `linear-gradient(180deg, ${rgba(primaryColor, 0.06)} 0%, #f9fafb 40%)`
    : '#f9fafb';

  return (
    <div
      className="relative w-full h-full min-h-full"
      style={{ background: appBg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      <AnimatePresence>
        {/* ── Header ──────────────────────────────── */}
        <Section key="header" delay={0}>
          <AppHeader
            appName={appName}
            primaryColor={primaryColor}
            uiStyle={uiStyle}
            showCart={config.showCart}
            showSearch={config.showSearch}
          />
        </Section>

        {/* ── Hero ────────────────────────────────── */}
        <Section key="hero" delay={0.05}>
          <HeroSection
            title={appName}
            tagline={tagline}
            ctaText={config.heroCtaText}
            bannerUrl={bannerUrl}
            primaryColor={primaryColor}
            uiStyle={uiStyle}
          />
        </Section>

        {/* ── Quick actions ────────────────────────── */}
        <Section key="actions" delay={0.1}>
          <QuickActions
            actions={config.quickActions}
            primaryColor={primaryColor}
            uiStyle={uiStyle}
          />
        </Section>

        {/* ── Featured products / content ──────────── */}
        <Section key="featured" delay={0.15}>
          <SectionHeading
            title={config.featuredTitle}
            actionLabel={config.featuredAction}
            primaryColor={primaryColor}
          />
          <div className="grid grid-cols-2 gap-3 px-4 pb-2">
            {!hasData
              ? [0, 1, 2, 3].map(i => (
                  <div key={i} className="rounded-2xl overflow-hidden">
                    <Skeleton w="w-full" h="h-24" rounded="rounded-t-2xl rounded-b-none" />
                    <div className="p-3 bg-white rounded-b-2xl space-y-1.5">
                      <Skeleton w="w-3/4" h="h-3" />
                      <Skeleton w="w-1/2" h="h-2.5" />
                    </div>
                  </div>
                ))
              : productCards.map((item, i) => (
                  <motion.div
                    key={item.name + i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.07, duration: 0.35 }}
                  >
                    <ProductCard item={item} primaryColor={primaryColor} uiStyle={uiStyle} />
                  </motion.div>
                ))
            }
          </div>
        </Section>

        {/* ── Categories row (food/retail) ─────────── */}
        {(category === 'food' || category === 'retail') && (
          <Section key="categories" delay={0.2}>
            <SectionHeading title="Browse Categories" primaryColor={primaryColor} />
            <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-none">
              {(category === 'food'
                ? ['🍣 Starters', '🍖 Mains', '🍰 Desserts', '🥤 Drinks']
                : ['👗 Tops', '👖 Bottoms', '👟 Shoes', '👜 Bags']
              ).map((cat, i) => {
                const cardStyle = getCardStyle(uiStyle, primaryColor, i === 0);
                return (
                  <div
                    key={cat}
                    className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-medium whitespace-nowrap cursor-pointer ${cardStyle.className ?? ''}`}
                    style={{
                      ...cardStyle.style,
                      color: i === 0 ? (uiStyle === 'outlined' ? primaryColor : '#fff') : '#444',
                    }}
                  >
                    {cat}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Promo banner ─────────────────────────── */}
        <Section key="promo" delay={0.25}>
          <div className="mx-4 mb-4 rounded-2xl overflow-hidden relative" style={{ height: 80 }}>
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${darken(primaryColor, 0.2)} 0%, ${primaryColor} 100%)`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-4">
              <div>
                <p className="text-white text-[13px] font-bold">Special Offer 🎉</p>
                <p className="text-white/75 text-[11px]">Get 20% off your first order</p>
              </div>
              <button className="px-4 py-1.5 bg-white rounded-full text-[11px] font-bold" style={{ color: primaryColor }}>
                Claim
              </button>
            </div>
          </div>
        </Section>
      </AnimatePresence>

      {/* ── Bottom nav ─────────────────────────────── */}
      <BottomNav tabs={config.navTabs} primaryColor={primaryColor} uiStyle={uiStyle} />
    </div>
  );
}
