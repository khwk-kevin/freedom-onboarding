/**
 * A/B Test Infrastructure
 * Hash-based variant assignment with PostHog feature flag support.
 */

import { AB_TESTS, type ABTestConfig } from './tests';

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getVariant(testName: string, distinctId: string): string {
  const test = (AB_TESTS as Record<string, ABTestConfig>)[testName];
  if (!test) return 'control';

  const hash = hashCode(`${test.name}:${distinctId}`);
  const index = hash % test.variants.length;
  return test.variants[index];
}

export { AB_TESTS } from './tests';
export type { ABTestConfig } from './tests';
