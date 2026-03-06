'use client';
import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, Zap } from 'lucide-react';

interface ChannelStat {
  channel: string;
  total_leads: number;
  completed: number;
  completion_rate_pct: number;
  avg_onboard_minutes: number | null;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<{ funnel: Record<string, number>; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/crm/stats')
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-7 bg-gray-200 rounded w-32 animate-pulse mb-8" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const funnel = stats?.funnel || {};
  const total = stats?.total || 0;

  const conversionRate =
    funnel.leads && funnel.leads > 0
      ? Math.round((funnel.active / funnel.leads) * 100)
      : 0;

  const onboardingRate =
    total > 0 ? Math.round((funnel.onboarded / total) * 100) : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1 text-sm">Pipeline performance metrics</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total Merchants',
            value: total,
            icon: <Users size={20} />,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
          },
          {
            label: 'Active Merchants',
            value: funnel.active || 0,
            icon: <TrendingUp size={20} />,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: 'Lead → Active Rate',
            value: `${conversionRate}%`,
            icon: <Zap size={20} />,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'Onboarding Rate',
            value: `${onboardingRate}%`,
            icon: <BarChart3 size={20} />,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{kpi.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{kpi.value}</p>
              </div>
              <div className={`w-10 h-10 ${kpi.bg} ${kpi.color} rounded-lg flex items-center justify-center`}>
                {kpi.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Funnel breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Full Pipeline Breakdown</h3>
        <div className="space-y-3">
          {[
            { label: 'Leads', key: 'leads', color: '#6366f1' },
            { label: 'In Onboarding', key: 'onboarding', color: '#f59e0b' },
            { label: 'Onboarded', key: 'onboarded', color: '#3b82f6' },
            { label: 'Active', key: 'active', color: '#00CC6A' },
            { label: 'Dormant', key: 'dormant', color: '#9ca3af' },
          ].map((row) => {
            const value = funnel[row.key] || 0;
            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
            return (
              <div key={row.key} className="flex items-center gap-3">
                <span className="w-28 text-sm text-gray-600 shrink-0">{row.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6">
                  <div
                    className="h-6 rounded-full flex items-center px-2 min-w-[24px] transition-all duration-700"
                    style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: row.color }}
                  >
                    <span className="text-white text-xs font-bold">{value}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coming soon */}
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center">
        <BarChart3 size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-500">Channel attribution, cohort analysis, and revenue trends</p>
        <p className="text-xs text-gray-400 mt-1">Coming in a future sprint</p>
      </div>
    </div>
  );
}
