'use client';

import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { MerchantAppSpec, VMStatus } from '@/lib/app-builder/types';
import { PhoneFrame } from './preview/PhoneFrame';
import { AppPreview } from './preview/AppPreview';

/** Bottom sheet state for mobile preview */
type SheetState = 'closed' | 'peeking' | 'open';

interface AppBuilderLayoutProps {
  /** Railway dev server URL (not used for preview — kept for future Railway phase) */
  devUrl: string | null;
  /** VM lifecycle status */
  vmStatus: VMStatus;
  /** Is a Claude Code build task currently running? */
  isBuilding: boolean;
  /** Description of the current build task */
  buildTask?: string;
  /** Token balance — shown after signup (omit / undefined = pre-signup, hidden) */
  tokenBalance?: number;
  /** Retry handler */
  onRetry?: () => void;
  /** Current merchant app spec — drives the client-side preview */
  merchantAppSpec?: MerchantAppSpec;
  /** Chat / left-panel content */
  children: ReactNode;
}

/**
 * AppBuilderLayout
 *
 * Split-screen layout for the app builder:
 * - Desktop (≥768px):  left 50% chat · right 50% live preview, side-by-side
 * - Mobile (<768px):   chat full-width (primary), preview as bottom sheet
 *                      triggered by floating eye button (bottom-right)
 *
 * Mobile auto-peek: after first build completes the bottom sheet peeks at 30%
 * height for 3 seconds, then slides back down.
 */
export function AppBuilderLayout({
  devUrl,
  vmStatus,
  isBuilding,
  buildTask,
  tokenBalance,
  onRetry,
  merchantAppSpec,
  children,
}: AppBuilderLayoutProps) {
  // Mobile bottom sheet state
  const [sheetState, setSheetState] = useState<SheetState>('closed');
  // Ref-based flag: only auto-peek once per session
  const hasPeekedRef = useRef(false);
  // Track previous isBuilding to detect transition false→true→false
  const prevIsBuildingRef = useRef(false);

  // Track spec version for glow animation
  const [specVersion, setSpecVersion] = useState(0);
  const prevSpecRef = useRef(merchantAppSpec);

  // Increment specVersion when relevant spec fields change (drives glow pulse in PhoneFrame)
  useEffect(() => {
    const prev = prevSpecRef.current;
    const curr = merchantAppSpec;
    if (!curr) return;
    if (
      prev?.primaryColor !== curr.primaryColor ||
      prev?.businessType !== curr.businessType ||
      prev?.businessName !== curr.businessName ||
      prev?.uiStyle !== curr.uiStyle ||
      prev?.products?.length !== curr.products?.length ||
      prev?.mood !== curr.mood
    ) {
      setSpecVersion(v => v + 1);
    }
    prevSpecRef.current = curr;
  }, [merchantAppSpec]);

  // Auto-peek on mobile: when spec first gets meaningful data, peek the preview
  useEffect(() => {
    if (hasPeekedRef.current) return;
    if (merchantAppSpec?.businessType || merchantAppSpec?.primaryColor) {
      hasPeekedRef.current = true;
      setSheetState('peeking');
      const timer = setTimeout(() => {
        setSheetState((s) => (s === 'peeking' ? 'closed' : s));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [merchantAppSpec?.businessType, merchantAppSpec?.primaryColor]);

  // Legacy: also auto-peek after first build completes (for Railway phase later)
  useEffect(() => {
    const wasBuilding = prevIsBuildingRef.current;
    prevIsBuildingRef.current = isBuilding;

    if (wasBuilding && !isBuilding && !hasPeekedRef.current) {
      hasPeekedRef.current = true;
      setSheetState('peeking');
      const timer = setTimeout(() => {
        setSheetState((s) => (s === 'peeking' ? 'closed' : s));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isBuilding]);

  const openSheet = () => setSheetState('open');
  const closeSheet = () => setSheetState('closed');
  const toggleSheet = () => setSheetState((s) => (s === 'open' ? 'closed' : 'open'));

  // Sheet CSS transform:
  //   open    → translateY(0)       – full 60vh visible
  //   peeking → translateY(50%)     – 30vh visible (half of 60vh sheet)
  //   closed  → translateY(100%)    – fully off-screen below
  const sheetTransform =
    sheetState === 'open' ? 'translateY(0)'
    : sheetState === 'peeking' ? 'translateY(50%)'
    : 'translateY(100%)';

  // Token counter colours
  const tokenColor =
    tokenBalance === undefined ? 'text-white/40'
    : tokenBalance > 5000 ? 'text-emerald-400'
    : tokenBalance > 1000 ? 'text-amber-400'
    : 'text-red-400';
  const tokenBg =
    tokenBalance === undefined ? 'bg-white/5'
    : tokenBalance > 5000 ? 'bg-emerald-500/10'
    : tokenBalance > 1000 ? 'bg-amber-500/10'
    : 'bg-red-500/10';
  const formattedBalance = tokenBalance !== undefined ? tokenBalance.toLocaleString() : null;

  return (
    <div
      className="relative flex flex-col w-full h-full overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #08061A 0%, #0F0D2E 50%, #0A0820 100%)' }}
    >
      {/* ── Ambient light orbs ─────────────────────────────────── */}
      {/* Top-right: violet/purple glow */}
      <div
        className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full pointer-events-none z-0 animate-ambient-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 65%)',
          transform: 'translate(25%, -25%)',
        }}
      />
      {/* Bottom-left: blue/indigo glow */}
      <div
        className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 65%)',
          transform: 'translate(-25%, 25%)',
          opacity: 0.08,
        }}
      />
      {/* Center: very subtle warm glow */}
      <div
        className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* ── Top bar ──────────────────────────────────────────── */}
      <header className="relative flex items-center justify-between h-12 px-4 shrink-0 bg-white/[0.02] backdrop-blur-xl border-b border-white/[0.06] z-10">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
            <span className="text-white text-[10px] font-bold">F</span>
          </div>
          <span
            className="text-sm font-semibold"
            style={{
              background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Freedom Builder
          </span>
        </div>

        {/* Token counter — only visible after signup */}
        {formattedBalance !== null && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${tokenBg} ${tokenColor}`}
            title="Token balance"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 18a8 8 0 110-16 8 8 0 010 16zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
            </svg>
            <span>{formattedBalance} tokens</span>
            {(tokenBalance ?? 0) <= 1000 && (
              <span className="ml-1 text-[10px] opacity-75">· Low</span>
            )}
          </div>
        )}

        {/* Animated gradient separator line at bottom of header */}
        <div className="gradient-header-line absolute bottom-0 left-0 right-0 h-px" />
      </header>

      {/* ── Main split area ────────────────────────────────────── */}
      <div className="relative flex flex-1 overflow-hidden min-w-0 z-10">

        {/* ── Chat panel ───────────────────────────────────────── */}
        {/*
          Mobile: full-width, always visible. Preview is a bottom sheet overlay.
          Desktop: 50% width, side-by-side with preview. Glassmorphic container.
        */}
        <div className="relative flex flex-col w-full md:w-1/2 h-full overflow-hidden min-w-0 md:bg-white/[0.02] md:backdrop-blur-xl">
          {children}

          {/*
            Mobile-only inline build status — renders as a system-message bubble
            anchored above the chat input, never overlaying the iframe.
          */}
          {(isBuilding || vmStatus === 'building') && buildTask && (
            <div className="md:hidden absolute bottom-[72px] left-0 right-0 z-10 flex justify-center px-4 pointer-events-none">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full
                           bg-[#1a1535] border border-white/10 shadow-md"
              >
                <div className="w-3 h-3 rounded-full border-2 border-t-transparent border-violet-400 animate-spin shrink-0" />
                <span className="text-xs text-white/60">✨ Your app is updating...</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Divider (desktop only) ───────────────────────────── */}
        <div
          className="hidden md:block w-px shrink-0 self-stretch"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(124,58,237,0.3), rgba(99,102,241,0.2), transparent)' }}
        />

        {/* ── Right panel: Client-Side App Preview (desktop only) ── */}
        <div className="hidden md:flex flex-col h-full overflow-hidden w-1/2 min-w-[420px] bg-white/[0.01]">
          {/* Preview header strip */}
          <div className="flex items-center justify-between h-9 px-3 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 font-medium">Live Preview</span>
              <div className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wide">Real-time</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-white/30">client render</span>
            </div>
          </div>

          {/* Phone frame area */}
          <div className="relative flex-1 overflow-y-auto overflow-x-hidden flex items-start justify-center py-6 px-4">
            {merchantAppSpec ? (
              <PhoneFrame
                primaryColor={merchantAppSpec.primaryColor}
                glowVersion={specVersion}
              >
                <AppPreview spec={merchantAppSpec} />
              </PhoneFrame>
            ) : (
              <div className="flex flex-col items-center gap-3 mt-16 text-white/30">
                <span className="text-4xl">📱</span>
                <p className="text-sm">Preview will appear here as you answer questions</p>
              </div>
            )}

            {/* Desktop build status overlay */}
            {(isBuilding || vmStatus === 'building') && buildTask && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                <BuildStatusOverlay
                  taskDescription={buildTask}
                  isBuilding={isBuilding || vmStatus === 'building'}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile: bottom sheet backdrop ───────────────────────── */}
      {sheetState === 'open' && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px]"
          onClick={closeSheet}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile: bottom sheet ─────────────────────────────────── */}
      {/*
        Height: 60vh
        Transforms:
          open    → full 60vh visible
          peeking → translateY(50%) → 30vh peeking above screen edge
          closed  → translateY(100%) → off-screen
      */}
      <div
        className="md:hidden fixed inset-x-0 bottom-0 z-40 h-[60vh]
                   transition-transform duration-300 ease-out"
        style={{ transform: sheetTransform }}
        aria-hidden={sheetState === 'closed'}
      >
        {/* Mobile sheet: phone preview */}
        <div className="flex flex-col w-full h-full overflow-hidden rounded-t-2xl bg-[#0D0B1E] border-t border-x border-white/10 shadow-2xl">
          {/* Drag handle + close */}
          <div className="flex items-center justify-center relative h-11 shrink-0 px-4">
            <div className="w-10 h-1.5 rounded-full bg-white/25" aria-hidden="true" />
            <button
              onClick={closeSheet}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/8 text-white/60 hover:bg-white/15 transition-colors"
              aria-label="Close preview"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Phone preview in sheet */}
          <div className="flex-1 overflow-y-auto flex items-start justify-center py-2 px-4">
            {merchantAppSpec ? (
              <PhoneFrame
                primaryColor={merchantAppSpec.primaryColor}
                glowVersion={specVersion}
              >
                <AppPreview spec={merchantAppSpec} />
              </PhoneFrame>
            ) : (
              <div className="flex flex-col items-center gap-3 mt-8 text-white/30">
                <span className="text-4xl">📱</span>
                <p className="text-sm">Answer questions to see your preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile: floating preview (eye) button ───────────────── */}
      {/*
        - Eye icon: opens/peeks at preview
        - X icon: closes when sheet is open
        - Pulse badge: visible while a build is in progress
        - Always 56px (w-14 h-14) → well above 44px touch target
      */}
      <button
        className={`
          md:hidden fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full
          bg-violet-600 hover:bg-violet-500 shadow-xl shadow-violet-900/50
          flex items-center justify-center text-white
          transition-all duration-200 active:scale-95
          ${isBuilding ? 'ring-2 ring-violet-400/50' : ''}
        `}
        onClick={toggleSheet}
        aria-label={sheetState === 'open' ? 'Close preview' : 'Open preview'}
      >
        {sheetState === 'open' ? (
          /* X close icon */
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          /* Eye icon */
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}

        {/* Build-in-progress ping badge */}
        {isBuilding && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-violet-300 animate-ping" />
        )}
      </button>
    </div>
  );
}

// ── Internal build status overlay (desktop) ────────────────────────────────────
// Lightweight inline variant used here to avoid circular dependency risk.
// Full-featured BuildStatusIndicator is in its own file.

interface BuildStatusOverlayProps {
  taskDescription: string;
  isBuilding: boolean;
}

function BuildStatusOverlay({ taskDescription, isBuilding }: BuildStatusOverlayProps) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-full
                 bg-black/75 backdrop-blur-md border border-white/10 shadow-xl
                 transition-all duration-300"
      style={{
        opacity: isBuilding ? 1 : 0,
        transform: isBuilding ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      <div className="w-3 h-3 rounded-full border-2 border-t-transparent border-violet-400 animate-spin shrink-0" />
      <span className="text-xs font-medium text-white/80 max-w-[200px] truncate">
        {taskDescription || 'Building...'}
      </span>
    </div>
  );
}
