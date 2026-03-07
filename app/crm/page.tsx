'use client';
import { useEffect, useState } from 'react';
import { Users, TrendingUp, CheckCircle, AlertCircle, DollarSign, ArrowRight, Activity, Clock, ChevronRight, BarChart2, Target, Compass } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  thisWeek: { signups: number; signupsChange: number; onboarded: number; onboardedChange: number };
  funnel: { leads: number; onboarding: number; onboarded: number; active: number; dormant: number };
  openHandoffs: number;
  total: number;
}

interface RevenueStats {
  total_lifetime_revenue: number;
  total_monthly_revenue: number;
}

interface ExtraStats {
  avgEngagement: number;
  engagementDist: { high: number; med: number; low: number };
  teamPerf: Array<{ owner: string; total: number; active: number; completed: number; revenue: number; completionRate: number }>;
  atRisk: Array<{ id: string; business_name: string | null; email: string; reason: string; onboarding_status: string; assigned_to: string | null; days: number }>;
  labelDist: Record<string, number>;
  unassigned: number;
}

const FUNNEL_STAGES = [
  { key: 'leads' as const, label: 'Leads', color: '#4A90D9', href: '/crm/pipeline' },
  { key: 'onboarding' as const, label: 'Onboarding', color: '#F5A623', href: '/crm/merchants?status=onboarding' },
  { key: 'onboarded' as const, label: 'Onboarded', color: '#7B68EE', href: '/crm/merchants?status=onboarded' },
  { key: 'active' as const, label: 'Won', color: '#4CAF50', href: '/crm/merchants?status=active' },
  { key: 'dormant' as const, label: 'Dormant', color: '#9E9E9E', href: '/crm/merchants?status=dormant' },
];

const LABEL_COLORS: Record<string, string> = {
  'Micro Enterprise': '#4A90D9',
  'SME': '#7B68EE',
  'Corporate': '#F5A623',
  'Unknown': '#9E9E9E',
};

function StatBlock({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] text-gray-500 font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-[12px] text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '20', color }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function CRMDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [extra, setExtra] = useState<ExtraStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/crm/stats').then((r) => r.json()),
      fetch('/api/crm/stats/revenue').then((r) => r.json()).catch(() => null),
      fetch('/api/crm/dashboard-extra').then((r) => r.json()).catch(() => null),
    ]).then(([statsData, revenueData, extraData]) => {
      setStats(statsData);
      if (revenueData) setRevenue(revenueData);
      if (extraData) setExtra(extraData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const funnel = stats?.funnel;
  const maxFunnelVal = funnel ? Math.max(...FUNNEL_STAGES.map((s) => funnel[s.key] ?? 0), 1) : 1;

  const totalLabelCount = extra ? Object.values(extra.labelDist).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="p-5 bg-[#f5f6f8] min-h-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[18px] font-bold text-gray-900">BD Overview</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Pipeline & merchant performance</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/crm/community-tracker"
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors hover:bg-gray-50"
          >
            <Compass size={14} /> Community Tracker
          </Link>
          <Link
            href="/crm/pipeline"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#4A90D9] hover:bg-[#3a7bc8] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Pipeline View <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Top stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <StatBlock label="Signups This Week" value={stats?.thisWeek.signups ?? 0}
              sub={stats?.thisWeek.signupsChange ? `${stats.thisWeek.signupsChange > 0 ? '+' : ''}${stats.thisWeek.signupsChange} vs last week` : undefined}
              icon={<Users size={18} />} color="#4A90D9" />
            <StatBlock label="Onboarded This Week" value={stats?.thisWeek.onboarded ?? 0}
              sub={stats?.thisWeek.onboardedChange ? `${stats.thisWeek.onboardedChange > 0 ? '+' : ''}${stats.thisWeek.onboardedChange} vs last week` : undefined}
              icon={<CheckCircle size={18} />} color="#4CAF50" />
            <StatBlock label="Active Merchants" value={stats?.funnel.active ?? 0} sub="Currently active"
              icon={<TrendingUp size={18} />} color="#7B68EE" />
            <StatBlock label="Open Handoffs" value={stats?.openHandoffs ?? 0} sub="Need attention"
              icon={<AlertCircle size={18} />} color="#F5A623" />
          </div>

          {/* Revenue + Engagement */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {revenue && (
              <>
                <StatBlock label="Total Lifetime Revenue" value={`฿${(revenue.total_lifetime_revenue || 0).toLocaleString()}`}
                  sub="All time" icon={<DollarSign size={18} />} color="#4CAF50" />
                <StatBlock label="Monthly Revenue (30d)" value={`฿${(revenue.total_monthly_revenue || 0).toLocaleString()}`}
                  sub="Last 30 days" icon={<TrendingUp size={18} />} color="#4A90D9" />
              </>
            )}
            {extra && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Avg Engagement Score</p>
                    <p className="text-2xl font-bold text-gray-900">{extra.avgEngagement}<span className="text-sm text-gray-400 font-normal">/100</span></p>
                  </div>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600">
                    <Target size={18} />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="flex-1 bg-green-50 rounded p-1.5 text-center">
                    <p className="text-[10px] text-green-600">High</p>
                    <p className="text-[13px] font-bold text-green-700">{extra.engagementDist.high}</p>
                  </div>
                  <div className="flex-1 bg-amber-50 rounded p-1.5 text-center">
                    <p className="text-[10px] text-amber-600">Med</p>
                    <p className="text-[13px] font-bold text-amber-700">{extra.engagementDist.med}</p>
                  </div>
                  <div className="flex-1 bg-red-50 rounded p-1.5 text-center">
                    <p className="text-[10px] text-red-600">Low</p>
                    <p className="text-[13px] font-bold text-red-700">{extra.engagementDist.low}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Visual funnel */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-[14px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity size={15} className="text-gray-400" />
                Pipeline Funnel
              </h3>
              <div className="space-y-2.5">
                {FUNNEL_STAGES.map((stage) => {
                  const count = funnel ? (funnel[stage.key] ?? 0) : 0;
                  const pct = maxFunnelVal > 0 ? (count / maxFunnelVal) * 100 : 0;
                  return (
                    <Link key={stage.key} href={stage.href}>
                      <div className="group hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-medium text-gray-700">{stage.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-gray-900">{count}</span>
                            <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: stage.color }} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Pipeline breakdown table */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-[14px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={15} className="text-gray-400" />
                Stage Breakdown
              </h3>
              <div className="space-y-0">
                {FUNNEL_STAGES.map((stage, i) => {
                  const count = funnel ? (funnel[stage.key] ?? 0) : 0;
                  const nextCount = i < FUNNEL_STAGES.length - 1 && funnel
                    ? (funnel[FUNNEL_STAGES[i + 1].key] ?? 0) : null;
                  const convRate = nextCount !== null && count > 0 ? Math.round((nextCount / count) * 100) : null;
                  return (
                    <Link key={stage.key} href={stage.href}>
                      <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors group">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                          <span className="text-[13px] text-gray-700">{stage.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-semibold text-gray-900">{count}</span>
                          {convRate !== null && <span className="text-[11px] text-gray-400">→ {convRate}%</span>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
                <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-200">
                  <span className="text-[13px] font-semibold text-gray-700">Total Merchants</span>
                  <span className="text-[14px] font-bold text-gray-900">{stats?.total ?? 0}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
                <Link href="/crm/merchants" className="flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <Users size={13} /> All Merchants
                </Link>
                <Link href="/crm/handoffs" className="flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">
                  <AlertCircle size={13} /> Handoffs ({stats?.openHandoffs ?? 0})
                </Link>
              </div>
            </div>
          </div>

          {/* Label distribution + Team Performance */}
          {extra && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              {/* Label Distribution */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-[14px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart2 size={15} className="text-gray-400" />
                  Merchant Label Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(extra.labelDist).sort((a, b) => b[1] - a[1]).map(([label, count]) => {
                    const pct = totalLabelCount > 0 ? Math.round((count / totalLabelCount) * 100) : 0;
                    const color = LABEL_COLORS[label] ?? '#9E9E9E';
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] text-gray-700">{label}</span>
                          <span className="text-[12px] font-semibold text-gray-900">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Team Performance */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-[14px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users size={15} className="text-gray-400" />
                  Team Performance
                  {extra.unassigned > 0 && (
                    <span className="ml-auto text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      {extra.unassigned} unassigned
                    </span>
                  )}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-1.5 text-[11px] text-gray-400 font-semibold">Owner</th>
                        <th className="text-right py-1.5 text-[11px] text-gray-400 font-semibold">Total</th>
                        <th className="text-right py-1.5 text-[11px] text-gray-400 font-semibold">Active</th>
                        <th className="text-right py-1.5 text-[11px] text-gray-400 font-semibold">Done%</th>
                        <th className="text-right py-1.5 text-[11px] text-gray-400 font-semibold">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extra.teamPerf.map((row) => (
                        <tr key={row.owner} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 font-medium text-gray-800 max-w-[100px] truncate">{row.owner}</td>
                          <td className="py-2 text-right text-gray-700">{row.total}</td>
                          <td className="py-2 text-right">
                            <span className={`font-semibold ${row.active > 0 ? 'text-green-600' : 'text-gray-400'}`}>{row.active}</span>
                          </td>
                          <td className="py-2 text-right">
                            <span className={`font-semibold ${row.completionRate >= 5 ? 'text-blue-600' : 'text-gray-400'}`}>{row.completionRate}%</span>
                          </td>
                          <td className="py-2 text-right text-gray-600">
                            {row.revenue > 0 ? `฿${(row.revenue / 1000).toFixed(0)}K` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* At-Risk Merchants */}
          {extra && extra.atRisk.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
              <h3 className="text-[14px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle size={15} className="text-red-400" />
                At-Risk Merchants
                <span className="ml-auto text-[11px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{extra.atRisk.length} need attention</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-[11px] text-gray-400 font-semibold">Business</th>
                      <th className="text-left py-2 text-[11px] text-gray-400 font-semibold">Issue</th>
                      <th className="text-left py-2 text-[11px] text-gray-400 font-semibold">Stage</th>
                      <th className="text-left py-2 text-[11px] text-gray-400 font-semibold">Owner</th>
                      <th className="text-right py-2 text-[11px] text-gray-400 font-semibold">Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extra.atRisk.slice(0, 10).map((m) => (
                      <tr key={m.id} className="border-b border-gray-50 hover:bg-red-50/30 transition-colors">
                        <td className="py-2">
                          <Link href={`/crm/merchants/${m.id}`} className="text-[#4A90D9] hover:underline font-medium">
                            {m.business_name || m.email}
                          </Link>
                        </td>
                        <td className="py-2 text-gray-500 text-[12px]">{m.reason}</td>
                        <td className="py-2">
                          <span className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{m.onboarding_status}</span>
                        </td>
                        <td className="py-2 text-gray-500 text-[12px]">{m.assigned_to || '—'}</td>
                        <td className="py-2 text-right">
                          <span className={`font-bold text-[12px] ${m.days > 21 ? 'text-red-600' : 'text-amber-600'}`}>{m.days}d</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {extra.atRisk.length > 10 && (
                <Link href="/crm/community-tracker" className="block text-center text-[12px] text-[#4A90D9] hover:underline mt-3">
                  View all {extra.atRisk.length} at-risk merchants →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
