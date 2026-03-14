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
import type { BuildProgressState, BuildProgressStep } from './OnboardingContext';
import { getTemplateById } from '@/lib/onboarding/templates';
import type { ChatMessage } from '@/types/onboarding';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function AdapterInner({ children }: { children: React.ReactNode }) {
  const builder = useAppBuilder();
  const hasStarted = React.useRef(false);
  // 'idle' | 'dashboard' | 'building' | 'done' | 'error'
  const buildState = React.useRef<'idle' | 'dashboard' | 'building' | 'done' | 'error'>('idle');

  // Extra messages injected by the adapter (e.g. build progress text)
  const [extraMessages, setExtraMessages] = React.useState<ChatMessage[]>([]);

  // Build progress state — drives the Blueprint sidebar's build phase view
  const [buildProgress, setBuildProgress] = React.useState<BuildProgressState>({
    steps: [],
    isBuilding: false,
    buildPhase: 'spec',
  });

  // Auto-start session on mount
  React.useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      builder.startSession();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── triggerBuild: switch Blueprint to build mode, stream SSE (ONCE) ──
  const triggerBuild = React.useCallback(() => {
    if (buildState.current === 'building' || buildState.current === 'done') return;
    buildState.current = 'building';

    const s = builder.merchantAppSpec;
    const merchantId = s.id;

    const onboardingData = {
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
    };

    // Inject a chat message directing user to the sidebar
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    setExtraMessages(prev => [...prev, {
      role: 'assistant' as const,
      content: isMobile
        ? "Building your app now! Tap the 📋 button to watch live progress"
        : "Building your app now! Watch the live progress on the right →",
      timestamp: new Date(),
    }]);

    // Switch Blueprint sidebar to building phase
    setBuildProgress({ steps: [], isBuilding: true, buildPhase: 'building' });

    // Stream SSE build progress
    const startBuildSSE = async () => {
      try {
        const res = await fetch(`${API_URL}/apps/build-app`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId, onboardingData }),
        });

        if (!res.ok || !res.body) {
          throw new Error('Failed to start build');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedDevUrl: string | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6)) as {
                step?: string;
                message?: string;
                devUrl?: string;
                event?: string;
                projectId?: string;
              };

              const newStep: BuildProgressStep = {
                step: data.step || '',
                message: data.message || '',
                devUrl: data.devUrl,
              };

              setBuildProgress(prev => ({
                ...prev,
                steps: [...prev.steps, newStep],
                devUrl: data.devUrl || prev.devUrl,
              }));

              if (data.devUrl) accumulatedDevUrl = data.devUrl;

              if (data.event === 'complete' || data.step === 'done') {
                buildState.current = 'done';
                setBuildProgress(prev => ({
                  ...prev,
                  isBuilding: false,
                  buildPhase: 'complete',
                  devUrl: accumulatedDevUrl || prev.devUrl,
                }));
                if (accumulatedDevUrl) {
                  setExtraMessages(prev => [...prev, {
                    role: 'assistant' as const,
                    content: `Your app is live! 🎉 View it in the panel on the right.`,
                    timestamp: new Date(),
                  }]);
                }
              }

              if (data.event === 'error' || data.step === 'error') {
                buildState.current = 'error';
                setBuildProgress(prev => ({
                  ...prev,
                  isBuilding: false,
                  buildPhase: 'error',
                  error: data.message || 'Build failed',
                }));
                setExtraMessages(prev => [...prev, {
                  role: 'assistant' as const,
                  content: "There was a hiccup building your app. Try again or tell me what to change. 💪",
                  timestamp: new Date(),
                }]);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Build failed';
        buildState.current = 'error';
        setBuildProgress({
          steps: [{ step: 'error', message }],
          isBuilding: false,
          buildPhase: 'error',
          error: message,
        });
        setExtraMessages(prev => [...prev, {
          role: 'assistant' as const,
          content: "There was a hiccup building your app. Try again or tell me what to change. 💪",
          timestamp: new Date(),
        }]);
      }
    };

    startBuildSSE();
  }, [builder.merchantAppSpec]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Map merchantAppSpec → communityData shape ──────────────────────────────
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
    // ── Blueprint functional fields ─────────────────────────────────────────
    antiPreferences: spec.antiPreferences || [],
    appFormat: spec.appFormat || spec.appType || spec.businessType || '',
    coreActions: spec.coreActions || [],
    keyScreens: spec.keyScreens || [],
    monetizationModel: spec.monetizationModel || '',
    mvpScope: spec.mvpScope || '',
    dataModel: spec.dataModel || '',
    userJourney: spec.userJourney || '',
    conversionGoal: spec.conversionGoal || '',
    firstImpression: spec.firstImpression || '',
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
      builder.handleUiStylePick(data.uiStyle as Parameters<typeof builder.handleUiStylePick>[0]);
    }
  };

  const onSignupSuccess = async (userId: string, _email?: string) => {
    await builder.handleSignup(userId);
  };

  const value = {
    messages,
    communityData,
    buildProgress,
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
        // Legacy: handle completion from a still-rendered AppBuildingCard
        if (buildState.current !== 'done') {
          buildState.current = 'done';
          const devUrl = cardData?.devUrl as string;
          setBuildProgress(prev => ({
            ...prev,
            isBuilding: false,
            buildPhase: 'complete',
            devUrl: devUrl || prev.devUrl,
          }));
          if (devUrl) {
            setExtraMessages(prev => [...prev, {
              role: 'assistant' as const,
              content: `Your app is live! 🎉 View it in the panel on the right.`,
              timestamp: new Date(),
            }]);
          }
        }
      } else if (action === 'app_build_error') {
        if (buildState.current !== 'error') {
          buildState.current = 'error';
          setBuildProgress(prev => ({
            ...prev,
            isBuilding: false,
            buildPhase: 'error',
            error: (cardData?.error as string) || 'Build failed',
          }));
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
      setBuildProgress({ steps: [], isBuilding: false, buildPhase: 'spec' });
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
