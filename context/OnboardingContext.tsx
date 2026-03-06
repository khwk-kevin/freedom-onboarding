'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ChatMessage, CommunityData, ConversationPhase } from '@/types/onboarding';
import { track } from '@/lib/tracking/unified';

interface OnboardingContextType {
  messages: ChatMessage[];
  communityData: Partial<CommunityData>;
  isPreviewVisible: boolean;
  currentPhase: ConversationPhase;
  isLoading: boolean;
  isGeneratingLogo: boolean;
  isGeneratingBanner: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  updateCommunityData: (data: Partial<CommunityData>) => void;
  showPreview: () => void;
  resetSession: () => void;
  generateImage: (type: 'logo' | 'banner') => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Helper function to detect if user requested regeneration of already-generated images
function detectRegenerationRequest(
  userMessage: string,
  currentData: Partial<CommunityData>
): { logo: boolean; banner: boolean } | null {
  if (!currentData.logo && !currentData.banner) return null;

  const isRegenRequest =
    /regenerat|new logo|new banner|different logo|different banner|try again|redo|remake|another logo|another banner|generate.*(logo|banner)|new.*(logo|banner)/i.test(
      userMessage
    );
  if (!isRegenRequest) return null;

  const hasLogoRef = /logo/i.test(userMessage);
  const hasBannerRef = /banner/i.test(userMessage);

  if (!hasLogoRef && !hasBannerRef) {
    return { logo: !!currentData.logo, banner: !!currentData.banner };
  }

  return {
    logo: hasLogoRef && !!currentData.logo,
    banner: hasBannerRef && !!currentData.banner,
  };
}

// Helper function to detect if user requested image generation
function detectImageGenerationRequest(
  userMessage: string,
  aiResponse: string
): { logo: boolean; banner: boolean } | null {
  const lowerUser = userMessage.toLowerCase();

  const isImagePhase =
    /(?:logo|banner|generate|visuals|upload)/i.test(aiResponse) ||
    /(?:logo|banner|generate)/i.test(userMessage);

  if (!isImagePhase) return null;

  if (/^(?:option\s*)?2$|^2️⃣|\bupload\b|\blater\b|\bskip\b|\bmanually\b/i.test(lowerUser)) {
    return null;
  }

  const hasLogo = /\blogo\b/i.test(lowerUser);
  const hasBanner = /\bbanner\b/i.test(lowerUser);

  if (/^(?:option\s*)?1$|^1️⃣|generate with ai|\bboth\b/i.test(lowerUser) || (hasLogo && hasBanner)) {
    return { logo: true, banner: true };
  }

  if (hasLogo) return { logo: true, banner: false };
  if (hasBanner) return { logo: false, banner: true };

  if (/^(?:option\s*)?1$|^1️⃣|\bgenerate\b|\bai\b/i.test(lowerUser)) {
    return { logo: true, banner: true };
  }

  return null;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [communityData, setCommunityData] = useState<Partial<CommunityData>>({
    primaryColor: '#ffffff',
  });
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<ConversationPhase>('context_collection');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasTrackedStart = useRef(false);

  // Fetch initial greeting
  useEffect(() => {
    if (!hasTrackedStart.current) {
      track.onboardStart('', undefined);
      hasTrackedStart.current = true;
    }
    setIsLoading(true);
    fetch('/api/onboarding/chat/greeting', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        setMessages([
          {
            role: 'assistant',
            content:
              data.greeting ||
              "Hey! 👋 I'm AVA, Freedom World's AI Community Consultant — here to help you build your dream community. ✨\nWhat are you thinking of building, and who's it for? 🚀",
            timestamp: new Date(),
          },
        ]);
      })
      .catch(() => {
        setMessages([
          {
            role: 'assistant',
            content:
              "Hey! 👋 I'm AVA, Freedom World's AI Community Consultant — here to help you build your dream community. ✨\nWhat are you thinking of building, and who's it for? 🚀",
            timestamp: new Date(),
          },
        ]);
      })
      .finally(() => setIsLoading(false));
  }, []);

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

        // Call chat API
        const res = await fetch('/api/onboarding/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages,
            extractedData: communityData,
          }),
        });

        if (!res.ok) throw new Error('Failed to send message');

        // Handle SSE streaming
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let replyText = '';
        let extractedUpdate: Partial<CommunityData> | null = null;

        if (reader) {
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
                    replyText += parsed.content;
                  } else if (parsed.type === 'data') {
                    extractedUpdate = parsed.updatedData;
                  }
                } catch {
                  // ignore parse errors
                }
              }
            }
          }
        }

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: replyText || 'I apologize, I encountered an issue. Could you please repeat that?',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (extractedUpdate) {
          setCommunityData((prev) => {
            const next = { ...prev, ...extractedUpdate };
            if (extractedUpdate!.name && !isPreviewVisible) {
              setIsPreviewVisible(true);
            }
            // Track onboarding steps based on extracted data
            if (extractedUpdate!.communityClass) track.onboardStep('', 'class_selection', { class: extractedUpdate!.communityClass });
            if (extractedUpdate!.name) track.onboardStep('', 'name_selection', { name: extractedUpdate!.name });
            if (extractedUpdate!.description) track.onboardStep('', 'description_selection', {});
            if (extractedUpdate!.category) track.onboardStep('', 'inference_confirmation', { category: extractedUpdate!.category });
            return next;
          });
        }

        // Detect image generation requests
        const imageGenerationRequested = detectImageGenerationRequest(content, replyText);
        if (imageGenerationRequested && (imageGenerationRequested.logo || imageGenerationRequested.banner)) {
          let statusMessage = '';
          if (imageGenerationRequested.logo && imageGenerationRequested.banner) {
            statusMessage = '✨ Generating your logo and banner...';
          } else if (imageGenerationRequested.logo) {
            statusMessage = '✨ Generating your logo...';
          } else if (imageGenerationRequested.banner) {
            statusMessage = '✨ Generating your banner...';
          }

          if (statusMessage) {
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: statusMessage, timestamp: new Date() },
            ]);
          }

          setTimeout(async () => {
            try {
              if (imageGenerationRequested.logo && imageGenerationRequested.banner) {
                await Promise.all([generateImage('logo'), generateImage('banner')]);
                setMessages((prev) => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: 'Your logo and banner are ready! 🎨 You can now create your community.',
                    timestamp: new Date(),
                  },
                ]);
              } else if (imageGenerationRequested.logo) {
                await generateImage('logo');
                setMessages((prev) => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: 'Your logo is ready! 🎨 You can now create your community.',
                    timestamp: new Date(),
                  },
                ]);
              } else if (imageGenerationRequested.banner) {
                await generateImage('banner');
                setMessages((prev) => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: 'Your banner is ready! 🎨 You can now create your community.',
                    timestamp: new Date(),
                  },
                ]);
              }
            } catch (err: any) {
              setError(err.message || 'Image generation failed');
            }
          }, 500);
        }

        // Check regeneration requests
        const regenRequest = detectRegenerationRequest(content, communityData);
        if (regenRequest && (regenRequest.logo || regenRequest.banner)) {
          setTimeout(async () => {
            try {
              if (regenRequest.logo && regenRequest.banner) {
                await Promise.all([generateImage('logo'), generateImage('banner')]);
                setMessages((prev) => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: 'Your new logo and banner are ready! 🎨',
                    timestamp: new Date(),
                  },
                ]);
              } else if (regenRequest.logo) {
                await generateImage('logo');
                setMessages((prev) => [
                  ...prev,
                  { role: 'assistant', content: 'Your new logo is ready! 🎨', timestamp: new Date() },
                ]);
              } else if (regenRequest.banner) {
                await generateImage('banner');
                setMessages((prev) => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: 'Your new banner is ready! 🎨',
                    timestamp: new Date(),
                  },
                ]);
              }
            } catch (err: any) {
              setError(err.message || 'Image generation failed');
            }
          }, 500);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to send message');
        console.error('Send message error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, communityData, isPreviewVisible]
  );

  const updateCommunityData = useCallback((data: Partial<CommunityData>) => {
    setCommunityData((prev) => ({ ...prev, ...data }));
  }, []);

  const showPreview = useCallback(() => {
    setIsPreviewVisible(true);
  }, []);

  const generateImage = useCallback(
    async (type: 'logo' | 'banner') => {
      try {
        if (type === 'logo') setIsGeneratingLogo(true);
        else setIsGeneratingBanner(true);
        setError(null);

        const res = await fetch('/api/onboarding/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, communityData }),
        });

        const result = await res.json();

        if (result.success && result.imageUrl) {
          setCommunityData((prev) => ({ ...prev, [type]: result.imageUrl }));
        } else {
          setError(result.error || `Failed to generate ${type}`);
        }
      } catch (err: any) {
        setError(err.message || `Failed to generate ${type}`);
        console.error(`Generate ${type} error:`, err);
      } finally {
        if (type === 'logo') setIsGeneratingLogo(false);
        else setIsGeneratingBanner(false);
      }
    },
    [communityData]
  );

  const resetSession = useCallback(() => {
    setMessages([
      {
        role: 'assistant',
        content:
          "Welcome! I'm excited to help you build your new community on Freedom World. Let's start with the basics.",
        timestamp: new Date(),
      },
    ]);
    setCommunityData({ primaryColor: '#ffffff' });
    setIsPreviewVisible(false);
    setCurrentPhase('context_collection');
    setError(null);
  }, []);

  const value = {
    messages,
    communityData,
    isPreviewVisible,
    currentPhase,
    isLoading,
    isGeneratingLogo,
    isGeneratingBanner,
    error,
    sendMessage,
    updateCommunityData,
    showPreview,
    resetSession,
    generateImage,
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
