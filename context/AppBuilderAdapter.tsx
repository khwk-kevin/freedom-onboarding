'use client';

/**
 * AppBuilderAdapter
 * 
 * Wraps AppBuilderContext and exposes it through the OnboardingContext interface.
 * This lets OnboardingChat (the good UI) use AppBuilderContext (the real builder).
 * 
 * OnboardingChat reads: messages, communityData, isPreviewVisible, isLoading,
 *   isGeneratingLogo, isGeneratingBanner, error, isAnonymous, showSignupWall,
 *   exchangeCount, sendMessage, selectBusinessType, updateCommunityData,
 *   generateImage, onSignupSuccess, dismissSignupWall, handleCardAction, resetSession
 */

import React from 'react';
import { AppBuilderProvider, useAppBuilder } from './AppBuilderContext';
import { OnboardingContext } from './OnboardingContext';
import type { ChatMessage } from '@/types/onboarding';

function AdapterInner({ children }: { children: React.ReactNode }) {
  const builder = useAppBuilder();

  // Map merchantAppSpec → communityData shape
  const spec = builder.merchantAppSpec;
  const communityData = {
    name: spec.businessName || '',
    description: spec.ideaDescription || '',
    targetAudience: spec.audienceDescription || '',
    category: spec.category || spec.businessType || '',
    businessType: spec.businessType || '',
    type: spec.appType === 'idea' ? 'interest' as const : 'business' as const,
    logo: spec.scrapedData?.photos?.[0] || '',
    banner: spec.scrapedData?.photos?.[1] || '',
    primaryColor: spec.primaryColor || '#10F48B',
    vibe: spec.mood || '',
    brandStyle: spec.uiStyle || '',
    products: spec.products?.map(p => p.price ? `${p.name}:${p.price}` : p.name) || [],
    audiencePersona: spec.audienceDescription || '',
    heroFeature: spec.appPriorities?.[0] || '',
    userFlow: '',
    differentiator: '',
    brandColors: spec.primaryColor ? [spec.primaryColor] : [],
  };

  // Map messages (same shape)
  const messages: ChatMessage[] = builder.messages.map(m => ({
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
    metadata: undefined,
  }));

  // Adapter functions
  const sendMessage = async (text: string) => {
    await builder.sendMessage(text);
  };

  const updateCommunityData = (data: Record<string, unknown>) => {
    // Color picks, style picks etc come through here
    if (data.primaryColor && typeof data.primaryColor === 'string') {
      builder.handleColorPick(data.primaryColor);
    }
    if (data.uiStyle && typeof data.uiStyle === 'string') {
      builder.handleUiStylePick(data.uiStyle as any);
    }
  };

  const onSignupSuccess = async (userId: string) => {
    await builder.handleSignup(userId);
  };

  const value = {
    // State
    messages,
    communityData,
    isPreviewVisible: true,
    isLoading: builder.isLoading,
    isGeneratingLogo: false,
    isGeneratingBanner: false,
    error: builder.error,
    isAnonymous: builder.isAnonymous,
    showSignupWall: builder.showSignupWall,
    exchangeCount: messages.filter(m => m.role === 'user').length,
    conversationPhase: builder.interviewPhase === 'phase1a' ? 'discovery' as const : 'deep_dive' as const,
    // Actions
    sendMessage,
    selectBusinessType: (type: string) => {
      sendMessage(type);
    },
    updateCommunityData,
    generateImage: async (_type: string) => {},
    onSignupSuccess,
    dismissSignupWall: () => {},
    handleCardAction: async (_action: string, _data?: Record<string, unknown>) => {},
    resetSession: () => {
      builder.startSession();
    },
    // Extra fields OnboardingChat might expect
    merchantId: spec.id,
    sessionId: builder.sessionId,
  };

  return (
    <OnboardingContext.Provider value={value as any}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function AppBuilderAdapterProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppBuilderProvider>
      <AdapterInner>{children}</AdapterInner>
    </AppBuilderProvider>
  );
}
