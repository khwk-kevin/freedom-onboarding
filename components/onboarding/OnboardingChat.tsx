'use client';

import { useEffect, useRef, useState } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { ChatMessageComponent, TypingIndicator } from './ChatMessage';
import { AICreationCard } from './InteractiveCards';
import { ChatInput } from './ChatInput';
import { PreviewSidebar } from './PreviewSidebar';
import { MobilePreviewCard } from './MobilePreviewCard';
import { SignupWall } from './SignupWall';

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
  } = useOnboarding();

  const conversationAreaRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(true);

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
      style={{ background: theme.bg }}
    >
      {/* Signup wall moved inline — see below chat area */}

      {/* Main Container */}
      <main
        className="w-full h-full md:max-h-[960px] md:max-w-[1440px] flex flex-col md:flex-row overflow-hidden relative"
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
                  AVA — Community Builder
                </h2>
                <p className="text-[9px] md:text-[10px] truncate" style={{ color: theme.textMuted }}>
                  {isAnonymous
                    ? 'Free preview · Building your brand'
                    : 'Building your community ✨'}
                </p>
              </div>
            </div>

            {/* Progress bar (header right) */}
            <div className="hidden sm:flex items-center gap-2 text-xs shrink-0" style={{ color: theme.textMuted }}>
              <div className="w-20 md:w-24 h-1 rounded-full overflow-hidden" style={{ background: 'var(--oc-border)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: '#10F48B' }}
                />
              </div>
              <span style={{ color: '#10F48B' }}>{progress}%</span>
            </div>
          </header>

          {/* Mobile progress bar */}
          <div className="sm:hidden h-1 w-full shrink-0" style={{ background: 'var(--oc-border)' }}>
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progress}%`, background: '#10F48B' }}
            />
          </div>

          {/* Mobile compact preview card — pinned below header, mobile only */}
          <div className="md:hidden shrink-0">
            <MobilePreviewCard
              businessName={communityData.name}
              logoUrl={communityData.logo}
              bannerUrl={communityData.banner}
              primaryColor={communityData.primaryColor}
              isGeneratingLogo={isGeneratingLogo}
              isGeneratingBanner={isGeneratingBanner}
              isDark={isDark}
            />
          </div>

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
                  style={{ background: 'rgba(16,244,139,0.1)', borderColor: 'rgba(16,244,139,0.25)', color: '#10F48B' }}
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
    </div>
  );
}
