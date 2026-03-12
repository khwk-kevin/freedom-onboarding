'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { VMStatus } from '@/lib/app-builder/types';

// Sprint 7.3: Max auto-reconnect attempts before showing manual retry
const MAX_RECONNECT_ATTEMPTS = 3;
// Sprint 7.3: Interval between auto-reconnect attempts (ms)
const RECONNECT_INTERVAL_MS = 5000;

interface LivePreviewProps {
  devUrl: string | null;
  status: VMStatus;
  isBuilding: boolean;
  onRetry?: () => void;
  /**
   * 'panel' (default): embedded in the desktop right panel.
   *   - fixed min-width (420px), rounded corners on all sides
   * 'sheet': inside the mobile bottom sheet overlay.
   *   - full width, rounded top corners only, drag handle + close button
   */
  mode?: 'panel' | 'sheet';
  /** Called when close button is pressed (sheet mode only) */
  onClose?: () => void;
}

// ── Skeleton shimmer block ─────────────────────────────────────────────────────
function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-white/10 ${className ?? ''}`} />
  );
}

// ── Full-panel skeleton for "provisioning" state ───────────────────────────────
function ProvisioningSkeleton() {
  return (
    <div className="flex flex-col h-full w-full p-6 gap-4 bg-[#0D0B1E]">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="w-28 h-7" />
        <div className="flex gap-2">
          <SkeletonBlock className="w-16 h-7" />
          <SkeletonBlock className="w-16 h-7" />
          <SkeletonBlock className="w-16 h-7" />
        </div>
      </div>
      <SkeletonBlock className="w-full flex-1 max-h-56 rounded-2xl" />
      <div className="space-y-3">
        <SkeletonBlock className="w-3/4 h-5" />
        <SkeletonBlock className="w-1/2 h-5" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <SkeletonBlock className="h-28 rounded-xl" />
        <SkeletonBlock className="h-28 rounded-xl" />
        <SkeletonBlock className="h-28 rounded-xl" />
      </div>
      <div className="flex flex-col items-center gap-2 pt-2">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-violet-400 animate-spin" />
        <p className="text-sm font-medium text-white/60">Setting up your workspace...</p>
      </div>
    </div>
  );
}

// ── Spinner overlay for "starting" state ──────────────────────────────────────
function StartingSpinner() {
  return (
    <div className="flex flex-col h-full w-full items-center justify-center gap-4 bg-[#0D0B1E]">
      <div className="relative flex items-center justify-center w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-violet-500/20" />
        <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <span className="text-2xl">🚀</span>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white/80">Starting your preview...</p>
        <p className="text-xs text-white/40 mt-1">Booting dev server</p>
      </div>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────
function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col h-full w-full items-center justify-center gap-4 bg-[#0D0B1E]">
      <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
        <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <div className="text-center px-6">
        <p className="text-sm font-semibold text-white/80">Preview unavailable</p>
        <p className="text-xs text-white/40 mt-1">Something went wrong starting the preview</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors min-h-[44px]"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ── Reconnecting overlay (Sprint 7.3) ─────────────────────────────────────────
// Shown when the iframe fails to load while the VM is running.
// Auto-retries every RECONNECT_INTERVAL_MS; after MAX_RECONNECT_ATTEMPTS shows manual retry.
function ReconnectingOverlay({
  attempts,
  maxAttempts,
  onManualRetry,
}: {
  attempts: number;
  maxAttempts: number;
  onManualRetry: () => void;
}) {
  const exhausted = attempts >= maxAttempts;

  if (exhausted) {
    return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#0D0B1E]/95 backdrop-blur-sm">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-amber-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <div className="text-center px-6">
          <p className="text-sm font-semibold text-white/80">Preview unavailable</p>
          <p className="text-xs text-white/40 mt-1">The preview server isn't responding</p>
        </div>
        <button
          onClick={onManualRetry}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors min-h-[44px]"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#0D0B1E]/80 backdrop-blur-sm">
      <div className="w-8 h-8 rounded-full border-2 border-t-violet-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      <p className="text-sm font-medium text-white/70">Reconnecting…</p>
    </div>
  );
}

// ── LivePreview ───────────────────────────────────────────────────────────────
export function LivePreview({
  devUrl,
  status,
  isBuilding,
  onRetry,
  mode = 'panel',
  onClose,
}: LivePreviewProps) {
  const isSheet = mode === 'sheet';

  // Track whether the iframe has successfully loaded at least once
  const [iframeLoaded, setIframeLoaded] = useState(false);
  // iframeKey is bumped to force an iframe remount (on URL change or reconnect)
  const [iframeKey, setIframeKey] = useState(devUrl ?? 'no-url');
  // Ref to track last devUrl — reset state only on a real URL change
  const lastDevUrl = useRef<string | null>(null);

  // ── Reconnection state (Sprint 7.3) ────────────────────────
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset everything when devUrl changes
  useEffect(() => {
    if (devUrl !== lastDevUrl.current) {
      lastDevUrl.current = devUrl;
      if (devUrl) {
        setIframeLoaded(false);
        setIsReconnecting(false);
        setReconnectAttempts(0);
        setIframeKey(devUrl + '-' + Date.now());
      }
    }
  }, [devUrl]);

  const stopReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearInterval(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const startReconnectTimer = useCallback(() => {
    stopReconnectTimer();
    reconnectTimerRef.current = setInterval(() => {
      setReconnectAttempts((prev) => {
        const next = prev + 1;
        if (next >= MAX_RECONNECT_ATTEMPTS) {
          // Stop auto-retrying; show manual retry button
          stopReconnectTimer();
        }
        return next;
      });
      // Bump iframe key to force a fresh src load attempt
      setIframeKey((prev) => prev + '-r');
    }, RECONNECT_INTERVAL_MS);
  }, [stopReconnectTimer]);

  const handleManualRetry = useCallback(() => {
    stopReconnectTimer();
    setIsReconnecting(false);
    setReconnectAttempts(0);
    setIframeLoaded(false);
    if (devUrl) {
      setIframeKey(devUrl + '-manual-' + Date.now());
    }
    onRetry?.();
  }, [devUrl, onRetry, stopReconnectTimer]);

  // Cleanup timer on unmount
  useEffect(() => () => stopReconnectTimer(), [stopReconnectTimer]);

  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
    setIsReconnecting(false);
    setReconnectAttempts(0);
    stopReconnectTimer();
  }, [stopReconnectTimer]);

  const handleIframeError = useCallback(() => {
    // Only trigger reconnect if we're in a live state (not provisioning/error/etc.)
    if (!isReconnecting) {
      setIframeLoaded(false);
      setIsReconnecting(true);
      startReconnectTimer();
    }
  }, [isReconnecting, startReconnectTimer]);

  // Outer wrapper classes differ between panel and sheet modes
  const outerClass = isSheet
    ? 'flex flex-col w-full h-full overflow-hidden rounded-t-2xl bg-[#0D0B1E] border-t border-x border-white/10 shadow-2xl'
    : `relative w-full h-full overflow-hidden rounded-xl border bg-[#0D0B1E] ${
        status === 'error' ? 'border-red-500/20' : 'border-white/8'
      }`;

  const outerStyle = isSheet ? undefined : { minWidth: '420px' };

  // ── Content renderer ──────────────────────────────────────────────────────
  function renderContent() {
    // ── Provisioning / stopped ────────────────────────────────
    if (status === 'provisioning' || status === 'stopped') {
      return <ProvisioningSkeleton />;
    }
    // ── Starting ──────────────────────────────────────────────
    if (status === 'starting') {
      return <StartingSpinner />;
    }
    // ── Hard VM error (not the same as iframe unreachable) ────
    if (status === 'error') {
      return <ErrorState onRetry={onRetry} />;
    }

    // ── Ready or Building — show iframe ───────────────────────
    const showBuildToast = isBuilding || status === 'building';

    return (
      <div className="relative w-full h-full">
        {devUrl ? (
          <>
            {/* Loading shimmer shown until iframe reports load (and not reconnecting) */}
            {!iframeLoaded && !isReconnecting && (
              <div className="absolute inset-0 z-10 bg-[#0D0B1E] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-t-violet-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              </div>
            )}
            <iframe
              key={iframeKey}
              src={devUrl}
              className="w-full h-full border-none"
              title="Live App Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{ display: 'block', opacity: iframeLoaded ? 1 : 0 }}
            />
            {/* Reconnecting overlay — auto-shown on iframe failure */}
            {isReconnecting && (
              <ReconnectingOverlay
                attempts={reconnectAttempts}
                maxAttempts={MAX_RECONNECT_ATTEMPTS}
                onManualRetry={handleManualRetry}
              />
            )}
          </>
        ) : (
          /* No URL yet but status is ready — show connecting state */
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-t-violet-500 border-r-transparent animate-spin" />
              <p className="text-sm text-white/50">Connecting to preview...</p>
            </div>
          </div>
        )}

        {/* Build toast — floating pill at bottom when building */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 shadow-xl transition-all duration-300"
          style={{
            opacity: showBuildToast ? 1 : 0,
            transform: `translateX(-50%) translateY(${showBuildToast ? '0' : '12px'})`,
            pointerEvents: 'none',
          }}
        >
          <div className="w-3 h-3 rounded-full border border-t-transparent border-violet-400 animate-spin" />
          <span className="text-xs font-medium text-white/80">Building...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={outerClass} style={outerStyle}>
      {/* ── Sheet mode: drag handle + close button ────────────── */}
      {isSheet && (
        <div className="flex items-center justify-center relative h-11 shrink-0 px-4">
          {/* Visual drag handle pill */}
          <div className="w-10 h-1.5 rounded-full bg-white/25" aria-hidden="true" />
          {/* Close button — top-right, ≥44px tap target */}
          <button
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11
                       flex items-center justify-center rounded-full
                       bg-white/8 text-white/60 hover:bg-white/15
                       transition-colors active:scale-95"
            aria-label="Close preview"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────── */}
      <div className={isSheet ? 'flex-1 relative overflow-hidden' : 'w-full h-full'}>
        {renderContent()}
      </div>
    </div>
  );
}
