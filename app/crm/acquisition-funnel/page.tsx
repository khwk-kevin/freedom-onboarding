'use client';
import { useEffect, useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  X,
  ExternalLink,
  Users,
  Clock,
  Eye,
  BarChart3,
  Zap,
  Hammer,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  Database,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type Stage = {
  id: string;
  label: string;
  count: number;
  estimated: boolean;
  source: string;
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

type AppBuilder = {
  totalApps: number;
  deployedApps: number;
  avgBuildTimeMs: number;
  buildSuccessRate: number;
  avgTokensUsed: number;
  topCategories: { category: string; count: number }[];
  appTypeBreakdown: { business: number; idea: number };
  regionBreakdown: Record<string, number>;
};

type PhSignals = {
  q2ScrapeSuccess: number;
  q2ScrapeSkip: number;
  q3MoodSelected: number;
  q4ColorSelected: number;
  appBuildStarted: number;
  tokenLimitReached: number;
  sessionAbandoned: number;
  communityCreated: number;
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
    posthogConnected: boolean;
    dataSource: string;
  };
  appBuilder: AppBuilder;
  phSignals: PhSignals;
};

// ── Stage metadata (static — no fake numbers) ──────────────────────────────────

const STAGE_META: Record<string, {
  posthogEvent: string;
  posthogUrl: string;
  actions: string[];
}> = {
  page_view: {
    posthogEvent: '$pageview',
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22%24pageview%22%7D%5D',
    actions: [
      'Improve mobile landing speed — most app builder traffic is mobile',
      'A/B test hero headline: "Build your app in 10 minutes" vs current',
      'Add exit-intent popup to capture abandoning visitors',
    ],
  },
  onboarding_started: {
    posthogEvent: 'onboarding_started',
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22onboarding_started%22%7D%5D',
    actions: [
      'Measure time from page_view → onboarding_started (should be < 10s)',
      'Test "Talk to AVA" vs "Build My App" CTA copy',
      'Reduce scroll depth needed to reach the CTA',
    ],
  },
  q1_answered: {
    posthogEvent: 'q1_answered',
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22q1_answered%22%7D%5D',
    actions: [
      'If q1 drop-off is high, the first message prompt is too intimidating — simplify it',
      'Add example prompts: "Coffee shop in Bangkok" or "Fitness coaching app"',
      'Track business vs idea split — determines which Q2 path (scrape vs description)',
    ],
  },
  first_preview_shown: {
    posthogEvent: 'first_preview_shown',
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22first_preview_shown%22%7D%5D',
    actions: [
      'Check scrape success rate — high skip rate means scraper needs improvement',
      'Ensure preview renders within 30s of Q4 — long waits kill conversion',
      'Show animated "building your app..." between Q4 and preview to maintain engagement',
    ],
  },
  signup_wall_shown: {
    posthogEvent: 'signup_wall_shown',
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22signup_wall_shown%22%7D%5D',
    actions: [
      'The signup wall is critical — show it only after the user is hooked (preview seen)',
      'Test "Save your app" framing vs "Create account" — ownership language converts better',
      'Add social proof at the signup wall: "Join X merchants who built with AVA"',
    ],
  },
  signup_completed: {
    posthogEvent: 'signup_completed',
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22signup_completed%22%7D%5D',
    actions: [
      'Measure signup wall → signup completion; anything below 50% needs a simpler auth flow',
      'LINE Login for Thai market — high share of regional traffic',
      'Immediately resume the build process post-signup — no dead ends',
    ],
  },
  app_build_completed: {
    posthogEvent: 'app_build_completed',
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22app_build_completed%22%7D%5D',
    actions: [
      'Show a real-time progress bar during build — reduces abandonment',
      'Send push/email if build takes > 2 minutes: "AVA is still working on your app…"',
      'If build failed, auto-retry and notify — track build_success_rate closely',
    ],
  },
  app_deployed: {
    posthogEvent: 'app_deployed',
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22app_deployed%22%7D%5D',
    actions: [
      'Celebrate deployment with a sharable "Your app is live" card',
      'Send the merchant their {slug}.app.freedom.world URL immediately',
      'Prompt to share via LINE OA / WhatsApp — viral loop opportunity',
    ],
  },
  iteration_started: {
    posthogEvent: 'iteration_started',
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22iteration_started%22%7D%5D',
    actions: [
      'Merchants who return to edit are your most engaged — track their retention carefully',
      'Show "What would you like to change?" prompt with suggestion chips',
      'Iteration = strong buying intent if you have paid tiers — upsell here',
    ],
  },
  active: {
    posthogEvent: 'merchant_active',
    posthogUrl: '/project/insights?events=%5B%7B%22id%22%3A%22merchant_active%22%7D%5D',
    actions: [
      'Active merchants are your core — understand what makes them stay',
      'Token balance depletion triggers churn — proactive top-up reminders',
      'Identify merchants who iterate daily and make them case studies',
    ],
  },
};

// ── Drill-down panel ───────────────────────────────────────────────────────────

function StageDetailPanel({
  stage,
  data,
  onClose,
}: {
  stage: Stage;
  data: FunnelData;
  onClose: () => void;
}) {
  const meta = STAGE_META[stage.id];
  if (!meta) return null;

  const posthogBase = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.posthog.com';
  const ab = data.appBuilder;
  const sig = data.phSignals;

  // Dynamic metrics per stage
  const metrics: { label: string; value: string; sub?: string }[] = [];

  if (stage.id === 'page_view') {
    metrics.push(
      { label: 'Total Page Views', value: stage.count.toLocaleString() },
      { label: 'Started Chat with AVA', value: (data.stages.find(s => s.id === 'onboarding_started')?.count ?? 0).toLocaleString() },
      { label: 'CVR → AVA Chat', value: stage.conversionToNext !== null ? `${stage.conversionToNext}%` : '—' },
      { label: 'Sessions Abandoned', value: sig.sessionAbandoned.toLocaleString() },
    );
  } else if (stage.id === 'onboarding_started') {
    metrics.push(
      { label: 'Conversations Started', value: stage.count.toLocaleString() },
      { label: 'Q1 Completed', value: (data.stages.find(s => s.id === 'q1_answered')?.count ?? 0).toLocaleString() },
      { label: 'CVR → Q1', value: stage.conversionToNext !== null ? `${stage.conversionToNext}%` : '—' },
      { label: 'Sessions Abandoned', value: sig.sessionAbandoned.toLocaleString() },
    );
  } else if (stage.id === 'q1_answered') {
    metrics.push(
      { label: 'Described Business/Idea', value: stage.count.toLocaleString() },
      { label: 'Scrape Success', value: sig.q2ScrapeSuccess.toLocaleString(), sub: 'auto-filled from URL' },
      { label: 'Scrape Skipped', value: sig.q2ScrapeSkip.toLocaleString(), sub: 'manual description' },
      { label: 'Mood Selected', value: sig.q3MoodSelected.toLocaleString() },
    );
  } else if (stage.id === 'first_preview_shown') {
    const scrapeTotal = sig.q2ScrapeSuccess + sig.q2ScrapeSkip;
    const scrapeRate = scrapeTotal > 0 ? Math.round((sig.q2ScrapeSuccess / scrapeTotal) * 100) : 0;
    metrics.push(
      { label: 'Previews Shown', value: stage.count.toLocaleString() },
      { label: 'Scrape Success Rate', value: `${scrapeRate}%` },
      { label: 'Color Selected', value: sig.q4ColorSelected.toLocaleString() },
      { label: 'CVR → Signup Wall', value: stage.conversionToNext !== null ? `${stage.conversionToNext}%` : '—' },
    );
  } else if (stage.id === 'signup_wall_shown') {
    metrics.push(
      { label: 'Reached Signup Wall', value: stage.count.toLocaleString() },
      { label: 'Completed Signup', value: (data.stages.find(s => s.id === 'signup_completed')?.count ?? 0).toLocaleString() },
      { label: 'Wall → Signup CVR', value: stage.conversionToNext !== null ? `${stage.conversionToNext}%` : '—' },
      { label: 'Communities Created', value: sig.communityCreated.toLocaleString() },
    );
  } else if (stage.id === 'signup_completed') {
    metrics.push(
      { label: 'Total Signups', value: stage.count.toLocaleString() },
      { label: 'Business App Users', value: ab.appTypeBreakdown.business.toLocaleString() },
      { label: 'Idea App Users', value: ab.appTypeBreakdown.idea.toLocaleString() },
      { label: 'Builds Started', value: sig.appBuildStarted.toLocaleString() },
    );
  } else if (stage.id === 'app_build_completed') {
    const avgSec = ab.avgBuildTimeMs > 0 ? Math.round(ab.avgBuildTimeMs / 1000) : 0;
    metrics.push(
      { label: 'Apps Built', value: stage.count.toLocaleString() },
      { label: 'Build Success Rate', value: `${ab.buildSuccessRate}%` },
      { label: 'Avg Build Time', value: avgSec > 0 ? `${avgSec}s` : '—' },
      { label: 'CVR → Deployed', value: stage.conversionToNext !== null ? `${stage.conversionToNext}%` : '—' },
    );
  } else if (stage.id === 'app_deployed') {
    metrics.push(
      { label: 'Apps Deployed', value: stage.count.toLocaleString() },
      { label: 'Returned to Edit', value: (data.stages.find(s => s.id === 'iteration_started')?.count ?? 0).toLocaleString() },
      { label: 'Avg Tokens Used', value: ab.avgTokensUsed.toLocaleString() },
      { label: 'Token Limit Hit', value: sig.tokenLimitReached.toLocaleString() },
    );
  } else if (stage.id === 'iteration_started') {
    metrics.push(
      { label: 'Merchants Who Edited', value: stage.count.toLocaleString() },
      { label: 'Token Limit Reached', value: sig.tokenLimitReached.toLocaleString() },
      { label: 'Avg Tokens Used', value: ab.avgTokensUsed.toLocaleString() },
      { label: 'CVR → Active (30d)', value: stage.conversionToNext !== null ? `${stage.conversionToNext}%` : '—' },
    );
  } else if (stage.id === 'active') {
    metrics.push(
      { label: 'Active Merchants (30d)', value: stage.count.toLocaleString() },
      { label: 'Total Apps Deployed', value: ab.deployedApps.toLocaleString() },
      { label: 'Overall Funnel CVR', value: `${data.summary.overallConversion}%` },
      { label: 'Token Limit Alerts', value: sig.tokenLimitReached.toLocaleString() },
    );
  }

  // Dynamic breakdowns per stage
  const breakdowns: { label: string; count: number; total: number }[] = [];

  if (stage.id === 'q1_answered' || stage.id === 'first_preview_shown') {
    // Scrape vs manual
    breakdowns.push(
      { label: 'URL Scraped (auto)', count: sig.q2ScrapeSuccess, total: stage.count },
      { label: 'Manual Description', count: sig.q2ScrapeSkip, total: stage.count },
    );
  } else if (stage.id === 'signup_completed' || stage.id === 'app_build_completed' || stage.id === 'app_deployed') {
    // App type split
    const typeTotal = ab.appTypeBreakdown.business + ab.appTypeBreakdown.idea;
    if (typeTotal > 0) {
      breakdowns.push(
        { label: 'Business App', count: ab.appTypeBreakdown.business, total: typeTotal },
        { label: 'Idea App', count: ab.appTypeBreakdown.idea, total: typeTotal },
      );
    }
    // Top categories
    const catTotal = ab.topCategories.reduce((s, c) => s + c.count, 0);
    ab.topCategories.slice(0, 5).forEach(c => {
      breakdowns.push({ label: c.category, count: c.count, total: catTotal });
    });
  } else if (stage.id === 'active') {
    // Region breakdown
    const regionTotal = Object.values(ab.regionBreakdown).reduce((s, v) => s + v, 0);
    Object.entries(ab.regionBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .forEach(([region, count]) => {
        breakdowns.push({ label: region, count, total: regionTotal });
      });
  } else if (data.channels.length > 0) {
    // Channel breakdown for top-of-funnel stages
    const chTotal = data.channels.reduce((s, c) => s + c.total, 0);
    data.channels.slice(0, 5).forEach(c => {
      breakdowns.push({ label: c.source, count: c.total, total: chTotal });
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[580px] h-full bg-white shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-gray-900">{stage.label}</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {stage.count.toLocaleString()} events ·{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] font-mono">
                {meta.posthogEvent}
              </code>
              {' · '}
              <span className={`text-[11px] font-semibold ${stage.source === 'posthog' ? 'text-[#1d4aff]' : 'text-green-600'}`}>
                {stage.source === 'posthog' ? 'PostHog' : stage.source === 'supabase' ? 'Supabase' : 'no data'}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`${posthogBase}${meta.posthogUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#1d4aff] text-white hover:bg-[#1538cc] transition-colors"
            >
              <ExternalLink size={12} /> Open in PostHog
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
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
              {metrics.map((m, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{m.label}</p>
                  <p className="text-[18px] font-bold text-gray-900 mt-1">{m.value}</p>
                  {m.sub && <p className="text-[10px] text-gray-400 mt-0.5">{m.sub}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          {breakdowns.length > 0 && (
            <div>
              <h3 className="text-[13px] font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <Users size={14} /> Breakdown
              </h3>
              <div className="space-y-2">
                {breakdowns.map((b, i) => {
                  const pct = b.total > 0 ? Math.round((b.count / b.total) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[12px] text-gray-700 w-[160px] shrink-0 truncate">
                        {b.label}
                      </span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-md overflow-hidden relative">
                        <div
                          className="h-full bg-[#1d4aff]/70 rounded-md transition-all"
                          style={{ width: `${pct}%` }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-600">
                          {b.count.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-500 w-[40px] text-right">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Drop-off from previous */}
          {stage.dropOffFromPrev > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-[12px] font-semibold text-red-700 flex items-center gap-1.5">
                <TrendingDown size={14} /> Drop-off from previous stage
              </p>
              <p className="text-[13px] font-bold text-red-800 mt-1">
                {stage.dropOffCount.toLocaleString()} ({stage.dropOffFromPrev}%)
              </p>
              <p className="text-[11px] text-red-600 mt-0.5">
                did not progress from the previous stage.
              </p>
            </div>
          )}

          {/* Recommended Actions */}
          <div>
            <h3 className="text-[13px] font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <Zap size={14} /> Recommended Actions
            </h3>
            <div className="space-y-2">
              {meta.actions.map((a, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50"
                >
                  <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-amber-700">{i + 1}</span>
                  </div>
                  <p className="text-[12px] text-gray-700 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

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

function fmtMs(ms: number): string {
  if (ms <= 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AcquisitionFunnelPage() {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/crm/acquisition-funnel?period=${period}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  const maxCount = data ? Math.max(...data.stages.map(s => s.count), 1) : 1;

  return (
    <div className="p-5 bg-[#f5f6f8] min-h-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[18px] font-bold text-gray-900">Acquisition Funnel</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            App Builder — landing page to active merchant
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {data && (
            <span className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${
              data.summary.posthogConnected
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <Database size={10} />
              {data.summary.posthogConnected ? 'PostHog + Supabase' : 'Supabase only'}
            </span>
          )}
          {PERIODS.map(p => (
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
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">
                Landing → Active
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {data.summary.overallConversion}%
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Overall conversion</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">
                Biggest Drop-off
              </p>
              <p className="text-[15px] font-bold text-red-600 leading-tight">
                {data.summary.biggestDropoffStage ?? '—'}
              </p>
              {data.summary.biggestDropoffPct !== null && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {data.summary.biggestDropoffPct}% leave here
                </p>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">
                Best Channel
              </p>
              <p className="text-[15px] font-bold text-green-600 truncate">
                {data.summary.bestChannel ?? '—'}
              </p>
              {data.summary.bestChannelConversion !== null && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {data.summary.bestChannelConversion}% → deployed
                </p>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">
                Total Apps
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {data.appBuilder.totalApps.toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {data.appBuilder.deployedApps} deployed
              </p>
            </div>
          </div>

          {/* Funnel Visualization */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-gray-900">Funnel Stages</h2>
              <div className="flex items-center gap-3 text-[11px] text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> &gt;50% CVR
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> 20–50%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> &lt;20%
                </span>
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
                    >
                      {/* Label */}
                      <div className="w-[180px] shrink-0 text-right">
                        <span className="text-[12px] text-gray-700 font-medium group-hover:text-[#1d4aff] transition-colors">
                          {stage.label}
                        </span>
                      </div>
                      {/* Bar */}
                      <div className="flex-1 relative h-7 bg-gray-100 rounded-md overflow-hidden">
                        <div
                          className={`h-full rounded-md transition-all ${color} opacity-80`}
                          style={{
                            width: `${barWidth}%`,
                            minWidth: stage.count > 0 ? '4px' : '0',
                          }}
                        />
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-white drop-shadow">
                          {stage.count.toLocaleString()}
                        </span>
                      </div>
                      {/* Drop-off badge */}
                      <div className="w-[100px] shrink-0">
                        {i > 0 && stage.dropOffCount > 0 ? (
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${dropoffBadgeColor(stage.dropOffFromPrev)}`}
                          >
                            <TrendingDown size={10} />
                            -{stage.dropOffFromPrev}% ({stage.dropOffCount.toLocaleString()})
                          </span>
                        ) : i > 0 ? (
                          <span className="text-[10px] text-green-600 font-semibold">✓ 0% drop</span>
                        ) : null}
                      </div>
                      {/* CVR to next */}
                      <div className="w-[60px] shrink-0 text-right">
                        {stage.conversionToNext !== null ? (
                          <span
                            className={`text-[12px] font-bold ${conversionColor(stage.conversionToNext)}`}
                          >
                            {stage.conversionToNext}%
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">—</span>
                        )}
                      </div>
                      {/* Drill hint */}
                      <div className="w-[20px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye size={14} className="text-[#1d4aff]" />
                      </div>
                    </div>
                    {i < data.stages.length - 1 && (
                      <div className="flex items-center ml-[194px] my-0.5">
                        <ArrowRight size={12} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drop-off Analysis */}
          {data.stages.some(s => s.dropOffCount > 0) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
              <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Drop-off Analysis</h2>
              <div className="space-y-3">
                {data.stages
                  .filter(s => s.dropOffCount > 0)
                  .sort((a, b) => b.dropOffCount - a.dropOffCount)
                  .map(stage => (
                    <div
                      key={stage.id}
                      className="flex items-start gap-4 p-3 rounded-lg border border-gray-100 bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[13px] font-semibold text-gray-800">
                            {stage.label}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${dropoffBadgeColor(stage.dropOffFromPrev)}`}
                          >
                            -{stage.dropOffFromPrev}%
                          </span>
                        </div>
                        <p className="text-[12px] text-gray-500">
                          {stage.dropOffCount.toLocaleString()} users didn&apos;t progress past this
                          stage
                        </p>
                      </div>
                      <div className="shrink-0">
                        <p className="text-[11px] text-gray-400 mb-1 text-right">Action</p>
                        <p className="text-[12px] text-gray-700 font-medium max-w-[200px] text-right">
                          {STAGE_META[stage.id]?.actions[0] ?? 'Review with BD team'}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ── App Builder Metrics Section ───────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Hammer size={15} className="text-[#1d4aff]" /> App Builder Metrics
            </h2>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Apps</p>
                <p className="text-[22px] font-bold text-gray-900 mt-0.5">
                  {data.appBuilder.totalApps.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-400">
                  {data.appBuilder.deployedApps} deployed
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Build Success</p>
                <p
                  className={`text-[22px] font-bold mt-0.5 ${
                    data.appBuilder.buildSuccessRate >= 80
                      ? 'text-green-600'
                      : data.appBuilder.buildSuccessRate >= 50
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}
                >
                  {data.appBuilder.buildSuccessRate > 0
                    ? `${data.appBuilder.buildSuccessRate}%`
                    : '—'}
                </p>
                <p className="text-[11px] text-gray-400">of completed builds</p>
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  Avg Build Time
                </p>
                <p className="text-[22px] font-bold text-gray-900 mt-0.5">
                  {fmtMs(data.appBuilder.avgBuildTimeMs)}
                </p>
                <p className="text-[11px] text-gray-400">per task</p>
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  Avg Tokens Used
                </p>
                <p className="text-[22px] font-bold text-gray-900 mt-0.5">
                  {data.appBuilder.avgTokensUsed > 0
                    ? data.appBuilder.avgTokensUsed.toLocaleString()
                    : '—'}
                </p>
                <p className="text-[11px] text-gray-400">per merchant app</p>
              </div>
            </div>

            {/* App type split + top categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Business vs Idea */}
              <div>
                <h3 className="text-[12px] font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                  App Type Split
                </h3>
                {data.appBuilder.appTypeBreakdown.business +
                  data.appBuilder.appTypeBreakdown.idea ===
                0 ? (
                  <p className="text-[13px] text-gray-400">No data yet</p>
                ) : (
                  <div className="space-y-2">
                    {[
                      {
                        label: 'Business App',
                        count: data.appBuilder.appTypeBreakdown.business,
                        color: 'bg-[#1d4aff]',
                      },
                      {
                        label: 'Idea App',
                        count: data.appBuilder.appTypeBreakdown.idea,
                        color: 'bg-purple-500',
                      },
                    ].map(item => {
                      const total =
                        data.appBuilder.appTypeBreakdown.business +
                        data.appBuilder.appTypeBreakdown.idea;
                      const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                      return (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className="text-[12px] text-gray-700 w-[100px] shrink-0">
                            {item.label}
                          </span>
                          <div className="flex-1 h-5 bg-gray-100 rounded-md overflow-hidden relative">
                            <div
                              className={`h-full ${item.color} opacity-80 rounded-md`}
                              style={{ width: `${pct}%` }}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-600">
                              {item.count.toLocaleString()}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-gray-500 w-[36px] text-right">
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top Categories */}
              <div>
                <h3 className="text-[12px] font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                  Top App Categories
                </h3>
                {data.appBuilder.topCategories.length === 0 ? (
                  <p className="text-[13px] text-gray-400">No category data yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {data.appBuilder.topCategories.slice(0, 6).map((cat, i) => {
                      const total = data.appBuilder.topCategories.reduce(
                        (s, c) => s + c.count,
                        0
                      );
                      const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-700 w-[110px] shrink-0 truncate">
                            {cat.category}
                          </span>
                          <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden relative">
                            <div
                              className="h-full bg-[#1d4aff]/60 rounded"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 w-[30px] text-right">
                            {cat.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Region breakdown */}
            {Object.keys(data.appBuilder.regionBreakdown).length > 0 && (
              <div className="mt-5">
                <h3 className="text-[12px] font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                  Region Breakdown
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.appBuilder.regionBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([region, count]) => (
                      <div
                        key={region}
                        className="px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-[11px] font-medium text-gray-700"
                      >
                        {region}: <span className="font-bold">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* PostHog signals */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <h3 className="text-[12px] font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                Pipeline Signals
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: 'Builds Started', value: data.phSignals.appBuildStarted },
                  { label: 'Token Limit Hit', value: data.phSignals.tokenLimitReached },
                  { label: 'Sessions Abandoned', value: data.phSignals.sessionAbandoned },
                  { label: 'Communities Created', value: data.phSignals.communityCreated },
                ].map((sig, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-2.5 border text-center ${
                      sig.label === 'Token Limit Hit' && sig.value > 0
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <p className="text-[16px] font-bold text-gray-900">
                      {sig.value.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{sig.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Channel Attribution */}
          {data.channels.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
              <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Source Attribution</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left font-semibold text-gray-500 pb-2 text-[11px] uppercase tracking-wider">
                        Source
                      </th>
                      <th className="text-right font-semibold text-gray-500 pb-2 text-[11px] uppercase tracking-wider">
                        Total
                      </th>
                      <th className="text-right font-semibold text-gray-500 pb-2 text-[11px] uppercase tracking-wider">
                        Deployed
                      </th>
                      <th className="text-right font-semibold text-gray-500 pb-2 text-[11px] uppercase tracking-wider">
                        CVR
                      </th>
                      <th className="pb-2 w-[120px]" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.channels.map(ch => (
                      <tr key={ch.source} className="hover:bg-gray-50">
                        <td className="py-2.5 font-medium text-gray-800">{ch.source}</td>
                        <td className="py-2.5 text-right text-gray-600">
                          {ch.total.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right text-green-600 font-semibold">
                          {ch.active.toLocaleString()}
                        </td>
                        <td
                          className={`py-2.5 text-right font-bold ${conversionColor(ch.conversionRate)}`}
                        >
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
            </div>
          )}

          {/* Focus / Recommendations */}
          <div className="bg-[#1a1a2e] rounded-xl p-5 text-white">
            <h2 className="text-[15px] font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#00ff88]" />
              What to Focus On
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="font-semibold text-[#00ff88] mb-1 flex items-center gap-1.5">
                  <AlertTriangle size={13} /> Biggest Opportunity
                </p>
                <p className="text-gray-300">
                  {data.summary.biggestDropoffStage
                    ? `"${data.summary.biggestDropoffStage}" drops ${data.summary.biggestDropoffPct}% — fix this first.`
                    : 'No major drop-off detected — funnel is healthy!'}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="font-semibold text-[#00ff88] mb-1 flex items-center gap-1.5">
                  <Rocket size={13} /> Double Down On
                </p>
                <p className="text-gray-300">
                  {data.summary.bestChannel
                    ? `"${data.summary.bestChannel}" converts at ${data.summary.bestChannelConversion}% → deployed. Invest more here.`
                    : 'Add UTM tracking to all acquisition channels to find your top performer.'}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="font-semibold text-[#00ff88] mb-1 flex items-center gap-1.5">
                  <Hammer size={13} /> Build Health
                </p>
                <p className="text-gray-300">
                  {data.appBuilder.buildSuccessRate > 0
                    ? `Build success rate: ${data.appBuilder.buildSuccessRate}%. ${
                        data.appBuilder.buildSuccessRate < 80
                          ? 'Below 80% — investigate Claude Code task failures.'
                          : 'Healthy. Monitor token limit alerts.'
                      }`
                    : 'No build data yet — trigger your first app build.'}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="font-semibold text-[#00ff88] mb-1 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Token Health
                </p>
                <p className="text-gray-300">
                  {data.phSignals.tokenLimitReached > 0
                    ? `${data.phSignals.tokenLimitReached} merchants hit the token limit. Proactive top-up reminders prevent churn.`
                    : data.appBuilder.avgTokensUsed > 0
                    ? `Avg ${data.appBuilder.avgTokensUsed.toLocaleString()} tokens per app. No limit alerts yet — good.`
                    : 'Token data will appear once builds complete.'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Stage drill-down panel */}
      {selectedStage && data && (
        <StageDetailPanel
          stage={selectedStage}
          data={data}
          onClose={() => setSelectedStage(null)}
        />
      )}
    </div>
  );
}
