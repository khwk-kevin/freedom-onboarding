import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServiceClient();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // Parallel queries
    const [
      { data: currentWeek },
      { data: prevWeek },
      { data: allMerchants },
      { count: openHandoffs },
    ] = await Promise.all([
      supabase
        .from('merchants')
        .select('status, onboarding_status, created_at')
        .gte('created_at', sevenDaysAgo),
      supabase
        .from('merchants')
        .select('status, onboarding_status, created_at')
        .gte('created_at', fourteenDaysAgo)
        .lt('created_at', sevenDaysAgo),
      supabase.from('merchants').select('status, onboarding_status'),
      supabase
        .from('handoffs')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'assigned']),
    ]);

    const curr = currentWeek || [];
    const prev = prevWeek || [];
    const all = allMerchants || [];

    const calcChange = (c: number, p: number) =>
      p > 0 ? Math.round(((c - p) / p) * 100) : 0;

    const thisWeekSignups = curr.length;
    const prevWeekSignups = prev.length;
    const thisWeekOnboarded = curr.filter((m) => m.onboarding_status === 'completed').length;
    const prevWeekOnboarded = prev.filter((m) => m.onboarding_status === 'completed').length;

    return NextResponse.json({
      thisWeek: {
        signups: thisWeekSignups,
        signupsChange: calcChange(thisWeekSignups, prevWeekSignups),
        onboarded: thisWeekOnboarded,
        onboardedChange: calcChange(thisWeekOnboarded, prevWeekOnboarded),
      },
      funnel: {
        leads: all.filter((m) => m.status === 'lead').length,
        onboarding: all.filter((m) => m.status === 'onboarding').length,
        onboarded: all.filter((m) => m.status === 'onboarded').length,
        active: all.filter((m) => m.status === 'active').length,
        dormant: all.filter((m) => m.status === 'dormant').length,
      },
      openHandoffs: openHandoffs ?? 0,
      total: all.length,
    });
  } catch (err) {
    console.error('[crm/stats] error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
