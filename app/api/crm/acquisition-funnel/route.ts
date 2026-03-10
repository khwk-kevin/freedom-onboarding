import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getEventCounts } from '@/lib/posthog/api';

// Realistic placeholder data for demo/preview
function getPlaceholderData(period: string) {
  const multiplier = period === '7d' ? 0.25 : period === '30d' ? 1 : period === '90d' ? 2.8 : 5;
  const m = (n: number) => Math.round(n * multiplier);

  const stages = [
    { id: 'page_view', label: 'Landing Page Views', count: m(12400), estimated: false, conversionToNext: 62, dropOffFromPrev: 0, dropOffCount: 0 },
    { id: 'scroll_50', label: 'Scrolled 50%+', count: m(7688), estimated: false, conversionToNext: 38, dropOffFromPrev: 38, dropOffCount: m(4712) },
    { id: 'cta_click', label: 'CTA Clicked', count: m(2921), estimated: false, conversionToNext: 71, dropOffFromPrev: 62, dropOffCount: m(4767) },
    { id: 'signup_started', label: 'Onboarding Started', count: m(2074), estimated: false, conversionToNext: 64, dropOffFromPrev: 29, dropOffCount: m(847) },
    { id: 'signup_completed', label: 'Signup Completed', count: m(1327), estimated: false, conversionToNext: 82, dropOffFromPrev: 36, dropOffCount: m(747) },
    { id: 'onboarding_started', label: 'Onboarding In Progress', count: m(1088), estimated: false, conversionToNext: 67, dropOffFromPrev: 18, dropOffCount: m(239) },
    { id: 'onboarding_complete', label: 'Onboarding Complete', count: m(729), estimated: false, conversionToNext: 45, dropOffFromPrev: 33, dropOffCount: m(359) },
    { id: 'first_product', label: 'First Product Listed', count: m(328), estimated: false, conversionToNext: 61, dropOffFromPrev: 55, dropOffCount: m(401) },
    { id: 'first_transaction', label: 'First Transaction', count: m(200), estimated: false, conversionToNext: 74, dropOffFromPrev: 39, dropOffCount: m(128) },
    { id: 'active', label: 'Active Merchant (30d)', count: m(148), estimated: false, conversionToNext: null, dropOffFromPrev: 26, dropOffCount: m(52) },
  ];

  const channels = [
    { source: 'Google Ads', total: m(4200), active: m(52), revenue: m(284000), conversionRate: 1.2 },
    { source: 'Facebook / Instagram', total: m(3100), active: m(38), revenue: m(198000), conversionRate: 1.2 },
    { source: 'LINE OA', total: m(1800), active: m(31), revenue: m(172000), conversionRate: 1.7 },
    { source: 'BD Team (Direct)', total: m(890), active: m(89), revenue: m(620000), conversionRate: 10.0 },
    { source: 'Referral', total: m(640), active: m(45), revenue: m(310000), conversionRate: 7.0 },
    { source: 'Organic Search', total: m(1200), active: m(18), revenue: m(94000), conversionRate: 1.5 },
    { source: 'TikTok', total: m(520), active: m(4), revenue: m(18000), conversionRate: 0.8 },
    { source: 'Direct / Unknown', total: m(350), active: m(8), revenue: m(42000), conversionRate: 2.3 },
  ];

  return {
    period,
    totalMerchants: m(1327),
    realSignups: m(1327),
    pipedriveImports: 0,
    stages,
    channels,
    engagement: { faqExpands: m(890), signupErrors: m(67), landingExits: m(4800) },
    summary: {
      overallConversion: 1.19,
      biggestDropoffStage: 'CTA Clicked → Onboarding Started',
      biggestDropoffPct: 62,
      bestChannel: 'BD Team (Direct)',
      bestChannelConversion: 10.0,
      posthogConnected: false,
      dataSource: 'placeholder',
      dataNote: '⚠️ Showing placeholder data — connect PostHog + Supabase for real metrics.',
    },
    allMerchants: {
      total: m(1327),
      active: m(148),
      completed: m(729),
      withRevenue: m(200),
    },
    _placeholder: true,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30d';

  try {
    const supabase = createServiceClient();

    let since: string | null = null;
    let phDateFrom = '-30d';
    const now = new Date();
    if (period === '7d') { since = new Date(now.getTime() - 7 * 86400000).toISOString(); phDateFrom = '-7d'; }
    else if (period === '30d') { since = new Date(now.getTime() - 30 * 86400000).toISOString(); phDateFrom = '-30d'; }
    else if (period === '90d') { since = new Date(now.getTime() - 90 * 86400000).toISOString(); phDateFrom = '-90d'; }

    // --- 1. Real merchant data from Supabase ---
    let merchantQuery = supabase
      .from('merchants')
      .select('id, status, onboarding_status, utm_source, lifetime_revenue, monthly_revenue, created_at');
    if (since) merchantQuery = merchantQuery.gte('created_at', since);
    const { data: merchants, error: mErr } = await merchantQuery;
    if (mErr) throw mErr;

    // --- 2. PostHog event counts (top-of-funnel) ---
    const phEventNames = [
      '$pageview',
      'scroll_depth',
      'cta_click',
      'faq_expand',
      'signup_start',
      'signup_complete',
      'signup_error',
      'onboard_start',
      'onboard_complete',
      'onboard_drop_off',
      'landing_exit',
    ];

    let phCounts: Record<string, number> = {};
    let phConnected = false;
    try {
      phCounts = await getEventCounts(phEventNames, phDateFrom);
      phConnected = true;
    } catch (phErr) {
      console.warn('[acquisition-funnel] PostHog unavailable, falling back to Supabase events:', phErr);
      // Fall back to Supabase events table
      let eventsQuery = supabase.from('events').select('event_type, created_at');
      if (since) eventsQuery = eventsQuery.gte('created_at', since);
      const { data: events } = await eventsQuery;
      for (const e of events || []) {
        phCounts[e.event_type] = (phCounts[e.event_type] || 0) + 1;
      }
    }

    const all = merchants || [];

    // If no real data (no merchants and all event counts are zero), return placeholder
    const totalEvents = Object.values(phCounts).reduce((sum, v) => sum + v, 0);
    if (all.length === 0 && totalEvents === 0) {
      return NextResponse.json(getPlaceholderData(period));
    }

    // --- 3. Build funnel with REAL data only ---
    const realSignups = all.filter((m) => m.utm_source !== 'pipedrive_import' && !m.utm_source?.startsWith('pipedrive'));
    const pipedriveImports = all.filter((m) => m.utm_source === 'pipedrive_import' || m.utm_source?.startsWith('pipedrive'));

    // Top-of-funnel from PostHog
    const pageViews = phCounts['$pageview'] || 0;
    const ctaClicks = phCounts['cta_click'] || 0;
    const scrollDepth50 = phCounts['scroll_depth'] || 0;
    const faqExpands = phCounts['faq_expand'] || 0;
    const landingExits = phCounts['landing_exit'] || 0;
    const signupStarts = phCounts['signup_start'] || 0;
    const signupErrors = phCounts['signup_error'] || 0;

    // Onboarding from PostHog (or Supabase fallback)
    const onboardStarts = phCounts['onboard_start'] || 0;
    const onboardCompletes = phCounts['onboard_complete'] || 0;

    // Merchant status counts (real signups only)
    const realOnboarding = realSignups.filter((m) =>
      ['context', 'branding', 'products', 'rewards', 'golive', 'completed'].includes(m.onboarding_status || '')
    ).length;
    const realCompleted = realSignups.filter((m) =>
      m.onboarding_status === 'completed' || m.status === 'active' || m.status === 'onboarded'
    ).length;
    const realActive = realSignups.filter((m) => m.status === 'active').length;
    const realWithRevenue = realSignups.filter((m) => (m.lifetime_revenue ?? 0) > 0).length;

    const allActive = all.filter((m) => m.status === 'active').length;
    const allCompleted = all.filter((m) =>
      m.onboarding_status === 'completed' || m.status === 'active' || m.status === 'onboarded'
    ).length;
    const allWithRevenue = all.filter((m) => (m.lifetime_revenue ?? 0) > 0).length;

    const stages = [
      { id: 'page_view', label: 'Landing Page Views', count: pageViews, source: phConnected ? 'posthog' : 'supabase_events', estimated: false },
      { id: 'scroll_50', label: 'Scrolled 50%+', count: scrollDepth50, source: phConnected ? 'posthog' : 'supabase_events', estimated: false },
      { id: 'cta_click', label: 'CTA Clicked', count: ctaClicks, source: phConnected ? 'posthog' : 'supabase_events', estimated: false },
      { id: 'signup_started', label: 'Signup Started', count: signupStarts, source: phConnected ? 'posthog' : 'supabase_events', estimated: false },
      { id: 'signup_completed', label: 'Signup Completed', count: realSignups.length, source: 'supabase', estimated: false },
      { id: 'onboarding_started', label: 'Onboarding Started', count: onboardStarts || realOnboarding, source: 'supabase', estimated: false },
      { id: 'onboarding_complete', label: 'Onboarding Complete', count: onboardCompletes || realCompleted, source: 'supabase', estimated: false },
      { id: 'first_transaction', label: 'First Transaction', count: realWithRevenue, source: 'supabase', estimated: false },
      { id: 'active', label: 'Active Merchant', count: realActive, source: 'supabase', estimated: false },
    ];

    const stagesWithMeta = stages.map((stage, i) => {
      const prev = i > 0 ? stages[i - 1].count : stage.count;
      const next = i < stages.length - 1 ? stages[i + 1].count : null;
      const conversionToNext = next !== null && stage.count > 0 ? Math.round((next / stage.count) * 100) : null;
      const dropOffFromPrev = i > 0 && prev > 0 ? Math.round(((prev - stage.count) / prev) * 100) : 0;
      const dropOffCount = i > 0 ? prev - stage.count : 0;
      return { ...stage, conversionToNext, dropOffFromPrev, dropOffCount };
    });

    // --- Channel attribution ---
    const channelMap: Record<string, { total: number; active: number; revenue: number }> = {};
    for (const m of all) {
      const src = m.utm_source || 'Direct / Unknown';
      if (src === 'pipedrive_import') continue;
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

    const overallConversion = pageViews > 0
      ? ((realActive / pageViews) * 100).toFixed(2)
      : '0';

    const realStages = [...stagesWithMeta].filter((s) => s.dropOffCount > 0);
    const biggestDropoff = realStages.sort((a, b) => b.dropOffCount - a.dropOffCount)[0] ?? null;
    const bestChannel = [...channels].sort((a, b) => b.conversionRate - a.conversionRate)[0] ?? null;

    return NextResponse.json({
      period,
      totalMerchants: all.length,
      realSignups: realSignups.length,
      pipedriveImports: pipedriveImports.length,
      stages: stagesWithMeta,
      channels,
      engagement: { faqExpands, signupErrors, landingExits },
      summary: {
        overallConversion: parseFloat(overallConversion),
        biggestDropoffStage: biggestDropoff?.label ?? null,
        biggestDropoffPct: biggestDropoff?.dropOffFromPrev ?? null,
        bestChannel: bestChannel?.source ?? null,
        bestChannelConversion: bestChannel?.conversionRate ?? null,
        posthogConnected: phConnected,
        dataSource: phConnected ? 'posthog' : 'supabase_events_fallback',
        dataNote: pageViews === 0
          ? 'No landing page views tracked yet — PostHog will capture them automatically once traffic arrives.'
          : undefined,
      },
      allMerchants: {
        total: all.length,
        active: allActive,
        completed: allCompleted,
        withRevenue: allWithRevenue,
      },
    });
  } catch (err) {
    console.error('acquisition-funnel error:', err);
    // Return placeholder data instead of error so page is always usable
    return NextResponse.json(getPlaceholderData(period));
  }
}
