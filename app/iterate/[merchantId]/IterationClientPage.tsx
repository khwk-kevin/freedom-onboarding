'use client';

/**
 * IterationClientPage — Iteration Mode UI
 * Sprint 5.1 — Console "Edit My App" Iframe
 *
 * Client component that renders the full AVA builder in iteration mode:
 *  - No interview flow — just free-form chat from phase='review'
 *  - AVA has full vault context (loaded from spec)
 *  - Token counter visible
 *  - "Deploy changes" button (calls /api/apps/deploy)
 *  - "End session" button (calls /api/apps/stop-vm)
 *
 * Uses AppBuilderProvider initialised with the existing spec + phase='review'.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppBuilderProvider, useAppBuilder } from '@/context/AppBuilderContext';
import { AppBuilderLayout } from '@/components/onboarding/AppBuilderLayout';
import type { MerchantAppSpec } from '@/lib/app-builder/types';
import { track } from '@/lib/tracking/unified';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ============================================================
// ROOT — wraps everything in the provider
// ============================================================

interface IterationClientPageProps {
  initialSpec: MerchantAppSpec;
  merchantId: string;
}

export function IterationClientPage({
  initialSpec,
  merchantId,
}: IterationClientPageProps) {
  return (
    <AppBuilderProvider>
      <IterationInner initialSpec={initialSpec} merchantId={merchantId} />
    </AppBuilderProvider>
  );
}

// ============================================================
// INNER — boots iteration session, then renders chat UI
// ============================================================

interface IterationInnerProps {
  initialSpec: MerchantAppSpec;
  merchantId: string;
}

function IterationInner({ initialSpec, merchantId }: IterationInnerProps) {
  const {
    messages,
    vmStatus,
    vmDevUrl,
    buildStatus,
    tokenBalance,
    tokenUsed,
    isLoading,
    error,
    sendMessage,
    handleAdHocRequest,
    finalizeAndDeploy,
    dismissError,
  } = useAppBuilder();

  // ── Boot state ─────────────────────────────────────────────
  const [bootStatus, setBootStatus] = useState<
    'idle' | 'starting' | 'ready' | 'error'
  >('idle');
  const [bootError, setBootError] = useState<string | null>(null);
  const [devUrl, setDevUrl] = useState<string | null>(vmDevUrl);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState<string | null>(
    initialSpec.productionUrl ?? null
  );
  const [deployError, setDeployError] = useState<string | null>(null);

  // Sync vmDevUrl from context once provisioning completes
  useEffect(() => {
    if (vmDevUrl) setDevUrl(vmDevUrl);
  }, [vmDevUrl]);

  // ── Boot: wake the Railway service on mount ────────────────
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    // Track session start
    track.onboardResume(merchantId, 'iteration');

    async function boot() {
      setBootStatus('starting');
      try {
        const res = await fetch(`${API_URL}/apps/start-iteration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId }),
        });

        if (!res.ok) {
          const errData = (await res.json()) as { error?: string };
          throw new Error(errData.error ?? 'Failed to start iteration session');
        }

        const data = (await res.json()) as {
          devUrl: string;
          tokenBalance: number;
        };

        setDevUrl(data.devUrl);
        setBootStatus('ready');
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setBootError(e.message);
        setBootStatus('error');
      }
    }

    boot();
  }, [merchantId]);

  // ── Scroll chat to bottom on new messages ──────────────────
  const chatBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── End session ────────────────────────────────────────────
  const handleEndSession = useCallback(async () => {
    if (isEndingSession) return;
    setIsEndingSession(true);
    try {
      await fetch(`${API_URL}/apps/stop-vm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId }),
      });
      // Session ended — redirect or show confirmation
      window.close(); // Works if opened in iframe/popup from console
    } catch (err) {
      console.error('[IterationClientPage] end session error:', err);
    } finally {
      setIsEndingSession(false);
    }
  }, [merchantId, isEndingSession]);

  // ── Deploy changes ──────────────────────────────────────────
  const handleDeploy = useCallback(async () => {
    if (isDeploying) return;
    setIsDeploying(true);
    setDeployError(null);
    try {
      const res = await fetch(`${API_URL}/apps/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId }),
      });

      const data = (await res.json()) as {
        productionUrl?: string;
        error?: string;
        buildLogs?: string;
      };

      if (!res.ok || data.error) {
        throw new Error(data.error ?? 'Deploy failed');
      }

      setDeployUrl(data.productionUrl ?? null);
      finalizeAndDeploy(); // Update context state
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setDeployError(e.message);
    } finally {
      setIsDeploying(false);
    }
  }, [merchantId, isDeploying, finalizeAndDeploy]);

  // ── Boot loading screen ────────────────────────────────────
  if (bootStatus === 'idle' || bootStatus === 'starting') {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#08061A] gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent border-violet-500 animate-spin" />
        <p className="text-white/60 text-sm">Waking up your builder...</p>
        <p className="text-white/30 text-xs">This usually takes 10–20 seconds</p>
      </div>
    );
  }

  if (bootStatus === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#08061A] gap-4">
        <div className="text-3xl">⚠️</div>
        <p className="text-white/80 text-sm font-semibold">
          Couldn't wake your builder
        </p>
        <p className="text-white/40 text-xs max-w-xs text-center">
          {bootError ?? 'Unknown error. Please try again.'}
        </p>
        <button
          onClick={() => {
            booted.current = false;
            setBootStatus('idle');
            setBootError(null);
          }}
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Main iteration UI ──────────────────────────────────────
  return (
    <AppBuilderLayout
      devUrl={devUrl}
      vmStatus={bootStatus === 'ready' ? 'ready' : vmStatus}
      isBuilding={buildStatus.isBuilding}
      buildTask={buildStatus.currentTask}
      tokenBalance={initialSpec.tokenBalance - tokenUsed}
      onRetry={() => {
        booted.current = false;
        setBootStatus('idle');
        boot();
      }}
    >
      {/* ── Iteration chat panel ──────────────────────────── */}
      <div className="flex flex-col h-full overflow-hidden bg-[#08061A]">
        {/* Iteration mode banner */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-violet-600/15 border-b border-violet-500/20">
          <span className="text-violet-400 text-xs font-semibold uppercase tracking-wide">
            ✏️ Edit Mode
          </span>
          <span className="text-white/30 text-xs">
            — {initialSpec.businessName ?? 'Your app'}
          </span>
          {deployUrl && (
            <a
              href={deployUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs text-violet-400 hover:text-violet-300 truncate max-w-[200px]"
            >
              {deployUrl.replace('https://', '')} ↗
            </a>
          )}
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
          {/* Welcome message if no history yet */}
          {messages.length === 0 && (
            <IterationWelcome businessName={initialSpec.businessName} />
          )}

          {messages.map((msg, i) => (
            <IterationChatBubble key={i} message={msg} />
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-2 items-center px-1">
              <AVAAvatar />
              <TypingDots />
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-red-900/20 border border-red-500/20 px-4 py-3 text-sm text-red-300">
              <span>{error}</span>
              <button
                onClick={dismissError}
                className="shrink-0 text-red-400 hover:text-red-200 transition-colors"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}

          {/* Deploy error */}
          {deployError && (
            <div className="rounded-xl bg-red-900/20 border border-red-500/20 px-4 py-3 text-sm text-red-300">
              Deploy failed: {deployError}
            </div>
          )}

          {/* Successful deploy */}
          {deployUrl && (
            <div className="rounded-xl bg-emerald-900/20 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-300 flex items-center gap-2">
              <span>🎉</span>
              <span>
                Deployed!{' '}
                <a
                  href={deployUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-emerald-200"
                >
                  View live
                </a>
              </span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Action bar: Deploy + End session */}
        <div className="shrink-0 border-t border-white/8 bg-[#0D0B1E]/80 backdrop-blur-md px-4 py-2 flex items-center gap-2">
          {/* Deploy changes */}
          <button
            onClick={handleDeploy}
            disabled={isDeploying || buildStatus.isBuilding}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500
                       text-white text-xs font-semibold transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/30"
          >
            {isDeploying ? (
              <>
                <span className="w-3 h-3 rounded-full border border-t-transparent border-white animate-spin" />
                Deploying…
              </>
            ) : (
              <>🚀 Deploy changes</>
            )}
          </button>

          {/* End session */}
          <button
            onClick={handleEndSession}
            disabled={isEndingSession}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/8 hover:bg-white/12
                       text-white/60 text-xs font-medium transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEndingSession ? 'Ending…' : '✓ End session'}
          </button>
        </div>

        {/* Chat input */}
        <div className="shrink-0 border-t border-white/8 bg-[#0D0B1E]/80 backdrop-blur-md">
          <IterationChatInput
            onSend={sendMessage}
            onAdHoc={handleAdHocRequest}
            disabled={isLoading}
          />
        </div>
      </div>
    </AppBuilderLayout>
  );
}

// ── Boot helper (callable from onRetry) ─────────────────────────────────────
// Defined outside so the ref can be shared — declared above as an inner fn.
// Re-exporting for the retry callback closure in JSX above.
// (The retry button resets booted.current and bootStatus, then re-runs useEffect)
function boot() {
  // Intentional no-op placeholder — retry is handled by resetting booted.current
  // and bootStatus inside the component, causing the useEffect to re-run.
}

// ============================================================
// WELCOME MESSAGE
// ============================================================

function IterationWelcome({ businessName }: { businessName?: string }) {
  const name = businessName ? ` for ${businessName}` : '';
  return (
    <div className="flex gap-2 items-start">
      <AVAAvatar />
      <div className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed bg-white/8 text-white/90">
        Welcome back! I've loaded your full app context{name}. 🎉
        <br />
        <br />
        Tell me what you'd like to change — I can update the design, add new
        sections, tweak copy, or anything else. What should we work on?
      </div>
    </div>
  );
}

// ============================================================
// CHAT BUBBLE
// ============================================================

interface MessageShape {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function IterationChatBubble({ message }: { message: MessageShape }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && <AVAAvatar />}
      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-violet-600 text-white rounded-br-md'
            : 'bg-white/8 text-white/90 rounded-bl-md'
          }
        `}
      >
        {message.content.split('\n').map((line, i, arr) => (
          <React.Fragment key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function AVAAvatar() {
  return (
    <div className="shrink-0 w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-[11px] font-bold text-white">
      A
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center h-7 px-3 rounded-2xl bg-white/8">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

// ============================================================
// CHAT INPUT (iteration variant — also triggers ad-hoc build)
// ============================================================

interface IterationChatInputProps {
  onSend: (text: string) => Promise<void>;
  onAdHoc: (message: string) => Promise<void>;
  disabled?: boolean;
}

function IterationChatInput({ onSend, disabled = false }: IterationChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    // In iteration mode every message is both a chat message and a potential
    // build trigger — the context handles dispatching ad_hoc_request builds.
    await onSend(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  };

  return (
    <div className="flex items-end gap-2 px-4 py-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Tell AVA what to change…"
        rows={1}
        className="
          flex-1 resize-none rounded-xl bg-white/8 border border-white/10
          px-4 py-3 text-sm text-white placeholder-white/30
          focus:outline-none focus:border-violet-500/50 focus:bg-white/10
          transition-colors disabled:opacity-40 disabled:cursor-not-allowed
          min-h-[44px] max-h-[160px] overflow-y-auto
        "
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="
          shrink-0 w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500
          disabled:opacity-30 disabled:cursor-not-allowed
          flex items-center justify-center transition-colors
        "
        aria-label="Send message"
      >
        <svg className="w-4 h-4 text-white rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  );
}
