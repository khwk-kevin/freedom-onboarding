import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Vercel Cron: runs daily at 9am SGT (0 9 * * *)
// Finds merchants stuck in onboarding for 3+ days and notifies Slack

export async function GET(req: NextRequest) {
  // Validate CRON_SECRET to prevent unauthorized calls
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // Find merchants stuck in onboarding (any phase) for 3+ days
    const { data: stuckMerchants, error } = await supabase
      .from('merchants')
      .select('id, email, business_name, onboarding_status, onboarding_last_phase_at, created_at')
      .in('onboarding_status', ['context', 'branding', 'products', 'rewards', 'golive'])
      .lt('onboarding_last_phase_at', threeDaysAgo)
      .is('onboarding_completed_at', null);

    if (error) throw error;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    let notified = 0;

    for (const merchant of stuckMerchants ?? []) {
      const daysSince = Math.floor(
        (Date.now() - new Date(merchant.onboarding_last_phase_at || merchant.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // Post Slack notification (internal endpoint)
      try {
        await fetch(`${appUrl}/api/slack/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'dormancy',
            merchant: {
              ...merchant,
              days_stuck: daysSince,
            },
          }),
        });
        notified++;
      } catch (slackErr) {
        console.error('[dormancy-check] Slack notification failed:', slackErr);
      }

      // Also update merchant status to dormant if stuck 7+ days
      if (daysSince >= 7) {
        await supabase
          .from('merchants')
          .update({ status: 'dormant' })
          .eq('id', merchant.id)
          .eq('status', 'onboarding'); // Only update if still in onboarding status
      }
    }

    return NextResponse.json({
      success: true,
      checked: stuckMerchants?.length ?? 0,
      notified,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[dormancy-check] error:', err);
    return NextResponse.json({ error: 'Dormancy check failed' }, { status: 500 });
  }
}
