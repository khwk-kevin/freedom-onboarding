'use client';

import { useState } from 'react';

interface MobilePreviewCardProps {
  businessName?: string;
  logoUrl?: string;
  primaryColor?: string;
  isGeneratingLogo?: boolean;
  isDark: boolean;
}

export function MobilePreviewCard({
  businessName,
  logoUrl,
  primaryColor = '#10F48B',
  isGeneratingLogo = false,
  isDark,
}: MobilePreviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#F3F4F6';
  const border = isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB';
  const text = isDark ? '#F4F4FC' : '#111827';
  const textMuted = isDark ? 'rgba(244,244,252,0.5)' : '#6B7280';
  const expandedBg = isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA';

  return (
    <div
      className="mx-3 mt-2 mb-1 rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: cardBg,
        border: `1px solid ${border}`,
      }}
    >
      {/* Compact View — always visible, tappable */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none"
        style={{ minHeight: '72px' }}
        onClick={() => setIsExpanded((v) => !v)}
      >
        {/* Logo or animated placeholder */}
        <div
          className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center overflow-hidden"
          style={{
            background: primaryColor + '18',
            border: `2px solid ${primaryColor}40`,
          }}
        >
          {isGeneratingLogo ? (
            <span
              className="text-xl animate-spin inline-block"
              style={{ color: primaryColor }}
            >
              ⟳
            </span>
          ) : logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl opacity-40">🏪</span>
          )}
        </div>

        {/* Business info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
              style={{ background: primaryColor }}
            />
            <span className="text-[10px] font-medium" style={{ color: primaryColor }}>
              {isGeneratingLogo ? 'Generating logo...' : 'Building your community'}
            </span>
          </div>
          <p className="text-sm font-semibold truncate" style={{ color: text }}>
            {businessName || 'Your Community'}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div
              className="w-3 h-3 rounded-full shrink-0 border border-white/20"
              style={{ background: primaryColor }}
            />
            <span className="text-[11px] font-mono truncate" style={{ color: textMuted }}>
              {primaryColor}
            </span>
          </div>
        </div>

        {/* Expand chevron */}
        <div
          className="shrink-0 text-[10px] transition-transform duration-300 px-1"
          style={{
            color: textMuted,
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </div>
      </div>

      {/* Expanded content — slides down */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: isExpanded ? '200px' : '0px',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div
          className="px-4 py-3 border-t"
          style={{ borderColor: border, background: expandedBg }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: textMuted }}>
            Brand Colour
          </p>
          <div
            className="w-full h-8 rounded-lg mb-3"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}66, ${primaryColor})`,
            }}
          />

          {isGeneratingLogo && (
            <div
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
              style={{
                background: primaryColor + '12',
                color: primaryColor,
                border: `1px solid ${primaryColor}28`,
              }}
            >
              <span className="animate-spin inline-block">⟳</span>
              Generating your unique logo — sit tight ✨
            </div>
          )}

          {!isGeneratingLogo && logoUrl && (
            <p className="text-xs" style={{ color: textMuted }}>
              ✓ Logo ready — tap to collapse and see the full preview on desktop
            </p>
          )}

          {!isGeneratingLogo && !logoUrl && (
            <p className="text-xs" style={{ color: textMuted }}>
              Your logo will appear here once generated ✨
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
