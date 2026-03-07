'use client';

import { useEffect, useRef } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { ChatMessageComponent, TypingIndicator } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { PreviewSidebar } from './PreviewSidebar';
import { SignupWall } from './SignupWall';
import { ProgressBar } from './ProgressBar';

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
  } = useOnboarding();

  const conversationAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversationAreaRef.current) {
      conversationAreaRef.current.scrollTo({
        top: conversationAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  // Simple progress: 0-100 based on exchange count (max 6 total steps)
  const progress = Math.min(Math.round((exchangeCount / 6) * 100), 100);

  return (
    <div className="h-screen w-screen flex items-center justify-center overflow-hidden" style={{ background: '#050314' }}>
      {/* Signup Wall Overlay */}
      {showSignupWall && (
        <SignupWall
          businessName={communityData.name}
          logoUrl={communityData.logo}
          onSignupSuccess={onSignupSuccess}
          onContinueWithoutSaving={dismissSignupWall}
        />
      )}

      {/* Main Container */}
      <main
        className="w-full h-full max-h-[960px] max-w-[1440px] flex overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '0',
        }}
      >
        {/* Chat Panel */}
        <section
          className={`${
            isPreviewVisible ? 'flex-1' : 'w-full'
          } h-full flex flex-col relative z-10 transition-all duration-500`}
          style={{ background: '#050314' }}
        >
          {/* Chat Header */}
          <header
            className="h-16 px-6 flex items-center justify-between shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border"
                style={{
                  background: 'rgba(16,244,139,0.1)',
                  borderColor: 'rgba(16,244,139,0.3)',
                  color: '#10F48B',
                }}
              >
                AVA
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: '#F4F4FC' }}>AVA — Community Builder</h2>
                <p className="text-[10px]" style={{ color: 'rgba(244,244,252,0.4)' }}>
                  {isAnonymous ? `Free preview · ${Math.max(0, 3 - exchangeCount)} free exchanges left` : 'Building your community ✨'}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(244,244,252,0.4)' }}>
              <div className="w-24 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: '#10F48B' }}
                />
              </div>
              <span style={{ color: '#10F48B' }}>{progress}%</span>
            </div>
          </header>

          {/* Chat Conversation Area */}
          <div
            ref={conversationAreaRef}
            className="flex-1 overflow-y-auto px-6 py-6 space-y-5"
            style={{ background: '#050314' }}
          >
            {/* Messages */}
            {messages.map((message, index) => {
              const isLatestAssistant =
                index === messages.length - 1 && message.role === 'assistant';
              const canInteract = isLatestAssistant && !isLoading;

              return (
                <ChatMessageComponent
                  key={index}
                  message={message as Parameters<typeof ChatMessageComponent>[0]['message']}
                  isLatest={isLatestAssistant}
                  onOptionClick={canInteract ? (opt) => sendMessage(opt) : undefined}
                  onBusinessTypeSelect={canInteract ? selectBusinessType : undefined}
                />
              );
            })}

            {/* Typing Indicator */}
            {isLoading && <TypingIndicator />}

            {/* Logo generating indicator */}
            {isGeneratingLogo && (
              <div
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl w-fit"
                style={{ background: 'rgba(16,244,139,0.08)', color: '#10F48B', border: '1px solid rgba(16,244,139,0.2)' }}
              >
                <span className="animate-spin">⟳</span>
                Generating your logo...
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
              >
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <ChatInput
            onSendMessage={sendMessage}
            onUploadImage={(url, type) => updateCommunityData({ [type]: url })}
            disabled={isLoading || showSignupWall}
          />
        </section>

        {/* Preview Sidebar */}
        {isPreviewVisible && (
          <PreviewSidebar
            communityData={communityData}
            onUpdate={updateCommunityData}
            onGenerateImage={generateImage}
            isGeneratingLogo={isGeneratingLogo}
            isGeneratingBanner={isGeneratingBanner}
            isAnonymous={isAnonymous}
          />
        )}
      </main>
    </div>
  );
}
