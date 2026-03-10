'use client';
import { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp, ArrowRight, Info, RefreshCw } from 'lucide-react';
import Link from 'next/link';

type Stage = {
  id: string;
  label: string;
  count: number;
  estimated: boolean;
  conversionToNext: number | null;
  dropOffFromPrev: number;
  dropOffCount: number;
};

type Channel = {
  source: string;
  total: number;
  active: number;
  revenue: number;
  conversionRate: number;
};

type FunnelData = {
  period: string;
  totalMerchants: number;
  stages: Stage[];
  channels: Channel[];
  summary: {
    overallConversion: number;
    biggestDropoffStage: string | null;
    biggestDropoffPct: number | null;
    bestChannel: string | null;
    bestChannelConversion: number | null;
  };
  _placeholder?: boolean;
};

const PERIODS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

function conversionColor(pct: number | null): string {
  if (pct === null) return 'text-gray-400';
  if (pct >= 50) return 'text-green-600';
  if (pct >= 20) return 'text-amber-500';
  return 'text-red-500';
}

function conversionBg(pct: number | null): string {
  if (pct === null) return 'bg-gray-200';
  if (pct >= 50) return 'bg-green-500';
  if (pct >= 20) return 'bg-amber-400';
  return 'bg-red-400';
}

function dropoffBadgeColor(pct: number): string {
  if (pct <= 10) return 'bg-green-50 text-green-700 border-green-200';
  if (pct <= 40) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-600 border-red-200';
}

export default function AcquisitionFunnelPage() {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/crm/acquisition-funnel?period=${period}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const maxCount = data ? Math.max(...data.stages.map((s) => s.count), 1) : 1;

  return (
    <div className="p-5 bg-[#f5f6f8] min-h-full">
      {/* Placeholder data banner */}
      {data && (data as FunnelData & { _placeholder?: boolean })._placeholder && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[12px]">
          <Info size={14} className="shrink-0" />
          <span><strong>Demo data</strong> — connect PostHog + Supabase for real metrics. Numbers scale with period selection.</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[18px] font-bold text-gray-900">Acquisition Funnel</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Track merchants from first visit to active revenue</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors border ${
                period === p.value
                  ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <RefreshCw size={20} className="animate-spin mr-2" /> Loading funnel…
        </div>
      ) : !data ? (
        <div className="text-center text-gray-500 py-16">Failed to load data.</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Landing → Active</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.overallConversion}%</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Overall conversion</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Biggest Drop-off</p>
              <p className="text-[15px] font-bold text-red-600">{data.summary.biggestDropoffStage ?? '—'}</p>
              {data.summary.biggestDropoffPct !== null && (
                <p className="text-[11px] text-gray-400 mt-0.5">{data.summary.biggestDropoffPct}% leave here</p>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Best Channel</p>
              <p className="text-[15px] font-bold text-green-600 truncate">{data.summary.bestChannel ?? '—'}</p>
              {data.summary.bestChannelConversion !== null && (
                <p className="text-[11px] text-gray-400 mt-0.5">{data.summary.bestChannelConversion}% → active</p>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Total Merchants</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalMerchants}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">In selected period</p>
            </div>
          </div>

          {/* Funnel Visualization */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-gray-900">Funnel Stages</h2>
              <div className="flex items-center gap-3 text-[11px] text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> &gt;50% CVR</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> 20–50%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span> &lt;20%</span>
              </div>
            </div>
            <div className="space-y-2">
              {data.stages.map((stage, i) => {
                const barWidth = Math.round((stage.count / maxCount) * 100);
                const color = conversionBg(stage.conversionToNext);
                return (
                  <div key={stage.id}>
                    <div className="flex items-center gap-3">
                      {/* Stage label */}
                      <div className="w-[170px] shrink-0 text-right">
                        <span className="text-[12px] text-gray-700 font-medium">{stage.label}</span>
                        {stage.estimated && (
                          <span className="ml-1 text-[10px] text-amber-500 font-semibold">EST</span>
                        )}
                      </div>
                      {/* Bar */}
                      <div className="flex-1 relative h-7 bg-gray-100 rounded-md overflow-hidden">
                        <div
                          className={`h-full rounded-md transition-all ${color} opacity-80`}
                          style={{ width: `${barWidth}%`, minWidth: stage.count > 0 ? '4px' : '0' }}
                        />
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-white drop-shadow">
                          {stage.count.toLocaleString()}
                        </span>
                      </div>
                      {/* Drop-off badge */}
                      <div className="w-[90px] shrink-0">
                        {i > 0 && stage.dropOffFromPrev > 0 ? (
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${dropoffBadgeColor(stage.dropOffFromPrev)}`}>
                            <TrendingDown size={10} />
                            -{stage.dropOffFromPrev}% ({stage.dropOffCount.toLocaleString()})
                          </span>
                        ) : i === 0 ? null : (
                          <span className="text-[10px] text-green-600 font-semibold">✓ 0% drop</span>
                        )}
                      </div>
                      {/* CVR to next */}
                      <div className="w-[60px] shrink-0 text-right">
                        {stage.conversionToNext !== null ? (
                          <span className={`text-[12px] font-bold ${conversionColor(stage.conversionToNext)}`}>
                            {stage.conversionToNext}%
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">—</span>
                        )}
                      </div>
                    </div>
                    {/* Arrow between stages */}
                    {i < data.stages.length - 1 && (
                      <div className="flex items-center ml-[183px] my-0.5">
                        <ArrowRight size={12} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-start gap-1.5 text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <Info size={13} className="shrink-0 mt-0.5" />
              <span><strong>EST</strong> = Estimated from typical SaaS conversion benchmarks (landing 3%, CTA 30%). Replace with real PostHog event data when available.</span>
            </div>
          </div>

          {/* Drop-off Analysis */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Drop-off Analysis</h2>
            <div className="space-y-3">
              {data.stages
                .filter((s) => !s.estimated && s.dropOffCount > 0)
                .sort((a, b) => b.dropOffCount - a.dropOffCount)
                .map((stage) => (
                  <div key={stage.id} className="flex items-start gap-4 p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-gray-800">{stage.label}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${dropoffBadgeColor(stage.dropOffFromPrev)}`}>
                          -{stage.dropOffFromPrev}%
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-500">
                        {stage.dropOffCount.toLocaleString()} merchants didn&apos;t progress past this stage
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] text-gray-400 mb-1">Suggested action</p>
                      <p className="text-[12px] text-gray-700 font-medium max-w-[200px] text-right">
                        {stage.id === 'onboarding_started' && 'Send welcome nudge email at T+1h'}
                        {stage.id === 'context' && 'Simplify context form — remove optional fields'}
                        {stage.id === 'branding' && 'Add progress bar & auto-save reminder'}
                        {stage.id === 'products' && 'Pre-populate product template based on category'}
                        {stage.id === 'rewards' && 'Highlight ROI of loyalty programs'}
                        {stage.id === 'go_live' && 'Assign BD rep to assist go-live checklist'}
                        {stage.id === 'onboarding_complete' && 'Trigger first-listing guide immediately post-completion'}
                        {stage.id === 'first_product' && 'Show live preview of storefront to motivate listing'}
                        {stage.id === 'first_transaction' && 'Run first-sale promotion or fee waiver'}
                        {!['onboarding_started','context','branding','products','rewards','go_live','onboarding_complete','first_product','first_transaction'].includes(stage.id) && 'Review with BD team'}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Channel Attribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Source Attribution</h2>
            {data.channels.length === 0 ? (
              <p className="text-[13px] text-gray-400">No UTM source data available yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left font-semibold text-gray-500 pb-2 text-[11px] uppercase tracking-wider">Source</th>
                      <th className="text-right font-semibold text-gray-500 pb-2 text-[11px] uppercase tracking-wider">Total</th>
                      <th className="text-right font-semibold text-gray-500 pb-2 text-[11px] uppercase tracking-wider">Active</th>
                      <th className="text-right font-semibold text-gray-500 pb-2 text-[11px] uppercase tracking-wider">Revenue</th>
                      <th className="text-right font-semibold text-gray-500 pb-2 text-[11px] uppercase tracking-wider">CVR → Active</th>
                      <th className="pb-2 w-[120px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.channels.map((ch) => (
                      <tr key={ch.source} className="hover:bg-gray-50">
                        <td className="py-2.5 font-medium text-gray-800">{ch.source}</td>
                        <td className="py-2.5 text-right text-gray-600">{ch.total.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-green-600 font-semibold">{ch.active.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-gray-600">
                          {ch.revenue > 0 ? `৳${ch.revenue.toLocaleString()}` : '—'}
                        </td>
                        <td className={`py-2.5 text-right font-bold ${conversionColor(ch.conversionRate)}`}>
                          {ch.conversionRate}%
                        </td>
                        <td className="py-2.5 pl-3">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${conversionBg(ch.conversionRate)}`}
                              style={{ width: `${ch.conversionRate}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Focus recommendations */}
          <div className="bg-[#1a1a2e] rounded-xl p-5 text-white">
            <h2 className="text-[15px] font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#00ff88]" />
              What to Focus On
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="font-semibold text-[#00ff88] mb-1">🎯 Biggest Opportunity</p>
                <p className="text-gray-300">
                  {data.summary.biggestDropoffStage
                    ? `"${data.summary.biggestDropoffStage}" is your biggest drop-off at ${data.summary.biggestDropoffPct}%. Fix this first.`
                    : 'No major drop-off detected — funnel is healthy!'}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="font-semibold text-[#00ff88] mb-1">📣 Double Down On</p>
                <p className="text-gray-300">
                  {data.summary.bestChannel
                    ? `"${data.summary.bestChannel}" converts at ${data.summary.bestChannelConversion}%. Invest more budget here.`
                    : 'Add UTM tracking to all acquisition channels to discover top performer.'}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="font-semibold text-[#00ff88] mb-1">💰 Revenue Gap</p>
                <p className="text-gray-300">
                  {data.stages.find(s => s.id === 'first_transaction') && data.stages.find(s => s.id === 'active')
                    ? `${(data.stages.find(s => s.id === 'active')!.count - data.stages.find(s => s.id === 'first_transaction')!.count).toLocaleString()} active merchants haven't transacted yet. Target them with activation campaigns.`
                    : 'Track first_transaction events to identify revenue gap.'}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="font-semibold text-[#00ff88] mb-1">📊 Data Gap</p>
                <p className="text-gray-300">
                  Top-of-funnel (visits, CTA clicks) are estimated. Connect PostHog or GA4 to get real numbers and improve targeting.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
