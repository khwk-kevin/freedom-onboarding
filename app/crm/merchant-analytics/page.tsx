import {
  getEcosystemKPIs,
  getEcosystemTotals,
  getTokenLoyalty,
  getPaymentMix,
  getMerchantHealthBoard,
  getRevenueTrend,
  getCrossMerchantShopping,
  getLoyaltyDepth,
} from '@/lib/queries/commerce';
import { RevenuePeriodFilter } from '@/components/crm/RevenuePeriodFilter';
import { Suspense } from 'react';
import {
  Activity,
  TrendingUp,
  Users,
  ShoppingBag,
  Zap,
  AlertTriangle,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Store,
  Repeat2,
  Network,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number | string | null | undefined): string {
  const num = Number(n ?? 0);
  if (num >= 1_000_000) return `฿${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `฿${(num / 1_000).toFixed(1)}K`;
  return `฿${num.toLocaleString()}`;
}

function pctChange(current: number, previous: number): number {
  if (!previous || previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

function healthColor(score: number) {
  if (score >= 75) return { bar: '#22c55e', bg: 'bg-green-100', text: 'text-green-700' };
  if (score >= 50) return { bar: '#f59e0b', bg: 'bg-yellow-100', text: 'text-yellow-700' };
  if (score >= 25) return { bar: '#f97316', bg: 'bg-orange-100', text: 'text-orange-700' };
  return { bar: '#ef4444', bg: 'bg-red-100', text: 'text-red-700' };
}

// ─── SVG Revenue Chart (server-rendered, adapts to bar count) ────────────────

function RevenueChart({
  data,
  period,
}: {
  data: { revenue: number; period_start: string }[];
  period: string;
}) {
  const W = 600;
  const H = 72;
  const isDaily = period === '1m';
  const labelEvery = isDaily ? 1 : period === '3m' ? 1 : period === '6m' ? 2 : period === '1y' ? 4 : 1;
  const rotate = isDaily; // rotate labels 45° for daily bars (30 bars → crowded)
  const labelAreaH = rotate ? 48 : 24;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const gap = data.length > 20 ? 2 : 3;
  const barW = Math.max(W / data.length - gap, 2);
  const recentCutoff = data.length - (isDaily ? 7 : 4);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H + labelAreaH}`}
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      {data.map((d, i) => {
        const h = Math.max((d.revenue / max) * H, 3);
        const x = i * (barW + gap);
        const cx = x + barW / 2;
        const isRecent = i >= recentCutoff;
        const showLabel = i % labelEvery === 0;
        const label = new Date(d.period_start + 'T12:00:00Z').toLocaleDateString('en-GB', {
          month: 'short',
          day: 'numeric',
        });

        return (
          <g key={i}>
            <rect
              x={x}
              y={H - h}
              width={barW}
              height={h}
              rx="1"
              fill={isRecent ? '#4A90D9' : '#e2e8f0'}
              opacity={isRecent ? 1 : 0.85}
            />
            {showLabel && (
              rotate ? (
                <text
                  transform={`translate(${cx}, ${H + 6}) rotate(-45)`}
                  textAnchor="end"
                  fontSize="8"
                  fill="#9ca3af"
                >
                  {label}
                </text>
              ) : (
                <text
                  x={cx}
                  y={H + 16}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#9ca3af"
                >
                  {label}
                </text>
              )
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Mini badge components ────────────────────────────────────────────────────

function MomentumBadge({ pct }: { pct: number }) {
  const n = Number(pct);
  if (n > 5)
    return (
      <span className="inline-flex items-center gap-0.5 text-green-600 font-semibold text-xs">
        <ArrowUpRight size={12} />+{n.toFixed(1)}%
      </span>
    );
  if (n < -5)
    return (
      <span className="inline-flex items-center gap-0.5 text-red-500 font-semibold text-xs">
        <ArrowDownRight size={12} />{n.toFixed(1)}%
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-gray-400 text-xs">
      <Minus size={12} />Flat
    </span>
  );
}

function ChangeBadge({ pct }: { pct: number }) {
  if (pct > 0)
    return <span className="text-green-500 text-[11px] font-medium">▲ {pct}% vs prev 30d</span>;
  if (pct < 0)
    return <span className="text-red-500 text-[11px] font-medium">▼ {Math.abs(pct)}% vs prev 30d</span>;
  return <span className="text-gray-400 text-[11px]">No prior data</span>;
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<{ period?: string }>;
}

export default async function MerchantAnalyticsPage({ searchParams }: Props) {
  const { period = '1m' } = await searchParams;

  const [kpis, totals, loyalty, loyaltyDepth, paymentMix, healthBoard, trendData, crossMerchant] =
    await Promise.all([
      getEcosystemKPIs(),
      getEcosystemTotals() as Promise<any>,
      getTokenLoyalty(),
      getLoyaltyDepth(),
      getPaymentMix(),
      getMerchantHealthBoard(),
      getRevenueTrend(period),
      getCrossMerchantShopping(),
    ]);

  const cur = kpis.current;
  const prev = kpis.previous;

  // Derived insight figures
  const tokenCash = loyalty.find((r: any) => r.buyer_type === 'Token + Cash');
  const cashOnly = loyalty.find((r: any) => r.buyer_type === 'Cash Only');
  const tokenOnly = loyalty.find((r: any) => r.buyer_type === 'Token Only');
  const totalRev = loyalty.reduce((s: number, r: any) => s + Number(r.total_revenue), 0);
  const tokenCashRevPct = totalRev > 0 ? Math.round((Number(tokenCash?.total_revenue ?? 0) / totalRev) * 100) : 0;
  const ltvMultiple =
    cashOnly && Number(cashOnly.avg_ltv) > 0
      ? Math.round(Number(tokenCash?.avg_ltv ?? 0) / Number(cashOnly.avg_ltv))
      : 22;

  const tokenCrossData = crossMerchant.find((r: any) => r.segment === 'Token Users');
  const cashCrossData = crossMerchant.find((r: any) => r.segment === 'Cash Only');

  const dormantCount = healthBoard.filter((m: any) => m.is_dormant).length;
  const healthyCount = healthBoard.filter((m: any) => Number(m.health_score) >= 75).length;
  const atRiskCount = healthBoard.filter((m: any) => Number(m.health_score) < 50).length;

  const totalPaymentAmt = paymentMix.reduce((s: number, r: any) => s + Number(r.amount), 0);

  // Week-over-week revenue data for chart
  // Neon returns date columns as JS Date objects — normalise to YYYY-MM-DD strings
  // Normalise Neon date objects → YYYY-MM-DD strings
  const trendRows = (trendData as { period_start: unknown; revenue: unknown; txns: unknown }[]).map(
    (w) => ({
      period_start:
        w.period_start instanceof Date
          ? w.period_start.toISOString().slice(0, 10)
          : String(w.period_start).slice(0, 10),
      revenue: Number(w.revenue),
      txns: Number(w.txns),
    })
  );

  return (
    <div className="p-5 space-y-6">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-gray-900">Commerce Intelligence</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Freedom ecosystem · {Number(totals.merchant_count).toLocaleString()} merchants · live data
          </p>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Activity size={11} />
          Refreshes every 10 min
        </div>
      </div>

      {/* ── 1. ALL-TIME ECOSYSTEM TOTALS ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'All-Time GMV',
            value: fmt(totals.gmv_all_time),
            sub: 'across all merchants',
            icon: <ShoppingBag size={18} />,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: 'Total Transactions',
            value: Number(totals.txns_all_time).toLocaleString(),
            sub: 'completed purchases',
            icon: <BarChart2 size={18} />,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Unique Buyers',
            value: Number(totals.total_buyers).toLocaleString(),
            sub: 'across ecosystem',
            icon: <Users size={18} />,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
          {
            label: 'Token Adoption',
            value: `${totals.token_adoption_pct}%`,
            sub: 'buyers used tokens',
            icon: <Zap size={18} />,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] text-gray-500 font-medium mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-[12px] text-gray-400 mt-1">{stat.sub}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 2. LAST-30-DAY KPIs ─────────────────────────────────────────── */}
      <div>
        <p className="text-[12px] font-semibold text-gray-500 mb-3">Last 30 Days vs Prior 30 Days</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Revenue',
              value: fmt(cur?.total_revenue),
              change: pctChange(Number(cur?.total_revenue), Number(prev?.total_revenue)),
              icon: <ShoppingBag size={18} />,
              color: 'text-green-600',
              bg: 'bg-green-50',
            },
            {
              label: 'Transactions',
              value: Number(cur?.total_transactions).toLocaleString(),
              change: pctChange(Number(cur?.total_transactions), Number(prev?.total_transactions)),
              icon: <BarChart2 size={18} />,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
            },
            {
              label: 'Unique Buyers',
              value: Number(cur?.unique_buyers).toLocaleString(),
              change: pctChange(Number(cur?.unique_buyers), Number(prev?.unique_buyers)),
              icon: <Users size={18} />,
              color: 'text-purple-600',
              bg: 'bg-purple-50',
            },
            {
              label: 'Avg Order Value',
              value: fmt(cur?.avg_order_value),
              change: pctChange(Number(cur?.avg_order_value), Number(prev?.avg_order_value)),
              icon: <TrendingUp size={18} />,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] text-gray-500 font-medium mb-1">{kpi.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                  <div className="mt-1">
                    <ChangeBadge pct={kpi.change} />
                  </div>
                </div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                  {kpi.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. REVENUE TREND ────────────────────────────────────────────── */}
      <div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Revenue Trend</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                All merchants combined ·{' '}
                {period === '1m' ? 'daily · last 30 days' :
                 period === '3m' ? 'weekly · last 3 months' :
                 period === '6m' ? 'weekly · last 6 months' :
                 period === '1y' ? 'weekly · last 12 months' : 'monthly · all time'} ·{' '}
                recent bars highlighted
              </p>
            </div>
            <Suspense fallback={null}>
              <RevenuePeriodFilter />
            </Suspense>
          </div>
          <div className="px-1 mt-2">
            <RevenueChart data={trendRows} period={period} />
          </div>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            {(() => {
              const recent = trendRows.slice(-7);
              const prior = trendRows.slice(-14, -7);
              const recentAvg = recent.length
                ? recent.reduce((s, w) => s + w.revenue, 0) / recent.length
                : 0;
              const priorAvg = prior.length
                ? prior.reduce((s, w) => s + w.revenue, 0) / prior.length
                : 0;
              const trend = priorAvg > 0 ? Math.round(((recentAvg - priorAvg) / priorAvg) * 100) : 0;
              const peak = trendRows.reduce(
                (best, w) => (w.revenue > best.revenue ? w : best),
                trendRows[0] || { revenue: 0, period_start: '' }
              );
              return (
                <>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Recent Avg</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">{fmt(recentAvg)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">vs Prior Period</p>
                    <p className={`text-lg font-bold mt-0.5 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {trend >= 0 ? '+' : ''}{trend}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Peak</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">{fmt(peak?.revenue)}</p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── 4. NETWORK EFFECT PROOF (BD Pitch Arsenal) ──────────────────── */}
      <div>
        <h2 className="text-[12px] font-semibold text-gray-500 mb-3">
          Network Effects — BD Pitch Arsenal
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-2xl mb-2">💎</div>
            <p className="text-gray-900 font-semibold text-base leading-snug">
              Token + Cash buyers generate{' '}
              <span className="text-[#00cc6a] font-black text-lg">{ltvMultiple}× higher LTV</span>
              {' '}than cash-only
            </p>
            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <p className="text-gray-400">Token+Cash avg LTV</p>
                <p className="font-bold text-gray-900">{fmt(tokenCash?.avg_ltv)}</p>
              </div>
              <div>
                <p className="text-gray-400">Cash-only avg LTV</p>
                <p className="font-bold text-gray-900">{fmt(cashOnly?.avg_ltv)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-2xl mb-2">🛒</div>
            <p className="text-gray-900 font-semibold text-base leading-snug">
              Token users visit{' '}
              <span className="text-[#00cc6a] font-black text-lg">
                {tokenCrossData?.avg_merchants_visited ?? '—'}
              </span>{' '}
              merchants on average.{' '}
              <span className="text-gray-500">Cash-only: </span>
              <span className="text-gray-800 font-bold">
                {cashCrossData?.avg_merchants_visited ?? '—'}
              </span>
            </p>
            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <p className="text-gray-400">Token avg spend</p>
                <p className="font-bold text-gray-900">{fmt(tokenCrossData?.avg_total_spent)}</p>
              </div>
              <div>
                <p className="text-gray-400">Cash avg spend</p>
                <p className="font-bold text-gray-900">{fmt(cashCrossData?.avg_total_spent)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-2xl mb-2">🔑</div>
            <p className="text-gray-900 font-semibold text-base leading-snug">
              Token + Cash buyers drive{' '}
              <span className="text-[#00cc6a] font-black text-lg">{tokenCashRevPct}%</span> of all
              ecosystem revenue
            </p>
            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <p className="text-gray-400">These buyers</p>
                <p className="font-bold text-gray-900">
                  {Number(tokenCash?.users ?? 0).toLocaleString()} users
                </p>
              </div>
              <div>
                <p className="text-gray-400">Repeat rate</p>
                <p className="font-bold text-[#00cc6a]">{tokenCash?.repeat_rate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. BUYER SEGMENTS ────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* LTV breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Lifetime Value by Segment</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Revenue share + avg LTV</p>
          </div>
          <div className="divide-y divide-gray-50">
            {loyalty.map((row: any, i: number) => {
              const revShare =
                totalRev > 0 ? Math.round((Number(row.total_revenue) / totalRev) * 100) : 0;
              const isTop = i === 0;
              const dotColor = row.buyer_type === 'Token + Cash' ? '#00ff88' : row.buyer_type === 'Token Only' ? '#818cf8' : '#d1d5db';
              return (
                <div key={row.buyer_type} className={`px-5 py-3.5 ${isTop ? 'bg-green-50/40' : ''}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                      <span className="text-sm font-medium text-gray-900">{row.buyer_type}</span>
                      <span className="text-[10px] text-gray-400">
                        {Number(row.users).toLocaleString()} users
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{fmt(row.avg_ltv)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${revShare}%`, backgroundColor: dotColor }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 w-8 text-right">{revShare}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Loyalty depth: avg purchases + active days */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Purchase Loyalty Depth</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Avg purchases, active days, repeat rate</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Segment', 'Avg Purchases', 'Active Days', 'Repeat Rate'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loyaltyDepth.map((row: any, i: number) => (
                <tr key={row.buyer_type} className={i === 0 ? 'bg-green-50/30' : ''}>
                  <td className="px-4 py-3 font-medium text-gray-900 text-xs">{row.buyer_type}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs font-semibold">{row.avg_purchases}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{row.avg_active_days}d</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold ${Number(row.repeat_rate) >= 50 ? 'text-green-600' : 'text-gray-600'}`}
                    >
                      {row.repeat_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 6. MERCHANT HEALTH BOARD ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[12px] font-semibold text-gray-500">
              Merchant Health Board
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {healthyCount} healthy · {atRiskCount} at risk · {dormantCount} dormant
            </p>
          </div>
          {dormantCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg">
              <AlertTriangle size={12} />
              {dormantCount} need re-engagement
            </div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {[
                    { label: 'Merchant', cls: 'text-left px-5 py-3 w-44' },
                    { label: 'Health', cls: 'text-left px-4 py-3' },
                    { label: 'All-Time Rev', cls: 'text-right px-4 py-3' },
                    { label: '4w Trend', cls: 'text-right px-4 py-3' },
                    { label: 'Activity', cls: 'text-right px-4 py-3' },
                    { label: 'Status', cls: 'text-right px-5 py-3' },
                  ].map((h) => (
                    <th
                      key={h.label}
                      className={`${h.cls} text-[10px] font-semibold text-gray-500 uppercase tracking-wide`}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {healthBoard.map((m: any) => {
                  const hc = healthColor(Number(m.health_score));
                  return (
                    <tr
                      key={m.org_id}
                      className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-gray-900 text-sm truncate max-w-[176px]">
                        {m.merchant_name}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(100, Number(m.health_score))}%`,
                                backgroundColor: hc.bar,
                              }}
                            />
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${hc.bg} ${hc.text}`}>
                            {Number(m.health_score).toFixed(0)}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-semibold text-gray-900 text-sm">
                        {fmt(m.total_revenue)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <MomentumBadge pct={m.momentum_pct} />
                      </td>

                      <td className="px-4 py-3 text-right text-gray-500 text-xs">
                        {Number(m.activity_rate).toFixed(0)}%
                        <span className="text-gray-300 ml-1">
                          ({m.weeks_active}/{m.total_weeks}w)
                        </span>
                      </td>

                      <td className="px-5 py-3 text-right">
                        {m.is_dormant ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                            <AlertTriangle size={9} />
                            Dormant
                          </span>
                        ) : Number(m.recent_4w_avg) > 0 ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            Inactive
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 7. PAYMENT MIX ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-[12px] font-semibold text-gray-500 mb-3">
          Payment Mix — Last 30 Days
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="space-y-2.5">
            {paymentMix.map((p: any) => {
              const pct =
                totalPaymentAmt > 0 ? Math.round((Number(p.amount) / totalPaymentAmt) * 100) : 0;
              const isToken = ['Token', 'Freedom (FDM)', 'Freedom Shard (FDS)'].includes(p.payment_method);
              return (
                <div key={p.payment_method} className="flex items-center gap-3">
                  <span className="w-32 text-xs text-gray-700 shrink-0 truncate">{p.payment_method}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4">
                    <div
                      className="h-4 rounded-full flex items-center px-2 transition-all"
                      style={{
                        width: `${Math.max(pct, 2)}%`,
                        backgroundColor: isToken ? '#00ff88' : '#94a3b8',
                      }}
                    >
                      {pct > 10 && (
                        <span className="text-[9px] font-bold text-gray-900">{pct}%</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-900 w-20 text-right shrink-0">
                    {fmt(p.amount)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <span className="w-3 h-3 rounded-sm bg-[#00ff88] shrink-0" />
              Token payments (Freedom ecosystem)
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <span className="w-3 h-3 rounded-sm bg-[#94a3b8] shrink-0" />
              Cash / card
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
