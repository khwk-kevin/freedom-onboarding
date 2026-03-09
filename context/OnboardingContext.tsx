'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ChatMessage, CommunityData, ConversationPhase } from '@/types/onboarding';
import { track } from '@/lib/tracking/unified';
import { BUSINESS_TEMPLATES, getTemplateById } from '@/lib/onboarding/templates';

// ============================================================
// Types
// ============================================================

interface MerchantOnboardingData extends Partial<CommunityData> {
  businessType?: string;
  vibe?: string;
  products?: string[];
  brandStyle?: string;
  rewards?: string;
  step?: string;
  scrapedImages?: string[];
  scrapedUrl?: string;
}

interface OnboardingContextType {
  // Chat state
  messages: ChatMessage[];
  communityData: MerchantOnboardingData;
  isPreviewVisible: boolean;
  currentPhase: ConversationPhase;
  isLoading: boolean;
  isGeneratingLogo: boolean;
  isGeneratingBanner: boolean;
  error: string | null;

  // Anonymous session
  isAnonymous: boolean;
  anonymousSessionId: string;
  showSignupWall: boolean;
  exchangeCount: number;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  selectBusinessType: (typeId: string) => void;
  updateCommunityData: (data: MerchantOnboardingData) => void;
  showPreview: () => void;
  resetSession: () => void;
  generateImage: (type: 'logo' | 'banner') => Promise<void>;
  onSignupSuccess: (merchantId: string, email: string) => Promise<void>;
  dismissSignupWall: () => void;
}

// ============================================================
// Context
// ============================================================

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const ANON_SESSION_KEY = 'fw_anon_session_id';

// ============================================================
// Provider
// ============================================================

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [communityData, setCommunityData] = useState<MerchantOnboardingData>({
    primaryColor: '#10F48B',
  });
  const [isPreviewVisible, setIsPreviewVisible] = useState(true); // visible by default in new flow
  const [currentPhase, setCurrentPhase] = useState<ConversationPhase>('context_collection');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Anonymous session state
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [anonymousSessionId, setAnonymousSessionId] = useState('');
  const [showSignupWall, setShowSignupWall] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  // Grace period: 1 extra free exchange after signup wall shown
  const [graceUsed, setGraceUsed] = useState(false);

  const hasInitialized = useRef(false);

  // Initialize anonymous session from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let sessionId = localStorage.getItem(ANON_SESSION_KEY);
    if (!sessionId) {
      sessionId = generateUUID();
      localStorage.setItem(ANON_SESSION_KEY, sessionId);
    }
    setAnonymousSessionId(sessionId);
  }, []);

  // Show initial greeting message (business type picker prompt)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    track.onboardStart('', undefined);

    setMessages([
      {
        role: 'assistant',
        content: "Hey! 👋 I'm AVA — your AI community builder. Tap your business type below to get started — I'll build your community live as we chat! ✨",
        timestamp: new Date(),
        // Special flag to render business type buttons
        metadata: { showBusinessTypePicker: true },
      } as ChatMessage & { metadata: Record<string, unknown> },
    ]);
  }, []);

  // ── Select business type (tapping a button card) ─────────────────
  const selectBusinessType = useCallback(
    async (typeId: string) => {
      const template = getTemplateById(typeId);
      if (!template) return;

      // Instantly update preview with template
      setCommunityData((prev) => ({
        ...prev,
        businessType: typeId,
        primaryColor: template.primaryColor,
        name: template.sampleName,
      }));
      setIsPreviewVisible(true);

      // Add user message
      const userMsg: ChatMessage = {
        role: 'user',
        content: template.name,
        timestamp: new Date(),
      };

      const updatedMessages = [
        ...messages,
        userMsg,
      ];
      setMessages(updatedMessages);
      setIsLoading(true);

      try {
        // Send to chat API with business type context
        const res = await fetch('/api/onboarding/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'user', content: `[[BUSINESS_TYPE:${template.name}]]` },
            ],
            isMerchantFlow: true,
            anonymousSessionId,
            merchantContext: {
              businessType: typeId,
              isAnonymous: true,
              exchangeCount: 0,
            },
          }),
        });

        const { text: reply } = await streamResponse(res);

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: reply, timestamp: new Date() },
        ]);

        setExchangeCount(1);
      } catch (err: unknown) {
        const e = err as Error;
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, anonymousSessionId]
  );

  // ── Send message ────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const userMessage: ChatMessage = {
          role: 'user',
          content,
          timestamp: new Date(),
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);

        const newExchangeCount = exchangeCount + 1;
        setExchangeCount(newExchangeCount);

        // Signup wall is ONLY triggered after logo generation completes (in generateImageInternal)
        // NOT based on exchange count — we want the full flow to complete first

        const res = await fetch('/api/onboarding/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages,
            isMerchantFlow: true,
            anonymousSessionId,
            merchantContext: {
              businessType: communityData.businessType,
              businessName: communityData.name,
              isAnonymous,
              exchangeCount: newExchangeCount,
            },
          }),
        });

        const { text: replyText, extractions } = await streamResponse(res);

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: replyText || "I'm having a little trouble — could you repeat that? 😊",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Use extractions from the API (sent as separate SSE events)
        const tagUpdates: Partial<MerchantOnboardingData> = {};
        if (extractions.products) {
          // Products can come as array or comma-separated string
          tagUpdates.products = Array.isArray(extractions.products) 
            ? extractions.products 
            : String(extractions.products).split(',').map((p: string) => p.trim()).filter(Boolean);
        }
        if (extractions.audience) {
          tagUpdates.targetAudience = extractions.audience;
        }
        if (extractions.style) {
          tagUpdates.brandStyle = extractions.style;
        }
        if (extractions.vibe) {
          tagUpdates.vibe = extractions.vibe;
        }
        if (extractions.name || extractions.businessName) {
          tagUpdates.name = extractions.name || extractions.businessName;
        }
        if (Object.keys(tagUpdates).length > 0) {
          setCommunityData((prev) => ({ ...prev, ...tagUpdates }));
        }

        // Handle scrape URL — auto-scrape their social/website
        if (extractions.scrapeUrl) {
          console.log('[onboarding] scraping:', extractions.scrapeUrl);
          setTimeout(async () => {
            try {
              const scrapeRes = await fetch('/api/onboarding/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: extractions.scrapeUrl }),
              });
              const scrapeData = await scrapeRes.json();
              console.log('[onboarding] scrape result:', scrapeData);

              if (scrapeData.success) {
                // Update community data with scraped info
                const scrapeUpdates: Partial<MerchantOnboardingData> = {};
                if (scrapeData.businessName) scrapeUpdates.name = scrapeData.businessName;
                if (scrapeData.vibe) scrapeUpdates.vibe = scrapeData.vibe;
                if (scrapeData.products) scrapeUpdates.products = scrapeData.products;
                if (scrapeData.brandColors?.[0]) scrapeUpdates.primaryColor = scrapeData.brandColors[0];
                if (scrapeData.description) scrapeUpdates.description = scrapeData.description;
                if (scrapeData.imageUrls) scrapeUpdates.scrapedImages = scrapeData.imageUrls;
                if (scrapeData.category) scrapeUpdates.businessType = scrapeData.category;
                setCommunityData((prev) => ({ ...prev, ...scrapeUpdates }));

                // Inject scraped context back into chat so AVA can present it
                const contextMsg = `[[SCRAPED_CONTEXT:${JSON.stringify({
                  businessName: scrapeData.businessName,
                  bio: scrapeData.bio,
                  products: scrapeData.products,
                  vibe: scrapeData.vibe,
                  category: scrapeData.category,
                  source: scrapeData.source,
                  address: scrapeData.address,
                  rating: scrapeData.followerCount,
                })}]]`;
                // Send as a system message to AVA
                await sendMessage(contextMsg);
              } else {
                // Scrape failed — tell AVA to continue with manual flow
                await sendMessage('[[SCRAPE_FAILED]]');
              }
            } catch (err) {
              console.error('[onboarding] scrape error:', err);
              await sendMessage('[[SCRAPE_FAILED]]');
            }
          }, 500);
        }

        // Auto-trigger cover page generation when step reaches 6 (brand look collected)
        const currentStep = extractions.step;
        console.log('[onboarding] step:', currentStep, 'extractions:', extractions);
        
        if (currentStep === '6' && communityData.businessType && !communityData.banner) {
          setTimeout(async () => {
            try {
              setIsGeneratingLogo(true);
              // Build enriched data snapshot with ALL collected context
              const enrichedData = {
                ...communityData,
                ...tagUpdates,
              };
              await generateImageInternal('banner', enrichedData);
            } catch {
              // Logo generation failure is non-fatal
            } finally {
              setIsGeneratingLogo(false);
            }
          }, 1500); // Give user time to see AVA's "generating..." message
        }

        // Signup wall is triggered via generateImageInternal after logo completes — not here
      } catch (err: unknown) {
        const e = err as Error;
        setError(e.message || 'Failed to send message');
        console.error('Send message error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, communityData, isAnonymous, exchangeCount, anonymousSessionId, graceUsed]
  );

  // ── Signup success ──────────────────────────────────────────────
  const onSignupSuccess = useCallback(
    async (merchantId: string, email: string) => {
      setIsAnonymous(false);
      setShowSignupWall(false);

      // Link anonymous session to merchant
      try {
        await fetch('/api/onboarding/link-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            anonymousSessionId,
            merchantId,
            communityData: {
              ...communityData,
              email,
            },
          }),
        });
      } catch (err) {
        console.error('Failed to link session:', err);
      }

      // Clear the anonymous session ID so a fresh one is generated next time
      if (typeof window !== 'undefined') {
        localStorage.removeItem(ANON_SESSION_KEY);
      }

      // Continue conversation with a "just signed up" message
      const continueMsg: ChatMessage = {
        role: 'user',
        content: '[[SIGNED_UP]]',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, continueMsg]);
    },
    [anonymousSessionId, communityData]
  );

  // ── Dismiss signup wall (grace period) ─────────────────────────
  const dismissSignupWall = useCallback(() => {
    setShowSignupWall(false);
    setGraceUsed(true);
  }, []);

  // ── Internal image generation helper ───────────────────────────
  const generateImageInternal = async (
    type: 'logo' | 'banner',
    data: MerchantOnboardingData
  ) => {
    const res = await fetch('/api/onboarding/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, communityData: data }),
    });

    const result = await res.json();

    if (result.success && result.imageUrl) {
      setCommunityData((prev) => ({ ...prev, [type]: result.imageUrl }));

      // Show signup wall after cover page is generated (if still anonymous)
      // Give them 3 seconds to appreciate the cover before asking to sign up
      if ((type === 'banner' || type === 'logo') && isAnonymous) {
        setTimeout(() => setShowSignupWall(true), 3000);
      }
    } else {
      throw new Error(result.error || `Failed to generate ${type}`);
    }
  };

  // ── Public generateImage ────────────────────────────────────────
  const generateImage = useCallback(
    async (type: 'logo' | 'banner') => {
      try {
        if (type === 'logo') setIsGeneratingLogo(true);
        else setIsGeneratingBanner(true);
        setError(null);
        await generateImageInternal(type, communityData);
      } catch (err: unknown) {
        const e = err as Error;
        setError(e.message || `Failed to generate ${type}`);
        console.error(`Generate ${type} error:`, err);
      } finally {
        if (type === 'logo') setIsGeneratingLogo(false);
        else setIsGeneratingBanner(false);
      }
    },
    [communityData, isAnonymous]
  );

  const updateCommunityData = useCallback((data: MerchantOnboardingData) => {
    setCommunityData((prev) => ({ ...prev, ...data }));
  }, []);

  const showPreview = useCallback(() => {
    setIsPreviewVisible(true);
  }, []);

  const resetSession = useCallback(() => {
    setMessages([]);
    setCommunityData({ primaryColor: '#10F48B' });
    setIsPreviewVisible(true);
    setCurrentPhase('context_collection');
    setError(null);
    setExchangeCount(0);
    setShowSignupWall(false);
    setGraceUsed(false);
    hasInitialized.current = false;
  }, []);

  const value: OnboardingContextType = {
    messages,
    communityData,
    isPreviewVisible,
    currentPhase,
    isLoading,
    isGeneratingLogo,
    isGeneratingBanner,
    error,
    isAnonymous,
    anonymousSessionId,
    showSignupWall,
    exchangeCount,
    sendMessage,
    selectBusinessType,
    updateCommunityData,
    showPreview,
    resetSession,
    generateImage,
    onSignupSuccess,
    dismissSignupWall,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

// ── SSE stream helper ──────────────────────────────────────────────
interface StreamResult {
  text: string;
  extractions: Record<string, string>;
}

async function streamResponse(res: Response): Promise<StreamResult> {
  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let extractions: Record<string, string> = {};

  if (!reader) return { text, extractions };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const raw = line.slice(6);
        if (raw === '[DONE]') continue;
        try {
          const parsed = JSON.parse(raw);
          if (parsed.type === 'text') {
            text += parsed.content;
          } else if (parsed.type === 'extractions' && parsed.extractions) {
            extractions = { ...extractions, ...parsed.extractions };
          }
        } catch {
          // ignore parse errors
        }
      }
    }
  }

  return { text, extractions };
}
