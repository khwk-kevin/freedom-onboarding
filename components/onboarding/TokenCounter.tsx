'use client';

/**
 * TokenCounter — Sprint 5.2
 *
 * Displays remaining token budget with a colour-coded progress bar.
 * Green > 50% | Amber 20–50% | Red < 20%
 * Shows a "Running low" badge at < 1000 tokens.
 * Shows a "Buy more tokens" CTA when balance ≤ 0.
 */

import React from 'react';
import { FREE_TIER_TOKENS } from '@/lib/app-builder/token-budget';

// ============================================================
// TYPES
// ============================================================

interface TokenCounterProps {
  /** Remaining token balance */
  balance: number;
  /** Tokens consumed so far */
  used: number;
}

// ============================================================
// HELPERS
// ============================================================

function getColorClass(pctRemaining: number): {
  bar: string;
  text: string;
} {
  if (pctRemaining > 50) {
    return { bar: 'bg-emerald-500', text: 'text-emerald-700' };
  }
  if (pctRemaining >= 20) {
    return { bar: 'bg-amber-400', text: 'text-amber-700' };
  }
  return { bar: 'bg-red-500', text: 'text-red-700' };
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

// ============================================================
// COMPONENT
// ============================================================

export function TokenCounter({ balance, used }: TokenCounterProps) {
  const limit = FREE_TIER_TOKENS;
  const safeBalance = Math.max(0, balance);
  const safeUsed = Math.min(used, limit);

  const pctRemaining = limit > 0 ? (safeBalance / limit) * 100 : 0;
  const { bar, text } = getColorClass(pctRemaining);

  const isExhausted = safeBalance <= 0;
  const isRunningLow = !isExhausted && safeBalance < 1000;

  return (
    <div className="flex flex-col gap-1 min-w-[160px]" aria-label="Token budget">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-medium ${isExhausted ? 'text-red-600' : text}`}>
          {isExhausted
            ? 'No tokens remaining'
            : `${formatTokens(safeBalance)} tokens left`}
        </span>

        {isRunningLow && !isExhausted && (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-400/40">
            Running low
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${Math.max(0, Math.min(100, pctRemaining))}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={safeBalance}
        />
      </div>

      {/* Sub-label */}
      <span className="text-[10px] text-gray-400">
        {formatTokens(safeUsed)} / {formatTokens(limit)} used
      </span>

      {/* CTA when exhausted */}
      {isExhausted && (
        <a
          href="/upgrade"
          className="mt-1 inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors"
          aria-label="Buy more tokens to continue building"
        >
          Buy more tokens to continue
        </a>
      )}
    </div>
  );
}

export default TokenCounter;
