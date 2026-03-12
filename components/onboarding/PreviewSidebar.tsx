'use client';

import { useRef, useEffect, useState } from 'react';
import {
  ShoppingCart,
  Calendar,
  MapPin,
  MessageCircle,
  Star,
  Trophy,
  User,
  Home,
  Camera,
  Truck,
  Gem,
  Zap,
  Users,
  ClipboardList,
  Target,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Award,
  Heart,
  Rocket,
} from 'lucide-react';
import type { CommunityData } from '@/types/onboarding';

interface PreviewSidebarProps {
  communityData: Partial<CommunityData> & {
    businessType?: string;
    vibe?: string;
    brandStyle?: string;
    scrapedImages?: string[];
    products?: string[];
    description?: string;
    audiencePersona?: string;
    heroFeature?: string;
    userFlow?: string;
    differentiator?: string;
    primaryActions?: string[];
    backgroundColor?: string;
    fontFamily?: string;
    brandColors?: string[];
  };
  onUpdate: (data: Partial<CommunityData>) => void;
  onGenerateImage?: (type: 'logo' | 'banner') => Promise<void>;
  isGeneratingLogo?: boolean;
  isGeneratingBanner?: boolean;
  isAnonymous?: boolean;
  isDark?: boolean;
}

/** Animated section wrapper — shows skeleton then reveals content */
function AnimatedSection({ visible, sectionKey, color, children }: {
  visible: boolean;
  sectionKey: string;
  color: string;
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<'hidden' | 'skeleton' | 'reveal'>('hidden');
  const prevVisible = useRef(visible);

  useEffect(() => {
    if (visible && !prevVisible.current) {
      // New section appearing — show skeleton first
      setPhase('skeleton');
      const timer = setTimeout(() => setPhase('reveal'), 400);
      prevVisible.current = visible;
      return () => clearTimeout(timer);
    } else if (visible && prevVisible.current) {
      // Already visible
      if (phase === 'hidden') setPhase('reveal');
    }
    prevVisible.current = visible;
  }, [visible, phase]);

  if (!visible || phase === 'hidden') return null;

  if (phase === 'skeleton') {
    return (
      <div className="mx-3 mb-3 p-3 rounded-xl shimmer-overlay" style={{ backgroundColor: `${color}08`, border: `1px solid ${color}15` }}>
        <div className="skeleton-line h-3 w-2/3 mb-2" />
        <div className="skeleton-line h-2 w-full mb-1.5" />
        <div className="skeleton-line h-2 w-4/5" />
      </div>
    );
  }

  return (
    <div className="slide-up-reveal section-highlight-dramatic" style={{ '--section-glow': `${color}44` } as React.CSSProperties}>
      {children}
    </div>
  );
}

/** Parse user flow text into discrete steps */
function parseFlowSteps(flow: string): string[] {
  // Try splitting on → arrows first
  if (flow.includes('→') || flow.includes('->')) {
    return flow.split(/→|->/).map(s => s.trim()).filter(Boolean);
  }
  // Try "then" splitting
  if (flow.toLowerCase().includes(' then ')) {
    return flow.split(/\bthen\b/i).map(s => s.trim()).filter(Boolean);
  }
  // Try numbered items
  const numbered = flow.match(/\d+[\.\)]\s*([^,\d]+)/g);
  if (numbered && numbered.length >= 2) {
    return numbered.map(s => s.replace(/^\d+[\.\)]\s*/, '').trim());
  }
  // Try comma-separated
  if (flow.includes(',')) {
    return flow.split(',').map(s => s.trim()).filter(Boolean);
  }
  // Fallback: return as single step
  return [flow];
}

/**
 * Live Preview Sidebar — shows the app being built in real-time.
 *
 * Starts empty. As the user answers questions, sections appear with animations.
 * Every element comes from user data — nothing is shown until the user provides it.
 * Background color comes from scraped brand data when available.
 */
// Helper: convert hex color to "r, g, b" string for use in rgba()
function hexToRgbComponents(hex: string): string {
  try {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  } catch {
    return '16, 244, 139';
  }
}

export function PreviewSidebar({ communityData }: PreviewSidebarProps) {
  const name = communityData.name;
  const color = communityData.primaryColor || '#10F48B';
  const vibe = communityData.vibe;
  const desc = communityData.description;
  const logo = communityData.logo;
  const banner = communityData.banner;
  const products = communityData.products;
  const type = communityData.businessType;
  const audience = communityData.audiencePersona;
  const images = communityData.scrapedImages;
  const heroFeature = communityData.heroFeature;
  const userFlow = communityData.userFlow;
  const differentiator = communityData.differentiator;
  const primaryActions = communityData.primaryActions;
  // Brand theming from scrape
  const scrapedBg = communityData.backgroundColor;
  const scrapedFont = communityData.fontFamily;

  // ── Highlight tracking ─────────────────────────────────────────────────────
  // Track which sections are currently highlighted
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const prevDataRef = useRef<typeof communityData>({});

  useEffect(() => {
    const prev = prevDataRef.current;
    const changed: string[] = [];

    // Check which fields changed — map field → section key
    const fieldToSection: Record<string, string> = {
      name: 'header',
      primaryColor: 'header',
      businessType: 'header',
      logo: 'header',
      description: 'hero',
      banner: 'hero',
      vibe: 'hero',
      primaryActions: 'actions',
      products: 'products',
      scrapedImages: 'gallery',
      heroFeature: 'heroFeature',
      userFlow: 'userFlow',
      differentiator: 'differentiator',
      audiencePersona: 'audience',
    };

    for (const [field, section] of Object.entries(fieldToSection)) {
      const key = field as keyof typeof communityData;
      const prevVal = prev[key];
      const currVal = communityData[key];

      // Detect changes (stringify arrays/objects for comparison)
      const prevStr = JSON.stringify(prevVal ?? null);
      const currStr = JSON.stringify(currVal ?? null);

      if (prevStr !== currStr && currVal !== undefined && currVal !== null) {
        if (!changed.includes(section)) changed.push(section);
      }
    }

    if (changed.length > 0) {
      setHighlighted(prev => {
        const next = new Set(prev);
        changed.forEach(s => next.add(s));
        return next;
      });

      // Remove highlights after 2s
      const timer = setTimeout(() => {
        setHighlighted(prev => {
          const next = new Set(prev);
          changed.forEach(s => next.delete(s));
          return next;
        });
      }, 2000);

      prevDataRef.current = { ...communityData };
      return () => clearTimeout(timer);
    }

    prevDataRef.current = { ...communityData };
  }, [
    communityData.name,
    communityData.primaryColor,
    communityData.businessType,
    communityData.logo,
    communityData.description,
    communityData.banner,
    communityData.vibe,
    communityData.primaryActions,
    communityData.products,
    communityData.scrapedImages,
    communityData.heroFeature,
    communityData.userFlow,
    communityData.differentiator,
    communityData.audiencePersona,
  ]);

  // ── Entrance + glow tracking (defined early, used below) ─────────────────

  // Helper: get inline style for a section that may be highlighted
  const rgb = hexToRgbComponents(color);
  const getHighlightStyle = (section: string): React.CSSProperties => {
    if (!highlighted.has(section)) return {};
    return {
      animation: 'sectionHighlight 2s ease-out',
      // Override the CSS variable approach with a real inline keyframe isn't possible,
      // so we add a data attribute and rely on the CSS animation + a custom prop trick.
      // Instead, we use a simpler approach: set boxShadow directly and animate via class.
    };
  };

  // Since CSS @keyframes can't use inline variables for rgba, we use a JS-driven
  // approach: apply the class AND set a CSS custom property on the element.
  const getHighlightProps = (section: string): { className?: string; style?: React.CSSProperties } => {
    if (!highlighted.has(section)) return {};
    return {
      className: 'section-highlight',
      style: {
        '--section-highlight-shadow-0': `0 0 0 0 rgba(${rgb}, 0.4)`,
        '--section-highlight-shadow-50': `0 0 20px 4px rgba(${rgb}, 0.3)`,
        '--section-highlight-shadow-100': `0 0 0 0 rgba(${rgb}, 0)`,
      } as React.CSSProperties,
    };
  };

  // Use scraped/vibe background if available, otherwise default dark theme
  // Default to light neutral bg (matches the onboarding page theme) until user picks a vibe/color
  const bg = scrapedBg || '#F8F9FA';
  const isLight = isLightColor(bg);
  const textColor = isLight ? '#1A1A1A' : '#FFFFFF';
  const textMuted = isLight ? '#666666' : '#8B8A9A';
  const cardBg = isLight
    ? adjustColor(bg, -12)   // slightly darker for light bg
    : (scrapedBg ? adjustColor(scrapedBg, 15) : '#0D0B1A');
  const cardBorder = isLight
    ? adjustColor(bg, -25)
    : (scrapedBg ? adjustColor(scrapedBg, 25) : '#1A1730');
  const fontFamilyStyle = scrapedFont
    ? `"${scrapedFont}", -apple-system, sans-serif`
    : 'inherit';

  const isFood = type === 'restaurant' || type === 'cafe';

  // Count filled fields for progress
  const fields = [name, desc, type, color !== '#10F48B' ? color : null, vibe, products?.length ? 'y' : null, audience, heroFeature, userFlow, differentiator];
  const filled = fields.filter(Boolean).length;
  const total = 10;
  const hasAnything = filled > 0;

  // ── Entrance + glow tracking ──────────────────────────────────────────────
  const [hasEnteredOnce, setHasEnteredOnce] = useState(false);
  const [phoneGlow, setPhoneGlow] = useState(false);
  const [liveDotFast, setLiveDotFast] = useState(false);

  useEffect(() => {
    if (hasAnything && !hasEnteredOnce) setHasEnteredOnce(true);
  }, [hasAnything, hasEnteredOnce]);

  useEffect(() => {
    if (highlighted.size > 0) {
      setPhoneGlow(true);
      setLiveDotFast(true);
      const t1 = setTimeout(() => setPhoneGlow(false), 1200);
      const t2 = setTimeout(() => setLiveDotFast(false), 1500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [highlighted]);

  // Map primary actions to Lucide icon components
  const actionIconMap: Record<string, { Icon: React.ElementType; label: string }> = {
    ordering: { Icon: ShoppingCart, label: 'Order' },
    booking: { Icon: Calendar, label: 'Book' },
    gallery: { Icon: Camera, label: 'Gallery' },
    loyalty: { Icon: Trophy, label: 'Rewards' },
    community: { Icon: Users, label: 'Community' },
    contact: { Icon: MapPin, label: 'Visit' },
    delivery: { Icon: Truck, label: 'Deliver' },
    messaging: { Icon: MessageCircle, label: 'Chat' },
    events: { Icon: Calendar, label: 'Events' },
    subscriptions: { Icon: Gem, label: 'Subscribe' },
  };

  const defaultActions = [
    { Icon: ShoppingCart, label: 'Order' },
    { Icon: Calendar, label: 'Book' },
    { Icon: MapPin, label: 'Visit' },
    { Icon: MessageCircle, label: 'Chat' },
  ];

  return (
    <aside
      className="w-full md:w-[440px] h-full border-l flex flex-col overflow-hidden"
      style={{ backgroundColor: bg, borderColor: cardBorder, fontFamily: fontFamilyStyle }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: cardBorder }}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${liveDotFast ? 'live-dot-fast' : 'animate-pulse'}`} style={{ backgroundColor: hasAnything ? color : '#555' }} />
          <span className="text-xs font-semibold" style={{ color: textColor }}>Live Preview</span>
          {hasAnything && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${color}22`, color }}>
              {filled}/{total}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ backgroundColor: cardBg, color: textMuted, border: `1px solid ${cardBorder}` }}>
          MOBILE
        </span>
      </div>

      {/* Phone frame */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Animated gradient border wrapper */}
        <div
          className={`gradient-border-phone mx-auto ${phoneGlow ? 'glow-pulse' : ''}`}
          style={{ maxWidth: '324px', '--glow-color': `${color}55` } as React.CSSProperties}
        >
        <div
          className={`rounded-[1.9rem] overflow-hidden ${hasEnteredOnce ? 'preview-entrance' : ''} ${hasAnything ? 'shimmer-overlay' : ''}`}
          style={{
            minHeight: '580px',
            backgroundColor: bg,
            boxShadow: hasAnything ? `0 0 40px ${color}15` : 'none',
            transition: 'box-shadow 0.5s ease',
          }}
        >
          {/* Status bar */}
          <div className="h-6 flex items-center justify-center">
            <div className="w-20 h-1 rounded-full" style={{ backgroundColor: cardBorder }} />
          </div>

          {!hasAnything ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                <Home size={28} style={{ color: textMuted }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: textColor }}>Your app will appear here</p>
              <p className="text-xs leading-relaxed" style={{ color: textMuted }}>
                Answer questions in the chat and watch your app build live
              </p>
            </div>
          ) : (
            /* Live app preview */
            <div className="px-0 pb-16">

              {/* App header — appears when name is set */}
              {name && (
                <div className="px-4 py-3 flex items-center gap-2.5 slide-up-reveal">
                  {logo ? (
                    <img src={logo} alt={name} className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: `linear-gradient(135deg, ${color}, ${color}88)`, color: bg }}>
                      {name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: textColor }}>{name}</p>
                    {type && <p className="text-[10px] capitalize" style={{ color: textMuted }}>{type}</p>}
                  </div>
                </div>
              )}

              {/* Hero — appears when description or banner is set */}
              {(desc || banner) && (
                <div className="relative mx-3 rounded-xl overflow-hidden mb-3 slide-up-reveal" style={{ minHeight: '120px' }}>
                  <div className="absolute inset-0" style={{
                    background: banner
                      ? `url(${banner}) center/cover`
                      : `linear-gradient(135deg, ${color}22 0%, ${bg} 100%)`
                  }} />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${bg} 0%, transparent 60%)` }} />
                  <div className="relative p-4 flex flex-col justify-end" style={{ minHeight: '120px' }}>
                    {vibe && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium mb-1.5 self-start" style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}33` }}>
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
                        {vibe}
                      </div>
                    )}
                    {name && <p className="text-base font-bold" style={{ color: textColor }}>{name}</p>}
                    {desc && <p className="text-[10px] mt-0.5 leading-relaxed line-clamp-2" style={{ color: `${textColor}B3` }}>{desc}</p>}
                  </div>
                </div>
              )}

              {/* Quick actions — use user's primary actions if available */}
              {(primaryActions?.length || type) && (
                <div className="grid grid-cols-4 gap-2 px-3 mb-3 slide-up-reveal">
                  {(primaryActions?.length
                    ? primaryActions.slice(0, 4).map(a => {
                        const mapped = actionIconMap[a];
                        return mapped || { Icon: Zap, label: a };
                      })
                    : defaultActions
                  ).map((a) => {
                    const { Icon, label } = a as { Icon: React.ElementType; label: string };
                    return (
                      <div key={label} className="flex flex-col items-center gap-1 py-2 rounded-lg" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                        <Icon size={16} style={{ color }} />
                        <span className="text-[8px] font-medium" style={{ color: textMuted }}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Products — appear as user lists them */}
              {products && products.length > 0 && (
                <div className="px-3 mb-3 slide-up-reveal">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold flex items-center gap-1" style={{ color: textColor }}>
                      {isFood
                        ? <><Star size={10} style={{ color }} /> Menu</>
                        : <><Star size={10} style={{ color }} /> Services</>
                      }
                    </p>
                    <span className="text-[9px]" style={{ color }}>{products.length} items</span>
                  </div>
                  <div className="space-y-1.5">
                    {products.slice(0, 5).map((product, i) => {
                      const [pName, price] = String(product).split(':');
                      return (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${color}15, ${color}08)` }}>
                            <Sparkles size={14} style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium truncate" style={{ color: textColor }}>{pName?.trim()}</p>
                          </div>
                          {price && (
                            <span className="text-[10px] font-bold shrink-0" style={{ color }}>
                              {/^\d/.test(price.trim()) ? `฿${price.trim()}` : price.trim()}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Gallery — from scraped images */}
              {images && images.length > 0 && (
                <div className="px-3 mb-3 slide-up-reveal">
                  <p className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: textColor }}>
                    <Camera size={10} style={{ color }} /> Gallery
                  </p>
                  <div className="flex gap-1.5 overflow-hidden">
                    {images.slice(0, 3).map((img, i) => (
                      <img key={i} src={img} alt="" className="w-20 h-20 rounded-lg object-cover" style={{ border: `1px solid ${cardBorder}` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ HERO FEATURE — Prominent CTA card ═══ */}
              <AnimatedSection visible={!!heroFeature} sectionKey="heroFeature" color={color}>
                <div className="mx-3 mb-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${color}33` }}>
                  {/* Gradient hero banner */}
                  <div className="p-4 pb-3" style={{ background: `linear-gradient(135deg, ${color}25, ${color}08 60%, transparent)` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}>
                        <Rocket size={16} style={{ color: bg }} />
                      </div>
                      <div>
                        <p className="text-[9px] font-medium uppercase tracking-wider" style={{ color }}>Core Feature</p>
                        <p className="text-xs font-bold leading-tight" style={{ color: textColor }}>{heroFeature}</p>
                      </div>
                    </div>
                    {/* CTA button mockup */}
                    <div
                      className="mt-2 py-2 px-4 rounded-lg text-center text-[11px] font-bold"
                      style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)`, color: bg }}
                    >
                      {heroFeature?.toLowerCase().includes('order') ? '🛒 Order Now' :
                       heroFeature?.toLowerCase().includes('book') ? '📅 Book Now' :
                       heroFeature?.toLowerCase().includes('browse') ? '🔍 Browse' :
                       heroFeature?.toLowerCase().includes('loyalty') ? '⭐ Join Rewards' :
                       '✨ Try It Now'}
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* ═══ USER FLOW — Visual step journey ═══ */}
              <AnimatedSection visible={!!userFlow} sectionKey="userFlow" color={color}>
                <div className="mx-3 mb-3 p-3 rounded-xl" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <RefreshCw size={12} style={{ color }} />
                    <p className="text-[10px] font-bold" style={{ color: textColor }}>Customer Journey</p>
                  </div>
                  {/* Step indicators */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {parseFlowSteps(userFlow || '').map((step, i, arr) => (
                      <div key={i} className="flex items-center gap-1 shrink-0" style={{ animation: `stepReveal 0.4s ${i * 0.15}s ease-out both` }}>
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold"
                            style={{ background: `linear-gradient(135deg, ${color}, ${color}88)`, color: bg }}
                          >
                            {i + 1}
                          </div>
                          <p className="text-[7px] font-medium text-center max-w-[52px] leading-tight" style={{ color: textMuted }}>{step}</p>
                        </div>
                        {i < arr.length - 1 && (
                          <ArrowRight size={10} className="shrink-0 mt-[-14px]" style={{ color: `${color}66` }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>

              {/* ═══ DIFFERENTIATOR — Hero banner ═══ */}
              <AnimatedSection visible={!!differentiator} sectionKey="differentiator" color={color}>
                <div className="mx-3 mb-3 rounded-xl overflow-hidden relative" style={{ border: `1px solid ${color}33` }}>
                  {/* Background gradient */}
                  <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color}20, ${color}05 50%, ${color}12)` }} />
                  {/* Sparkle decorations */}
                  <div className="absolute top-2 right-2 opacity-30">
                    <Sparkles size={24} style={{ color }} />
                  </div>
                  <div className="absolute bottom-2 left-2 opacity-20">
                    <Star size={16} style={{ color }} />
                  </div>
                  {/* Content */}
                  <div className="relative p-4 text-center">
                    <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}33, ${color}11)`, border: `2px solid ${color}44` }}>
                      <Award size={20} style={{ color }} />
                    </div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color }}>What Sets Us Apart</p>
                    <p className="text-[11px] font-bold leading-snug" style={{ color: textColor }}>{differentiator}</p>
                  </div>
                </div>
              </AnimatedSection>

              {/* ═══ AUDIENCE — Persona card ═══ */}
              <AnimatedSection visible={!!audience} sectionKey="audience" color={color}>
                <div className="mx-3 mb-3 p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                  <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}25, ${color}08)`, border: `1px solid ${color}33` }}>
                    <Heart size={18} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color }}>Built For</p>
                    <p className="text-[10px] leading-relaxed" style={{ color: textColor }}>{audience}</p>
                  </div>
                </div>
              </AnimatedSection>

              {/* Loyalty placeholder — appears when type is set */}
              {type && name && (
                <div className="mx-3 mb-3 p-3 rounded-lg slide-up-reveal" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}33, ${color}11)` }}>
                      <Star size={14} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold" style={{ color: textColor }}>0 / 100 pts</p>
                      <p className="text-[8px]" style={{ color: textMuted }}>Earn with every purchase</p>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${color}15` }}>
                    <div className="h-full rounded-full" style={{ width: '10%', backgroundColor: color }} />
                  </div>
                </div>
              )}

              {/* Bottom nav */}
              {name && (
                <div className="fixed-bottom mx-3 mt-2 flex items-center justify-around py-2 rounded-xl slide-up-reveal" style={{ backgroundColor: `${cardBg}ee`, border: `1px solid ${cardBorder}` }}>
                  {[
                    { Icon: Home, label: 'Home', active: true },
                    { Icon: ClipboardList, label: isFood ? 'Menu' : 'Browse', active: false },
                    { Icon: Trophy, label: 'Rewards', active: false },
                    { Icon: User, label: 'Profile', active: false },
                  ].map((tab) => (
                    <div key={tab.label} className="flex flex-col items-center gap-0.5 px-2">
                      <tab.Icon size={14} style={{ color: tab.active ? color : textMuted }} />
                      <span className="text-[7px] font-medium" style={{ color: tab.active ? color : textMuted }}>{tab.label}</span>
                      {tab.active && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {/* end gradient-border-phone wrapper */}
        </div>
      </div>

      {/* Footer status */}
      <div className="px-4 py-2.5 border-t text-center" style={{ borderColor: cardBorder }}>
        <p className="text-[10px]" style={{ color: textMuted }}>
          {!hasAnything && 'Start chatting to build your app'}
          {hasAnything && filled < 6 && `Building... ${filled}/${total} sections`}
          {filled >= 6 && filled < total && `Almost ready — ${filled}/${total} sections`}
          {filled >= total && '✨ Spec complete — ready to build!'}
        </p>
      </div>
    </aside>
  );
}

// Helper: determine if a hex color is light (luminance > 0.5)
function isLightColor(hex: string): boolean {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  } catch {
    return false;
  }
}

// Helper: lighten or darken a hex color by offset (positive = lighter)
function adjustColor(hex: string, offset: number): string {
  try {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    const clamp = (v: number) => Math.min(255, Math.max(0, v));
    return `#${[r, g, b].map(c => clamp(c + offset).toString(16).padStart(2, '0')).join('')}`;
  } catch {
    return hex;
  }
}
