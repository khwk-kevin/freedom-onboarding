'use client';

import { useState, useEffect, useRef } from 'react';

interface BuildStatusIndicatorProps {
  /** 'running' | 'complete' | 'failed' — or any custom status string */
  status: string;
  /** Human-readable description of the current build task */
  taskDescription: string;
  /**
   * Rendering variant:
   * - 'overlay' (default): floating pill/card at bottom of preview area (desktop)
   * - 'inline': system message bubble inline in the chat (mobile)
   *
   * The component uses responsive CSS classes by default if you don't pass a
   * variant, so you can also render it once and let CSS handle both layouts:
   *   - md:block  → overlay style (desktop)
   *   - block md:hidden → inline style (mobile)
   */
  variant?: 'overlay' | 'inline';
}

/**
 * BuildStatusIndicator
 *
 * Shows what Claude is currently building, with status transitions.
 *
 * **Desktop (overlay variant):**
 * Floating pill at the bottom of the preview area. Auto-hides with a fade
 * animation when the build completes.
 *
 * **Mobile (inline variant):**
 * Styled as a system message bubble inline within the chat conversation,
 * so it doesn't cover the preview iframe.
 */
export function BuildStatusIndicator({
  status,
  taskDescription,
  variant = 'overlay',
}: BuildStatusIndicatorProps) {
  const isActive = status === 'running' || status === 'queued';
  const isComplete = status === 'complete' || status === 'success';
  const isFailed = status === 'failed' || status === 'error';

  // visible = should be in DOM; fading = animating out
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  // Remember the last non-empty description to show during fade-out
  const lastDescriptionRef = useRef(taskDescription);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (taskDescription) {
      lastDescriptionRef.current = taskDescription;
    }
  }, [taskDescription]);

  useEffect(() => {
    if (isActive) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      setFading(false);
      setVisible(true);
    } else if (isComplete || isFailed) {
      setFading(false);
      setVisible(true);
      hideTimerRef.current = setTimeout(() => {
        setFading(true);
        hideTimerRef.current = setTimeout(() => {
          setVisible(false);
          setFading(false);
        }, 350);
      }, 1800);
    } else {
      setVisible(false);
      setFading(false);
    }

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isActive, isComplete, isFailed]);

  if (!visible) return null;

  const displayText = taskDescription || lastDescriptionRef.current || 'Working on your app...';

  // ── Inline / mobile variant ───────────────────────────────────────────────
  // Styled as a system-message bubble in the chat stream.
  if (variant === 'inline') {
    return (
      <div
        className="flex justify-center px-4 py-1"
        style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.3s' }}
        aria-live="polite"
        aria-label="Build status"
      >
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                     bg-[#1a1535] border border-white/10 shadow-sm max-w-[85%]"
        >
          {/* Status icon */}
          <span className="shrink-0">
            {isActive && (
              <span className="block w-3 h-3 rounded-full border-2 border-t-transparent border-violet-400 animate-spin" />
            )}
            {isComplete && (
              <span className="block text-emerald-400 text-xs font-bold">✓</span>
            )}
            {isFailed && (
              <span className="block text-red-400 text-xs font-bold">✗</span>
            )}
          </span>
          {/* Text */}
          <span className="text-xs text-white/60 truncate">
            {isActive && '✨ Your app is updating...'}
            {isComplete && '✅ Build complete'}
            {isFailed && '⚠️ Build had an issue'}
          </span>
        </div>
      </div>
    );
  }

  // ── Overlay / desktop variant ─────────────────────────────────────────────
  // Floating pill/card — placed absolutely at the bottom of the preview area.
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-2xl max-w-xs w-full
                 bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl
                 transition-all duration-300"
      style={{
        opacity: fading ? 0 : 1,
        transform: fading ? 'translateY(8px)' : 'translateY(0)',
      }}
      aria-live="polite"
      aria-label="Build status"
    >
      {/* Status icon / spinner */}
      <div className="shrink-0 mt-0.5">
        {isActive && (
          <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-violet-400 animate-spin" />
        )}
        {isComplete && (
          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {isFailed && (
          <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-white/90 leading-snug">
          {isActive && 'Claude is building'}
          {isComplete && 'Build complete ✓'}
          {isFailed && 'Build had an issue'}
        </p>
        <p className="text-[10px] text-white/50 mt-0.5 truncate" title={displayText}>
          {displayText}
        </p>
      </div>
    </div>
  );
}
