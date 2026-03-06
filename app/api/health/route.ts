import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()

  try {
    const supabase = createServiceClient()

    // Ping Supabase — simple query to verify connectivity
    const { error } = await supabase
      .from('merchants')
      .select('id')
      .limit(1)

    const latencyMs = Date.now() - start

    if (error) {
      return NextResponse.json(
        {
          status: 'error',
          supabase: 'error',
          error: error.message,
          latency_ms: latencyMs,
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'ok',
      supabase: 'connected',
      latency_ms: latencyMs,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        supabase: 'unreachable',
        error: err instanceof Error ? err.message : 'Unknown error',
        latency_ms: Date.now() - start,
      },
      { status: 503 }
    )
  }
}
