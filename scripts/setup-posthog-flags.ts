/**
 * Setup PostHog Feature Flags
 * Run: npx tsx scripts/setup-posthog-flags.ts
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const BASE_URL = 'https://eu.posthog.com/api/projects/136745'
const KEY = process.env.POSTHOG_PERSONAL_API_KEY

if (!KEY) {
  console.error('❌ POSTHOG_PERSONAL_API_KEY not found in .env.local')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
}

interface FlagDef {
  key: string
  name: string
  variants: Array<{ key: string; name: string; rollout_percentage: number }>
}

const flags: FlagDef[] = [
  {
    key: 'hero-headline',
    name: 'Hero Headline Variant',
    variants: [
      { key: 'control', name: 'Control', rollout_percentage: 34 },
      { key: 'benefit-led', name: 'Benefit Led', rollout_percentage: 33 },
      { key: 'data-led', name: 'Data Led', rollout_percentage: 33 },
    ],
  },
  {
    key: 'cta-copy',
    name: 'CTA Copy Variant',
    variants: [
      { key: 'create-community', name: 'Create Community', rollout_percentage: 34 },
      { key: 'get-started-free', name: 'Get Started Free', rollout_percentage: 33 },
      { key: 'launch-now', name: 'Launch Now', rollout_percentage: 33 },
    ],
  },
  {
    key: 'social-proof-position',
    name: 'Social Proof Position',
    variants: [
      { key: 'above-fold', name: 'Above Fold', rollout_percentage: 50 },
      { key: 'below-fold', name: 'Below Fold', rollout_percentage: 50 },
    ],
  },
  {
    key: 'ai-opener',
    name: 'AI Opener Tone',
    variants: [
      { key: 'formal', name: 'Formal', rollout_percentage: 34 },
      { key: 'casual', name: 'Casual', rollout_percentage: 33 },
      { key: 'data-hook', name: 'Data Hook', rollout_percentage: 33 },
    ],
  },
  {
    key: 'onboard-order',
    name: 'Onboarding Step Order',
    variants: [
      { key: 'default', name: 'Default', rollout_percentage: 50 },
      { key: 'products-first', name: 'Products First', rollout_percentage: 50 },
    ],
  },
]

async function createFlag(flag: FlagDef) {
  const body = {
    key: flag.key,
    name: flag.name,
    active: true,
    rollout_percentage: 100,
    multivariate: {
      variants: flag.variants,
    },
    filters: {
      groups: [{ properties: [], rollout_percentage: 100 }],
    },
  }

  const res = await fetch(`${BASE_URL}/feature_flags/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (res.status === 400) {
    // May already exist
    const err = await res.json()
    if (JSON.stringify(err).includes('already exists') || JSON.stringify(err).includes('unique')) {
      console.log(`⏭  Flag already exists: ${flag.key}`)
      return
    }
    throw new Error(`400 creating ${flag.key}: ${JSON.stringify(err)}`)
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} creating ${flag.key}: ${text}`)
  }

  const data = await res.json()
  console.log(`✅ Created flag: ${flag.key} (id=${data.id})`)
}

async function main() {
  console.log('🚀 Setting up PostHog feature flags...\n')
  for (const flag of flags) {
    try {
      await createFlag(flag)
    } catch (err) {
      console.error(`❌ Failed to create flag ${flag.key}:`, err)
    }
  }
  console.log('\n✅ Done!')
}

main()
