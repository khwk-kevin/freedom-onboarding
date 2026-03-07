import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30d';

  try {
    const supabase = createServiceClient();

    let since: string | null = null;
    const now = new Date();
    if (period === '7d') since = new Date(now.getTime() - 7 * 86400000).toISOString();
    else if (period === '30d') since = new Date(now.getTime() - 30 * 86400000).toISOString();
    else if (period === '90d') since = new Date(now.getTime() - 90 * 86400000).toISOString();

    // --- 1. Real merchant data from Supabase ---
    let merchantQuery = supabase
      .from('merchants')
      .select('id, status, onboarding_status, utm_source, lifetime_revenue, monthly_revenue, created_at');
    if (since) merchantQuery = merchantQuery.gte('created_at', since);
    const { data: merchants, error: mErr } = await merchantQuery;
    if (mErr) throw mErr;

    // --- 2. Real event data from Supabase events table ---
    let eventsQuery = supabase
      .from('events')
      .select('event_type, created_at');
    if (since) eventsQuery = eventsQuery.gte('created_at', since);
    const { data: events } = await eventsQuery;

    // Count real events
    const eventCounts: Record<string, number> = {};
    for (const e of events || []) {
      eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
    }

    const all = merchants || [];

    // --- 3. Build funnel with REAL data only ---
    // Exclude pipedrive imports from funnel (they didn't come through landing page)
    const realSignups = all.filter((m) => m.utm_source !== 'pipedrive_import' && !m.utm_source?.startsWith('pipedrive'));
    const pipedriveImports = all.filter((m) => m.utm_source === 'pipedrive_import' || m.utm_source?.startsWith('pipedrive'));

    // Landing page events (from events table — tracked by PostHog + Supabase)
    const pageViews = eventCounts['$pageview'] || eventCounts['pageview'] || 0;
    const ctaClicks = eventCounts['cta_click'] || 0;
    const scrollDepth50 = eventCounts['scroll_depth'] || 0;
    const faqExpands = eventCounts['faq_expand'] || 0;
    const landingExits = eventCounts['landing_exit'] || 0;

    // Signup events
    const signupStarts = eventCounts['signup_start'] || 0;
    const signupCompletes = eventCounts['signup_complete'] || realSignups.length;
    const signupErrors = eventCounts['signup_error'] || 0;

    // Onboarding events (from events table or merchant status)
    const onboardStarts = eventCounts['onboard_start'] || 0;
    const onboardCompletes = eventCounts['onboard_complete'] || 0;

    // Merchant status counts (real signups only, excluding imports)
    const realOnboarding = realSignups.filter((m) =>
      ['context', 'branding', 'products', 'rewards', 'golive', 'completed'].includes(m.onboarding_status || '')
    ).length;
    const realCompleted = realSignups.filter((m) =>
      m.onboarding_status === 'completed' || m.status === 'active' || m.status === 'onboarded'
    ).length;
    const realActive = realSignups.filter((m) => m.status === 'active').length;
    const realWithRevenue = realSignups.filter((m) => (m.lifetime_revenue ?? 0) > 0).length;

    // All merchants status counts (including imports, for reference)
    const allActive = all.filter((m) => m.status === 'active').length;
    const allCompleted = all.filter((m) =>
      m.onboarding_status === 'completed' || m.status === 'active' || m.status === 'onboarded'
    ).length;
    const allWithRevenue = all.filter((m) => (m.lifetime_revenue ?? 0) > 0).length;

    const stages = [
      { id: 'page_view', label: 'Landing Page Views', count: pageViews, source: 'posthog+events', estimated: false },
      { id: 'scroll_50', label: 'Scrolled 50%+', count: scrollDepth50, source: 'posthog+events', estimated: false },
      { id: 'cta_click', label: 'CTA Clicked', count: ctaClicks, source: 'posthog+events', estimated: false },
      { id: 'signup_started', label: 'Signup Started', count: signupStarts, source: 'posthog+events', estimated: false },
      { id: 'signup_completed', label: 'Signup Completed', count: realSignups.length, source: 'supabase', estimated: false },
      { id: 'onboarding_started', label: 'Onboarding Started', count: onboardStarts || realOnboarding, source: 'supabase', estimated: false },
      { id: 'onboarding_complete', label: 'Onboarding Complete', count: onboardCompletes || realCompleted, source: 'supabase', estimated: false },
      { id: 'first_transaction', label: 'First Transaction', count: realWithRevenue, source: 'supabase', estimated: false },
      { id: 'active', label: 'Active Merchant', count: realActive, source: 'supabase', estimated: false },
    ];

    // Add conversion rates + drop-off
    const stagesWithMeta = stages.map((stage, i) => {
      const prev = i > 0 ? stages[i - 1].count : stage.count;
      const next = i < stages.length - 1 ? stages[i + 1].count : null;
      const conversionToNext = next !== null && stage.count > 0 ? Math.round((next / stage.count) * 100) : null;
      const dropOffFromPrev = i > 0 && prev > 0 ? Math.round(((prev - stage.count) / prev) * 100) : 0;
      const dropOffCount = i > 0 ? prev - stage.count : 0;
      return { ...stage, conversionToNext, dropOffFromPrev, dropOffCount };
    });

    // --- Channel attribution (all merchants) ---
    const channelMap: Record<string, { total: number; active: number; revenue: number }> = {};
    for (const m of all) {
      const src = m.utm_source || 'Direct / Unknown';
      if (src === 'pipedrive_import') continue; // Skip imports from channel analysis
      if (!channelMap[src]) channelMap[src] = { total: 0, active: 0, revenue: 0 };
      channelMap[src].total++;
      if (m.status === 'active') channelMap[src].active++;
      channelMap[src].revenue += m.lifetime_revenue ?? 0;
    }
    const channels = Object.entries(channelMap)
      .map(([source, d]) => ({
        source,
        total: d.total,
        active: d.active,
        revenue: Math.round(d.revenue),
        conversionRate: d.total > 0 ? Math.round((d.active / d.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Summary
    const overallConversion = pageViews > 0
      ? ((realActive / pageViews) * 100).toFixed(2)
      : '0';

    const realStages = stagesWithMeta.filter((s) => s.dropOffCount > 0);
    const biggestDropoff = realStages.sort((a, b) => b.dropOffCount - a.dropOffCount)[0] ?? null;
    const bestChannel = [...channels].sort((a, b) => b.conversionRate - a.conversionRate)[0] ?? null;

    return NextResponse.json({
      period,
      totalMerchants: all.length,
      realSignups: realSignups.length,
      pipedriveImports: pipedriveImports.length,
      stages: stagesWithMeta,
      channels,
      engagement: {
        faqExpands,
        signupErrors,
        landingExits,
      },
      summary: {
        overallConversion: parseFloat(overallConversion),
        biggestDropoffStage: biggestDropoff?.label ?? null,
        biggestDropoffPct: biggestDropoff?.dropOffFromPrev ?? null,
        bestChannel: bestChannel?.source ?? null,
        bestChannelConversion: bestChannel?.conversionRate ?? null,
        posthogConnected: (events || []).length > 0,
        dataNote: pageViews === 0
          ? 'No landing page events tracked yet. Visit the landing page to start generating data. PostHog is collecting data — connect the Personal API Key for historical insights.'
          : undefined,
      },
      // Reference: all merchants including Pipedrive imports
      allMerchants: {
        total: all.length,
        active: allActive,
        completed: allCompleted,
        withRevenue: allWithRevenue,
      },
    });
  } catch (err) {
    console.error('acquisition-funnel error:', err);
    return NextResponse.json({ error: 'Failed to load funnel data' }, { status: 500 });
  }
}
