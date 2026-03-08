'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { CommunityData, CommunityCategory } from '@/types/onboarding';
import { ALLOWED_CATEGORIES, DEFAULT_PRIMARY_COLORS } from '@/types/onboarding';
import { ConfirmationPanel } from './ConfirmationPanel';
import { getTemplateById } from '@/lib/onboarding/templates';

interface PreviewSidebarProps {
  communityData: Partial<CommunityData> & { businessType?: string };
  onUpdate: (data: Partial<CommunityData>) => void;
  onGenerateImage?: (type: 'logo' | 'banner') => Promise<void>;
  isGeneratingLogo?: boolean;
  isGeneratingBanner?: boolean;
  /** Show "preview" watermark (anonymous/pre-signup) */
  isAnonymous?: boolean;
  /** Follow system dark/light theme */
  isDark?: boolean;
}

function getCardColors(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const isDark = luminance < 0.5;
  return {
    text: isDark ? '#ffffff' : '#1a1a1a',
    muted: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
    border: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
    badge: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
  };
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
  // Sidebar shell theme
  const sidebarBg = isDark ? '#0D0B1E' : '#F8F9FA';
  const sidebarBorder = isDark ? 'rgba(255,255,255,0.07)' : '#E5E7EB';
  const sidebarHeaderBg = isDark ? '#0D0B1E' : '#FFFFFF';
  const sidebarText = isDark ? '#F4F4FC' : '#374151';
  const sidebarTextMuted = isDark ? 'rgba(244,244,252,0.4)' : '#9CA3AF';
  // Merge template defaults when a business type is selected but no data yet
  const template = communityData.businessType ? getTemplateById(communityData.businessType) : null;
  const effectiveData: Partial<CommunityData> & { businessType?: string } = {
    primaryColor: template?.primaryColor || '#10F48B',
    ...communityData,
    // Only use template sample name if user hasn't provided their own
    name: communityData.name && communityData.name !== template?.sampleName
      ? communityData.name
      : (communityData.name || template?.sampleName),
    description: communityData.description || template?.sampleDescription,
  };
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [customColor, setCustomColor] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpdate({ logo: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpdate({ banner: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleStartEdit = (field: string, currentValue: string = '') => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const handleSaveEdit = (field: keyof CommunityData) => {
    if (tempValue.trim()) {
      onUpdate({ [field]: tempValue.trim() });
    }
    setEditingField(null);
    setTempValue('');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setTempValue('');
  };

  const handleColorSelect = (color: string) => {
    onUpdate({ primaryColor: color });
  };

  const cardColor = effectiveData.primaryColor || communityData.primaryColor || '#ffffff';
  const cardColors = getCardColors(cardColor);

  return (
    <section
      className="w-[35%] h-full flex flex-col border-l relative overflow-hidden"
      style={{ background: sidebarBg, borderColor: sidebarBorder }}
    >
      {/* Header */}
      <div
        className="h-16 px-6 border-b flex items-center justify-between"
        style={{ background: sidebarHeaderBg, borderColor: sidebarBorder }}
      >
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#00FF88' }} />
          <span className="text-sm font-semibold" style={{ color: sidebarText }}>Community Preview</span>
        </div>
        <span className="text-xs" style={{ color: sidebarTextMuted }}>Auto-updating</span>
      </div>

      {/* Anonymous watermark */}
      {isAnonymous && (
        <div
          className="absolute top-2 right-2 z-20 px-2 py-1 rounded-md text-[10px] font-semibold tracking-wider select-none pointer-events-none"
          style={{ background: 'rgba(16,244,139,0.12)', color: '#10F48B', border: '1px solid rgba(16,244,139,0.2)' }}
        >
          PREVIEW
        </div>
      )}

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Community Card Preview */}
        <div
          className="rounded-2xl shadow-sm overflow-hidden relative z-10 group transition-all duration-300 hover:shadow-md"
          style={{ backgroundColor: cardColor, border: `1px solid ${cardColors.border}` }}
        >
          {/* Banner Area */}
          <div className="h-32 bg-gray-100 relative group/banner">
            {isGeneratingBanner ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <svg
                  className="animate-spin h-8 w-8"
                  style={{ color: '#00FF88' }}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : communityData.banner ? (
              <img
                className="w-full h-full object-cover cursor-zoom-in"
                src={communityData.banner}
                alt="Community banner"
                onClick={() => setBannerModalOpen(true)}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 cursor-pointer"
                onClick={() => bannerInputRef.current?.click()}
              >
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
            {!isGeneratingBanner && (
              <button
                className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-gray-600 shadow-sm opacity-60 group-hover/banner:opacity-100 transition-opacity hover:text-gray-800"
                onClick={() => bannerInputRef.current?.click()}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            )}
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6 relative">
            <div className="flex items-start space-x-4 -mt-10 mb-4">
              {/* Logo */}
              <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-sm group/logo z-10 flex-shrink-0 relative">
                <div className="w-full h-full rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden relative">
                  {isGeneratingLogo ? (
                    <svg
                      className="animate-spin h-7 w-7"
                      style={{ color: '#00FF88' }}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : communityData.logo ? (
                    <img
                      className="w-full h-full object-cover cursor-zoom-in"
                      src={communityData.logo}
                      alt="Community logo"
                      onClick={() => setLogoModalOpen(true)}
                    />
                  ) : (
                    <button
                      className="w-full h-full flex items-center justify-center"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </button>
                  )}
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  {!isGeneratingLogo && communityData.logo && (
                    <div
                      className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity cursor-zoom-in"
                      onClick={() => setLogoModalOpen(true)}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                        />
                      </svg>
                    </div>
                  )}
                  {!isGeneratingLogo && !communityData.logo && (
                    <div
                      className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                {!isGeneratingLogo && (
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md opacity-70 hover:opacity-100 transition-opacity z-20"
                  >
                    <svg className="w-2.5 h-2.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Title */}
              <div className="flex-1 pt-12 group/field relative p-1 -ml-1">
                {editingField === 'name' ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      maxLength={100}
                      className="w-full text-xl font-bold bg-transparent border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-brand-green"
                      style={{ color: cardColors.text }}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit('name');
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <div className="flex space-x-2">
                      <button onClick={() => handleSaveEdit('name')} className="text-xs text-brand-green-dark hover:text-brand-green">Save</button>
                      <button onClick={handleCancelEdit} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold" style={{ color: cardColors.text }}>
                      {communityData.name || 'Community Name'}
                    </h2>
                    <button
                      onClick={() => handleStartEdit('name', communityData.name)}
                      className="text-gray-400 hover:text-brand-green-dark flex-shrink-0"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Text Details */}
            <div className="space-y-4">
              {/* Category Badge */}
              <div className="flex items-center space-x-2">
                <span
                  className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md"
                  style={{ backgroundColor: cardColors.badge, color: cardColors.muted }}
                >
                  {communityData.category || 'Category'}
                </span>
                {communityData.category && (
                  <>
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: cardColors.muted }} />
                    <span className="text-xs" style={{ color: cardColors.muted }}>
                      {communityData.type || 'Type'}
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              <div className="group/field relative">
                {editingField === 'description' ? (
                  <div className="space-y-2 border border-gray-200 rounded-lg p-1">
                    <textarea
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      maxLength={400}
                      rows={3}
                      className="w-full text-sm bg-transparent border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-brand-green resize-none"
                      style={{ color: cardColors.muted }}
                      autoFocus
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <button onClick={() => handleSaveEdit('description')} className="text-xs text-brand-green-dark hover:text-brand-green">Save</button>
                        <button onClick={handleCancelEdit} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                      </div>
                      <span className="text-xs text-gray-400">{tempValue.length}/400</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed" style={{ color: cardColors.muted }}>
                    {communityData.description || 'Community description will appear here...'}
                    <button
                      onClick={() => handleStartEdit('description', communityData.description)}
                      className="inline-flex items-center text-gray-400 hover:text-brand-green-dark align-middle ml-2"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </p>
                )}
              </div>

              {/* Target Audience */}
              {communityData.targetAudience && (
                <div className="group/field relative border border-transparent hover:border-gray-200 rounded-lg p-2 -ml-2 transition-colors">
                  {editingField === 'targetAudience' ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        maxLength={150}
                        className="w-full text-sm bg-transparent border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-brand-green"
                        style={{ color: cardColors.text }}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit('targetAudience');
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <div className="flex space-x-2">
                        <button onClick={() => handleSaveEdit('targetAudience')} className="text-xs text-brand-green-dark hover:text-brand-green">Save</button>
                        <button onClick={handleCancelEdit} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: cardColors.muted }}>Target Audience</p>
                        <p className="text-sm" style={{ color: cardColors.text }}>{communityData.targetAudience}</p>
                      </div>
                      <button
                        onClick={() => handleStartEdit('targetAudience', communityData.targetAudience)}
                        className="text-gray-400 opacity-0 group-hover/field:opacity-100 hover:text-brand-green-dark"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Community Type */}
              {communityData.type && (
                <div>
                  <div
                    className="group/field relative border border-transparent hover:border-gray-200 rounded-lg p-2 -ml-2 transition-colors cursor-pointer"
                    onClick={() => setTypeDropdownOpen((o) => !o)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: cardColors.muted }}>Community Type</p>
                        <p className="text-sm" style={{ color: cardColors.text }}>
                          {communityData.type} {communityData.type === 'Private' ? '• Invite Only' : '• Open to All'}
                        </p>
                      </div>
                      <svg
                        className={`w-3 h-3 transition-transform ${typeDropdownOpen ? 'rotate-180' : ''}`}
                        style={{ color: cardColors.muted }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {typeDropdownOpen && (
                    <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      {(['Public', 'Private'] as const).map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            onUpdate({ type: option });
                            setTypeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${communityData.type === option ? 'bg-gray-50' : 'bg-white'}`}
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">{option}</p>
                            <p className="text-xs text-gray-500">{option === 'Private' ? 'Invite Only' : 'Open to All'}</p>
                          </div>
                          {communityData.type === option && (
                            <svg className="w-3 h-3 text-brand-green-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Color Palette */}
              <div className="pt-3 border-t" style={{ borderColor: cardColors.border }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: cardColors.muted }}>
                    Primary Color
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {customColor && (
                      <button
                        onClick={() => handleColorSelect(customColor)}
                        className={`w-5 h-5 rounded-md hover:scale-110 transition-transform shadow-sm flex-shrink-0 ${communityData.primaryColor === customColor ? 'ring-2 ring-offset-1 ring-brand-green' : ''}`}
                        style={{
                          backgroundColor: customColor,
                          ...(customColor.toLowerCase() === '#ffffff' ? { outline: '1px solid #d1d5db' } : {}),
                        }}
                        title="Custom color"
                      />
                    )}
                    {DEFAULT_PRIMARY_COLORS.map((color) => (
                      <button
                        key={color.hex}
                        onClick={() => handleColorSelect(color.hex)}
                        className={`w-5 h-5 rounded-md hover:scale-110 transition-transform shadow-sm flex-shrink-0 ${communityData.primaryColor === color.hex ? 'ring-2 ring-offset-1 ring-brand-green' : ''}`}
                        style={{
                          backgroundColor: color.hex,
                          ...(color.hex.toLowerCase() === '#ffffff' ? { outline: '1px solid #d1d5db' } : {}),
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <div style={{ marginLeft: '48px' }} className="flex-shrink-0 relative">
                    <input
                      ref={colorPickerRef}
                      type="color"
                      value={communityData.primaryColor || '#00FF88'}
                      onChange={(e) => {
                        const hex = e.target.value;
                        setCustomColor(hex);
                        handleColorSelect(hex);
                      }}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      title="Custom color"
                    />
                    <button
                      onClick={() => colorPickerRef.current?.click()}
                      className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm hover:scale-105 transition-transform overflow-hidden relative"
                      style={{
                        background:
                          'conic-gradient(from 0deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #a855f7, #ec4899, #ef4444)',
                      }}
                      title="Custom color"
                    >
                      <span className="absolute inset-0 bg-white/20 hover:bg-white/10 transition-colors" />
                      <svg className="w-3 h-3 text-white drop-shadow relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation / CTA */}
        {onGenerateImage && (
          <div className="mt-6 relative z-10">
            <ConfirmationPanel
              communityData={communityData}
              onUpdateData={onUpdate}
              onGenerateImage={onGenerateImage}
            />
          </div>
        )}
      </div>

      {/* Banner Preview Modal */}
      {bannerModalOpen && communityData.banner &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setBannerModalOpen(false)}
          >
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <img
                src={communityData.banner}
                alt="Community banner enlarged"
                className="max-w-[90vw] max-h-[80vh] rounded-2xl shadow-2xl object-contain"
              />
              <button
                onClick={() => setBannerModalOpen(false)}
                className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md text-gray-700 hover:text-gray-900 hover:scale-110 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Logo Preview Modal */}
      {logoModalOpen && communityData.logo &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setLogoModalOpen(false)}
          >
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <img
                src={communityData.logo}
                alt="Community logo enlarged"
                className="max-w-[80vw] max-h-[80vh] rounded-2xl shadow-2xl object-contain"
              />
              <button
                onClick={() => setLogoModalOpen(false)}
                className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md text-gray-700 hover:text-gray-900 hover:scale-110 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}
