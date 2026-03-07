// TODO: Add auth check — import { getServerSession } from '@/lib/supabase/auth'; const user = await getServerSession(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('merchants')
      .select(
        'id, email, business_name, business_type, status, utm_source, health_score, created_at, onboarding_status'
      )
      .not('status', 'in', '(churned,lost)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    return NextResponse.json({ merchants: data ?? [] });
  } catch (err) {
    console.error('[crm/pipeline] error:', err);
    return NextResponse.json({ error: 'Failed to fetch pipeline' }, { status: 500 });
  }
}
