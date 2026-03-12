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
  rewards?: { emoji: string; title: string; description: string; type: string }[];
  welcomePost?: string;
  audiencePersona?: string;
  step?: string;
  scrapedImages?: string[];
  scrapedUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
    images?: string[];
  };
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
  handleCardAction: (action: string, cardData?: Record<string, unknown>) => void;
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
const CACHE_KEY = 'fw_onboarding_state';
const CACHE_VERSION = 2; // Bumped to invalidate old broken share.google cache

interface CachedState {
  version: number;
  messages: ChatMessage[];
  communityData: MerchantOnboardingData;
  exchangeCount: number;
  isAnonymous: boolean;
  showSignupWall: boolean;
  graceUsed: boolean;
  timestamp: number;
}

function saveStateToCache(state: Partial<CachedState>) {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadStateFromCache();
    const merged: CachedState = {
      version: CACHE_VERSION,
      messages: state.messages ?? existing?.messages ?? [],
      communityData: state.communityData ?? existing?.communityData ?? { primaryColor: '#10F48B' },
      exchangeCount: state.exchangeCount ?? existing?.exchangeCount ?? 0,
      isAnonymous: state.isAnonymous ?? existing?.isAnonymous ?? true,
      showSignupWall: state.showSignupWall ?? existing?.showSignupWall ?? false,
      graceUsed: state.graceUsed ?? existing?.graceUsed ?? false,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
  } catch { /* storage full or unavailable */ }
}

function loadStateFromCache(): CachedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedState;
    if (parsed.version !== CACHE_VERSION) return null;
    // Expire cache after 24 hours
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    // Rehydrate Date objects in messages
    if (parsed.messages) {
      parsed.messages = parsed.messages.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearStateCache() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_KEY);
}

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

  // Initialize: restore from cache OR start fresh
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Always restore anonymous session ID
    let sessionId = localStorage.getItem(ANON_SESSION_KEY);
    if (!sessionId) {
      sessionId = generateUUID();
      localStorage.setItem(ANON_SESSION_KEY, sessionId);
    }
    setAnonymousSessionId(sessionId);

    // Restore cached onboarding state if available
    const cached = loadStateFromCache();
    if (cached && cached.messages.length > 0) {
      console.log('[onboarding] Restoring cached state:', cached.messages.length, 'messages');
      setMessages(cached.messages);
      setCommunityData(cached.communityData);
      setExchangeCount(cached.exchangeCount);
      setIsAnonymous(cached.isAnonymous);
      setShowSignupWall(cached.showSignupWall);
      setGraceUsed(cached.graceUsed);
      hasInitialized.current = true;
      return;
    }
  }, []);

  // Show initial greeting message (business type picker prompt) — only if no cache
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

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    if (messages.length === 0) return;
    saveStateToCache({ messages, communityData, exchangeCount, isAnonymous, showSignupWall, graceUsed });
  }, [messages, communityData, exchangeCount, isAnonymous, showSignupWall, graceUsed]);

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
          const scrapeUrl = extractions.scrapeUrl;
          console.log('[onboarding] scraping:', scrapeUrl);

          // Show scraping indicator card in chat
          const scrapingMsg: ChatMessage = {
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            metadata: {
              cardType: 'scraping',
              cardData: { url: scrapeUrl, stage: 'fetching' },
            },
          };
          setMessages((prev) => [...prev, scrapingMsg]);

          setTimeout(async () => {
            // Update scraping stage to "analyzing"
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (updated[lastIdx]?.metadata?.cardType === 'scraping') {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  metadata: { cardType: 'scraping', cardData: { url: scrapeUrl, stage: 'analyzing' } },
                };
              }
              return updated;
            });

            try {
              const scrapeRes = await fetch('/api/onboarding/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: scrapeUrl }),
              });
              const scrapeData = await scrapeRes.json();
              console.log('[onboarding] scrape result:', scrapeData);

              // Update to "extracting" stage
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.metadata?.cardType === 'scraping') {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    metadata: { cardType: 'scraping', cardData: { url: scrapeUrl, stage: 'extracting' } },
                  };
                }
                return updated;
              });

              // Brief pause to show extracting stage
              await new Promise(r => setTimeout(r, 800));

              if (scrapeData.success) {
                // Update community data with scraped info
                const scrapeUpdates: Partial<MerchantOnboardingData> = {};
                if (scrapeData.businessName) scrapeUpdates.name = scrapeData.businessName;
                if (scrapeData.vibe) scrapeUpdates.vibe = scrapeData.vibe;
                if (scrapeData.products) scrapeUpdates.products = scrapeData.products;
                if (scrapeData.brandColors?.[0]) scrapeUpdates.primaryColor = scrapeData.brandColors[0];
                if (scrapeData.description) scrapeUpdates.description = scrapeData.description;
                if (scrapeData.imageUrls) {
                  scrapeUpdates.scrapedImages = scrapeData.imageUrls;
                  // Auto-populate logo with first scraped photo (best photo from Google)
                  if (scrapeData.imageUrls[0]) {
                    scrapeUpdates.logo = scrapeData.imageUrls[0];
                  }
                  // Auto-populate banner/cover with second photo (or first if only one)
                  if (scrapeData.imageUrls[1]) {
                    scrapeUpdates.banner = scrapeData.imageUrls[1];
                  } else if (scrapeData.imageUrls[0]) {
                    scrapeUpdates.banner = scrapeData.imageUrls[0];
                  }
                }
                if (scrapeData.category) scrapeUpdates.businessType = scrapeData.category;
                // Store location data from Google Places for POI creation
                if (scrapeData.latitude && scrapeData.longitude) {
                  scrapeUpdates.location = {
                    latitude: scrapeData.latitude,
                    longitude: scrapeData.longitude,
                    name: scrapeData.businessName || '',
                    address: scrapeData.address || scrapeData.formattedAddress || '',
                    images: scrapeData.imageUrls || [],
                  };
                }
                setCommunityData((prev) => ({ ...prev, ...scrapeUpdates }));

                // Replace scraping indicator with the appropriate interactive card
                const isGoogleMaps = scrapeData.source === 'google_maps';
                const cardType = isGoogleMaps ? 'place_confirm' as const : 'brand_profile' as const;

                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (updated[lastIdx]?.metadata?.cardType === 'scraping') {
                    updated[lastIdx] = {
                      role: 'assistant',
                      content: isGoogleMaps
                        ? 'I found a place on Google Maps! Is this your business? 📍'
                        : 'I checked out your page! Here\'s what I found: ✨',
                      timestamp: new Date(),
                      metadata: {
                        cardType,
                        cardData: {
                          name: scrapeData.businessName || 'Unknown',
                          bio: scrapeData.bio,
                          address: scrapeData.address,
                          rating: scrapeData.followerCount,
                          vibe: scrapeData.vibe,
                          products: scrapeData.products,
                          category: scrapeData.category,
                          imageUrl: scrapeData.imageUrls?.[0],
                          source: scrapeData.source,
                          // Store full scrape data for confirmation
                          _scrapeData: scrapeData,
                        },
                      },
                    };
                  }
                  return updated;
                });
              } else {
                // Remove scraping indicator and tell AVA to continue with manual flow
                setMessages((prev) => prev.filter(m => m.metadata?.cardType !== 'scraping'));
                await sendMessage('[[SCRAPE_FAILED]]');
              }
            } catch (err) {
              console.error('[onboarding] scrape error:', err);
              setMessages((prev) => prev.filter(m => m.metadata?.cardType !== 'scraping'));
              await sendMessage('[[SCRAPE_FAILED]]');
            }
          }, 500);
        }

        // Auto-trigger cover page generation when step reaches 6 (brand look collected)
        const currentStep = extractions.step;
        console.log('[onboarding] step:', currentStep, 'extractions:', extractions);
        
        if (currentStep === '6' && communityData.businessType) {
          const enrichedData = { ...communityData, ...tagUpdates };

          // 1. Trigger cover generation ONLY if no banner exists (scraped photos skip this)
          if (!communityData.banner) {
            setTimeout(async () => {
              try {
                setIsGeneratingLogo(true);
                await generateImageInternal('banner', enrichedData);
              } catch {
                // Cover generation failure is non-fatal
              } finally {
                setIsGeneratingLogo(false);
              }
            }, 1500);
          } else {
            // Banner already exists from scraping — show signup wall directly
            if (isAnonymous) {
              setTimeout(() => setShowSignupWall(true), 2000);
            }
          }

          // 2. Simultaneously generate AI brand content (description, rewards, welcome post)
          setTimeout(async () => {
            try {
              const res = await fetch('/api/onboarding/generate-brand-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  businessName: enrichedData.name || 'Your Business',
                  businessType: enrichedData.businessType,
                  vibe: enrichedData.vibe,
                  products: enrichedData.products,
                  description: enrichedData.description,
                  brandStyle: enrichedData.brandStyle,
                  types: ['description', 'rewards', 'welcomePost', 'audiencePersona'],
                }),
              });
              const content = await res.json();
              console.log('[onboarding] brand content generated:', content);

              if (content.success) {
                // Update community data with ALL AI-generated content
                setCommunityData((prev) => ({
                  ...prev,
                  ...(content.description ? { description: content.description } : {}),
                  ...(content.rewards ? { rewards: content.rewards } : {}),
                  ...(content.welcomePost ? { welcomePost: content.welcomePost } : {}),
                  ...(content.audiencePersona ? { audiencePersona: content.audiencePersona } : {}),
                }));

                // Add reward suggestions card to chat
                if (content.rewards?.length) {
                  setMessages((prev) => [...prev, {
                    role: 'assistant' as const,
                    content: `I created some reward ideas tailored to ${enrichedData.name || 'your business'}! 🎁`,
                    timestamp: new Date(),
                    metadata: {
                      cardType: 'rewards' as const,
                      cardData: {
                        rewards: content.rewards,
                        businessName: enrichedData.name || 'Your Business',
                      },
                    },
                  }]);
                }

                // Add AI description card
                if (content.description) {
                  setTimeout(() => {
                    setMessages((prev) => [...prev, {
                      role: 'assistant' as const,
                      content: 'Here\'s an AI-crafted description for your community page:',
                      timestamp: new Date(),
                      metadata: {
                        cardType: 'brand_description' as const,
                        cardData: {
                          description: content.description,
                          audiencePersona: content.audiencePersona,
                        },
                      },
                    }]);
                  }, 2000);
                }

                // Add welcome post card
                if (content.welcomePost) {
                  setTimeout(() => {
                    setMessages((prev) => [...prev, {
                      role: 'assistant' as const,
                      content: 'And I drafted your first community post! 📝',
                      timestamp: new Date(),
                      metadata: {
                        cardType: 'welcome_post' as const,
                        cardData: {
                          post: content.welcomePost,
                          businessName: enrichedData.name || 'Your Business',
                          logoUrl: enrichedData.logo,
                        },
                      },
                    }]);
                  }, 4000);
                }
              }
            } catch (err) {
              console.error('[onboarding] brand content generation failed:', err);
            }
          }, 2000);
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

      // 1. Link anonymous session to merchant
      try {
        await fetch('/api/onboarding/link-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            anonymousSessionId,
            merchantId,
            communityData: { ...communityData, email },
          }),
        });
      } catch (err) {
        console.error('Failed to link session:', err);
      }

      // 2. Sync ALL collected data to Supabase + Freedom World backend
      try {
        const syncRes = await fetch('/api/onboarding/sync-community', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchantId,
            communityData: {
              name: communityData.name,
              description: communityData.description,
              businessType: communityData.businessType,
              vibe: communityData.vibe,
              products: communityData.products,
              brandStyle: communityData.brandStyle,
              primaryColor: communityData.primaryColor,
              logo: communityData.logo,
              banner: communityData.banner,
              rewards: communityData.rewards,
              welcomePost: communityData.welcomePost,
              audiencePersona: communityData.audiencePersona,
              scrapedUrl: communityData.scrapedUrl,
              scrapedImages: communityData.scrapedImages,
              // Location from Google Places scrape (for POI creation)
              location: communityData.location,
              email,
            },
          }),
        });
        const syncResult = await syncRes.json();
        console.log('[onboarding] sync result:', syncResult);
      } catch (err) {
        console.error('Failed to sync community:', err);
      }

      // Clear session data (no longer anonymous)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(ANON_SESSION_KEY);
        clearStateCache();
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

  // ── Handle interactive card actions ─────────────────────────────
  const handleCardAction = useCallback((action: string, cardData?: Record<string, unknown>) => {
    const scrapeData = cardData?._scrapeData as Record<string, unknown> | undefined;

    if (action === 'place_confirm') {
      // User confirmed the Google Maps place — now inject scraped context
      if (scrapeData) {
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
        sendMessage(contextMsg);
      }
    } else if (action === 'place_reject') {
      // Wrong place — go to manual flow
      sendMessage("That's not my place — let me fill in the details myself");
    } else if (action === 'brand_confirm') {
      // User confirmed scraped brand data
      if (scrapeData) {
        const contextMsg = `[[SCRAPED_CONTEXT:${JSON.stringify({
          businessName: scrapeData.businessName,
          bio: scrapeData.bio,
          products: scrapeData.products,
          vibe: scrapeData.vibe,
          category: scrapeData.category,
          source: scrapeData.source,
          address: scrapeData.address,
          rating: scrapeData.followerCount,
          confirmed: true,
        })}]]`;
        sendMessage(contextMsg);
      }
    } else if (action === 'brand_tweak') {
      sendMessage("Close, but let me tweak a few things");
    } else if (action === 'brand_fresh') {
      sendMessage("Not quite — let me fill in the details myself");
    } else if (action === 'rewards_accept') {
      sendMessage("Love these reward ideas! Let's use them ✨");
      
      // Show the mission board card after a delay
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: "Here's what your customers will see — their mission board! 🎮 This is the hook that keeps them coming back:",
          timestamp: new Date(),
          metadata: {
            cardType: 'mission_board',
            cardData: {
              businessName: communityData.name || 'Your Business',
              businessType: communityData.businessType || 'default',
              primaryColor: communityData.primaryColor || '#10F48B',
            },
          },
        }]);
      }, 2000);
    } else if (action === 'mission_accept') {
      sendMessage("The mission board looks amazing! My customers will love this 🎮");
    } else if (action === 'mission_customize') {
      sendMessage("Let me customize the missions a bit");
    } else if (action === 'description_accept') {
      sendMessage("That description is perfect!");
    } else if (action === 'description_edit') {
      sendMessage("Let me tweak the description a bit");
    } else if (action === 'welcome_accept') {
      sendMessage("Great welcome post! Let's use it 📝");
      
      // Show the merchant dashboard card — the onboarding outro
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: "Look at everything you've built! 🎉 Here's your community dashboard:",
          timestamp: new Date(),
          metadata: {
            cardType: 'merchant_dashboard',
            cardData: {
              businessName: communityData.name || 'Your Business',
              primaryColor: communityData.primaryColor || '#10F48B',
              logoUrl: communityData.logo,
              bannerUrl: communityData.banner,
              hasLogo: Boolean(communityData.logo),
              hasBanner: Boolean(communityData.banner),
              hasDescription: Boolean(communityData.description),
              hasLocation: Boolean(communityData.location),
              hasRewards: Boolean(communityData.rewards && communityData.rewards.length > 0),
              hasWelcomePost: true,
            },
          },
        }]);
      }, 2500);
    } else if (action === 'dashboard_go_live') {
      // Trigger the app builder pipeline
      const merchantId = communityData.name 
        ? `fw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
        : `fw-${Date.now().toString(36)}`;
      
      // Add the building card to chat
      setMessages((prev) => [...prev, {
        role: 'assistant' as const,
        content: "Now let's turn everything into your custom app! 🚀 Watch it being built live:",
        timestamp: new Date(),
        metadata: {
          cardType: 'app_building' as const,
          cardData: {
            merchantId,
            onboardingData: {
              businessType: communityData.businessType,
              vibe: communityData.vibe,
              name: communityData.name,
              products: communityData.products,
              brandStyle: communityData.brandStyle,
              primaryColor: communityData.primaryColor,
              logo: communityData.logo,
              banner: communityData.banner,
              description: communityData.description,
              audiencePersona: communityData.audiencePersona,
              scrapedImages: communityData.scrapedImages,
              scrapedUrl: communityData.scrapedUrl,
              location: communityData.location,
            },
            primaryColor: communityData.primaryColor || '#10F48B',
            businessName: communityData.name || 'Your App',
          },
        },
      }]);
    } else if (action === 'app_build_complete') {
      const devUrl = cardData?.devUrl as string;
      setMessages((prev) => [...prev, {
        role: 'assistant' as const,
        content: `Your app is live! 🎉\n\n🔗 ${devUrl}\n\nShare this link with your customers. You can always come back to make changes — just tell me what you want to update!`,
        timestamp: new Date(),
      }]);
    } else if (action === 'app_build_error') {
      setMessages((prev) => [...prev, {
        role: 'assistant' as const,
        content: "There was a hiccup building your app, but don't worry — your community is still set up and ready! We'll get the app sorted shortly. 💪",
        timestamp: new Date(),
      }]);
    } else if (action === 'dashboard_console') {
      // Open Freedom console in new tab
      if (typeof window !== 'undefined') {
        window.open('https://console.freedom.world', '_blank');
      }
    } else if (action === 'welcome_edit') {
      sendMessage("Let me edit the welcome post");
    }
  }, [sendMessage]);

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
    clearStateCache();
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
    handleCardAction,
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
