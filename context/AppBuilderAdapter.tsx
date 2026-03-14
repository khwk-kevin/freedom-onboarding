'use client';

/**
 * AppBuilderAdapter
 * 
 * Wraps AppBuilderContext and exposes it through the OnboardingContext interface.
 * This lets OnboardingChat (the good UI) use AppBuilderContext (the real builder).
 */

import React from 'react';
import { AppBuilderProvider, useAppBuilder } from './AppBuilderContext';
import { OnboardingContext } from './OnboardingContext';
import { getTemplateById } from '@/lib/onboarding/templates';
import type { ChatMessage } from '@/types/onboarding';

function AdapterInner({ children }: { children: React.ReactNode }) {
  const builder = useAppBuilder();
  const hasStarted = React.useRef(false);
  const buildState = React.useRef<'idle' | 'dashboard' | 'building' | 'done' | 'error'>('idle');

  // Extra messages injected by the adapter (e.g. build card)
  const [extraMessages, setExtraMessages] = React.useState<ChatMessage[]>([]);

  // Auto-start session on mount
  React.useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      builder.startSession();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── triggerBuild: inject the AppBuildingCard into chat (ONCE) ──
  const triggerBuild = React.useCallback(() => {
    if (buildState.current === 'building' || buildState.current === 'done') return;
    buildState.current = 'building';

    const s = builder.merchantAppSpec;
    // Use the UUID from AppBuilderContext (startSession generates it via crypto.randomUUID)
    const merchantId = s.id;

    setExtraMessages(prev => [...prev, {
      role: 'assistant' as const,
      content: "Now let's turn everything into your custom app! 🚀 Watch it being built live:",
      timestamp: new Date(),
      metadata: {
        cardType: 'app_building' as const,
        cardData: {
          merchantId,
          onboardingData: {
            businessType: s.businessType || '',
            vibe: s.mood || '',
            name: s.businessName || '',
            products: s.products?.map(p => p.price ? `${p.name}:${p.price}` : p.name) || [],
            brandStyle: s.uiStyle || '',
            primaryColor: s.primaryColor || '#10F48B',
            logo: s.scrapedData?.photos?.[0] || '',
            banner: s.scrapedData?.photos?.[1] || '',
            description: s.ideaDescription || '',
            audiencePersona: s.audienceDescription || '',
            scrapedImages: s.scrapedData?.photos || [],
            heroFeature: s.appPriorities?.[0] || '',
            userFlow: '',
            differentiator: '',
            uiStyle: s.uiStyle || 'bold',
          },
          primaryColor: s.primaryColor || '#10F48B',
          businessName: s.businessName || 'Your App',
        },
      },
    }]);
  }, [builder.merchantAppSpec]);

  // When interview reaches 'review' or 'complete', auto-trigger build
  React.useEffect(() => {
    if (
      (builder.interviewPhase === 'review' || builder.interviewPhase === 'complete') &&
      buildState.current === 'idle'
    ) {
      triggerBuild();
    }
  }, [builder.interviewPhase, triggerBuild]);

  // Completeness-based trigger: show dashboard card after enough data collected
  const specFields = [
    builder.merchantAppSpec.businessName,
    builder.merchantAppSpec.businessType,
    builder.merchantAppSpec.mood || builder.merchantAppSpec.primaryColor,
    builder.merchantAppSpec.ideaDescription || builder.merchantAppSpec.audienceDescription,
    builder.merchantAppSpec.products?.length,
  ];
  const filledCount = specFields.filter(Boolean).length;
  const userMsgCount = builder.messages.filter(m => m.role === 'user').length;

  React.useEffect(() => {
    if (filledCount >= 3 && userMsgCount >= 3 && buildState.current === 'idle') {
      buildState.current = 'dashboard';
      setExtraMessages(prev => [...prev, {
        role: 'assistant' as const,
        content: "I've got enough to build your app! Hit Go Live when you're ready 🚀",
        timestamp: new Date(),
        metadata: {
          cardType: 'merchant_dashboard' as const,
          cardData: {
            businessName: builder.merchantAppSpec.businessName || 'Your App',
            primaryColor: builder.merchantAppSpec.primaryColor || '#10F48B',
            hasLogo: false,
            hasBanner: false,
            hasDescription: Boolean(builder.merchantAppSpec.ideaDescription),
            hasLocation: false,
            hasRewards: false,
            hasWelcomePost: false,
          },
        },
      }]);
    }
  }, [filledCount, userMsgCount]); // eslint-disable-line react-hooks/exhaustive-deps

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
    scrapedImages: spec.scrapedData?.photos || [],
    backgroundColor: undefined as string | undefined,
    fontFamily: undefined as string | undefined,
    primaryActions: spec.appPriorities || [],
    uiStyle: spec.uiStyle || 'bold',
  };

  // Map messages — preserve metadata, append extras
  const messages: ChatMessage[] = [
    ...builder.messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      metadata: m.metadata,
    })),
    ...extraMessages,
  ];

  const sendMessage = async (text: string) => {
    await builder.sendMessage(text);
  };

  const updateCommunityData = (data: Record<string, unknown>) => {
    if (data.primaryColor && typeof data.primaryColor === 'string') {
      builder.handleColorPick(data.primaryColor);
    }
    if (data.uiStyle && typeof data.uiStyle === 'string') {
      builder.handleUiStylePick(data.uiStyle as any);
    }
  };

  const onSignupSuccess = async (userId: string, _email?: string) => {
    await builder.handleSignup(userId);
  };

  const value = {
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
    sendMessage,
    selectBusinessType: (typeId: string) => {
      const template = getTemplateById(typeId);
      sendMessage(template?.name || typeId);
    },
    updateCommunityData,
    generateImage: async (_type: string) => {},
    onSignupSuccess,
    dismissSignupWall: () => {},
    handleCardAction: async (action: string, cardData?: Record<string, unknown>) => {
      if (action === 'dashboard_go_live') {
        triggerBuild();
        builder.finalizeAndDeploy();
      } else if (action === 'app_build_complete') {
        if (buildState.current !== 'done') {
          buildState.current = 'done';
          const devUrl = cardData?.devUrl as string;
          setExtraMessages(prev => [...prev, {
            role: 'assistant' as const,
            content: `Your app is live! 🎉\n\n🔗 ${devUrl}\n\nShare this link with your customers!`,
            timestamp: new Date(),
          }]);
        }
      } else if (action === 'app_build_error') {
        if (buildState.current !== 'error') {
          buildState.current = 'error';
          setExtraMessages(prev => [...prev, {
            role: 'assistant' as const,
            content: "There was a hiccup building your app. Try again or tell me what to change. 💪",
            timestamp: new Date(),
          }]);
        }
      }
    },
    resetSession: () => {
      buildState.current = 'idle';
      builder.startSession();
    },
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
