import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/merchants — list all merchants
// GET /api/merchants?id=xxx — single merchant with events + conversations
// PATCH /api/merchants?id=xxx — update merchant fields
export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  const id = req.nextUrl.searchParams.get('id');

  if (id) {
    // Single merchant detail
    const [
      { data: merchant, error },
      { data: events },
      { data: conversations },
      { data: products },
      { data: handoffs },
    ] = await Promise.all([
      supabase.from('merchants').select('*').eq('id', id).single(),
      supabase
        .from('events')
        .select('id, event_type, event_data, created_at')
        .eq('merchant_id', id)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('conversations')
        .select('id, role, content, phase, created_at')
        .eq('merchant_id', id)
        .order('created_at', { ascending: true }),
      supabase
        .from('products')
        .select('id, name, description, price, category, is_active')
        .eq('merchant_id', id)
        .order('sort_order'),
      supabase
        .from('handoffs')
        .select('id, reason, reason_category, status, priority, stuck_at_phase, created_at, resolved_at')
        .eq('merchant_id', id)
        .order('created_at', { ascending: false }),
    ]);

    if (error) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    return NextResponse.json({
      merchant,
      events: events ?? [],
      conversations: conversations ?? [],
      products: products ?? [],
      handoffs: handoffs ?? [],
    });
  }

  // List view
  const { status, search, limit = '50', offset = '0' } = Object.fromEntries(
    req.nextUrl.searchParams.entries()
  );

  let query = supabase
    .from('merchants')
    .select(
      'id, email, business_name, business_type, status, onboarding_status, utm_source, health_score, created_at, last_activity_at'
    )
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (status) query = query.eq('status', status);
  if (search) {
    query = query.or(`email.ilike.%${search}%,business_name.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ merchants: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const supabase = createServiceClient();
  const id = req.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const body = await req.json();

  // Allowlist updatable fields
  const allowed = [
    'status',
    'assigned_to',
    'health_score',
    'notes',
    'tags',
    'next_follow_up_at',
    'last_contact_at',
  ] as const;

  type AllowedKey = typeof allowed[number];
  const update: Partial<Record<AllowedKey, unknown>> = {};
  for (const key of allowed) {
    if (key in body) {
      update[key] = body[key];
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('merchants')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ merchant: data });
}
