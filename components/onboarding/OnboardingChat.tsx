'use client';

import { useEffect, useRef, useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingContext';
import { ChatMessageComponent, TypingIndicator } from './ChatMessage';
import { AICreationCard } from './InteractiveCards';
import { ChatInput } from './ChatInput';
import { PreviewSidebar } from './PreviewSidebar';
import { SignupWall } from './SignupWall';

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) || 16;
  const g = parseInt(h.substring(2, 4), 16) || 244;
  const b = parseInt(h.substring(4, 6), 16) || 139;
  return `${r},${g},${b}`;
}

export function OnboardingChat() {
  const {
    messages,
    communityData,
    isPreviewVisible,
    isLoading,
    isGeneratingLogo,
    isGeneratingBanner,
    error,
    isAnonymous,
    showSignupWall,
    exchangeCount,
    sendMessage,
    selectBusinessType,
    updateCommunityData,
    generateImage,
    onSignupSuccess,
    dismissSignupWall,
    handleCardAction,
    resetSession,
  } = useOnboarding();

  const conversationAreaRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(true);

  // Mobile bottom sheet state for live preview
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  // Count filled preview fields for badge
  const primaryColor = communityData.primaryColor || '#10F48B';
  const previewFields = [
    communityData.name,
    communityData.description,
    communityData.businessType,
    communityData.primaryColor !== undefined && communityData.primaryColor !== '#10F48B' ? communityData.primaryColor : null,
    communityData.vibe,
    (communityData.products?.length ?? 0) > 0 ? 'y' : null,
    communityData.audiencePersona,
    communityData.heroFeature,
    communityData.userFlow,
    communityData.differentiator,
  ];
  const filledCount = previewFields.filter(Boolean).length;
  const totalCount = 10;

  // Detect system preference — no manual toggle
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversationAreaRef.current) {
      conversationAreaRef.current.scrollTo({
        top: conversationAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  const progress = Math.min(Math.round((exchangeCount / 6) * 100), 100);

  // Theme uses CSS variables from globals.css (auto light/dark via prefers-color-scheme)
  const theme = {
    bg: 'var(--oc-bg)',
    cardBg: 'var(--oc-card-bg)',
    border: 'var(--oc-border)',
    headerBg: 'var(--oc-bg)',
    text: 'var(--oc-text)',
    textMuted: 'var(--oc-text-muted)',
    inputBg: 'var(--oc-input-bg)',
  };

  return (
    <div
      className="h-[100dvh] w-screen flex items-center justify-center overflow-hidden"
      style={{ background: theme.bg, '--oc-primary': primaryColor, '--oc-primary-rgb': hexToRgb(primaryColor) } as React.CSSProperties}
    >
      {/* Ambient gradient orbs — Premium Studio */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full animate-ambient-pulse"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full animate-ambient-pulse"
          style={{ background: 'radial-gradient(circle, rgba(16,244,139,0.05) 0%, transparent 70%)', animationDelay: '2.5s' }}
        />
      </div>

      {/* Signup wall moved inline — see below chat area */}

      {/* Main Container */}
      <main
        className="w-full h-full md:max-h-[960px] md:max-w-[1440px] flex flex-col md:flex-row overflow-hidden relative z-10 backdrop-blur-sm"
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
        }}
      >
        {/* Chat Panel — full width on mobile */}
        <section
          className="flex-1 h-full flex flex-col relative z-10 min-w-0"
          style={{ background: theme.bg }}
        >
          {/* Chat Header */}
          <header
            className="h-14 md:h-16 px-4 md:px-6 flex items-center justify-between shrink-0"
            style={{ borderBottom: `1px solid ${theme.border}`, background: theme.headerBg }}
          >
            <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={isDark ? '/svgs/freedom-logo-light.svg' : '/svgs/freedom-logo-dark.svg'}
                alt="Freedom World"
                className="h-8 md:h-10 w-auto shrink-0"
              />
              <div className="w-px h-5 md:h-6 shrink-0" style={{ background: theme.border }} />
              <div className="min-w-0">
                <h2 className="text-xs md:text-sm font-semibold truncate" style={{ color: theme.text }}>
                  AVA — Your App Designer
                </h2>
                <p className="text-[9px] md:text-[10px] truncate" style={{ color: theme.textMuted }}>
                  {isAnonymous
                    ? 'Free preview · Building your brand'
                    : 'Building your community ✨'}
                </p>
              </div>
            </div>

            {/* Progress bar + Start Over (header right) */}
            <div className="flex items-center gap-2 md:gap-3 text-xs shrink-0" style={{ color: theme.textMuted }}>
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-20 md:w-24 h-1 rounded-full overflow-hidden" style={{ background: 'var(--oc-border)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, background: primaryColor }}
                  />
                </div>
                <span style={{ color: primaryColor }}>{progress}%</span>
              </div>
              {exchangeCount > 0 && (
                <button
                  onClick={() => { if (confirm('Start over? This will clear your progress.')) { resetSession(); window.location.reload(); } }}
                  className="text-[10px] md:text-xs px-2 py-1 rounded-md hover:opacity-80 transition-opacity"
                  style={{ color: theme.textMuted, border: `1px solid ${theme.border}` }}
                  title="Start over"
                >
                  ↺ Reset
                </button>
              )}
            </div>
          </header>

          {/* Premium Studio gradient header line */}
          <div className="gradient-header-line h-px w-full shrink-0" />

          {/* Mobile progress bar */}
          <div className="sm:hidden h-1 w-full shrink-0" style={{ background: 'var(--oc-border)' }}>
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progress}%`, background: primaryColor }}
            />
          </div>

          {/* Mobile compact preview card removed — replaced by floating preview button + bottom sheet */}

          {/* Chat Conversation Area */}
          <div
            ref={conversationAreaRef}
            className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-5"
            style={{ background: theme.bg }}
          >
            {messages.map((message, index) => {
              const isLatestAssistant =
                index === messages.length - 1 && message.role === 'assistant';
              const canInteract = isLatestAssistant && !isLoading;

              return (
                <ChatMessageComponent
                  key={index}
                  message={message}
                  isLatest={isLatestAssistant}
                  onOptionClick={canInteract ? (opt) => sendMessage(opt) : undefined}
                  onBusinessTypeSelect={canInteract ? selectBusinessType : undefined}
                  onCardAction={handleCardAction}
                />
              );
            })}

            {isLoading && <TypingIndicator />}

            {isGeneratingLogo && (
              <div className="flex items-start space-x-3 max-w-sm">
                <div
                  className="w-8 h-8 rounded-full shrink-0 mt-1 flex items-center justify-center text-xs font-bold border"
                  style={{ background: `rgba(${hexToRgb(primaryColor)},0.1)`, borderColor: `rgba(${hexToRgb(primaryColor)},0.25)`, color: primaryColor }}
                >
                  AVA
                </div>
                <AICreationCard
                  type="cover"
                  businessName={communityData.name}
                  vibe={communityData.vibe}
                  style={communityData.brandStyle}
                />
              </div>
            )}

            {error && (
              <div
                className="rounded-xl px-3 py-2 text-sm flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
              >
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Signup banner — inline above chat input, non-blocking */}
          {showSignupWall && (
            <SignupWall
              businessName={communityData.name}
              logoUrl={communityData.logo}
              onSignupSuccess={onSignupSuccess}
              onContinueWithoutSaving={dismissSignupWall}
            />
          )}

          {/* Chat Input */}
          <ChatInput
            onSendMessage={sendMessage}
            onUploadImage={(url, type) => updateCommunityData({ [type]: url })}
            disabled={isLoading}
          />
        </section>

        {/* Desktop Preview Sidebar */}
        {isPreviewVisible && (
          <div className="hidden md:block">
            <PreviewSidebar
              communityData={communityData}
              onUpdate={updateCommunityData}
              onGenerateImage={generateImage}
              isGeneratingLogo={isGeneratingLogo}
              isGeneratingBanner={isGeneratingBanner}
              isAnonymous={isAnonymous}
              isDark={isDark}
            />
          </div>
        )}
      </main>

      {/* ── Mobile: backdrop ─────────────────────────────── */}
      {mobilePreviewOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
          onClick={() => setMobilePreviewOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile: bottom sheet with PreviewSidebar ─────── */}
      <div
        className="md:hidden fixed inset-x-0 bottom-0 z-50 h-[70vh] rounded-t-2xl overflow-hidden
                   transition-transform duration-300 ease-out"
        style={{
          transform: mobilePreviewOpen ? 'translateY(0)' : 'translateY(100%)',
          background: isDark ? '#0D0B1A' : '#F8F9FA',
        }}
        aria-hidden={!mobilePreviewOpen}
      >
        {/* Drag handle */}
        <div className="flex flex-col items-center pt-2 pb-1 shrink-0">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: isDark ? 'rgba(255,255,255,0.15)' : '#D1D5DB' }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={() => setMobilePreviewOpen(false)}
          className="absolute top-3 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center
                     transition-colors"
          style={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', color: isDark ? '#fff' : '#111' }}
          aria-label="Close preview"
        >
          <X size={16} />
        </button>

        {/* PreviewSidebar — stretches to fill sheet */}
        <div className="h-full overflow-hidden" style={{ paddingTop: '8px' }}>
          <PreviewSidebar
            communityData={communityData}
            onUpdate={updateCommunityData}
            onGenerateImage={generateImage}
            isGeneratingLogo={isGeneratingLogo}
            isGeneratingBanner={isGeneratingBanner}
            isAnonymous={isAnonymous}
            isDark={isDark}
          />
        </div>
      </div>

      {/* ── Mobile: floating preview button ──────────────── */}
      <button
        className="md:hidden fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full
                   flex items-center justify-center text-white
                   transition-all duration-200 active:scale-95 shadow-xl"
        style={{
          background: mobilePreviewOpen
            ? (isDark ? 'rgba(255,255,255,0.15)' : '#374151')
            : primaryColor,
          boxShadow: `0 4px 20px ${primaryColor}55`,
          animation: isGeneratingLogo || isGeneratingBanner ? 'pulse 2s infinite' : 'none',
        }}
        onClick={() => setMobilePreviewOpen(v => !v)}
        aria-label={mobilePreviewOpen ? 'Close preview' : 'Open live preview'}
      >
        {mobilePreviewOpen ? (
          <X size={20} />
        ) : (
          <Smartphone size={20} />
        )}

        {/* Progress badge */}
        {filledCount > 0 && !mobilePreviewOpen && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full
                       flex items-center justify-center text-[9px] font-bold px-1"
            style={{ background: '#1A1A1A', color: primaryColor, border: `1.5px solid ${primaryColor}` }}
          >
            {filledCount}/{totalCount}
          </span>
        )}
      </button>
    </div>
  );
}
