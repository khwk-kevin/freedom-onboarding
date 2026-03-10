'use client';
import { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp, ArrowRight, Info, RefreshCw, X, ExternalLink, Play, Users, Clock, MousePointerClick, Eye, BarChart3, Zap } from 'lucide-react';
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

// Placeholder drill-down insights per stage
const STAGE_INSIGHTS: Record<string, {
  posthogEvent: string;
  metrics: { label: string; value: string; delta?: string; deltaUp?: boolean }[];
  breakdown: { label: string; pct: number; count: number }[];
  sessions: { id: string; duration: string; pages: number; outcome: string; device: string }[];
  actions: string[];
  posthogUrl: string;
}> = {
  page_view: {
    posthogEvent: '$pageview',
    metrics: [
      { label: 'Unique Visitors', value: '8,240', delta: '+12%', deltaUp: true },
      { label: 'Avg. Time on Page', value: '1m 42s', delta: '-8%', deltaUp: false },
      { label: 'Bounce Rate', value: '38%', delta: '-3%', deltaUp: true },
      { label: 'Mobile %', value: '72%' },
    ],
    breakdown: [
      { label: 'Google Ads', pct: 34, count: 4216 },
      { label: 'Facebook / IG', pct: 25, count: 3100 },
      { label: 'Organic Search', pct: 16, count: 1984 },
      { label: 'LINE OA', pct: 14, count: 1736 },
      { label: 'Direct', pct: 7, count: 868 },
      { label: 'Other', pct: 4, count: 496 },
    ],
    sessions: [
      { id: 'sess_a1b2', duration: '3m 12s', pages: 4, outcome: 'Signed Up', device: 'iPhone 15' },
      { id: 'sess_c3d4', duration: '0m 18s', pages: 1, outcome: 'Bounced', device: 'Samsung S24' },
      { id: 'sess_e5f6', duration: '1m 45s', pages: 2, outcome: 'CTA Clicked', device: 'Desktop Chrome' },
      { id: 'sess_g7h8', duration: '2m 30s', pages: 3, outcome: 'Scrolled 80%', device: 'iPad Pro' },
    ],
    actions: ['Optimize mobile landing speed (72% mobile traffic)', 'A/B test hero copy — current bounce rate 38%', 'Add exit-intent popup for bounced visitors'],
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22%24pageview%22%7D%5D',
  },
  scroll_50: {
    posthogEvent: 'scroll_depth',
    metrics: [
      { label: 'Scroll Rate', value: '62%', delta: '+5%', deltaUp: true },
      { label: 'Avg. Scroll Depth', value: '68%' },
      { label: 'Read Time', value: '1m 12s' },
      { label: 'Engaged > 30s', value: '74%' },
    ],
    breakdown: [
      { label: 'Scrolled 25%', pct: 82, count: 10168 },
      { label: 'Scrolled 50%', pct: 62, count: 7688 },
      { label: 'Scrolled 75%', pct: 41, count: 5084 },
      { label: 'Scrolled 100%', pct: 22, count: 2728 },
    ],
    sessions: [
      { id: 'sess_j1k2', duration: '2m 50s', pages: 1, outcome: 'Read full page', device: 'Desktop Firefox' },
      { id: 'sess_l3m4', duration: '0m 45s', pages: 1, outcome: 'Stopped at pricing', device: 'iPhone 14' },
    ],
    actions: ['Move CTA higher — 38% never reach it', 'Add sticky CTA bar after 50% scroll', 'Test shorter page variant for mobile'],
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22scroll_depth%22%7D%5D',
  },
  cta_click: {
    posthogEvent: 'cta_click',
    metrics: [
      { label: 'Click Rate', value: '38%', delta: '+2%', deltaUp: true },
      { label: 'Avg. Time to Click', value: '48s' },
      { label: 'Mobile Click Rate', value: '32%' },
      { label: 'Desktop Click Rate', value: '51%' },
    ],
    breakdown: [
      { label: 'Hero CTA ("Get Started")', pct: 45, count: 1314 },
      { label: 'Pricing CTA', pct: 28, count: 818 },
      { label: 'Sticky Bar CTA', pct: 18, count: 526 },
      { label: 'Footer CTA', pct: 9, count: 263 },
    ],
    sessions: [
      { id: 'sess_n5o6', duration: '0m 52s', pages: 1, outcome: 'Started signup', device: 'Desktop Chrome' },
      { id: 'sess_p7q8', duration: '1m 15s', pages: 2, outcome: 'Viewed pricing first', device: 'iPhone 15 Pro' },
    ],
    actions: ['Mobile CTA underperforming (32% vs 51% desktop) — increase button size', 'Hero CTA gets 45% of clicks — test copy variants', 'Add CTA after testimonials section'],
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22cta_click%22%7D%5D',
  },
  signup_started: {
    posthogEvent: 'onboard_start',
    metrics: [
      { label: 'Start Rate', value: '71%', delta: '+4%', deltaUp: true },
      { label: 'Avg. Time in Onboarding', value: '4m 20s' },
      { label: 'Drop at Business Type', value: '8%' },
      { label: 'Drop at Link Share', value: '22%' },
    ],
    breakdown: [
      { label: 'Restaurant', pct: 32, count: 663 },
      { label: 'Retail / Shop', pct: 24, count: 498 },
      { label: 'Cafe / Coffee', pct: 18, count: 373 },
      { label: 'Salon / Beauty', pct: 14, count: 290 },
      { label: 'Fitness / Gym', pct: 7, count: 145 },
      { label: 'Other', pct: 5, count: 104 },
    ],
    sessions: [
      { id: 'sess_r1s2', duration: '6m 30s', pages: 1, outcome: 'Completed onboarding', device: 'Desktop Chrome' },
      { id: 'sess_t3u4', duration: '1m 10s', pages: 1, outcome: 'Dropped at vibe step', device: 'iPhone 13' },
    ],
    actions: ['22% drop at link sharing — make it optional with clearer skip', 'Restaurant is #1 category — tailor default templates', 'Reduce onboarding to under 3 mins'],
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22onboard_start%22%7D%5D',
  },
  signup_completed: {
    posthogEvent: 'signup_complete',
    metrics: [
      { label: 'Completion Rate', value: '64%', delta: '+6%', deltaUp: true },
      { label: 'Google SSO', value: '58%' },
      { label: 'Apple SSO', value: '24%' },
      { label: 'Email Signup', value: '18%' },
    ],
    breakdown: [
      { label: 'Google SSO', pct: 58, count: 770 },
      { label: 'Apple SSO', pct: 24, count: 318 },
      { label: 'Email/Password', pct: 18, count: 239 },
    ],
    sessions: [],
    actions: ['Google SSO dominates (58%) — keep it prominent', 'Email signup has higher drop-off — simplify password requirements', 'Add LINE Login for Thai market'],
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22signup_complete%22%7D%5D',
  },
  onboarding_started: {
    posthogEvent: 'onboard_progress',
    metrics: [
      { label: 'Continue Rate', value: '82%' },
      { label: 'Median Steps Completed', value: '4 of 6' },
      { label: 'Returned After Pause', value: '34%' },
      { label: 'Avg. Session Duration', value: '5m 45s' },
    ],
    breakdown: [
      { label: 'Completed all steps', pct: 67, count: 729 },
      { label: 'Stopped at Brand Look', pct: 15, count: 163 },
      { label: 'Stopped at Products', pct: 10, count: 109 },
      { label: 'Stopped at Rewards', pct: 8, count: 87 },
    ],
    sessions: [],
    actions: ['33% don\'t complete — send reminder email at T+2h', 'Brand Look step loses 15% — add "skip" option with smart defaults', 'Enable session persistence (localStorage) to retain progress'],
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22onboard_progress%22%7D%5D',
  },
  onboarding_complete: {
    posthogEvent: 'onboard_complete',
    metrics: [
      { label: 'Time to Complete', value: '6m 12s', delta: '-1m 30s', deltaUp: true },
      { label: 'With Scraped Data', value: '41%' },
      { label: 'AI Cover Generated', value: '59%' },
      { label: 'Photos from Google', value: '41%' },
    ],
    breakdown: [
      { label: 'Used Google Maps link', pct: 41, count: 299 },
      { label: 'Used website/social', pct: 22, count: 160 },
      { label: 'Manual entry only', pct: 37, count: 270 },
    ],
    sessions: [],
    actions: ['Promote Google Maps linking — 41% use it and complete faster', 'Manual-entry users take 2x longer — pre-fill more defaults', 'Send "Your community is ready" email immediately'],
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22onboard_complete%22%7D%5D',
  },
  first_product: {
    posthogEvent: 'first_product_listed',
    metrics: [
      { label: 'Listing Rate', value: '45%' },
      { label: 'Avg. Time to List', value: '2.3 days' },
      { label: 'With Photos', value: '67%' },
      { label: 'With Pricing', value: '82%' },
    ],
    breakdown: [
      { label: 'Listed within 1 hour', pct: 18, count: 131 },
      { label: 'Listed within 24h', pct: 35, count: 255 },
      { label: 'Listed within 7d', pct: 30, count: 219 },
      { label: 'Never listed', pct: 17, count: 124 },
    ],
    sessions: [],
    actions: ['55% never list a product — trigger "Add your first item" nudge at T+1d', 'Show live storefront preview to motivate listing', 'Auto-import menu from Google Maps where available'],
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22first_product_listed%22%7D%5D',
  },
  first_transaction: {
    posthogEvent: 'first_transaction',
    metrics: [
      { label: 'Transaction Rate', value: '61%' },
      { label: 'Avg. Time to First Sale', value: '5.2 days' },
      { label: 'Avg. First Order', value: '฿380' },
      { label: 'Repeat within 7d', value: '42%' },
    ],
    breakdown: [
      { label: 'QR Code payment', pct: 48, count: 96 },
      { label: 'In-app purchase', pct: 32, count: 64 },
      { label: 'Reward redemption', pct: 20, count: 40 },
    ],
    sessions: [],
    actions: ['Run "first sale" fee waiver promotion', 'Send QR code table tent template to new merchants', 'BD team call for merchants with no sale after 7d'],
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22first_transaction%22%7D%5D',
  },
  active: {
    posthogEvent: 'merchant_active',
    metrics: [
      { label: 'Monthly Active Rate', value: '74%' },
      { label: 'Avg. Revenue / Month', value: '฿12,400' },
      { label: 'Avg. Customers / Month', value: '86' },
      { label: 'Churn Risk (30d)', value: '12%' },
    ],
    breakdown: [
      { label: 'Power users (daily)', pct: 22, count: 33 },
      { label: 'Regular (weekly)', pct: 41, count: 61 },
      { label: 'Occasional (monthly)', pct: 25, count: 37 },
      { label: 'At risk (no login 14d)', pct: 12, count: 18 },
    ],
    sessions: [],
    actions: ['12% at churn risk — trigger re-engagement campaign', 'Power users are 22% — identify what they do differently', 'Create merchant success stories for social proof'],
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22merchant_active%22%7D%5D',
  },
};

// Drill-down panel component
function StageDetailPanel({ stage, onClose }: { stage: Stage; onClose: () => void }) {
  const insights = STAGE_INSIGHTS[stage.id];
  if (!insights) return null;

  const posthogBase = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com';

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      {/* Panel */}
      <div 
        className="relative w-full max-w-[580px] h-full bg-white shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-gray-900">{stage.label}</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {stage.count.toLocaleString()} events · PostHog: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] font-mono">{insights.posthogEvent}</code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`${posthogBase}${insights.posthogUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#1d4aff] text-white hover:bg-[#1538cc] transition-colors"
            >
              <ExternalLink size={12} /> Open in PostHog
            </a>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Key Metrics */}
          <div>
            <h3 className="text-[13px] font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <BarChart3 size={14} /> Key Metrics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {insights.metrics.map((m, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{m.label}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-[18px] font-bold text-gray-900">{m.value}</span>
                    {m.delta && (
                      <span className={`text-[11px] font-semibold ${m.deltaUp ? 'text-green-600' : 'text-red-500'}`}>
                        {m.delta}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div>
            <h3 className="text-[13px] font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <Users size={14} /> Breakdown
            </h3>
            <div className="space-y-2">
              {insights.breakdown.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[12px] text-gray-700 w-[160px] shrink-0 truncate">{b.label}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-md overflow-hidden relative">
                    <div 
                      className="h-full bg-[#1d4aff]/70 rounded-md transition-all"
                      style={{ width: `${b.pct}%` }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-600">
                      {b.count.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-500 w-[40px] text-right">{b.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mini time series placeholder */}
          <div>
            <h3 className="text-[13px] font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <Clock size={14} /> Trend (30d)
            </h3>
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 h-[120px] flex items-end gap-[3px]">
              {Array.from({ length: 30 }, (_, i) => {
                const base = stage.count / 30;
                const h = Math.max(8, Math.round((base * (0.5 + Math.random()) / base) * 80));
                return (
                  <div key={i} className="flex-1 rounded-t-sm bg-[#1d4aff]/50 hover:bg-[#1d4aff]/80 transition-colors cursor-pointer" style={{ height: `${h}%` }} title={`Day ${i + 1}`} />
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">Connect PostHog for real time-series data</p>
          </div>

          {/* Session Recordings */}
          {insights.sessions.length > 0 && (
            <div>
              <h3 className="text-[13px] font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <Play size={14} /> Recent Sessions
              </h3>
              <div className="space-y-2">
                {insights.sessions.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:border-[#1d4aff]/30 cursor-pointer transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-[#1d4aff]/10 flex items-center justify-center shrink-0 group-hover:bg-[#1d4aff]/20 transition-colors">
                      <Play size={14} className="text-[#1d4aff]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-gray-800">{s.device}</p>
                      <p className="text-[10px] text-gray-500">{s.duration} · {s.pages} page{s.pages > 1 ? 's' : ''}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      s.outcome.includes('Sign') || s.outcome.includes('Complete') 
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : s.outcome.includes('Bounce') 
                        ? 'bg-red-50 text-red-600 border border-red-200' 
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {s.outcome}
                    </span>
                  </div>
                ))}
              </div>
              <a
                href={`${posthogBase}/project/replay`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1 text-[11px] text-[#1d4aff] hover:underline font-medium"
              >
                View all recordings in PostHog <ExternalLink size={10} />
              </a>
            </div>
          )}

          {/* Suggested Actions */}
          <div>
            <h3 className="text-[13px] font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <Zap size={14} /> Recommended Actions
            </h3>
            <div className="space-y-2">
              {insights.actions.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-amber-700">{i + 1}</span>
                  </div>
                  <p className="text-[12px] text-gray-700 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PostHog integration note */}
          <div className="bg-[#1d4aff]/5 border border-[#1d4aff]/15 rounded-xl p-4 flex items-start gap-3">
            <MousePointerClick size={16} className="text-[#1d4aff] shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-semibold text-gray-800">Connect PostHog for live data</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Session recordings, heatmaps, real-time funnels, and A/B test results. All metrics above will auto-populate from PostHog events.
              </p>
              <a
                href="https://posthog.com/docs/getting-started/install"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#1d4aff] hover:underline font-medium"
              >
                Setup guide <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);

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
                    <div 
                      className="flex items-center gap-3 cursor-pointer rounded-lg px-2 py-1 -mx-2 hover:bg-gray-50 transition-colors group"
                      onClick={() => setSelectedStage(stage)}
                      title={`Click to view ${stage.label} details`}
                    >
                      {/* Stage label */}
                      <div className="w-[170px] shrink-0 text-right">
                        <span className="text-[12px] text-gray-700 font-medium group-hover:text-[#1d4aff] transition-colors">{stage.label}</span>
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
                      {/* Drill-down hint */}
                      <div className="w-[20px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye size={14} className="text-[#1d4aff]" />
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

      {/* Stage drill-down panel */}
      {selectedStage && (
        <StageDetailPanel stage={selectedStage} onClose={() => setSelectedStage(null)} />
      )}
    </div>
  );
}
