/**
 * PostHog Server-Side API Client
 * Uses POSTHOG_PERSONAL_API_KEY — never exposed to the client.
 */

const BASE_URL = 'https://eu.posthog.com/api/projects/136745'

function getHeaders() {
  const key = process.env.POSTHOG_PERSONAL_API_KEY
  if (!key) throw new Error('POSTHOG_PERSONAL_API_KEY is not set')
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

async function phFetch(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) },
    next: { revalidate: 300 }, // 5-min cache
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`PostHog API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EventDef {
  id: string
  name?: string
  type?: 'events' | 'actions'
}

export interface PHEvent {
  uuid: string
  event: string
  timestamp: string
  distinct_id: string
  properties: Record<string, unknown>
}

export interface PHRecording {
  id: string
  distinct_id: string
  start_time: string
  end_time: string
  duration: number
  viewed: boolean
}

export interface PHPerson {
  id: string
  distinct_ids: string[]
  properties: Record<string, unknown>
  created_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDateParams(dateFrom: string, dateTo?: string) {
  const p = new URLSearchParams({ date_from: dateFrom })
  if (dateTo) p.set('date_to', dateTo)
  return p
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get total event count for a single event name within a date range.
 */
export async function getEventCount(
  eventName: string,
  dateFrom: string,
  dateTo?: string,
): Promise<number> {
  try {
    const params = buildDateParams(dateFrom, dateTo)
    params.set('event', eventName)
    params.set('display', 'ActionsLineGraph')
    // Use the events endpoint with aggregation
    const data = await phFetch(`/insights/trend/?${params}`)
    // Sum all data points across series
    const total = (data.result || []).reduce((sum: number, series: { data?: number[] }) => {
      return sum + (series.data || []).reduce((s: number, v: number) => s + (v || 0), 0)
    }, 0)
    return total
  } catch {
    return 0
  }
}

/**
 * Get event counts for multiple events in one pass (parallel fetch).
 */
export async function getEventCounts(
  eventNames: string[],
  dateFrom: string,
): Promise<Record<string, number>> {
  try {
    const results = await Promise.all(
      eventNames.map(async (name) => {
        const count = await getEventCount(name, dateFrom)
        return [name, count] as [string, number]
      }),
    )
    return Object.fromEntries(results)
  } catch {
    return Object.fromEntries(eventNames.map((n) => [n, 0]))
  }
}

/**
 * Create / query a Trends or Funnels insight.
 */
export async function getInsight(
  type: 'TRENDS' | 'FUNNELS',
  events: EventDef[],
  dateFrom: string,
): Promise<unknown> {
  try {
    const body = {
      insight: type,
      events: events.map((e) => ({ id: e.id, name: e.name || e.id, type: e.type || 'events' })),
      date_from: dateFrom,
      funnel_viz_type: type === 'FUNNELS' ? 'steps' : undefined,
    }
    const data = await phFetch('/insights/', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return data
  } catch (err) {
    console.error('[PostHog] getInsight error:', err)
    return null
  }
}

/**
 * Get recent events for a specific person (by distinct_id).
 */
export async function getPersonEvents(
  distinctId: string,
  limit = 50,
): Promise<PHEvent[]> {
  try {
    const params = new URLSearchParams({
      distinct_id: distinctId,
      limit: String(limit),
    })
    const data = await phFetch(`/events/?${params}`)
    return data.results || []
  } catch {
    return []
  }
}

/**
 * Get session recordings list.
 */
export async function getSessionRecordings(
  dateFrom?: string,
  limit = 20,
): Promise<PHRecording[]> {
  try {
    const params = new URLSearchParams({ limit: String(limit) })
    if (dateFrom) params.set('date_from', dateFrom)
    const data = await phFetch(`/session_recordings/?${params}`)
    return data.results || []
  } catch {
    return []
  }
}

/**
 * Look up a person by distinct_id.
 */
export async function getPersonByDistinctId(
  distinctId: string,
): Promise<PHPerson | null> {
  try {
    const params = new URLSearchParams({ distinct_id: distinctId })
    const data = await phFetch(`/persons/?${params}`)
    const results: PHPerson[] = data.results || []
    return results[0] || null
  } catch {
    return null
  }
}

/**
 * Get a summary of today's + this week's event counts for the dashboard.
 */
export async function getDashboardSummary() {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const weekAgo = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0]

  const [todayCounts, weekCounts, recordings] = await Promise.all([
    getEventCounts(['$pageview', 'cta_click', 'signup_start', 'signup_complete'], `-1d`),
    getEventCounts(['$pageview', 'cta_click', 'signup_start', 'signup_complete'], `-7d`),
    getSessionRecordings(weekAgo, 100),
  ])

  return {
    today: todayCounts,
    week: weekCounts,
    sessionRecordingCount: recordings.length,
    generatedAt: new Date().toISOString(),
  }
}
