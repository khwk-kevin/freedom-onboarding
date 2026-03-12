import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getEventCounts } from '@/lib/posthog/api';
import { EVENTS } from '@/lib/analytics/events';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30d';

  const supabase = createServiceClient();

  let since: string | null = null;
  let phDateFrom = '-30d';
  const now = new Date();
  if (period === '7d') {
    since = new Date(now.getTime() - 7 * 86400000).toISOString();
    phDateFrom = '-7d';
  } else if (period === '30d') {
    since = new Date(now.getTime() - 30 * 86400000).toISOString();
    phDateFrom = '-30d';
  } else if (period === '90d') {
    since = new Date(now.getTime() - 90 * 86400000).toISOString();
    phDateFrom = '-90d';
  } else if (period === 'all') {
    phDateFrom = '-365d';
  }

  // ── 1. PostHog event counts (top-of-funnel + signals) ────────────────────
  const phEventNames = [
    '$pageview',
    EVENTS.ONBOARDING_STARTED,
    EVENTS.Q1_ANSWERED,
    EVENTS.Q2_SCRAPE_SUCCESS,
    EVENTS.Q2_SCRAPE_SKIP,
    EVENTS.Q3_MOOD_SELECTED,
    EVENTS.Q4_COLOR_SELECTED,
    EVENTS.FIRST_PREVIEW_SHOWN,
    EVENTS.SIGNUP_WALL_SHOWN,
    EVENTS.SIGNUP_COMPLETED,
    EVENTS.COMMUNITY_CREATED,
    EVENTS.APP_BUILD_STARTED,
    EVENTS.APP_BUILD_COMPLETED,
    EVENTS.APP_DEPLOYED,
    EVENTS.ITERATION_STARTED,
    EVENTS.TOKEN_LIMIT_REACHED,
    EVENTS.SESSION_ABANDONED,
  ];

  let phCounts: Record<string, number> = Object.fromEntries(phEventNames.map(n => [n, 0]));
  let phConnected = false;
  try {
    phCounts = await getEventCounts(phEventNames, phDateFrom);
    phConnected = true;
  } catch (phErr) {
    console.warn('[acquisition-funnel] PostHog unavailable:', phErr);
  }

  // ── 2. Supabase: merchant_apps ────────────────────────────────────────────
  let appsQuery = supabase
    .from('merchant_apps')
    .select('id, status, app_type, region, token_balance, token_used, spec, deployed_at, created_at');
  if (since) appsQuery = appsQuery.gte('created_at', since);
  const { data: apps, error: appsErr } = await appsQuery;
  if (appsErr) console.error('[acquisition-funnel] merchant_apps error:', appsErr);
  const allApps = apps || [];

  // ── 3. Supabase: build_tasks ──────────────────────────────────────────────
  let buildQuery = supabase
    .from('build_tasks')
    .select('id, status, duration_ms, created_at');
  if (since) buildQuery = buildQuery.gte('created_at', since);
  const { data: buildTasks, error: buildErr } = await buildQuery;
  if (buildErr) console.error('[acquisition-funnel] build_tasks error:', buildErr);
  const allTasks = buildTasks || [];

  // ── 4. Supabase: active merchants (app_builder_sessions, last 30d) ────────
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
  const { data: activeSessions } = await supabase
    .from('app_builder_sessions')
    .select('merchant_id')
    .gte('last_active_at', thirtyDaysAgo)
    .not('merchant_id', 'is', null);
  const activeMerchantIds = new Set((activeSessions || []).map(s => s.merchant_id));
  const activeMerchants = activeMerchantIds.size;

  // ── 5. Funnel stages ──────────────────────────────────────────────────────
  // Pre-signup: prefer PostHog counts (captures anonymous visitors)
  // Post-signup: prefer Supabase for accuracy (PostHog as supplement)
  const deployedApps = allApps.filter(a =>
    a.status === 'deployed' || a.status === 'iterating'
  ).length;
  const builtApps = allApps.filter(a =>
    ['building', 'deployed', 'iterating', 'suspended'].includes(a.status ?? '')
  ).length;

  const raw = [
    { id: 'page_view',           label: 'Landing Page Views',    count: phCounts['$pageview'] || 0 },
    { id: 'onboarding_started',  label: 'Started Chat with AVA', count: phCounts[EVENTS.ONBOARDING_STARTED] || 0 },
    { id: 'q1_answered',         label: 'Described Business/Idea', count: phCounts[EVENTS.Q1_ANSWERED] || 0 },
    { id: 'first_preview_shown', label: 'Saw App Preview',       count: phCounts[EVENTS.FIRST_PREVIEW_SHOWN] || 0 },
    { id: 'signup_wall_shown',   label: 'Reached Signup Wall',   count: phCounts[EVENTS.SIGNUP_WALL_SHOWN] || 0 },
    { id: 'signup_completed',    label: 'Signed Up',             count: phCounts[EVENTS.SIGNUP_COMPLETED] || allApps.length },
    { id: 'app_build_completed', label: 'App Built',             count: phCounts[EVENTS.APP_BUILD_COMPLETED] || builtApps },
    { id: 'app_deployed',        label: 'App Deployed & Live',   count: phCounts[EVENTS.APP_DEPLOYED] || deployedApps },
    { id: 'iteration_started',   label: 'Returned to Edit',      count: phCounts[EVENTS.ITERATION_STARTED] || 0 },
    { id: 'active',              label: 'Active Merchant (30d)', count: activeMerchants },
  ];

  const stages = raw.map((stage, i) => {
    const prev = i > 0 ? raw[i - 1].count : stage.count;
    const next = i < raw.length - 1 ? raw[i + 1].count : null;
    const conversionToNext =
      next !== null && stage.count > 0 ? Math.round((next / stage.count) * 100) : null;
    const dropOffFromPrev =
      i > 0 && prev > 0 ? Math.round(((prev - stage.count) / prev) * 100) : 0;
    const dropOffCount = i > 0 ? Math.max(0, prev - stage.count) : 0;
    return {
      ...stage,
      estimated: false,
      source: i <= 4 ? (phConnected ? 'posthog' : 'none') : 'supabase',
      conversionToNext,
      dropOffFromPrev,
      dropOffCount,
    };
  });

  // ── 6. App Builder metrics ────────────────────────────────────────────────
  const totalApps = allApps.length;
  const totalDeployed = deployedApps;

  const successTasks = allTasks.filter(t => t.status === 'success');
  const failedTasks = allTasks.filter(t => t.status === 'failed');
  const completedTasks = successTasks.length + failedTasks.length;
  const buildSuccessRate =
    completedTasks > 0 ? Math.round((successTasks.length / completedTasks) * 100) : 0;

  const tasksWithDuration = allTasks.filter(t => t.duration_ms != null);
  const avgBuildTimeMs =
    tasksWithDuration.length > 0
      ? Math.round(
          tasksWithDuration.reduce((s, t) => s + (t.duration_ms ?? 0), 0) /
            tasksWithDuration.length
        )
      : 0;

  const totalTokensUsed = allApps.reduce((s, a) => s + (a.token_used ?? 0), 0);
  const avgTokensUsed =
    allApps.length > 0 ? Math.round(totalTokensUsed / allApps.length) : 0;

  // Category from spec JSONB
  const categoryMap: Record<string, number> = {};
  for (const app of allApps) {
    const cat =
      ((app.spec as Record<string, unknown>)?.['category'] as string) || 'Uncategorized';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  }
  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([category, count]) => ({ category, count }));

  const businessApps = allApps.filter(a => a.app_type === 'business').length;
  const ideaApps = allApps.filter(a => a.app_type === 'idea').length;

  const regionMap: Record<string, number> = {};
  for (const app of allApps) {
    const reg = (app.region as string) || 'unknown';
    regionMap[reg] = (regionMap[reg] || 0) + 1;
  }

  // ── 7. Channel attribution (from app spec UTM) ────────────────────────────
  const channelMap: Record<string, { total: number; active: number }> = {};
  for (const app of allApps) {
    const src =
      ((app.spec as Record<string, unknown>)?.['utm_source'] as string) ||
      'Direct / Unknown';
    if (!channelMap[src]) channelMap[src] = { total: 0, active: 0 };
    channelMap[src].total++;
    if (app.status === 'deployed' || app.status === 'iterating') {
      channelMap[src].active++;
    }
  }
  const channels = Object.entries(channelMap)
    .map(([source, d]) => ({
      source,
      total: d.total,
      active: d.active,
      revenue: 0,
      conversionRate: d.total > 0 ? Math.round((d.active / d.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // ── 8. Summary ────────────────────────────────────────────────────────────
  const pageViews = phCounts['$pageview'] || 0;
  const overallConversion =
    pageViews > 0 ? parseFloat(((activeMerchants / pageViews) * 100).toFixed(2)) : 0;

  const droppable = [...stages].filter(s => s.dropOffCount > 0);
  const biggestDropoff =
    droppable.sort((a, b) => b.dropOffCount - a.dropOffCount)[0] ?? null;
  const bestChannel =
    [...channels].sort((a, b) => b.conversionRate - a.conversionRate)[0] ?? null;

  return NextResponse.json({
    period,
    totalMerchants: totalApps,
    stages,
    channels,
    summary: {
      overallConversion,
      biggestDropoffStage: biggestDropoff?.label ?? null,
      biggestDropoffPct: biggestDropoff?.dropOffFromPrev ?? null,
      bestChannel: bestChannel?.source ?? null,
      bestChannelConversion: bestChannel?.conversionRate ?? null,
      posthogConnected: phConnected,
      dataSource: phConnected ? 'posthog+supabase' : 'supabase',
    },
    appBuilder: {
      totalApps,
      deployedApps: totalDeployed,
      avgBuildTimeMs,
      buildSuccessRate,
      avgTokensUsed,
      topCategories,
      appTypeBreakdown: { business: businessApps, idea: ideaApps },
      regionBreakdown: regionMap,
    },
    phSignals: {
      q2ScrapeSuccess: phCounts[EVENTS.Q2_SCRAPE_SUCCESS] || 0,
      q2ScrapeSkip:    phCounts[EVENTS.Q2_SCRAPE_SKIP]    || 0,
      q3MoodSelected:  phCounts[EVENTS.Q3_MOOD_SELECTED]  || 0,
      q4ColorSelected: phCounts[EVENTS.Q4_COLOR_SELECTED] || 0,
      appBuildStarted: phCounts[EVENTS.APP_BUILD_STARTED] || 0,
      tokenLimitReached: phCounts[EVENTS.TOKEN_LIMIT_REACHED] || 0,
      sessionAbandoned:  phCounts[EVENTS.SESSION_ABANDONED]   || 0,
      communityCreated:  phCounts[EVENTS.COMMUNITY_CREATED]   || 0,
    },
  });
}
