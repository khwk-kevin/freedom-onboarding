import { NextResponse } from 'next/server'
import { getDashboardSummary } from '@/lib/posthog/api'

export async function GET() {
  try {
    const summary = await getDashboardSummary()
    return NextResponse.json(summary)
  } catch (err) {
    console.error('[posthog-summary] error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch PostHog summary', today: {}, week: {}, sessionRecordingCount: 0 },
      { status: 500 },
    )
  }
}
