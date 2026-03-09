'use client';

import { useState, useEffect } from 'react';

// ── Place Confirmation Card (Google Maps) ────────────────────────
interface PlaceConfirmCardProps {
  name: string;
  address?: string;
  rating?: string;
  imageUrl?: string;
  category?: string;
  onConfirm: () => void;
  onReject: () => void;
}

export function PlaceConfirmCard({
  name, address, rating, imageUrl, category, onConfirm, onReject,
}: PlaceConfirmCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden max-w-xs animate-in slide-in-from-bottom-2 duration-300"
      style={{
        background: 'var(--oc-bubble-bg)',
        border: '1px solid var(--oc-bubble-border)',
      }}
    >
      {/* Place photo */}
      {imageUrl && (
        <div className="relative w-full aspect-video bg-black/20 overflow-hidden">
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(16,244,139,0.3)', borderTopColor: 'transparent' }} />
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={name}
            className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgLoaded(true)}
          />
          {/* Category badge */}
          {category && (
            <span
              className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm"
              style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
            >
              {category}
            </span>
          )}
        </div>
      )}

      {/* Place details */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--oc-text)' }}>{name}</h3>
            {address && (
              <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--oc-text-muted)' }}>
                📍 {address}
              </p>
            )}
          </div>
          {rating && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-lg shrink-0"
              style={{ background: 'rgba(16,244,139,0.1)' }}
            >
              <span className="text-xs">⭐</span>
              <span className="text-xs font-bold" style={{ color: '#10F48B' }}>{rating}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
            style={{ background: '#10F48B', color: '#050314' }}
          >
            ✅ That&apos;s me!
          </button>
          <button
            onClick={onReject}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
            style={{
              background: 'var(--oc-btn-bg)',
              color: 'var(--oc-text-muted)',
              border: '1px solid var(--oc-btn-border)',
            }}
          >
            Wrong place
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Brand Profile Card (scraped data summary) ───────────────────
interface BrandProfileCardProps {
  name: string;
  bio?: string;
  vibe?: string;
  products?: string[];
  category?: string;
  imageUrl?: string;
  rating?: string;
  onConfirm: () => void;
  onTweak: () => void;
  onStartFresh: () => void;
}

export function BrandProfileCard({
  name, bio, vibe, products, category, imageUrl, rating,
  onConfirm, onTweak, onStartFresh,
}: BrandProfileCardProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden max-w-xs animate-in slide-in-from-bottom-2 duration-300"
      style={{
        background: 'var(--oc-bubble-bg)',
        border: '1px solid var(--oc-bubble-border)',
      }}
    >
      {/* Header with image */}
      <div className="relative px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          {imageUrl && (
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border" style={{ borderColor: 'var(--oc-bubble-border)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold truncate" style={{ color: 'var(--oc-text)' }}>{name}</h3>
            {category && (
              <span
                className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: 'rgba(16,244,139,0.1)', color: '#10F48B' }}
              >
                {category}
              </span>
            )}
            {rating && (
              <span className="text-[11px] ml-1.5" style={{ color: 'var(--oc-text-muted)' }}>⭐ {rating}</span>
            )}
          </div>
        </div>
      </div>

      {/* Extracted data */}
      <div className="px-4 pb-3 space-y-2">
        {bio && (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--oc-text-muted)' }}>
            &ldquo;{bio}&rdquo;
          </p>
        )}

        {vibe && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--oc-text-muted)' }}>Vibe</span>
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{ background: 'rgba(16,244,139,0.08)', color: '#10F48B', border: '1px solid rgba(16,244,139,0.15)' }}
            >
              {vibe}
            </span>
          </div>
        )}

        {products && products.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--oc-text-muted)' }}>Offerings</span>
            <div className="flex flex-wrap gap-1">
              {products.slice(0, 5).map((p, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full text-[11px]"
                  style={{
                    background: 'var(--oc-btn-bg)',
                    color: 'var(--oc-text)',
                    border: '1px solid var(--oc-btn-border)',
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div
        className="px-4 py-3 flex flex-col gap-2"
        style={{ borderTop: '1px solid var(--oc-bubble-border)' }}
      >
        <button
          onClick={onConfirm}
          className="w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
          style={{ background: '#10F48B', color: '#050314' }}
        >
          ✨ Looks perfect!
        </button>
        <div className="flex gap-2">
          <button
            onClick={onTweak}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
            style={{ background: 'var(--oc-btn-bg)', color: 'var(--oc-text)', border: '1px solid var(--oc-btn-border)' }}
          >
            ✏️ Tweak
          </button>
          <button
            onClick={onStartFresh}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
            style={{ background: 'var(--oc-btn-bg)', color: 'var(--oc-text-muted)', border: '1px solid var(--oc-btn-border)' }}
          >
            🔄 Start fresh
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Scraping / Analysis Indicator ──────────────────────────────
interface ScrapingIndicatorProps {
  url: string;
  stage: 'fetching' | 'analyzing' | 'extracting' | 'done';
}

const SCRAPE_STAGES = [
  { key: 'fetching', label: 'Visiting your page...', icon: '🌐' },
  { key: 'analyzing', label: 'Reading content with AI...', icon: '🧠' },
  { key: 'extracting', label: 'Extracting brand details...', icon: '✨' },
  { key: 'done', label: 'Got it!', icon: '✅' },
];

export function ScrapingIndicator({ url, stage }: ScrapingIndicatorProps) {
  const stageIdx = SCRAPE_STAGES.findIndex(s => s.key === stage);

  // Clean up URL for display
  const displayUrl = url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').slice(0, 35);

  return (
    <div
      className="rounded-2xl overflow-hidden max-w-xs animate-in slide-in-from-bottom-2 duration-300"
      style={{
        background: 'var(--oc-bubble-bg)',
        border: '1px solid var(--oc-bubble-border)',
      }}
    >
      <div className="px-4 py-3 space-y-3">
        {/* URL being scraped */}
        <div className="flex items-center gap-2">
          <span className="text-xs">🔗</span>
          <span className="text-xs font-mono truncate" style={{ color: '#10F48B' }}>{displayUrl}</span>
        </div>

        {/* Progress steps */}
        <div className="space-y-1.5">
          {SCRAPE_STAGES.map((s, i) => {
            const isActive = i === stageIdx;
            const isDone = i < stageIdx;
            const isPending = i > stageIdx;

            return (
              <div
                key={s.key}
                className="flex items-center gap-2 transition-all duration-300"
                style={{ opacity: isPending ? 0.3 : 1 }}
              >
                <span className={`text-xs ${isActive ? 'animate-pulse' : ''}`}>
                  {isDone ? '✅' : s.icon}
                </span>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: isActive ? '#10F48B' : isDone ? 'var(--oc-text-muted)' : 'var(--oc-text-muted)' }}
                >
                  {s.label}
                </span>
                {isActive && (
                  <div className="w-3 h-3 border border-t-transparent rounded-full animate-spin ml-auto" style={{ borderColor: 'rgba(16,244,139,0.3)', borderTopColor: 'transparent' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--oc-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${((stageIdx + 1) / SCRAPE_STAGES.length) * 100}%`,
              background: 'linear-gradient(90deg, #10F48B, #0bd977)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── AI Creation Card (cover gen progress) ────────────────────────
interface AICreationCardProps {
  type: 'cover' | 'banner';
  businessName?: string;
  vibe?: string;
  style?: string;
}

const CREATION_STEPS = [
  'Understanding your brand...',
  'Composing the visual style...',
  'Generating with AI...',
  'Polishing details...',
];

export function AICreationCard({ type, businessName, vibe, style }: AICreationCardProps) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx(prev => (prev < CREATION_STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="rounded-2xl overflow-hidden max-w-xs animate-in slide-in-from-bottom-2 duration-300"
      style={{
        background: 'var(--oc-bubble-bg)',
        border: '1px solid rgba(16,244,139,0.2)',
      }}
    >
      {/* Animated gradient header */}
      <div
        className="h-24 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(16,244,139,0.15) 0%, rgba(11,217,119,0.05) 100%)',
        }}
      >
        {/* Animated particles */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: '#10F48B',
                opacity: 0.4,
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animation: `float ${2 + i * 0.3}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(16,244,139,0.15)',
              border: '1px solid rgba(16,244,139,0.25)',
              animation: 'pulse 2s infinite',
            }}
          >
            <span className="text-xl">🎨</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        <h4 className="text-xs font-bold" style={{ color: 'var(--oc-text)' }}>
          Creating your {type === 'cover' ? 'cover page' : 'banner'}
        </h4>

        {/* Context tags */}
        <div className="flex flex-wrap gap-1">
          {businessName && (
            <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: 'rgba(16,244,139,0.08)', color: '#10F48B' }}>
              {businessName}
            </span>
          )}
          {vibe && (
            <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: 'rgba(16,244,139,0.08)', color: '#10F48B' }}>
              {vibe}
            </span>
          )}
          {style && (
            <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: 'rgba(16,244,139,0.08)', color: '#10F48B' }}>
              {style}
            </span>
          )}
        </div>

        {/* Animated step text */}
        <p
          className="text-[11px] transition-all duration-500"
          style={{ color: 'var(--oc-text-muted)' }}
          key={stepIdx}
        >
          ✨ {CREATION_STEPS[stepIdx]}
        </p>

        {/* Progress bar */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--oc-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${((stepIdx + 1) / CREATION_STEPS.length) * 100}%`,
              background: 'linear-gradient(90deg, #10F48B, #0bd977)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Vibe Selector Cards (visual) ─────────────────────────────────
interface VibeSelectorProps {
  vibes: { name: string; emoji: string; gradient: string }[];
  onSelect: (vibe: string) => void;
}

const VIBE_PRESETS: Record<string, { emoji: string; gradient: string }> = {
  'Cozy & Warm': { emoji: '🕯️', gradient: 'linear-gradient(135deg, #F59E0B20, #D9770610)' },
  'Bold & Energetic': { emoji: '⚡', gradient: 'linear-gradient(135deg, #EF444420, #DC262610)' },
  'Classy & Elegant': { emoji: '🥂', gradient: 'linear-gradient(135deg, #A855F720, #7C3AED10)' },
  'Playful & Fun': { emoji: '🎪', gradient: 'linear-gradient(135deg, #EC489920, #DB277710)' },
  'Clean & Modern': { emoji: '◻️', gradient: 'linear-gradient(135deg, #3B82F620, #2563EB10)' },
  'Earthy & Natural': { emoji: '🌿', gradient: 'linear-gradient(135deg, #10B98120, #05966910)' },
};

export function VibeSelector({ vibes, onSelect }: VibeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 max-w-xs">
      {vibes.map(({ name, emoji, gradient }) => (
        <button
          key={name}
          onClick={() => onSelect(name)}
          className="flex items-center gap-2 px-3 py-3 rounded-xl transition-all duration-150 active:scale-95 hover:scale-[1.02] text-left"
          style={{
            background: gradient,
            border: '1px solid var(--oc-bubble-border)',
          }}
        >
          <span className="text-xl">{emoji}</span>
          <span className="text-xs font-medium" style={{ color: 'var(--oc-text)' }}>{name}</span>
        </button>
      ))}
    </div>
  );
}

export { VIBE_PRESETS };
