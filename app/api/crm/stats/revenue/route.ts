// TODO: Add auth check — import { getServerSession } from '@/lib/supabase/auth'; const user = await getServerSession(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Aggregate revenue stats from Supabase merchant records
// (synced from Neon or manually updated)
export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('merchants')
      .select('lifetime_revenue, monthly_revenue')
      .in('status', ['active', 'onboarded']);

    if (error) throw error;

    const merchants = data ?? [];
    const total_lifetime_revenue = merchants.reduce(
      (sum, m) => sum + Number(m.lifetime_revenue || 0),
      0
    );
    const total_monthly_revenue = merchants.reduce(
      (sum, m) => sum + Number(m.monthly_revenue || 0),
      0
    );

    return NextResponse.json({
      total_lifetime_revenue: Math.round(total_lifetime_revenue),
      total_monthly_revenue: Math.round(total_monthly_revenue),
      merchant_count: merchants.length,
    });
  } catch (err) {
    console.error('[crm/stats/revenue] error:', err);
    return NextResponse.json({ error: 'Failed to fetch revenue stats' }, { status: 500 });
  }
}
