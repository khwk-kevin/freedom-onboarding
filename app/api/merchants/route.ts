import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
// TODO: Add auth check — import { getServerSession } from '@/lib/supabase/auth'; const user = await getServerSession(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
      'id, email, business_name, business_type, status, onboarding_status, utm_source, health_score, created_at, last_activity_at, phone, line_id, location, assigned_to, lifetime_revenue, monthly_revenue, notes, tags'
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
    'business_name',
    'business_type',
    'business_description',
    'phone',
    'line_id',
    'location',
    'website_url',
    'monthly_revenue',
    'lifetime_revenue',
    'onboarding_status',
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

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const body = await req.json();

  // Required
  if (!body.email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const insert: Record<string, unknown> = {
    email: body.email,
    status: body.status ?? 'lead',
    onboarding_status: 'signup',
  };

  const optionalFields = [
    'phone', 'line_id', 'business_name', 'business_type', 'business_size',
    'business_description', 'location', 'website_url', 'social_urls',
    'assigned_to', 'tags', 'notes', 'next_follow_up_at',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_vertical', 'referrer_url',
  ] as const;

  for (const f of optionalFields) {
    if (f in body && body[f] !== '' && body[f] !== null && body[f] !== undefined) {
      insert[f] = body[f];
    }
  }

  const { data, error } = await supabase
    .from('merchants')
    .insert(insert)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A merchant with this email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ merchant: data }, { status: 201 });
}
