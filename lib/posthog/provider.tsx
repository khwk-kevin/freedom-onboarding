'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { gtmPageView } from '@/lib/gtm/events';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

// ─── Initialize at module scope (client-side only) ────────────────────────────
// IMPORTANT: Must NOT be inside useEffect — React calls children's effects
// before parents', so posthog.init() in useEffect fires AFTER child components
// try to capture events, silently dropping them.
if (typeof window !== 'undefined' && POSTHOG_KEY && POSTHOG_KEY !== 'phc_xxxxx' && !posthog.__loaded) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,     // We fire $pageview manually on route change
    capture_pageleave: true,
    autocapture: true,
    persistence: 'localStorage+cookie',
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: { password: true },
    },
  });
}

// ─── Pageview tracker — fires on route change ─────────────────────────────────
function PostHogPageviewInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || !POSTHOG_KEY || POSTHOG_KEY === 'phc_xxxxx') return;

    const url =
      window.origin +
      pathname +
      (searchParams?.toString() ? '?' + searchParams.toString() : '');

    // posthog is now guaranteed to be initialized (module-scope init above)
    posthog.capture('$pageview', { $current_url: url });

    // Also push to GTM dataLayer so GA4/Ads tags can track SPAs
    gtmPageView(pathname, document.title);
  }, [pathname, searchParams]);

  return null;
}

export function PostHogPageview() {
  return (
    <Suspense fallback={null}>
      <PostHogPageviewInner />
    </Suspense>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function PHProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
