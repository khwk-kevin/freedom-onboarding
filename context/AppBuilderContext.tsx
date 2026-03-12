'use client';

/**
 * Freedom World App Builder — AppBuilderContext
 * Sprint 3.3 — End-to-End Interview Pipeline
 *
 * The main React Context that drives the entire interview → build → preview flow.
 * Wires together: AVA chat, spec extraction, provisioning, build dispatcher, PostHog.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import type { MerchantAppSpec, VMStatus, BuildTrigger } from '@/lib/app-builder/types';
import { updateSpecFromExtractions } from '@/lib/app-builder/extract-spec';
import { APP_BUILDER_SYSTEM_PROMPT, getPhase1bPrompt } from '@/lib/app-builder/ava-prompt';
import { track, identify, setContext } from '@/lib/analytics/posthog';
import { EVENTS } from '@/lib/analytics/events';

// ============================================================
// TYPES
// ============================================================

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type InterviewPhase = 'phase1a' | 'phase1b' | 'review' | 'complete';

export interface BuildStatus {
  isBuilding: boolean;
  queueDepth: number;
  currentTask?: string;
}

interface AppBuilderContextType {
  // ── State ──────────────────────────────────────────────────
  messages: Message[];
  merchantAppSpec: MerchantAppSpec;
  interviewPhase: InterviewPhase;
  vmStatus: VMStatus;
  vmDevUrl: string | null;
  buildStatus: BuildStatus;
  isAnonymous: boolean;
  showSignupWall: boolean;
  sessionId: string;
  tokenBalance: number | null;
  tokenUsed: number;
  isLoading: boolean;
  error: string | null;
  isAbandoned: boolean;

  // ── Actions ─────────────────────────────────────────────────
  startSession: () => void;
  sendMessage: (text: string) => Promise<void>;
  handleSignup: (userId: string) => Promise<void>;
  handleColorPick: (hex: string) => void;
  handleAdHocRequest: (message: string) => Promise<void>;
  finalizeAndDeploy: () => void;
  dismissError: () => void;
  resumeAbandonedSession: () => Promise<void>;
}

// ============================================================
// DEFAULTS
// ============================================================

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function createDefaultSpec(merchantId: string): MerchantAppSpec {
  const now = new Date().toISOString();
  return {
    id: merchantId,
    slug: '',
    region: 'ap-southeast-1',
    appType: 'business',
    primaryLanguage: 'en',
    tokenBalance: 10000,
    tokenUsed: 0,
    status: 'interviewing',
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================
// CONTEXT
// ============================================================

const AppBuilderContext = createContext<AppBuilderContextType | undefined>(undefined);

// ============================================================
// PROVIDER
// ============================================================

export function AppBuilderProvider({ children }: { children: React.ReactNode }) {
  // ── Session identity ──────────────────────────────────────
  const [sessionId, setSessionId] = useState<string>('');
  const [merchantId, setMerchantId] = useState<string>('');

  // ── Chat state ────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Interview state ───────────────────────────────────────
  const [merchantAppSpec, setMerchantAppSpec] = useState<MerchantAppSpec>(
    createDefaultSpec('')
  );
  const [interviewPhase, setInterviewPhase] = useState<InterviewPhase>('phase1a');

  // ── VM / Preview state ────────────────────────────────────
  const [vmStatus, setVmStatus] = useState<VMStatus>('stopped');
  const [vmDevUrl, setVmDevUrl] = useState<string | null>(null);

  // ── Build state ───────────────────────────────────────────
  const [buildStatus, setBuildStatus] = useState<BuildStatus>({
    isBuilding: false,
    queueDepth: 0,
  });

  // ── Auth / gate state ─────────────────────────────────────
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [showSignupWall, setShowSignupWall] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [tokenUsed, setTokenUsed] = useState(0);

  // ── Internal refs ─────────────────────────────────────────
  // Track provisioning so we don't double-provision
  const isProvisioningRef = useRef(false);
  const provisionedRef = useRef(false);
  // Latest spec ref — used inside async callbacks to avoid stale closures
  const specRef = useRef<MerchantAppSpec>(merchantAppSpec);
  useEffect(() => {
    specRef.current = merchantAppSpec;
  }, [merchantAppSpec]);

  // ── Abandonment timer ref ─────────────────────────────────
  const abandonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether the session has been abandoned (so we can resume on return)
  const [isAbandoned, setIsAbandoned] = useState(false);

  // ── Poll build status while building ─────────────────────
  useEffect(() => {
    if (!buildStatus.isBuilding || !merchantId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/apps/build-status?merchantId=${merchantId}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          isBuilding: boolean;
          queueDepth: number;
          currentTask?: string;
        };
        setBuildStatus({
          isBuilding: data.isBuilding,
          queueDepth: data.queueDepth,
          currentTask: data.currentTask,
        });
      } catch {
        // non-fatal
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [buildStatus.isBuilding, merchantId]);

  // ============================================================
  // SESSION ABANDONMENT DETECTION
  // ============================================================

  /** Reset the 5-minute inactivity timer. Call on every user message. */
  const resetAbandonmentTimer = useCallback(() => {
    if (abandonTimerRef.current) clearTimeout(abandonTimerRef.current);

    abandonTimerRef.current = setTimeout(async () => {
      const spec = specRef.current;
      // Only count as abandoned if we have a meaningful session in progress
      if (!spec.id || !spec.businessType) return;

      console.log('[AppBuilderContext] Session abandoned — stopping Railway service.');
      setIsAbandoned(true);

      track(EVENTS.SESSION_ABANDONED, {
        merchantId: spec.id,
        sessionId,
        lastStep: spec.status,
        primaryLanguage: spec.primaryLanguage,
      });

      // Stop the Railway service to avoid cost bleed
      if (spec.railwayProjectId && spec.railwayServiceId) {
        try {
          await fetch('/api/apps/stop-vm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ merchantId: spec.id }),
          });
        } catch (err) {
          console.error('[AppBuilderContext] Failed to stop Railway service on abandon:', err);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }, [sessionId]);

  /** Cleanup abandonment timer on unmount */
  useEffect(() => {
    return () => {
      if (abandonTimerRef.current) clearTimeout(abandonTimerRef.current);
    };
  }, []);

  /**
   * Resume a previously abandoned session.
   * Reloads spec from Supabase and restarts the Railway service.
   */
  const resumeAbandonedSession = useCallback(async () => {
    const spec = specRef.current;
    if (!spec.id) return;

    setIsAbandoned(false);
    console.log('[AppBuilderContext] Resuming abandoned session for merchant:', spec.id);

    try {
      // 1. Reload spec from Supabase
      const loadRes = await fetch(`/api/apps/load-spec?merchantId=${spec.id}`);
      if (loadRes.ok) {
        const loadData = (await loadRes.json()) as { spec: MerchantAppSpec };
        if (loadData.spec) {
          setMerchantAppSpec(loadData.spec);
          console.log('[AppBuilderContext] Spec reloaded from Supabase.');
        }
      }

      // 2. Restart the Railway service
      if (spec.railwayProjectId && spec.railwayServiceId) {
        setVmStatus('starting');
        const startRes = await fetch('/api/apps/start-iteration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId: spec.id }),
        });
        if (startRes.ok) {
          const startData = (await startRes.json()) as { devUrl?: string };
          if (startData.devUrl) {
            setVmDevUrl(startData.devUrl);
            setVmStatus('ready');
          }
        } else {
          setVmStatus('error');
        }
      }
    } catch (err) {
      console.error('[AppBuilderContext] resumeAbandonedSession error:', err);
      setVmStatus('error');
    }

    // Restart the abandonment timer
    resetAbandonmentTimer();
  }, [resetAbandonmentTimer]);

  // ============================================================
  // PROVISIONING — starts when Q1 businessType is first detected
  // ============================================================

  const startProvisioning = useCallback(
    async (spec: MerchantAppSpec) => {
      if (isProvisioningRef.current || provisionedRef.current) return;
      isProvisioningRef.current = true;
      setVmStatus('provisioning');

      console.log('[AppBuilderContext] Starting provisioning for merchant:', spec.id);

      try {
        // Step 1: Create GitHub repo + Railway project
        const res = await fetch('/api/apps/provision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchantId: spec.id,
            category: spec.category ?? 'general',
          }),
        });

        if (!res.ok) {
          const errData = (await res.json()) as { error?: string };
          throw new Error(errData.error ?? 'Provision failed');
        }

        const data = (await res.json()) as {
          projectId: string;
          serviceId: string;
          devUrl: string;
          repoUrl?: string;
          cloneUrl?: string;
        };

        const { projectId, serviceId, devUrl, repoUrl } = data;

        // Update spec with infra IDs
        setMerchantAppSpec((prev) => ({
          ...prev,
          railwayProjectId: projectId,
          railwayServiceId: serviceId,
          githubRepoUrl: repoUrl,
          updatedAt: new Date().toISOString(),
        }));

        setVmStatus('starting');
        if (devUrl) setVmDevUrl(devUrl);

        // Step 2: Poll vm-status until ready
        let attempts = 0;
        const maxAttempts = 20; // 20 × 3s = 60s max
        const pollReady = async (): Promise<void> => {
          if (attempts >= maxAttempts) {
            setVmStatus('error');
            return;
          }
          attempts++;

          const statusRes = await fetch(
            `/api/apps/vm-status?serviceId=${serviceId}`
          );
          if (!statusRes.ok) {
            await new Promise((r) => setTimeout(r, 3000));
            return pollReady();
          }

          const statusData = (await statusRes.json()) as {
            status: string;
            devUrl?: string;
          };

          if (statusData.status === 'ready') {
            setVmStatus('ready');
            if (statusData.devUrl) setVmDevUrl(statusData.devUrl);
            provisionedRef.current = true;
          } else if (statusData.status === 'error') {
            setVmStatus('error');
          } else {
            // Still starting — poll again
            await new Promise((r) => setTimeout(r, 3000));
            return pollReady();
          }
        };

        await pollReady();
      } catch (err) {
        console.error('[AppBuilderContext] Provisioning error:', err);
        setVmStatus('error');
      } finally {
        isProvisioningRef.current = false;
      }
    },
    []
  );

  // ============================================================
  // DISPATCH BUILD TASK — calls /api/apps/build API route
  // ============================================================

  const dispatchBuild = useCallback(
    async (trigger: BuildTrigger, spec: MerchantAppSpec, adHocMsg?: string) => {
      if (!spec.railwayProjectId || !spec.railwayServiceId) {
        console.log(
          '[AppBuilderContext] Skipping build dispatch — Railway not provisioned yet'
        );
        return;
      }

      setBuildStatus((prev) => ({
        ...prev,
        isBuilding: true,
        currentTask: trigger,
      }));

      track(EVENTS.APP_BUILD_STARTED, {
        merchantId: spec.id,
        sessionId,
        trigger,
      });

      try {
        await fetch('/api/apps/build', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchantId: spec.id,
            trigger,
            spec,
            adHocMessage: adHocMsg,
          }),
        });
        // Build is async on server (202) — polling handles status updates
      } catch (err) {
        console.error('[AppBuilderContext] Build dispatch error:', err);
        setBuildStatus((prev) => ({ ...prev, isBuilding: false }));
      }
    },
    [sessionId]
  );

  // ============================================================
  // HANDLE AVA RESPONSE — extract tags, update spec, trigger builds
  // ============================================================

  const handleAVAResponse = useCallback(
    async (response: string, currentSpec: MerchantAppSpec) => {
      // 1. Extract all [[TAG:value]] patterns and get updated spec + triggers
      const extracted = updateSpecFromExtractions(currentSpec, response);
      const {
        _triggers,
        _triggerSignupWall,
        _triggerFinalize,
        ...updatedSpec
      } = extracted;

      // Persist updated spec to state
      setMerchantAppSpec(updatedSpec);

      // 2. Check if businessType newly detected → start provisioning
      if (updatedSpec.businessType && !currentSpec.businessType) {
        setContext({
          merchantId: updatedSpec.id,
          appType: updatedSpec.appType,
          category: updatedSpec.category,
          primaryLanguage: updatedSpec.primaryLanguage,
        });
        track(EVENTS.Q1_ANSWERED, {
          merchantId: updatedSpec.id,
          sessionId,
          appType: updatedSpec.appType,
          businessType: updatedSpec.businessType,
        });
        // Start provisioning in background (don't await)
        startProvisioning(updatedSpec);
      }

      // 3. Handle SCRAPE_URL → run scraper, then download assets
      const scrapeUrl = updatedSpec.scrapedData?.website;
      const prevScrapeUrl = currentSpec.scrapedData?.website;
      let specAfterScrape = updatedSpec;

      if (scrapeUrl && scrapeUrl !== prevScrapeUrl) {
        console.log('[AppBuilderContext] Scraping URL:', scrapeUrl);
        try {
          const scrapeRes = await fetch('/api/apps/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: scrapeUrl, merchantId: updatedSpec.id }),
          });

          if (scrapeRes.ok) {
            const scrapeData = (await scrapeRes.json()) as {
              spec: Partial<MerchantAppSpec>;
            };
            specAfterScrape = {
              ...updatedSpec,
              ...scrapeData.spec,
              updatedAt: new Date().toISOString(),
            };
            setMerchantAppSpec(specAfterScrape);

            track(EVENTS.Q2_SCRAPE_SUCCESS, {
              merchantId: updatedSpec.id,
              sessionId,
              hasPhotos: (scrapeData.spec.scrapedData?.photos?.length ?? 0) > 0,
              hasHours: !!scrapeData.spec.scrapedData?.hours,
              hasProducts: (scrapeData.spec.scrapedData?.categories?.length ?? 0) > 0,
            });
          } else {
            track(EVENTS.Q2_SCRAPE_SKIP, {
              merchantId: updatedSpec.id,
              sessionId,
              reason: 'scrape_failed',
            });
          }
        } catch (err) {
          console.error('[AppBuilderContext] Scrape error:', err);
        }
      }

      // 4. Dispatch build tasks for each detected trigger
      const specForBuild = specAfterScrape;
      if (specForBuild.railwayProjectId && specForBuild.railwayServiceId) {
        for (const trigger of _triggers ?? []) {
          await dispatchBuild(trigger, specForBuild);
        }
      } else if ((_triggers ?? []).length > 0) {
        // Queue triggers for when Railway is ready — store in spec for reference
        console.log(
          '[AppBuilderContext] Triggers pending provisioning:',
          _triggers
        );
      }

      // 5. Signup wall
      if (_triggerSignupWall && isAnonymous) {
        track(EVENTS.SIGNUP_WALL_SHOWN, { merchantId: updatedSpec.id, sessionId });
        setShowSignupWall(true);
      }

      // 6. Finalize → review phase
      if (_triggerFinalize) {
        setInterviewPhase('review');
      }

      // 7. Track mood selection
      if (updatedSpec.mood && !currentSpec.mood) {
        track(EVENTS.Q3_MOOD_SELECTED, {
          merchantId: updatedSpec.id,
          sessionId,
          mood: updatedSpec.mood,
          moodKeywords: updatedSpec.moodKeywords ?? [],
        });
      }

      // 8. Track color selection
      if (updatedSpec.primaryColor && !currentSpec.primaryColor) {
        track(EVENTS.Q4_COLOR_SELECTED, {
          merchantId: updatedSpec.id,
          sessionId,
          primaryColor: updatedSpec.primaryColor,
          method: 'typed',
        });
      }

      // 9. Periodically save to Supabase (don't await — fire and forget)
      saveSpecToSupabase(specForBuild);
    },
    [isAnonymous, sessionId, startProvisioning, dispatchBuild]
  );

  // ============================================================
  // SAVE TO SUPABASE — fire and forget
  // ============================================================

  const saveSpecToSupabase = useCallback(async (spec: MerchantAppSpec) => {
    if (!spec.id || !spec.businessType) return; // Don't save until we have meaningful data
    try {
      await fetch('/api/apps/save-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: spec.id, spec }),
      }).catch(() => {
        // Non-fatal — API route may not exist yet in this sprint
      });
    } catch {
      // Non-fatal
    }
  }, []);

  // ============================================================
  // START SESSION
  // ============================================================

  const startSession = useCallback(() => {
    const newSessionId = generateUUID();
    const newMerchantId = generateUUID();

    setSessionId(newSessionId);
    setMerchantId(newMerchantId);

    const spec = createDefaultSpec(newMerchantId);
    setMerchantAppSpec(spec);

    setContext({ sessionId: newSessionId });

    track(EVENTS.ONBOARDING_STARTED, {
      sessionId: newSessionId,
      source:
        typeof window !== 'undefined' ? document.referrer || 'direct' : 'direct',
    });

    // Add AVA's opening greeting as the first assistant message
    const greeting: Message = {
      role: 'assistant',
      content:
        "Hey! I'm AVA — I'll help you build your app. What are we making today?",
      timestamp: new Date(),
    };
    setMessages([greeting]);
  }, []);

  // ============================================================
  // SEND MESSAGE — main interview loop
  // ============================================================

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      // Reset the 5-minute inactivity timer on every user message
      resetAbandonmentTimer();

      setIsLoading(true);
      setError(null);

      const userMsg: Message = {
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);

      try {
        // Determine system prompt based on phase
        const currentSpec = specRef.current;
        const systemPrompt =
          interviewPhase === 'phase1b'
            ? getPhase1bPrompt(currentSpec) + '\n\n---\n\n' + APP_BUILDER_SYSTEM_PROMPT
            : APP_BUILDER_SYSTEM_PROMPT;

        // Call AVA
        const res = await fetch('/api/apps/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            systemPrompt,
            phase: interviewPhase,
          }),
        });

        if (!res.ok) {
          const errData = (await res.json()) as { error?: string };
          throw new Error(errData.error ?? 'Chat API error');
        }

        const data = (await res.json()) as { text: string };
        const avaResponse = data.text;

        // Add assistant message
        const assistantMsg: Message = {
          role: 'assistant',
          content: avaResponse || "I'm having a little trouble — could you repeat that?",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Extract tags + update spec + trigger builds (non-fatal)
        try {
          await handleAVAResponse(avaResponse, currentSpec);
        } catch (postErr) {
          console.error('[AppBuilderContext] handleAVAResponse error (non-fatal):', postErr);
        }
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        console.error('[AppBuilderContext] sendMessage error:', e.message);
        setError('Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, interviewPhase, handleAVAResponse, resetAbandonmentTimer]
  );

  // ============================================================
  // HANDLE SIGNUP
  // ============================================================

  const handleSignup = useCallback(
    async (userId: string) => {
      setIsAnonymous(false);
      setShowSignupWall(false);
      setInterviewPhase('phase1b');

      const spec = specRef.current;

      // Update spec with Freedom user ID and token balance
      const updatedSpec: MerchantAppSpec = {
        ...spec,
        freedomUserId: userId,
        tokenBalance: 10000,
        updatedAt: new Date().toISOString(),
      };
      setMerchantAppSpec(updatedSpec);
      setTokenBalance(10000);

      identify(userId, {
        merchantId: spec.id,
        sessionId,
        appType: updatedSpec.appType,
        primaryLanguage: updatedSpec.primaryLanguage,
      });

      track(EVENTS.SIGNUP_COMPLETED, {
        merchantId: spec.id,
        sessionId,
        freedomUserId: userId,
      });

      // TODO: Create Freedom community (existing community creation logic)
      // This will be implemented when the Freedom sync API is available
      // For now, log it:
      console.log('[AppBuilderContext] handleSignup — community creation pending Sprint 4.2');

      // Save to Supabase
      await saveSpecToSupabase(updatedSpec);

      // Add transition message to chat
      const continueMsg: Message = {
        role: 'assistant',
        content: getPhase1bContinuationGreeting(updatedSpec),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, continueMsg]);
    },
    [sessionId, saveSpecToSupabase]
  );

  // ============================================================
  // HANDLE COLOR PICK
  // ============================================================

  const handleColorPick = useCallback(
    (hex: string) => {
      const spec = specRef.current;
      const updatedSpec: MerchantAppSpec = {
        ...spec,
        primaryColor: hex,
        updatedAt: new Date().toISOString(),
      };
      setMerchantAppSpec(updatedSpec);

      track(EVENTS.Q4_COLOR_SELECTED, {
        merchantId: spec.id,
        sessionId,
        primaryColor: hex,
        method: 'picker',
      });

      // Dispatch color_changed build
      dispatchBuild('color_changed', updatedSpec);
    },
    [sessionId, dispatchBuild]
  );

  // ============================================================
  // HANDLE AD-HOC REQUEST
  // ============================================================

  const handleAdHocRequest = useCallback(
    async (message: string) => {
      const spec = specRef.current;
      await dispatchBuild('ad_hoc_request', spec, message);
    },
    [dispatchBuild]
  );

  // ============================================================
  // FINALIZE AND DEPLOY
  // ============================================================

  const finalizeAndDeploy = useCallback(() => {
    // Sprint 4.1 will implement the actual deploy flow.
    // For now: set phase to 'complete'.
    setInterviewPhase('complete');

    const spec = specRef.current;
    track(EVENTS.APP_DEPLOYED, {
      merchantId: spec.id,
      sessionId,
      productionUrl: spec.productionUrl ?? 'pending',
      slug: spec.slug,
    });

    console.log(
      '[AppBuilderContext] finalizeAndDeploy — deploy flow pending Sprint 4.1'
    );
  }, [sessionId]);

  // ============================================================
  // DISMISS ERROR
  // ============================================================

  const dismissError = useCallback(() => setError(null), []);

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  const value: AppBuilderContextType = {
    messages,
    merchantAppSpec,
    interviewPhase,
    vmStatus,
    vmDevUrl,
    buildStatus,
    isAnonymous,
    showSignupWall,
    sessionId,
    tokenBalance,
    tokenUsed,
    isLoading,
    error,
    isAbandoned,
    startSession,
    sendMessage,
    handleSignup,
    handleColorPick,
    handleAdHocRequest,
    finalizeAndDeploy,
    dismissError,
    resumeAbandonedSession,
  };

  return (
    <AppBuilderContext.Provider value={value}>
      {children}
    </AppBuilderContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

export function useAppBuilder() {
  const ctx = useContext(AppBuilderContext);
  if (!ctx) {
    throw new Error('useAppBuilder must be used within AppBuilderProvider');
  }
  return ctx;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Generate a friendly continuation message after signup for phase1b.
 * Adapts language based on spec.primaryLanguage.
 */
function getPhase1bContinuationGreeting(spec: MerchantAppSpec): string {
  const lang = spec.primaryLanguage ?? 'en';
  const name = spec.businessName ? ` for ${spec.businessName}` : '';

  if (lang === 'th') {
    return `ยินดีต้อนรับกลับมา! มาต่อกันเลย — ตอนนี้จะสร้างส่วนที่เหลือของแอพ${name} 🚀`;
  }
  if (lang === 'ja') {
    return `おかえりなさい！続けましょう — ${name}のアプリの残りを作っていきます 🚀`;
  }
  if (lang === 'ko') {
    return `다시 오셨군요! 계속해봐요 — ${name} 앱의 나머지 부분을 만들겠습니다 🚀`;
  }

  return `Welcome back! Let's keep going — now we'll build out the rest of your app${name}. 🚀`;
}
