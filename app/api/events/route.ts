import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/utils/rate-limit'

export async function POST(req: NextRequest) {
  // Rate limit: 60 event pings per minute per IP
  const ip = getClientIp(req)
  const rl = rateLimit(`${ip}:events`, { limit: 60, windowMs: 60_000 })
  if (!rl.success) return rateLimitResponse(rl)

  try {
    const { merchantId, eventType, eventData } = await req.json()

    if (!eventType) {
      return NextResponse.json({ error: 'eventType required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const ua = req.headers.get('user-agent') || undefined
    const forwarded = req.headers.get('x-forwarded-for')
    const clientIp = forwarded?.split(',')[0]

    await supabase.from('events').insert({
      merchant_id: merchantId || null,
      event_type: eventType,
      event_data: eventData || {},
      page_url: req.headers.get('referer') || null,
      user_agent: ua || null,
      // ip_country resolved by Vercel Edge headers if configured
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    // Non-critical — don't 500 the client for analytics failures
    console.error('Event log error:', err)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
