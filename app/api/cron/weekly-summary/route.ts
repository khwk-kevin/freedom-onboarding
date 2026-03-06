import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Vercel Cron: runs every Monday at 9am SGT (0 9 * * 1)
// Computes weekly pipeline stats and posts to Slack

export async function GET(req: NextRequest) {
  // Validate CRON_SECRET
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { data: weekMerchants },
      { count: openHandoffs },
      { data: allActive },
    ] = await Promise.all([
      supabase
        .from('merchants')
        .select('status, onboarding_status, utm_source')
        .gte('created_at', sevenDaysAgo),
      supabase
        .from('handoffs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo),
      supabase
        .from('merchants')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
    ]);

    const week = weekMerchants ?? [];
    const signups = week.length;
    const onboarded = week.filter((m) => m.onboarding_status === 'completed').length;
    const completionRate = signups > 0 ? Math.round((onboarded / signups) * 100) : 0;

    // Top channel
    const channelCounts = week.reduce<Record<string, number>>((acc, m) => {
      const src = m.utm_source || 'direct';
      acc[src] = (acc[src] || 0) + 1;
      return acc;
    }, {});
    const topChannel = Object.entries(channelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const stats = {
      signups,
      onboarded,
      completionRate,
      active: allActive?.length ?? 0,
      handoffs: openHandoffs ?? 0,
      topChannel,
    };

    // Post to Slack
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    await fetch(`${appUrl}/api/slack/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'weekly_summary',
        stats,
      }),
    });

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[weekly-summary] error:', err);
    return NextResponse.json({ error: 'Weekly summary failed' }, { status: 500 });
  }
}
