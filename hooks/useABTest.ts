'use client';

import { useState, useEffect } from 'react';
import { getVariant } from '@/lib/ab-test';
import { track } from '@/lib/analytics/posthog';
import { EVENTS } from '@/lib/analytics/events';

export function useABTest(testName: string): { variant: string; isReady: boolean } {
  const [variant, setVariant] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storageKey = `ab_test_${testName}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      setVariant(stored);
      setIsReady(true);
      return;
    }

    // Generate a distinct ID from existing PostHog or random
    const distinctId =
      localStorage.getItem('ph_distinct_id') ||
      crypto.randomUUID();

    const assigned = getVariant(testName, distinctId);
    localStorage.setItem(storageKey, assigned);
    setVariant(assigned);
    setIsReady(true);

    track(EVENTS.AB_TEST_ASSIGNED, {
      testName,
      variant: assigned,
      distinctId,
    });
  }, [testName]);

  return { variant, isReady };
}
