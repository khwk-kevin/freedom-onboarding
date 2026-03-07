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

    let query = supabase
      .from('merchants')
      .select('id, status, onboarding_status, utm_source, lifetime_revenue, monthly_revenue, created_at');

    if (since) query = query.gte('created_at', since);

    const { data: merchants, error } = await query;
    if (error) throw error;

    const all = merchants || [];
    const total = all.length;

    // --- Funnel stage counts from DB ---
    const signupStarted = total; // all merchants signed up
    const signupCompleted = total; // same (they're all in DB)
    const onboardingStarted = all.filter((m) =>
      ['context', 'branding', 'products', 'rewards', 'go_live', 'completed', 'onboarding', 'onboarded', 'active', 'dormant'].includes(m.onboarding_status ?? m.status)
    ).length;
    const contextPhase = all.filter((m) =>
      ['branding', 'products', 'rewards', 'go_live', 'completed', 'onboarded', 'active'].includes(m.onboarding_status ?? '')
    ).length + all.filter(m => ['branding', 'products', 'rewards', 'go_live', 'completed'].includes(m.status ?? '')).length;
    const brandingPhase = all.filter((m) =>
      ['products', 'rewards', 'go_live', 'completed', 'onboarded', 'active'].includes(m.onboarding_status ?? '')
    ).length;
    const productsPhase = all.filter((m) =>
      ['rewards', 'go_live', 'completed', 'onboarded', 'active'].includes(m.onboarding_status ?? '')
    ).length;
    const rewardsPhase = all.filter((m) =>
      ['go_live', 'completed', 'onboarded', 'active'].includes(m.onboarding_status ?? '')
    ).length;
    const goLivePhase = all.filter((m) =>
      ['completed', 'onboarded', 'active'].includes(m.onboarding_status ?? '') ||
      ['onboarded', 'active'].includes(m.status ?? '')
    ).length;
    const onboardingComplete = all.filter((m) =>
      m.onboarding_status === 'completed' || m.status === 'onboarded' || m.status === 'active'
    ).length;
    const firstProduct = all.filter((m) =>
      m.status === 'active' || m.status === 'onboarded'
    ).length;
    const firstTransaction = all.filter((m) => (m.lifetime_revenue ?? 0) > 0).length;
    const activeMerchant = all.filter((m) => m.status === 'active').length;

    // --- Estimated top-of-funnel (typical SaaS rates) ---
    // signup → landing: ~3% CVR, cta: ~30% of landing clicks
    const estimatedLandingVisits = Math.round(signupStarted / 0.03);
    const estimatedCtaClicks = Math.round(estimatedLandingVisits * 0.30);
    const estimatedSignupPageViews = Math.round(estimatedCtaClicks * 0.85);

    const stages = [
      { id: 'landing', label: 'Landing Visit', count: estimatedLandingVisits, estimated: true },
      { id: 'cta_click', label: 'CTA Click', count: estimatedCtaClicks, estimated: true },
      { id: 'signup_page', label: 'Signup Page', count: estimatedSignupPageViews, estimated: true },
      { id: 'signup_started', label: 'Signup Started', count: signupStarted, estimated: false },
      { id: 'signup_completed', label: 'Signup Completed', count: signupCompleted, estimated: false },
      { id: 'onboarding_started', label: 'Onboarding Started', count: onboardingStarted, estimated: false },
      { id: 'context', label: 'Context Phase', count: contextPhase, estimated: false },
      { id: 'branding', label: 'Branding Phase', count: brandingPhase, estimated: false },
      { id: 'products', label: 'Products Phase', count: productsPhase, estimated: false },
      { id: 'rewards', label: 'Rewards Phase', count: rewardsPhase, estimated: false },
      { id: 'go_live', label: 'Go Live Phase', count: goLivePhase, estimated: false },
      { id: 'onboarding_complete', label: 'Onboarding Complete', count: onboardingComplete, estimated: false },
      { id: 'first_product', label: 'First Product Listed', count: firstProduct, estimated: false },
      { id: 'first_transaction', label: 'First Transaction', count: firstTransaction, estimated: false },
      { id: 'active', label: 'Active Merchant', count: activeMerchant, estimated: false },
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

    // --- Channel attribution ---
    const channelMap: Record<string, { total: number; active: number; revenue: number }> = {};
    for (const m of all) {
      const src = m.utm_source || 'Direct / Unknown';
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

    // Summary stats
    const overallConversion = estimatedLandingVisits > 0
      ? ((activeMerchant / estimatedLandingVisits) * 100).toFixed(2)
      : '0';

    // Biggest drop-off (non-estimated stages)
    const realStages = stagesWithMeta.filter(s => !s.estimated && s.dropOffCount > 0);
    const biggestDropoff = realStages.sort((a, b) => b.dropOffCount - a.dropOffCount)[0] ?? null;

    const bestChannel = channels.sort((a, b) => b.conversionRate - a.conversionRate)[0] ?? null;

    return NextResponse.json({
      period,
      totalMerchants: total,
      stages: stagesWithMeta,
      channels,
      summary: {
        overallConversion: parseFloat(overallConversion),
        biggestDropoffStage: biggestDropoff?.label ?? null,
        biggestDropoffPct: biggestDropoff?.dropOffFromPrev ?? null,
        bestChannel: bestChannel?.source ?? null,
        bestChannelConversion: bestChannel?.conversionRate ?? null,
      },
    });
  } catch (err) {
    console.error('acquisition-funnel error:', err);
    return NextResponse.json({ error: 'Failed to load funnel data' }, { status: 500 });
  }
}
