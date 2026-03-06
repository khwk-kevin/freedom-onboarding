import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/onboarding/state?merchantId=xxx
 * Loads merchant onboarding state + conversations + products
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
        .select(
          'id, onboarding_status, onboarding_data, business_name, business_type, business_description, logo_url, banner_url, primary_color, email'
        )
        .eq('id', merchantId)
        .single(),

      supabase
        .from('conversations')
        .select('id, role, content, phase, created_at')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: true })
        .limit(100),

      supabase
        .from('products')
        .select('id, name, description, price, currency, category, sort_order, is_active')
        .eq('merchant_id', merchantId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
    ])

  if (merchantResult.error || !merchantResult.data) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
  }

  const merchant = merchantResult.data
  const currentPhase =
    merchant.onboarding_status === 'completed' ||
    merchant.onboarding_status === 'abandoned'
      ? null
      : merchant.onboarding_status

  return NextResponse.json({
    merchant,
    conversations: conversationsResult.data ?? [],
    products: productsResult.data ?? [],
    currentPhase,
  })
}

/**
 * PUT /api/onboarding/state
 * Updates merchant onboarding state
 */
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { merchantId, updates } = body as {
    merchantId: string
    updates: Record<string, unknown>
  }

  if (!merchantId || !updates) {
    return NextResponse.json(
      { error: 'Missing merchantId or updates' },
      { status: 400 }
    )
  }

  // Allowlist of fields that can be updated via this route
  const ALLOWED_FIELDS = new Set([
    'onboarding_status',
    'onboarding_data',
    'onboarding_last_phase_at',
    'onboarding_completed_at',
    'business_name',
    'business_type',
    'business_description',
    'business_size',
    'location',
    'logo_url',
    'banner_url',
    'primary_color',
    'secondary_color',
    'status',
    'last_activity_at',
  ])

  const safeUpdates: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(updates)) {
    if (ALLOWED_FIELDS.has(key)) {
      safeUpdates[key] = value
    }
  }

  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('merchants')
    .update(safeUpdates)
    .eq('id', merchantId)
    .select('id, onboarding_status, onboarding_data')
    .single()

  if (error) {
    console.error('[onboarding/state PUT] Supabase error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, merchant: data })
}
