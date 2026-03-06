import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { merchantId, eventType, eventData } = await req.json()

    if (!eventType) {
      return NextResponse.json({ error: 'eventType required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const ua = req.headers.get('user-agent') || undefined
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]

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
