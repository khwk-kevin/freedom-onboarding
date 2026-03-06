'use client';

import { useEffect, useRef } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { ChatMessageComponent, TypingIndicator } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { PreviewSidebar } from './PreviewSidebar';
import { ProgressBar } from './ProgressBar';
import type { CommunityData } from '@/types/onboarding';

function calculateProgress(communityData: Partial<CommunityData>): number {
  const fields: (keyof CommunityData)[] = [
    'context',
    'targetAudience',
    'communityClass',
    'name',
    'category',
    'type',
    'logo',
    'banner',
    'primaryColor',
  ];
  const filledFields = fields.filter((field) => communityData[field]);
  return Math.round((filledFields.length / fields.length) * 100);
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
    sendMessage,
    updateCommunityData,
    generateImage,
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

  const handleImageUpload = (imageUrl: string, type: 'logo' | 'banner') => {
    updateCommunityData({ [type]: imageUrl });
  };

  const progress = calculateProgress(communityData);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50 overflow-hidden">
      {/* Main Container */}
      <main className="w-full h-full max-h-[960px] max-w-[1440px] bg-white rounded-none lg:rounded-3xl flex overflow-hidden shadow-2xl border border-gray-200">
        {/* Chat Panel */}
        <section
          className={`${
            isPreviewVisible ? 'flex-1' : 'w-full'
          } h-full flex flex-col relative z-10 transition-all duration-500`}
        >
          {/* Chat Header */}
          <header className="h-20 px-6 lg:px-8 flex items-center justify-between shrink-0 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm">
                  <img
                    src="https://ui-avatars.com/api/?name=A+V+A&background=f0fdf4&color=00CC6A&size=128&font-size=0.33&length=3"
                    alt="AVA"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full animate-pulse"
                  style={{ backgroundColor: '#00FF88' }}
                />
              </div>
              {/* Name */}
              <div>
                <h2 className="text-base font-semibold text-gray-900">AVA Onboarding Assistant</h2>
                <div className="flex items-center space-x-2 text-xs">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-medium tracking-wider uppercase border"
                    style={{
                      backgroundColor: '#00FF8815',
                      color: '#00CC6A',
                      borderColor: '#00FF8830',
                    }}
                  >
                    AVA AI
                  </span>
                  <span className="text-gray-400">AI-Powered Onboarding</span>
                </div>
              </div>
            </div>

            {/* Progress chip */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: '#00FF88' }}
                />
              </div>
              <span className="font-medium text-gray-700">{progress}%</span>
            </div>
          </header>

          {/* Progress Bar */}
          <ProgressBar progress={progress} />

          {/* Chat Conversation Area */}
          <div
            ref={conversationAreaRef}
            className="flex-1 overflow-y-auto px-6 lg:px-10 py-8 space-y-6 bg-gray-50"
          >
            {/* Date Divider */}
            <div className="flex justify-center my-4 opacity-60">
              <span className="text-[10px] font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Messages */}
            {messages.map((message, index) => (
              <ChatMessageComponent
                key={index}
                message={message}
                isLatest={index === messages.length - 1 && message.role === 'assistant'}
                onOptionClick={
                  index === messages.length - 1 && message.role === 'assistant' && !isLoading
                    ? (option) => sendMessage(option)
                    : undefined
                }
              />
            ))}

            {/* Typing Indicator */}
            {isLoading && <TypingIndicator />}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                {error}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <ChatInput
            onSendMessage={sendMessage}
            onUploadImage={handleImageUpload}
            disabled={isLoading}
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
          />
        )}
      </main>
    </div>
  );
}
