'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, CheckCircle, AlertCircle, Clock, TrendingUp,
  ChevronRight, User, Briefcase, ArrowRight,
} from 'lucide-react';

interface MerchantSummary {
  id: string;
  business_name: string;
  email: string;
  onboarding_status: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
  last_activity_at: string | null;
  contact_person: string | null;
  pipedrive_label: string | null;
  lost_reason: string | null;
  days_in_stage: number;
}

interface Metrics {
  totalInPipeline: number;
  avgDaysToComplete: number | null;
  conversionRate: number;
  stuckCount: number;
  thisWeekCompletions: number;
  total: number;
  completedTotal: number;
  abandonedTotal: number;
}

interface TrackerData {
  byStage: Record<string, MerchantSummary[]>;
  metrics: Metrics;
  stages: string[];
}

const PIPELINE_STAGES = [
  { key: 'signup', label: 'Signup', color: '#4A90D9', shortLabel: 'Signup' },
  { key: 'context', label: 'Context', color: '#7B68EE', shortLabel: 'Context' },
  { key: 'branding', label: 'Branding', color: '#F5A623', shortLabel: 'Branding' },
  { key: 'products', label: 'Products', color: '#E57373', shortLabel: 'Products' },
  { key: 'rewards', label: 'Rewards', color: '#29B6F6', shortLabel: 'Rewards' },
  { key: 'golive', label: 'Go Live', color: '#66BB6A', shortLabel: 'Go Live' },
  { key: 'completed', label: 'Completed', color: '#4CAF50', shortLabel: 'Done' },
];

const LABEL_COLORS: Record<string, string> = {
  'Micro Enterprise': 'bg-blue-100 text-blue-700',
  'SME': 'bg-purple-100 text-purple-700',
  'Corporate': 'bg-amber-100 text-amber-700',
};

function stageAgeBg(days: number): string {
  if (days <= 7) return 'border-green-300 bg-green-50';
  if (days <= 14) return 'border-amber-300 bg-amber-50';
  return 'border-red-300 bg-red-50';
}

function stageAgeDot(days: number): string {
  if (days <= 7) return 'bg-green-400';
  if (days <= 14) return 'bg-amber-400';
  return 'bg-red-500';
}

function MetricCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-gray-500 font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '20', color }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function MerchantCard({ m, stageColor }: { m: MerchantSummary; stageColor: string }) {
  return (
    <Link href={`/crm/merchants/${m.id}`}>
      <div className={`rounded-lg border-l-4 p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow bg-white ${stageAgeBg(m.days_in_stage)}`}
        style={{ borderLeftColor: stageColor }}>
        <div className="flex items-start justify-between gap-1">
          <p className="text-[13px] font-semibold text-gray-900 leading-tight truncate">{m.business_name}</p>
          <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${stageAgeDot(m.days_in_stage)}`} />
        </div>
        {m.contact_person && (
          <div className="flex items-center gap-1 mt-1">
            <User size={10} className="text-gray-400" />
            <span className="text-[11px] text-gray-500 truncate">{m.contact_person}</span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {m.pipedrive_label && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${LABEL_COLORS[m.pipedrive_label] ?? 'bg-gray-100 text-gray-600'}`}>
              {m.pipedrive_label}
            </span>
          )}
          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
            <Clock size={9} /> {m.days_in_stage}d
          </span>
          {m.assigned_to && (
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5 truncate">
              <Briefcase size={9} /> {m.assigned_to}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function CommunityTrackerPage() {
  const [data, setData] = useState<TrackerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [view, setView] = useState<'kanban' | 'funnel'>('funnel');

  useEffect(() => {
    fetch('/api/crm/community-tracker')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-white rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-gray-500">Failed to load data</div>;
  }

  const { byStage, metrics } = data;
  const allPipelineStages = PIPELINE_STAGES.filter((s) => s.key !== 'completed');
  const maxCount = Math.max(...PIPELINE_STAGES.map((s) => (byStage[s.key] ?? []).length), 1);

  // Stage detail list
  const stageDetail = selectedStage ? (byStage[selectedStage] ?? []) : [];
  const selectedStageMeta = PIPELINE_STAGES.find((s) => s.key === selectedStage);

  return (
    <div className="p-5 bg-[#f5f6f8] min-h-full">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[18px] font-bold text-gray-900">Community Tracker</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Onboarding pipeline for {metrics.total} merchants</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('funnel')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${view === 'funnel' ? 'bg-[#4A90D9] text-white border-[#4A90D9]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            Funnel View
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${view === 'kanban' ? 'bg-[#4A90D9] text-white border-[#4A90D9]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            Kanban Board
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <MetricCard
          label="In Pipeline"
          value={metrics.totalInPipeline}
          sub="Active onboarding"
          icon={<Users size={16} />}
          color="#4A90D9"
        />
        <MetricCard
          label="Avg Days to Complete"
          value={metrics.avgDaysToComplete !== null ? `${metrics.avgDaysToComplete}d` : '—'}
          sub="From signup to done"
          icon={<Clock size={16} />}
          color="#7B68EE"
        />
        <MetricCard
          label="Conversion Rate"
          value={`${metrics.conversionRate}%`}
          sub="Signup → Completed"
          icon={<TrendingUp size={16} />}
          color="#4CAF50"
        />
        <MetricCard
          label="Stuck > 14 Days"
          value={metrics.stuckCount}
          sub="Need attention"
          icon={<AlertCircle size={16} />}
          color="#E57373"
        />
        <MetricCard
          label="This Week Completed"
          value={metrics.thisWeekCompletions}
          sub={`${metrics.completedTotal} total`}
          icon={<CheckCircle size={16} />}
          color="#F5A623"
        />
      </div>

      {view === 'funnel' ? (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5">
          {/* Funnel Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Onboarding Funnel</h3>
            <div className="space-y-3">
              {PIPELINE_STAGES.map((stage, i) => {
                const count = (byStage[stage.key] ?? []).length;
                const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const nextStage = PIPELINE_STAGES[i + 1];
                const nextCount = nextStage ? (byStage[nextStage.key] ?? []).length : null;
                const convRate = nextCount !== null && count > 0 ? Math.round((nextCount / count) * 100) : null;
                const isSelected = selectedStage === stage.key;

                return (
                  <div key={stage.key}>
                    <button
                      onClick={() => setSelectedStage(isSelected ? null : stage.key)}
                      className={`w-full text-left group rounded-xl px-3 py-2.5 transition-colors ${isSelected ? 'bg-blue-50 ring-2 ring-[#4A90D9]/40' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                          <span className="text-[13px] font-medium text-gray-800">{stage.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-bold text-gray-900">{count}</span>
                          {convRate !== null && (
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <ArrowRight size={10} /> {convRate}%
                            </span>
                          )}
                          <ChevronRight size={13} className={`text-gray-300 group-hover:text-gray-500 transition-colors ${isSelected ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: stage.color }}
                        />
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-[11px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> &lt; 7 days</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> 7–14 days</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &gt; 14 days</span>
            </div>
          </div>

          {/* Stage Detail */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            {selectedStage && selectedStageMeta ? (
              <>
                <h3 className="text-[14px] font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedStageMeta.color }} />
                  {selectedStageMeta.label}
                  <span className="text-[12px] text-gray-400 font-normal">({stageDetail.length} merchants)</span>
                </h3>
                <p className="text-[11px] text-gray-400 mb-4">Click a merchant to view full profile</p>
                <div className="overflow-y-auto max-h-[600px] pr-1">
                  {stageDetail.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">No merchants at this stage</p>
                  ) : (
                    stageDetail
                      .sort((a, b) => b.days_in_stage - a.days_in_stage)
                      .map((m) => <MerchantCard key={m.id} m={m} stageColor={selectedStageMeta.color} />)
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                  <Users size={22} className="text-gray-400" />
                </div>
                <p className="text-[13px] font-medium text-gray-600">Click a stage to see merchants</p>
                <p className="text-[11px] text-gray-400 mt-1">Select any funnel stage above</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Kanban Board */
        <div className="overflow-x-auto">
          <div className="flex gap-3 min-w-max pb-4">
            {PIPELINE_STAGES.map((stage) => {
              const cards = byStage[stage.key] ?? [];
              return (
                <div key={stage.key} className="w-56 shrink-0">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-[12px] font-semibold text-gray-700">{stage.label}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full font-semibold">{cards.length}</span>
                  </div>
                  <div className="bg-gray-100 rounded-xl p-2 min-h-[100px] max-h-[70vh] overflow-y-auto">
                    {cards.length === 0 ? (
                      <p className="text-[11px] text-gray-400 text-center py-4">Empty</p>
                    ) : (
                      cards
                        .sort((a, b) => b.days_in_stage - a.days_in_stage)
                        .map((m) => <MerchantCard key={m.id} m={m} stageColor={stage.color} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Abandoned Section */}
      {(byStage['abandoned'] ?? []).length > 0 && (
        <div className="mt-5 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-[14px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400" />
            Abandoned ({(byStage['abandoned'] ?? []).length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-[11px] text-gray-400 font-semibold">Business</th>
                  <th className="text-left py-2 text-[11px] text-gray-400 font-semibold">Contact</th>
                  <th className="text-left py-2 text-[11px] text-gray-400 font-semibold">Label</th>
                  <th className="text-left py-2 text-[11px] text-gray-400 font-semibold">Days</th>
                  <th className="text-left py-2 text-[11px] text-gray-400 font-semibold">Owner</th>
                </tr>
              </thead>
              <tbody>
                {(byStage['abandoned'] ?? []).slice(0, 20).map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2">
                      <Link href={`/crm/merchants/${m.id}`} className="text-[#4A90D9] hover:underline font-medium">
                        {m.business_name}
                      </Link>
                    </td>
                    <td className="py-2 text-gray-500">{m.contact_person || '—'}</td>
                    <td className="py-2">
                      {m.pipedrive_label ? (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${LABEL_COLORS[m.pipedrive_label] ?? 'bg-gray-100 text-gray-600'}`}>
                          {m.pipedrive_label}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2 text-gray-500">{m.days_in_stage}d</td>
                    <td className="py-2 text-gray-500">{m.assigned_to || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
