'use client';
import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/crm/StatsCard';
import { FunnelChart } from '@/components/crm/FunnelChart';
import { Users, TrendingUp, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  thisWeek: {
    signups: number;
    signupsChange: number;
    onboarded: number;
    onboardedChange: number;
  };
  funnel: {
    leads: number;
    onboarding: number;
    onboarded: number;
    active: number;
    dormant: number;
  };
  openHandoffs: number;
  total: number;
}

interface RevenueStats {
  total_lifetime_revenue: number;
  total_monthly_revenue: number;
}

export default function CRMDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/crm/stats').then((r) => r.json()),
      fetch('/api/crm/stats/revenue').then((r) => r.json()).catch(() => null),
    ]).then(([statsData, revenueData]) => {
      setStats(statsData);
      if (revenueData) setRevenue(revenueData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="mb-8">
          <div className="h-7 bg-gray-200 rounded w-40 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-56 mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const funnelStages = [
    { label: 'Lead', value: stats?.funnel.leads ?? 0, color: '#6366f1' },
    { label: 'Onboarding', value: stats?.funnel.onboarding ?? 0, color: '#f59e0b' },
    { label: 'Onboarded', value: stats?.funnel.onboarded ?? 0, color: '#3b82f6' },
    { label: 'Active', value: stats?.funnel.active ?? 0, color: '#00CC6A' },
  ];

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">BD Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Merchant pipeline overview</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/crm/pipeline"
            className="px-4 py-2 bg-brand-green hover:bg-brand-green-dark text-black text-sm font-semibold rounded-lg transition-colors"
          >
            View Pipeline
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Signups This Week"
          value={stats?.thisWeek.signups ?? 0}
          change={stats?.thisWeek.signupsChange}
          icon={<Users size={20} />}
        />
        <StatsCard
          label="Onboarded This Week"
          value={stats?.thisWeek.onboarded ?? 0}
          change={stats?.thisWeek.onboardedChange}
          icon={<CheckCircle size={20} />}
        />
        <StatsCard
          label="Active Merchants"
          value={stats?.funnel.active ?? 0}
          icon={<TrendingUp size={20} />}
        />
        <StatsCard
          label="Open Handoffs"
          value={stats?.openHandoffs ?? 0}
          icon={<AlertCircle size={20} />}
        />
      </div>

      {/* Revenue stats (from Neon) */}
      {revenue && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <StatsCard
            label="Total Lifetime Revenue"
            value={`฿${(revenue.total_lifetime_revenue || 0).toLocaleString()}`}
            icon={<DollarSign size={20} />}
          />
          <StatsCard
            label="Monthly Revenue (30d)"
            value={`฿${(revenue.total_monthly_revenue || 0).toLocaleString()}`}
            icon={<TrendingUp size={20} />}
          />
        </div>
      )}

      {/* Funnel + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FunnelChart stages={funnelStages} />

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Pipeline Breakdown</h3>
          <div className="space-y-3">
            {[
              {
                label: 'Leads',
                value: stats?.funnel.leads ?? 0,
                color: 'bg-indigo-100 text-indigo-700',
                href: '/crm/merchants?status=lead',
              },
              {
                label: 'In Onboarding',
                value: stats?.funnel.onboarding ?? 0,
                color: 'bg-amber-100 text-amber-700',
                href: '/crm/merchants?status=onboarding',
              },
              {
                label: 'Onboarded',
                value: stats?.funnel.onboarded ?? 0,
                color: 'bg-blue-100 text-blue-700',
                href: '/crm/merchants?status=onboarded',
              },
              {
                label: 'Active',
                value: stats?.funnel.active ?? 0,
                color: 'bg-green-100 text-green-700',
                href: '/crm/merchants?status=active',
              },
              {
                label: 'Dormant',
                value: stats?.funnel.dormant ?? 0,
                color: 'bg-gray-100 text-gray-700',
                href: '/crm/merchants?status=dormant',
              },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
              >
                <span className="text-sm text-gray-600">{item.label}</span>
                <span
                  className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${item.color}`}
                >
                  {item.value}
                </span>
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between px-2">
              <span className="text-sm font-medium text-gray-700">Total Merchants</span>
              <span className="text-sm font-bold text-gray-900">{stats?.total ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
