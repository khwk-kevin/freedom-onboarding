import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/onboarding/resume?merchantId=xxx
 * Loads full onboarding state for session resume.
 * Returns merchant, conversations (last 50), products, and resolved current phase.
 */
export async function GET(req: NextRequest) {
  const merchantId = req.nextUrl.searchParams.get('merchantId')
  if (!merchantId) {
    return NextResponse.json({ error: 'Missing merchantId' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const [merchantResult, conversationsResult, productsResult] =
    await Promise.all([
      supabase
        .from('merchants')
        .select('*')
        .eq('id', merchantId)
        .single(),

      supabase
        .from('conversations')
        .select('id, role, content, phase, metadata, created_at')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: true })
        .limit(50),

      supabase
        .from('products')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
    ])

  if (merchantResult.error || !merchantResult.data) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
  }

  const merchant = merchantResult.data
  const conversations = conversationsResult.data ?? []
  const products = productsResult.data ?? []

  // Determine current phase for resume
  const terminalStatuses = ['completed', 'abandoned']
  const currentPhase = terminalStatuses.includes(merchant.onboarding_status)
    ? null
    : merchant.onboarding_status

  // Determine if there's an active session to resume
  const hasActiveSession =
    currentPhase !== null && conversations.length > 0

  // Log the resume event
  if (hasActiveSession) {
    await supabase.from('events').insert({
      merchant_id: merchantId,
      event_type: 'onboard_resume',
      event_data: {
        resumed_from_phase: currentPhase,
        conversation_count: conversations.length,
      },
    })

    // Update last activity
    await supabase
      .from('merchants')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', merchantId)
  }

  return NextResponse.json({
    merchant,
    conversations,
    products,
    currentPhase,
    hasActiveSession,
    resumeContext: hasActiveSession
      ? {
          phase: currentPhase,
          lastMessage: conversations[conversations.length - 1] ?? null,
          totalMessages: conversations.length,
          onboardingData: merchant.onboarding_data,
        }
      : null,
  })
}
