/**
 * Freedom World — PostHog Analytics Wrapper
 * Sprint 6.1 — Central analytics module for the app-builder flow.
 *
 * Usage:
 *   import { track, identify, page, setContext } from '@/lib/analytics/posthog';
 *
 * Default properties merged into every event:
 *   merchantId, sessionId, appType, category, primaryLanguage, timestamp
 *
 * Call setContext() whenever these values become known (e.g. after session init,
 * after Q1 is answered, after signup).
 */

import posthog from 'posthog-js';

// ─── Module-level context ────────────────────────────────────────────────────

interface AnalyticsContext {
  merchantId?: string;
  sessionId?: string;
  appType?: 'business' | 'idea';
  category?: string;
  primaryLanguage?: string;
}

let _ctx: AnalyticsContext = {};
let _initialized = false;

// ─── Init ────────────────────────────────────────────────────────────────────

/**
 * Initialize PostHog. Safe to call multiple times — no-ops after first call.
 * Called automatically by PostHogProvider on mount; you can also call it
 * manually if you need analytics before the provider renders.
 */
export function initPostHog(): void {
  if (typeof window === 'undefined') return; // SSR guard
  if (_initialized) return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

  if (!key || key === 'phc_xxxxx') {
    // No key — analytics disabled but module still exports safe no-ops
    return;
  }

  posthog.init(key, {
    api_host: host,
    capture_pageview: false, // handle manually via page()
    capture_pageleave: true,
    autocapture: true,
    persistence: 'localStorage+cookie',
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: { password: true },
    },
  });

  _initialized = true;
}

// ─── Context helpers ─────────────────────────────────────────────────────────

/**
 * Update the shared analytics context. Properties are registered as PostHog
 * super-properties so they're automatically included in every subsequent event.
 */
export function setContext(ctx: Partial<AnalyticsContext>): void {
  _ctx = { ..._ctx, ...ctx };

  if (typeof window === 'undefined' || !isEnabled()) return;

  // Push to PostHog super-properties (persists for the session)
  posthog.register({
    ...(ctx.merchantId !== undefined && { merchantId: ctx.merchantId }),
    ...(ctx.sessionId !== undefined && { sessionId: ctx.sessionId }),
    ...(ctx.appType !== undefined && { appType: ctx.appType }),
    ...(ctx.category !== undefined && { category: ctx.category }),
    ...(ctx.primaryLanguage !== undefined && { primaryLanguage: ctx.primaryLanguage }),
  });
}

// ─── Core functions ───────────────────────────────────────────────────────────

function isEnabled(): boolean {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  return (
    typeof window !== 'undefined' &&
    !!key &&
    key !== 'phc_xxxxx' &&
    _initialized
  );
}

function buildDefaults(): Record<string, unknown> {
  return {
    // Context values (may be undefined if not yet known — PostHog will drop undefined)
    ...(_ctx.merchantId !== undefined && { merchantId: _ctx.merchantId }),
    ...(_ctx.sessionId !== undefined && { sessionId: _ctx.sessionId }),
    ...(_ctx.appType !== undefined && { appType: _ctx.appType }),
    ...(_ctx.category !== undefined && { category: _ctx.category }),
    ...(_ctx.primaryLanguage !== undefined && { primaryLanguage: _ctx.primaryLanguage }),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Track an event. Merges in default context properties automatically.
 * Callers may still pass merchantId / sessionId explicitly — they'll override defaults.
 */
export function track(
  event: string,
  properties?: Record<string, unknown>
): void {
  const merged = { ...buildDefaults(), ...properties };

  if (!isEnabled()) {
    // Dev fallback — keep console visibility during local dev
    console.log(`[posthog] ${event}`, merged);
    return;
  }

  posthog.capture(event, merged);
}

/**
 * Identify a user after signup/login.
 */
export function identify(
  userId: string,
  traits?: Record<string, unknown>
): void {
  if (!isEnabled()) {
    console.log('[posthog] identify', userId, traits ?? {});
    return;
  }
  posthog.identify(userId, traits);
}

/**
 * Track a page view.
 */
export function page(name: string, properties?: Record<string, unknown>): void {
  const merged = { ...buildDefaults(), page_name: name, ...properties };

  if (!isEnabled()) {
    console.log('[posthog] $pageview', merged);
    return;
  }

  posthog.capture('$pageview', merged);
}
