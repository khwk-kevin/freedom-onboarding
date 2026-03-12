'use client';

/**
 * Freedom World — PostHogProvider
 * Sprint 6.1
 *
 * Initializes the analytics/posthog wrapper on mount and wraps children
 * with the posthog-js/react PostHogProvider so hooks (usePostHog, etc.)
 * are available anywhere in the tree.
 *
 * Usage — add to app/layout.tsx or any page layout:
 *   <PostHogProvider>
 *     {children}
 *   </PostHogProvider>
 *
 * Note: The root layout already uses PHProvider from lib/posthog/provider.tsx
 * which handles posthog.init. This component calls initPostHog() which is
 * idempotent (no-op after first call), so both can coexist safely.
 */

import { useEffect } from 'react';
import { PostHogProvider as PHReactProvider } from 'posthog-js/react';
import posthog from 'posthog-js';
import { initPostHog } from '@/lib/analytics/posthog';

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <PHReactProvider client={posthog}>
      {children}
    </PHReactProvider>
  );
}

export default PostHogProvider;
