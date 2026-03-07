'use client'

import posthog from 'posthog-js'

export function getFlag(flagKey: string): string | boolean | undefined {
  return posthog.getFeatureFlag(flagKey) as string | boolean | undefined
}

export function isFlagEnabled(flagKey: string): boolean {
  return !!posthog.isFeatureEnabled(flagKey)
}
