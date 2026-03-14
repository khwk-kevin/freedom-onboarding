'use client';

/**
 * AppBuilderClientPage
 * Sprint 3.3 — End-to-End Interview Pipeline
 *
 * Client component that renders the full app builder UI:
 *   - AppBuilderContext.Provider (wraps everything)
 *   - AppBuilderLayout (split: chat left, preview right)
 *   - Chat area: message list + input + send
 *   - Signup wall modal (when showSignupWall=true)
 *   - Color picker (inline in chat at Q4)
 */

import React, { useEffect, useRef, useState } from 'react';
import { AppBuilderProvider, useAppBuilder } from '@/context/AppBuilderContext';
import { AppBuilderLayout } from './AppBuilderLayout';
import { UIStylePicker } from './UIStylePicker';
import { AppBuildingCard } from './cards/AppBuildingCard';
import { track } from '@/lib/analytics/posthog';
import { EVENTS } from '@/lib/analytics/events';

// ============================================================
// ROOT — wraps everything in the provider
// ============================================================

export function AppBuilderClientPage() {
  return (
    <AppBuilderProvider>
      <AppBuilderInner />
    </AppBuilderProvider>
  );
}

// ============================================================
// INNER — consumes the context
// ============================================================

function AppBuilderInner() {
  const {
    messages,
    vmStatus,
    vmDevUrl,
    buildStatus,
    isAnonymous,
    showSignupWall,
    tokenBalance,
    interviewPhase,
    merchantAppSpec,
    isLoading,
    error,
    startSession,
    sendMessage,
    handleSignup,
    handleColorPick,
    handleUiStylePick,
    finalizeAndDeploy,
    dismissError,
  } = useAppBuilder();

  // ── Local state for SSE build progress ───────────────────
  const [isBuildingApp, setIsBuildingApp] = useState(false);
  const [buildDevUrl, setBuildDevUrl] = useState<string | null>(null);

  // Start session on first mount
  const sessionStarted = useRef(false);
  useEffect(() => {
    if (!sessionStarted.current) {
      sessionStarted.current = true;
      startSession();
    }
  }, [startSession]);

  // Scroll chat to bottom on new messages
  const chatBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detect Q4 (color pick phase) — show color picker when primaryColor not yet set
  // and we're at phase1a with mood already selected
  const showColorPicker =
    interviewPhase === 'phase1a' &&
    !!merchantAppSpec.mood &&
    !merchantAppSpec.primaryColor;

  // Show style picker after color is set but uiStyle not yet chosen
  const showStylePicker =
    !!merchantAppSpec.primaryColor &&
    !merchantAppSpec.uiStyle;

  return (
    <>
      <AppBuilderLayout
        devUrl={vmDevUrl}
        vmStatus={vmStatus}
        isBuilding={buildStatus.isBuilding}
        buildTask={buildStatus.currentTask}
        tokenBalance={!isAnonymous ? (tokenBalance ?? undefined) : undefined}
        merchantAppSpec={merchantAppSpec}
        onRetry={() => {
          console.log('[AppBuilderClientPage] Retry requested');
        }}
      >
        {/* ── Chat panel content ───────────────────────────── */}
        <div className="flex flex-col h-full overflow-hidden bg-[#08061A]">
          {/* Message list */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} />
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

            {/* Color picker — appears at Q4 */}
            {showColorPicker && (
              <div className="flex flex-col gap-2 px-1">
                <p className="text-xs font-medium text-white/40 uppercase tracking-wide">
                  Pick a primary color
                </p>
                <InlineColorPicker onColorPick={handleColorPick} />
              </div>
            )}

            {/* UI Style picker — appears after color is chosen */}
            {showStylePicker && (
              <div className="px-1">
                <UIStylePicker
                  value={merchantAppSpec.uiStyle}
                  onSelect={handleUiStylePick}
                  primaryColor={merchantAppSpec.primaryColor}
                />
              </div>
            )}

            {/* Finalize button — appears in review phase (before build starts) */}
            {interviewPhase === 'review' && !isBuildingApp && !buildDevUrl && (
              <div className="flex flex-col items-center gap-3 pt-2">
                <p className="text-xs text-white/50 text-center px-4">
                  Your app spec is complete. Ready to build?
                </p>
                <button
                  onClick={() => {
                    setIsBuildingApp(true);
                    finalizeAndDeploy();
                  }}
                  className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500
                             text-white font-semibold text-sm transition-colors
                             shadow-lg shadow-violet-900/40"
                >
                  🚀 Go Live
                </button>
              </div>
            )}

            {/* SSE build progress — shown after Go Live is clicked */}
            {(isBuildingApp || buildDevUrl) && (
              <div className="px-1">
                <AppBuildingCard
                  merchantId={merchantAppSpec.id}
                  onboardingData={{
                    name: merchantAppSpec.businessName,
                    description: merchantAppSpec.ideaDescription ?? merchantAppSpec.scrapedData?.description,
                    businessType: merchantAppSpec.businessType ?? merchantAppSpec.category,
                    primaryColor: merchantAppSpec.primaryColor,
                    vibe: merchantAppSpec.mood,
                    uiStyle: merchantAppSpec.uiStyle,
                    audiencePersona: merchantAppSpec.audienceDescription,
                    heroFeature: merchantAppSpec.appPriorities?.[0],
                    products: merchantAppSpec.products?.map(p =>
                      p.price !== undefined ? `${p.name}:${p.currency ?? '$'}${p.price}` : p.name
                    ),
                    logo: merchantAppSpec.scrapedData?.photos?.[0],
                    scrapedUrl: merchantAppSpec.scrapedData?.website,
                    scrapedImages: merchantAppSpec.scrapedData?.photos,
                  }}
                  primaryColor={merchantAppSpec.primaryColor}
                  businessName={merchantAppSpec.businessName}
                  onComplete={(devUrl) => {
                    setIsBuildingApp(false);
                    setBuildDevUrl(devUrl);
                  }}
                  onError={() => {
                    setIsBuildingApp(false);
                  }}
                />
              </div>
            )}

            {/* Complete state — after SSE build finishes (non-SSE path) */}
            {interviewPhase === 'complete' && !isBuildingApp && !buildDevUrl && (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <span className="text-3xl">🎉</span>
                <p className="text-sm font-semibold text-white/80">
                  Your app is being deployed!
                </p>
                <p className="text-xs text-white/40">
                  We'll send you a link when it's live.
                </p>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={chatBottomRef} />
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-white/8 bg-[#0D0B1E]/80 backdrop-blur-md">
            <ChatInput
              onSend={sendMessage}
              disabled={isLoading || interviewPhase === 'complete'}
              placeholder={
                interviewPhase === 'review'
                  ? 'Any final changes?'
                  : 'Message AVA...'
              }
            />
          </div>
        </div>
      </AppBuilderLayout>

      {/* ── Signup wall modal ───────────────────────────────── */}
      {showSignupWall && (
        <SignupWallModal
          onSignup={handleSignup}
          onDismiss={() => {
            track(EVENTS.SIGNUP_ABANDONED, {
              page: window.location.pathname,
              via: 'dismiss_button',
            });
          }}
        />
      )}
    </>
  );
}

// ============================================================
// CHAT BUBBLE
// ============================================================

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function ChatBubble({ message }: { message: Message }) {
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
        {/* Render newlines as <br> */}
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
// CHAT INPUT
// ============================================================

interface ChatInputProps {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

function ChatInput({ onSend, disabled = false, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    setValue('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSend(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
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
        placeholder={placeholder ?? 'Message AVA...'}
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
        <svg
          className="w-4 h-4 text-white rotate-90"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </div>
  );
}

// ============================================================
// INLINE COLOR PICKER (Q4)
// ============================================================

const SUGGESTED_COLORS = [
  // Warm
  { hex: '#E85D04', label: 'Burnt orange' },
  { hex: '#D62828', label: 'Deep red' },
  { hex: '#F4A261', label: 'Sandy coral' },
  // Bold
  { hex: '#1D3557', label: 'Deep navy' },
  { hex: '#2D6A4F', label: 'Forest green' },
  { hex: '#7209B7', label: 'Bold violet' },
  // Minimal
  { hex: '#6B7280', label: 'Slate gray' },
  { hex: '#374151', label: 'Charcoal' },
  { hex: '#9CA3AF', label: 'Cool gray' },
  // Playful
  { hex: '#F72585', label: 'Hot pink' },
  { hex: '#4CC9F0', label: 'Sky blue' },
  { hex: '#F8C537', label: 'Sunshine' },
];

interface InlineColorPickerProps {
  onColorPick: (hex: string) => void;
}

function InlineColorPicker({ onColorPick }: InlineColorPickerProps) {
  const [customColor, setCustomColor] = useState('#6366F1');

  return (
    <div className="rounded-xl bg-white/5 border border-white/8 p-4 space-y-3">
      {/* Suggested swatches */}
      <div className="grid grid-cols-6 gap-2">
        {SUGGESTED_COLORS.map((c) => (
          <button
            key={c.hex}
            onClick={() => onColorPick(c.hex)}
            className="w-9 h-9 rounded-lg border-2 border-transparent hover:border-white/40
                       transition-all active:scale-95 hover:scale-105"
            style={{ backgroundColor: c.hex }}
            title={c.label}
            aria-label={`${c.label}: ${c.hex}`}
          />
        ))}
      </div>

      {/* Custom color input */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={customColor}
          onChange={(e) => setCustomColor(e.target.value)}
          className="w-9 h-9 rounded-lg cursor-pointer border border-white/20 bg-transparent"
          aria-label="Custom color picker"
        />
        <input
          type="text"
          value={customColor}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setCustomColor(v);
          }}
          className="flex-1 rounded-lg bg-white/8 border border-white/10 px-3 py-1.5
                     text-sm text-white font-mono focus:outline-none focus:border-violet-500/50"
          placeholder="#RRGGBB"
          maxLength={7}
        />
        <button
          onClick={() => onColorPick(customColor)}
          disabled={!/^#[0-9a-fA-F]{6}$/.test(customColor)}
          className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500
                     text-white text-sm font-medium transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Use
        </button>
      </div>
    </div>
  );
}

// ============================================================
// SIGNUP WALL MODAL
// ============================================================

interface SignupWallModalProps {
  onSignup: (userId: string) => Promise<void>;
  onDismiss?: () => void;
}

function SignupWallModal({ onSignup, onDismiss }: SignupWallModalProps) {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [email, setEmail] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSigningUp) return;

    setIsSigningUp(true);
    setSignupError(null);

    try {
      // Call the existing signup API route
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const errData = (await res.json()) as { error?: string; message?: string };
        throw new Error(errData.error ?? errData.message ?? 'Signup failed');
      }

      const data = (await res.json()) as { merchantId?: string; userId?: string; id?: string };
      const userId = data.merchantId ?? data.userId ?? data.id ?? crypto.randomUUID();

      await onSignup(userId);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setSignupError(e.message);
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Create your Freedom account"
    >
      {/* Modal card */}
      <div className="w-full max-w-sm mx-4 rounded-2xl bg-[#0D0B1E] border border-white/10 shadow-2xl overflow-hidden">
        {/* Gradient top accent */}
        <div className="h-1 bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500" />
        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 text-white/30 hover:text-white/60 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        )}

        <div className="px-6 py-8 space-y-6">
          {/* Headline */}
          <div className="text-center space-y-1">
            <div className="text-2xl">✨</div>
            <h2 className="text-lg font-bold text-white">
              Your app is looking great!
            </h2>
            <p className="text-sm text-white/50">
              Create your free Freedom account to keep building and unlock the full experience.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="signup-email" className="sr-only">
                Email address
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="
                  w-full rounded-xl bg-white/8 border border-white/10
                  px-4 py-3 text-sm text-white placeholder-white/30
                  focus:outline-none focus:border-violet-500/50 focus:bg-white/10
                  transition-colors
                "
                autoFocus
              />
            </div>

            {signupError && (
              <p className="text-xs text-red-400 text-center">{signupError}</p>
            )}

            <button
              type="submit"
              disabled={isSigningUp || !email.trim()}
              className="
                w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500
                text-white font-semibold text-sm transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed
                shadow-lg shadow-violet-900/40
              "
            >
              {isSigningUp ? 'Creating account...' : 'Continue building →'}
            </button>
          </form>

          {/* Fine print */}
          <p className="text-center text-[11px] text-white/25">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
