import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Beacon endpoint for beforeunload tracking (sendBeacon sends POST with text/plain)
export async function POST(req: NextRequest) {
  try {
    const text = await req.text()
    const data = JSON.parse(text)

    const supabase = createServiceClient()
    await supabase.from('events').insert({
      merchant_id: null,
      event_type: data.event || 'beacon',
      event_data: data.properties || {},
      page_url: req.headers.get('referer') || null,
      user_agent: req.headers.get('user-agent') || null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // Never fail beacons
  }
}
