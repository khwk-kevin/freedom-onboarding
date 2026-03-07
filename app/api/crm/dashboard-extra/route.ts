import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Engagement score calculation
function calcEngagement(m: {
  notes: unknown;
  phone: string | null;
  email: string;
  status: string;
  onboarding_status: string;
  lifetime_revenue: number | null;
  assigned_to: string | null;
}): number {
  let score = 0;
  // Has contact person in Pipedrive data
  if (Array.isArray(m.notes)) {
    const pd = (m.notes as Array<Record<string, unknown>>).find((n) => n && n.type === 'pipedrive_import');
    if (pd?.contact_person) score += 10;
    const acts = Number(pd?.activities_done ?? 0);
    if (acts > 0) score += 10;
  }
  if (m.phone) score += 10;
  // Real email (not pipedrive+ pattern)
  if (m.email && !m.email.includes('pipedrive+') && !m.email.includes('@example.')) score += 10;
  if (m.status === 'active' || m.status === 'onboarded') score += 20;
  if ((m.lifetime_revenue ?? 0) > 0) score += 20;
  if (m.assigned_to) score += 10;
  if (m.onboarding_status === 'completed') score += 10;
  return score;
}

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data: merchants } = await supabase
      .from('merchants')
      .select('id, email, business_name, status, onboarding_status, assigned_to, phone, lifetime_revenue, monthly_revenue, notes, last_activity_at, created_at');

    if (!merchants) return NextResponse.json({ error: 'no data' }, { status: 500 });

    const now = Date.now();

    // Engagement scores
    const scores = merchants.map((m) => ({ id: m.id, score: calcEngagement(m) }));
    const avgEngagement = scores.length > 0
      ? Math.round(scores.reduce((s, x) => s + x.score, 0) / scores.length) : 0;

    // Score distribution buckets
    const dist = { high: 0, med: 0, low: 0 };
    for (const s of scores) {
      if (s.score >= 60) dist.high++;
      else if (s.score >= 30) dist.med++;
      else dist.low++;
    }

    // Team performance: group by assigned_to
    const teamMap = new Map<string, { total: number; active: number; completed: number; revenue: number }>();
    for (const m of merchants) {
      const owner = m.assigned_to || 'Unassigned';
      if (!teamMap.has(owner)) teamMap.set(owner, { total: 0, active: 0, completed: 0, revenue: 0 });
      const t = teamMap.get(owner)!;
      t.total++;
      if (m.status === 'active' || m.status === 'onboarded') t.active++;
      if (m.onboarding_status === 'completed') t.completed++;
      t.revenue += m.lifetime_revenue ?? 0;
    }
    const teamPerf = Array.from(teamMap.entries())
      .map(([owner, d]) => ({
        owner,
        total: d.total,
        active: d.active,
        completed: d.completed,
        revenue: d.revenue,
        completionRate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);

    // At-risk merchants
    const atRisk: Array<{
      id: string; business_name: string | null; email: string; reason: string;
      onboarding_status: string; assigned_to: string | null; days: number;
    }> = [];

    for (const m of merchants) {
      const lastActivity = m.last_activity_at || m.created_at;
      const days = Math.floor((now - new Date(lastActivity).getTime()) / 86400000);

      // Onboarding stuck > 14 days
      if (['context', 'branding', 'products', 'rewards', 'golive'].includes(m.onboarding_status) && days > 14) {
        atRisk.push({ id: m.id, business_name: m.business_name, email: m.email, reason: `Stuck in ${m.onboarding_status} for ${days} days`, onboarding_status: m.onboarding_status, assigned_to: m.assigned_to, days });
      }
      // Active but 0 revenue
      else if (m.status === 'active' && !(m.lifetime_revenue && m.lifetime_revenue > 0)) {
        atRisk.push({ id: m.id, business_name: m.business_name, email: m.email, reason: 'Active but no revenue recorded', onboarding_status: m.onboarding_status, assigned_to: m.assigned_to, days });
      }
    }
    atRisk.sort((a, b) => b.days - a.days);

    // Label distribution
    const labelMap: Record<string, number> = {};
    for (const m of merchants) {
      if (Array.isArray(m.notes)) {
        const pd = (m.notes as Array<Record<string, unknown>>).find((n) => n && n.type === 'pipedrive_import');
        const label = (pd?.pipedrive_label as string) || 'Unknown';
        labelMap[label] = (labelMap[label] || 0) + 1;
      }
    }

    return NextResponse.json({
      avgEngagement,
      engagementDist: dist,
      teamPerf,
      atRisk: atRisk.slice(0, 20),
      labelDist: labelMap,
      unassigned: merchants.filter((m) => !m.assigned_to).length,
    });
  } catch (err) {
    console.error('[dashboard-extra]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
