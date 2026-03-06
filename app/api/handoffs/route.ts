import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/utils/rate-limit';

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  const merchantId = req.nextUrl.searchParams.get('merchantId');
  const status = req.nextUrl.searchParams.get('status');

  let query = supabase
    .from('handoffs')
    .select(`
      id,
      merchant_id,
      reason,
      reason_category,
      status,
      priority,
      stuck_at_phase,
      assigned_to,
      created_at,
      resolved_at,
      merchants (email, business_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (merchantId) query = query.eq('merchant_id', merchantId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten merchant join
  const handoffs = (data ?? []).map((h: any) => ({
    ...h,
    merchant_email: h.merchants?.email,
    merchant_business_name: h.merchants?.business_name,
    merchants: undefined,
  }));

  return NextResponse.json({ handoffs });
}

export async function PATCH(req: NextRequest) {
  // Rate limit: 30 status updates per minute per IP
  const ip = getClientIp(req);
  const rl = rateLimit(`${ip}:handoffs-patch`, { limit: 30, windowMs: 60_000 });
  if (!rl.success) return rateLimitResponse(rl);

  const supabase = createServiceClient();
  const id = req.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const body = await req.json();
  const allowed = ['status', 'assigned_to', 'resolution_notes', 'resolution_outcome', 'resolved_at', 'priority'] as const;
  type AllowedKey = typeof allowed[number];
  const update: Partial<Record<AllowedKey, unknown>> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { data, error } = await supabase
    .from('handoffs')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ handoff: data });
}
