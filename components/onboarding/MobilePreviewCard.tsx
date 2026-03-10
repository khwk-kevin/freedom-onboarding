'use client';

import { useState } from 'react';

interface MobilePreviewCardProps {
  businessName?: string;
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  isGeneratingLogo?: boolean;
  isGeneratingBanner?: boolean;
  isDark: boolean;
}

export function MobilePreviewCard({
  businessName,
  logoUrl,
  bannerUrl,
  primaryColor = '#10F48B',
  isGeneratingLogo = false,
  isGeneratingBanner = false,
  isDark,
}: MobilePreviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded to showcase

  const isGenerating = isGeneratingLogo || isGeneratingBanner;
  const hasCover = Boolean(bannerUrl);

  return (
    <div
      className="mx-3 mt-2 mb-1 rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: isDark ? 'rgba(255,255,255,0.04)' : '#F3F4F6',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'}`,
      }}
    >
      {/* Tappable header */}
      <div
        className="flex items-center gap-3 px-3 py-2 cursor-pointer select-none"
        onClick={() => setIsExpanded(v => !v)}
      >
        {/* Status dot + label */}
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            background: isGenerating ? '#F59E0B' : hasCover ? primaryColor : primaryColor,
            animation: isGenerating ? 'pulse 1.5s infinite' : 'none',
          }}
        />
        <span
          className="text-xs font-medium flex-1"
          style={{ color: isDark ? '#F4F4FC' : '#111827' }}
        >
          {isGenerating
            ? '✨ Generating your cover page...'
            : hasCover
              ? `${businessName || 'Your Community'} — Cover Ready!`
              : `${businessName || 'Your Community'}`}
        </span>
        <span
          className="text-[10px] transition-transform duration-300"
          style={{
            color: isDark ? 'rgba(244,244,252,0.4)' : '#9CA3AF',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </div>

      {/* Cover page showcase — the hero */}
      <div
        className="overflow-hidden transition-all duration-500 ease-out"
        style={{
          maxHeight: isExpanded ? '300px' : '0px',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        {/* Cover image area */}
        <div
          className="mx-3 mb-3 rounded-xl overflow-hidden relative"
          style={{
            aspectRatio: '1440/690',
            background: hasCover
              ? 'transparent'
              : `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}10)`,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB'}`,
          }}
        >
          {isGenerating ? (
            /* Generating animation */
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div
                className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: `${primaryColor}40`, borderTopColor: 'transparent' }}
              />
              <span className="text-xs font-medium" style={{ color: primaryColor }}>
                Creating your cover...
              </span>
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}40, transparent 60%)`,
                  animation: 'pulse 2s infinite',
                }}
              />
            </div>
          ) : hasCover ? (
            /* Generated cover */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerUrl}
              alt="Community cover"
              className="w-full h-full object-cover"
            />
          ) : (
            /* Placeholder */
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <span className="text-3xl opacity-30">🎨</span>
              )}
              <span
                className="text-[11px] font-medium"
                style={{ color: isDark ? 'rgba(244,244,252,0.3)' : '#9CA3AF' }}
              >
                Cover page will appear here
              </span>
            </div>
          )}
        </div>

        {/* Business name bar */}
        <div
          className="mx-3 mb-3 px-3 py-2 rounded-lg flex items-center gap-2"
          style={{
            background: isDark ? 'rgba(255,255,255,0.03)' : '#FAFAFA',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6'}`,
          }}
        >
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ background: primaryColor }}
          />
          <span
            className="text-xs font-semibold truncate"
            style={{ color: isDark ? '#F4F4FC' : '#111827' }}
          >
            {businessName || 'Your Community'}
          </span>
          <span
            className="text-[10px] font-mono ml-auto shrink-0"
            style={{ color: isDark ? 'rgba(244,244,252,0.3)' : '#9CA3AF' }}
          >
            {primaryColor}
          </span>
        </div>
      </div>
    </div>
  );
}
