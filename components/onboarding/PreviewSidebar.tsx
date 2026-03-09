'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { CommunityData } from '@/types/onboarding';
import { DEFAULT_PRIMARY_COLORS } from '@/types/onboarding';
import { getTemplateById } from '@/lib/onboarding/templates';

interface PreviewSidebarProps {
  communityData: Partial<CommunityData> & { businessType?: string; vibe?: string; brandStyle?: string; scrapedImages?: string[] };
  onUpdate: (data: Partial<CommunityData>) => void;
  onGenerateImage?: (type: 'logo' | 'banner') => Promise<void>;
  isGeneratingLogo?: boolean;
  isGeneratingBanner?: boolean;
  isAnonymous?: boolean;
  isDark?: boolean;
}

export function PreviewSidebar({
  communityData,
  onUpdate,
  onGenerateImage,
  isGeneratingLogo,
  isGeneratingBanner,
  isAnonymous = false,
  isDark = true,
}: PreviewSidebarProps) {
  const template = communityData.businessType ? getTemplateById(communityData.businessType) : null;
  const displayName = communityData.name || template?.sampleName || 'Your Community';
  const displayDesc = communityData.description || template?.sampleDescription || '';
  const primaryColor = communityData.primaryColor || template?.primaryColor || '#10F48B';
  const hasBanner = Boolean(communityData.banner);
  const hasLogo = Boolean(communityData.logo);

  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);
  const [customColor, setCustomColor] = useState<string | null>(null);

  const handleFileUpload = (type: 'logo' | 'banner') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onUpdate({ [type]: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  // Theme
  const bg = isDark ? '#0D0B1E' : '#EEF2F6';
  const border = isDark ? 'rgba(255,255,255,0.08)' : '#D6DCE4';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)';
  const text = isDark ? '#F4F4FC' : '#111827';
  const textMuted = isDark ? 'rgba(244,244,252,0.5)' : '#5B6578';
  const labelColor = isDark ? 'rgba(244,244,252,0.35)' : '#7C879A';

  return (
    <section
      className="w-[420px] h-full flex flex-col border-l overflow-hidden"
      style={{ background: bg, borderColor: border }}
    >
      {/* Header */}
      <div
        className="h-16 px-5 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: border }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10F48B' }} />
          <span className="text-sm font-semibold" style={{ color: text }}>Live Preview</span>
        </div>
        {isAnonymous && (
          <span
            className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider"
            style={{ background: 'rgba(16,244,139,0.1)', color: '#10F48B' }}
          >
            PREVIEW
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* ── Cover Page Preview ─────────────────────────────── */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: labelColor }}>
            Cover Page
          </label>
          <div
            className="rounded-xl overflow-hidden relative group cursor-pointer"
            style={{
              aspectRatio: '1440/690',
              background: hasBanner ? 'transparent' : `linear-gradient(135deg, ${primaryColor}25, ${primaryColor}08)`,
              border: `1px solid ${border}`,
            }}
            onClick={() => hasBanner ? setBannerModalOpen(true) : bannerInputRef.current?.click()}
          >
            {isGeneratingBanner ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div
                  className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: `${primaryColor}40`, borderTopColor: 'transparent' }}
                />
                <span className="text-[11px] font-medium" style={{ color: primaryColor }}>
                  Creating cover...
                </span>
              </div>
            ) : hasBanner ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={communityData.banner} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                  <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to enlarge
                  </span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <span className="text-2xl opacity-30">🎨</span>
                <span className="text-[11px]" style={{ color: textMuted }}>
                  Cover will generate automatically
                </span>
              </div>
            )}
            {/* Upload + Remove buttons */}
            {!isGeneratingBanner && (
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); bannerInputRef.current?.click(); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                  title="Upload cover"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </button>
                {hasBanner && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdate({ banner: undefined }); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.7)', color: '#fff' }}
                    title="Remove cover"
                  >
                    <span className="text-xs font-bold">✕</span>
                  </button>
                )}
              </div>
            )}
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload('banner')} />
          </div>
        </div>

        {/* ── Logo / Brand Upload ─────────────────────────────── */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: labelColor }}>
            Your Logo
          </label>
          <div
            className="rounded-xl overflow-hidden relative group"
            style={{ background: cardBg, border: `1px solid ${border}` }}
          >
            {hasLogo ? (
              <div className="flex items-center gap-3 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={communityData.logo}
                  alt="Logo"
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                  style={{ border: `1px solid ${border}` }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: text }}>Logo uploaded ✓</p>
                  <p className="text-[10px] mt-0.5" style={{ color: textMuted }}>Used for cover page generation</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all hover:scale-105"
                    style={{ background: `${primaryColor}15`, color: primaryColor, border: `1px solid ${primaryColor}25` }}
                  >
                    Replace
                  </button>
                  <button
                    onClick={() => onUpdate({ logo: undefined })}
                    className="px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all hover:scale-105"
                    style={{ background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
                    title="Remove logo"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="p-5 flex flex-col items-center gap-2 cursor-pointer transition-all hover:opacity-80"
                onClick={() => logoInputRef.current?.click()}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${primaryColor}10`, border: `2px dashed ${primaryColor}30` }}
                >
                  <svg className="w-5 h-5" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium" style={{ color: text }}>Upload your logo</p>
                  <p className="text-[10px] mt-0.5" style={{ color: textMuted }}>
                    Helps AVA create a better cover page
                  </p>
                </div>
              </div>
            )}
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload('logo')} />
          </div>
        </div>

        {/* ── Brand Identity ─────────────────────────────────── */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider mb-3 block" style={{ color: labelColor }}>
            Brand Identity
          </label>
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: cardBg, border: `1px solid ${border}` }}
          >
            {/* Logo + Name row */}
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div
                className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center cursor-pointer group relative"
                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6', border: `1px solid ${border}` }}
                onClick={() => logoInputRef.current?.click()}
              >
                {hasLogo ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={communityData.logo} alt="Logo" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <svg className="w-3 h-3 text-white opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <svg className="w-5 h-5" style={{ color: textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload('logo')} />
              </div>

              {/* Name + Category */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold truncate" style={{ color: text }}>{displayName}</h3>
                {communityData.businessType && (
                  <span className="text-[11px] capitalize" style={{ color: textMuted }}>
                    {template?.name || communityData.businessType}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {displayDesc && (
              <p className="text-xs leading-relaxed" style={{ color: textMuted }}>{displayDesc}</p>
            )}

            {/* Tags row — vibe + style */}
            {(communityData.vibe || communityData.brandStyle) && (
              <div className="flex flex-wrap gap-1.5">
                {communityData.vibe && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ background: `${primaryColor}15`, color: primaryColor, border: `1px solid ${primaryColor}25` }}
                  >
                    {communityData.vibe}
                  </span>
                )}
                {communityData.brandStyle && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ background: `${primaryColor}15`, color: primaryColor, border: `1px solid ${primaryColor}25` }}
                  >
                    {communityData.brandStyle}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Business Photos (from Google Maps) ──────────────── */}
        {communityData.scrapedImages && communityData.scrapedImages.length > 0 && (
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: labelColor }}>
              Business Photos
            </label>
            <div
              className="rounded-xl p-3 space-y-2"
              style={{ background: cardBg, border: `1px solid ${border}` }}
            >
              <div className="grid grid-cols-2 gap-2">
                {communityData.scrapedImages.slice(0, 4).map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-lg overflow-hidden cursor-pointer group"
                    style={{ aspectRatio: '4/3' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt={`Business photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Click to use as logo or cover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onUpdate({ logo: imgUrl })}
                        className="px-2 py-1 rounded text-[9px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(0,0,0,0.6)' }}
                        title="Use as logo"
                      >
                        Logo
                      </button>
                      <button
                        onClick={() => onUpdate({ banner: imgUrl })}
                        className="px-2 py-1 rounded text-[9px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(0,0,0,0.6)' }}
                        title="Use as cover"
                      >
                        Cover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-center" style={{ color: textMuted }}>
                📍 From Google Maps · Hover to use as logo or cover
              </p>
            </div>
          </div>
        )}

        {/* ── Primary Color ──────────────────────────────────── */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: labelColor }}>
            Primary Color
          </label>
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: cardBg, border: `1px solid ${border}` }}
          >
            {/* Selected color swatch */}
            <div
              className="w-8 h-8 rounded-lg shrink-0 shadow-sm"
              style={{
                background: primaryColor,
                border: primaryColor.toLowerCase() === '#ffffff' ? '1px solid #d1d5db' : 'none',
              }}
            />
            <span className="text-xs font-mono" style={{ color: textMuted }}>{primaryColor}</span>

            <div className="flex-1" />

            {/* Color palette */}
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {customColor && (
                <button
                  onClick={() => onUpdate({ primaryColor: customColor })}
                  className={`w-5 h-5 rounded-md transition-transform hover:scale-110 ${communityData.primaryColor === customColor ? 'ring-2 ring-offset-1 ring-green-400' : ''}`}
                  style={{ background: customColor }}
                />
              )}
              {DEFAULT_PRIMARY_COLORS.slice(0, 6).map((c) => (
                <button
                  key={c.hex}
                  onClick={() => onUpdate({ primaryColor: c.hex })}
                  className={`w-5 h-5 rounded-md transition-transform hover:scale-110 ${communityData.primaryColor === c.hex ? 'ring-2 ring-offset-1 ring-green-400' : ''}`}
                  style={{
                    background: c.hex,
                    border: c.hex.toLowerCase() === '#ffffff' ? '1px solid #d1d5db' : 'none',
                  }}
                  title={c.name}
                />
              ))}
              {/* Custom color picker */}
              <div className="relative">
                <input
                  ref={colorPickerRef}
                  type="color"
                  value={primaryColor}
                  onChange={(e) => { setCustomColor(e.target.value); onUpdate({ primaryColor: e.target.value }); }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <button
                  onClick={() => colorPickerRef.current?.click()}
                  className="w-5 h-5 rounded-md flex items-center justify-center"
                  style={{
                    background: 'conic-gradient(from 0deg, #ef4444, #eab308, #22c55e, #3b82f6, #a855f7, #ef4444)',
                  }}
                  title="Custom"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Status ─────────────────────────────────────────── */}
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: cardBg, border: `1px solid ${border}` }}
        >
          <p className="text-xs" style={{ color: textMuted }}>
            {hasBanner
              ? '✅ Cover page ready — continue chatting to refine'
              : isGeneratingBanner
                ? '✨ Generating your cover page...'
                : '💬 Continue the conversation to build your community'
            }
          </p>
        </div>
      </div>

      {/* Banner Modal */}
      {bannerModalOpen && communityData.banner && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setBannerModalOpen(false)}
          >
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={communityData.banner}
                alt="Cover enlarged"
                className="max-w-[90vw] max-h-[80vh] rounded-2xl shadow-2xl object-contain"
              />
              <button
                onClick={() => setBannerModalOpen(false)}
                className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md text-gray-700 hover:text-gray-900"
              >
                ✕
              </button>
            </div>
          </div>,
          document.body
        )
      }
    </section>
  );
}
