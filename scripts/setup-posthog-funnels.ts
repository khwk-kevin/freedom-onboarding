/**
 * Setup PostHog Funnels (Insights)
 * Run: npx tsx scripts/setup-posthog-funnels.ts
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

function makeEvent(id: string, order: number) {
  return { id, name: id, type: 'events', order }
}

const funnels = [
  {
    name: '🏆 Acquisition Funnel (Full)',
    description: 'End-to-end from landing page view to active merchant',
    filters: {
      insight: 'FUNNELS',
      funnel_viz_type: 'steps',
      date_from: '-30d',
      events: [
        makeEvent('$pageview', 0),
        makeEvent('cta_click', 1),
        makeEvent('signup_start', 2),
        makeEvent('signup_complete', 3),
        makeEvent('onboard_start', 4),
        makeEvent('onboard_complete', 5),
      ],
    },
  },
  {
    name: '🎯 Onboarding Detail Funnel',
    description: 'Step-by-step onboarding completion',
    filters: {
      insight: 'FUNNELS',
      funnel_viz_type: 'steps',
      date_from: '-30d',
      events: [
        makeEvent('onboard_start', 0),
        makeEvent('onboard_step_class_selection', 1),
        makeEvent('onboard_step_name_selection', 2),
        makeEvent('onboard_step_description_selection', 3),
        makeEvent('onboard_complete', 4),
      ],
    },
  },
  {
    name: '📊 Landing Page Engagement',
    description: 'Engagement depth from pageview to signup start',
    filters: {
      insight: 'FUNNELS',
      funnel_viz_type: 'steps',
      date_from: '-30d',
      events: [
        makeEvent('$pageview', 0),
        makeEvent('scroll_depth', 1),
        makeEvent('cta_click', 2),
        makeEvent('signup_start', 3),
      ],
    },
  },
]

async function createFunnel(funnel: (typeof funnels)[0]) {
  const body = {
    name: funnel.name,
    description: funnel.description,
    filters: funnel.filters,
    saved: true,
  }

  const res = await fetch(`${BASE_URL}/insights/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status}: ${text.slice(0, 300)}`)
  }

  const data = await res.json()
  console.log(`✅ Created insight: ${funnel.name} (id=${data.id}, short_id=${data.short_id})`)
  return data
}

async function main() {
  console.log('🚀 Setting up PostHog funnels...\n')
  for (const funnel of funnels) {
    try {
      await createFunnel(funnel)
    } catch (err) {
      console.error(`❌ Failed to create funnel "${funnel.name}":`, err)
    }
  }
  console.log('\n✅ Done!')
}

main()
