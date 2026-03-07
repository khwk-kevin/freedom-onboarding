import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  getPersonByDistinctId,
  getPersonEvents,
  getSessionRecordings,
} from '@/lib/posthog/api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const merchantId = searchParams.get('merchantId')

  if (!merchantId) {
    return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
  }

  try {
    const supabase = createServiceClient()

    // Look up the merchant to get their email / distinct_id
    const { data: merchant, error } = await supabase
      .from('merchants')
      .select('id, email, cognito_sub, created_at')
      .eq('id', merchantId)
      .single()

    if (error || !merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // Try multiple distinct_id candidates: cognito_sub, email, merchantId
    const candidates = [
      merchant.cognito_sub,
      merchant.email,
      merchantId,
    ].filter(Boolean) as string[]

    let person = null
    let events: Awaited<ReturnType<typeof getPersonEvents>> = []
    let usedId = ''

    for (const id of candidates) {
      const found = await getPersonByDistinctId(id)
      if (found) {
        person = found
        usedId = id
        events = await getPersonEvents(id, 100)
        break
      }
    }

    // Session recordings for this person
    const allRecordings = await getSessionRecordings('-90d', 50)
    const recordings = person
      ? allRecordings.filter((r) =>
          r.distinct_id === usedId ||
          candidates.includes(r.distinct_id),
        )
      : []

    // Aggregate stats
    const pageViews = events.filter((e) => e.event === '$pageview').length
    const sessions = new Set(events.map((e) => (e.properties as Record<string, string>)['$session_id']).filter(Boolean)).size

    const firstSeen = person?.created_at ?? null
    const lastSeen = events[0]?.timestamp ?? null

    // Event timeline (last 50 events, newest first)
    const timeline = events.slice(0, 50).map((e) => ({
      uuid: e.uuid,
      event: e.event,
      timestamp: e.timestamp,
      url: (e.properties as Record<string, string>)['$current_url'] ?? null,
      sessionId: (e.properties as Record<string, string>)['$session_id'] ?? null,
    }))

    return NextResponse.json({
      merchantId,
      posthogPerson: person
        ? {
            id: person.id,
            distinctId: usedId,
            properties: person.properties,
            createdAt: person.created_at,
          }
        : null,
      stats: {
        totalPageViews: pageViews,
        totalSessions: sessions,
        totalEvents: events.length,
        firstSeen,
        lastSeen,
        sessionRecordingCount: recordings.length,
      },
      timeline,
      sessionRecordings: recordings.map((r) => ({
        id: r.id,
        startTime: r.start_time,
        endTime: r.end_time,
        durationSec: r.duration,
        viewed: r.viewed,
        url: `https://eu.posthog.com/project/136745/replay/${r.id}`,
      })),
      noData: !person,
      noDataReason: !person
        ? 'This merchant has not been identified in PostHog yet. They need to visit the app after signup.'
        : undefined,
    })
  } catch (err) {
    console.error('[merchants/posthog] error:', err)
    return NextResponse.json({ error: 'Failed to fetch PostHog data' }, { status: 500 })
  }
}
