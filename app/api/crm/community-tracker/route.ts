import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/crm/community-tracker — aggregate data for the community tracker page
export async function GET() {
  const supabase = createServiceClient();

  const { data: merchants, error } = await supabase
    .from('merchants')
    .select('id, business_name, email, onboarding_status, status, assigned_to, created_at, last_activity_at, notes')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();

  // Enrich each merchant with pipedrive data
  const enriched = (merchants ?? []).map((m) => {
    let contact_person: string | null = null;
    let pipedrive_label: string | null = null;
    let lost_reason: string | null = null;

    if (Array.isArray(m.notes)) {
      const pd = (m.notes as Array<Record<string, unknown>>).find(
        (n) => n && n.type === 'pipedrive_import'
      );
      if (pd) {
        contact_person = (pd.contact_person as string) || null;
        pipedrive_label = (pd.pipedrive_label as string) || null;
        lost_reason = (pd.lost_reason as string) || null;
      }
    }

    const lastActivity = m.last_activity_at || m.created_at;
    const daysInStage = Math.floor((now - new Date(lastActivity).getTime()) / 86400000);

    return {
      id: m.id,
      business_name: m.business_name || m.email,
      email: m.email,
      onboarding_status: m.onboarding_status,
      status: m.status,
      assigned_to: m.assigned_to,
      created_at: m.created_at,
      last_activity_at: m.last_activity_at,
      contact_person,
      pipedrive_label,
      lost_reason,
      days_in_stage: daysInStage,
    };
  });

  // Group by onboarding_status
  const stages = ['signup', 'context', 'branding', 'products', 'rewards', 'golive', 'completed', 'abandoned'];
  const byStage: Record<string, typeof enriched> = {};
  for (const s of stages) byStage[s] = [];

  for (const m of enriched) {
    const stage = m.onboarding_status || 'signup';
    if (!byStage[stage]) byStage[stage] = [];
    byStage[stage].push(m);
  }

  // Calculate metrics
  const pipeline = enriched.filter((m) => m.onboarding_status !== 'abandoned' && m.onboarding_status !== 'completed');
  const stuck = pipeline.filter((m) => m.days_in_stage > 14);
  const completed = byStage['completed'] || [];
  const total = enriched.length;

  // Avg time to complete (days from created_at to last_activity_at for completed)
  const completedWithTime = completed.filter((m) => m.last_activity_at);
  const avgDays = completedWithTime.length > 0
    ? Math.round(completedWithTime.reduce((sum, m) => {
        return sum + Math.floor((new Date(m.last_activity_at!).getTime() - new Date(m.created_at).getTime()) / 86400000);
      }, 0) / completedWithTime.length)
    : null;

  // This week completions (completed updated in last 7 days)
  const oneWeekAgo = now - 7 * 86400000;
  const thisWeekCompletions = completed.filter((m) => m.last_activity_at && new Date(m.last_activity_at).getTime() > oneWeekAgo).length;

  return NextResponse.json({
    byStage,
    metrics: {
      totalInPipeline: pipeline.length,
      avgDaysToComplete: avgDays,
      conversionRate: total > 0 ? Math.round((completed.length / total) * 100) : 0,
      stuckCount: stuck.length,
      thisWeekCompletions,
      total,
      completedTotal: completed.length,
      abandonedTotal: (byStage['abandoned'] || []).length,
    },
    stages,
  });
}
