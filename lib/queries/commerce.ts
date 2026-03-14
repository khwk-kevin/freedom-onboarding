import { unstable_cache } from 'next/cache';
import { sql } from '@/lib/neon';

// ─── Ecosystem KPIs (30d vs prior 30d) ───────────────────────────────────────
export const getEcosystemKPIs = unstable_cache(
  async () => {
    const current = await sql`
      SELECT
        COALESCE(SUM(total_revenue), 0)       AS total_revenue,
        COALESCE(SUM(transaction_count), 0)   AS total_transactions,
        COALESCE(SUM(unique_buyers), 0)       AS unique_buyers,
        COALESCE(AVG(avg_order_value), 0)     AS avg_order_value,
        MAX(currency)                          AS currency
      FROM merchant_analytics.daily_revenue
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    `;
    const previous = await sql`
      SELECT
        COALESCE(SUM(total_revenue), 0)       AS total_revenue,
        COALESCE(SUM(transaction_count), 0)   AS total_transactions,
        COALESCE(SUM(unique_buyers), 0)       AS unique_buyers,
        COALESCE(AVG(avg_order_value), 0)     AS avg_order_value
      FROM merchant_analytics.daily_revenue
      WHERE date >= CURRENT_DATE - INTERVAL '60 days'
        AND date < CURRENT_DATE - INTERVAL '30 days'
    `;
    return { current: current[0], previous: previous[0] };
  },
  ['commerce-ecosystem-kpis'],
  { revalidate: 600 }
);

// ─── Token Loyalty / LTV by buyer type ───────────────────────────────────────
export const getTokenLoyalty = unstable_cache(
  async () => {
    const ltv = await sql`
      WITH buyer_ltv AS (
        SELECT
          user_id,
          BOOL_OR(payment_method IN ('Token','Freedom (FDM)','Freedom Shard (FDS)')) AS used_tokens,
          BOOL_OR(payment_method NOT IN ('Token','Freedom (FDM)','Freedom Shard (FDS)'))  AS used_cash,
          SUM(payment_amount::numeric)   AS ltv,
          COUNT(*)                       AS purchases
        FROM server_side_http_api_prod.fdp_payment_completed
        GROUP BY user_id
      )
      SELECT
        CASE
          WHEN used_tokens AND used_cash  THEN 'Token + Cash'
          WHEN used_tokens                THEN 'Token Only'
          ELSE                                 'Cash Only'
        END                                                          AS buyer_type,
        COUNT(*)                                                     AS users,
        ROUND(AVG(ltv)::numeric, 0)                                  AS avg_ltv,
        ROUND(SUM(ltv)::numeric, 0)                                  AS total_revenue,
        ROUND((COUNT(*) FILTER (WHERE purchases > 1)::numeric
               / NULLIF(COUNT(*), 0)::numeric * 100)::numeric, 1)   AS repeat_rate
      FROM buyer_ltv
      WHERE used_tokens OR used_cash
      GROUP BY 1
      ORDER BY avg_ltv DESC
    `;
    return ltv;
  },
  ['commerce-token-loyalty'],
  { revalidate: 600 }
);

// ─── Payment method mix (last 30 days) ───────────────────────────────────────
export const getPaymentMix = unstable_cache(
  async () => {
    return sql`
      SELECT
        payment_method,
        SUM(transaction_count)  AS txn_count,
        SUM(total_amount)       AS amount,
        MAX(currency)           AS currency
      FROM merchant_analytics.daily_payment_methods
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY payment_method
      ORDER BY amount DESC
    `;
  },
  ['commerce-payment-mix'],
  { revalidate: 600 }
);

// ─── Merchant health board ────────────────────────────────────────────────────
// Health score mirrors the XLSX dashboard formula:
//   activity_rate * 0.4 + momentum_score * 0.3 + rev_tier * 0.3
export const getMerchantHealthBoard = unstable_cache(
  async () => {
    return sql`
      WITH weekly AS (
        SELECT
          org_id,
          merchant_name,
          DATE_TRUNC('week', date)::date   AS week_start,
          SUM(total_revenue)               AS weekly_rev,
          SUM(transaction_count)           AS weekly_txn
        FROM merchant_analytics.daily_revenue
        GROUP BY org_id, merchant_name, DATE_TRUNC('week', date)
      ),
      per_merchant AS (
        SELECT
          org_id,
          MAX(merchant_name)                                                             AS merchant_name,
          ROUND(SUM(weekly_rev)::numeric, 0)                                            AS total_revenue,
          ROUND(SUM(weekly_txn)::numeric, 0)                                            AS total_txn,
          COUNT(*)                                                                       AS total_weeks,
          COUNT(*) FILTER (WHERE weekly_rev > 0)                                        AS weeks_active,
          ROUND(COALESCE(AVG(weekly_rev) FILTER (
            WHERE week_start >= CURRENT_DATE - INTERVAL '28 days'), 0)::numeric, 0)    AS recent_4w_avg,
          ROUND(COALESCE(AVG(weekly_rev) FILTER (
            WHERE week_start >= CURRENT_DATE - INTERVAL '56 days'
              AND week_start <  CURRENT_DATE - INTERVAL '28 days'), 0)::numeric, 0)    AS prior_4w_avg,
          MAX(week_start) FILTER (WHERE weekly_rev > 0)                                 AS last_active_week
        FROM weekly
        GROUP BY org_id
      )
      SELECT
        org_id,
        merchant_name,
        total_revenue,
        total_txn,
        total_weeks,
        weeks_active,
        recent_4w_avg,
        prior_4w_avg,
        last_active_week,

        -- Activity rate %
        ROUND(CASE WHEN total_weeks > 0
          THEN weeks_active * 100.0 / total_weeks ELSE 0
        END::numeric, 1)                                                   AS activity_rate,

        -- Momentum %
        ROUND(CASE
          WHEN prior_4w_avg > 0
            THEN ((recent_4w_avg - prior_4w_avg) / prior_4w_avg * 100)
          WHEN recent_4w_avg > 0 THEN 100
          ELSE 0
        END::numeric, 1)                                                   AS momentum_pct,

        -- Dormant flag: no activity for 21+ days
        CASE
          WHEN last_active_week < CURRENT_DATE - INTERVAL '21 days'
            AND weeks_active > 0 THEN true
          ELSE false
        END                                                                AS is_dormant,

        -- Health score 0-100
        ROUND(LEAST(100,
          (CASE WHEN total_weeks > 0
            THEN weeks_active * 100.0 / total_weeks ELSE 0
          END) * 0.4
          +
          GREATEST(0, LEAST(100, 50 + CASE
            WHEN prior_4w_avg > 0
              THEN ((recent_4w_avg - prior_4w_avg)::numeric / prior_4w_avg * 50)
            WHEN recent_4w_avg > 0 THEN 50
            ELSE 0
          END)) * 0.3
          +
          LEAST(100, total_revenue::numeric / 100000 * 100) * 0.3
        )::numeric, 1)                                                     AS health_score

      FROM per_merchant
      ORDER BY total_revenue DESC
    `;
  },
  ['commerce-merchant-health'],
  { revalidate: 600 }
);

// ─── Revenue trend — supports 1m (daily) / 3m / 6m / 1y / all (weekly or monthly) ──
// ─── Revenue trend — period-aware (daily / weekly / monthly) ─────────────────
// NOTE: unstable_cache must not be called inside a runtime function.
// This query is intentionally uncached since the page is already dynamic
// (reads searchParams). Each period is a distinct SQL shape anyway.
export async function getRevenueTrend(period: string = '1m') {
  const intervalMap: Record<string, string> = {
    '1m': '30 days',
    '3m': '91 days',
    '6m': '182 days',
    '1y': '365 days',
  };
  const interval = intervalMap[period]; // undefined for 'all'

  if (period === '1m') {
    return sql`
      SELECT
        dr.date::text                      AS period_start,
        dr.total_revenue                   AS revenue,
        dr.transaction_count               AS txns
      FROM merchant_analytics.daily_revenue dr
      WHERE dr.date >= CURRENT_DATE - INTERVAL ${interval ?? '30 days'}
      ORDER BY dr.date ASC
    `;
  }

  if (period === 'all') {
    return sql`
      SELECT
        DATE_TRUNC('month', dr.date)::date::text  AS period_start,
        SUM(dr.total_revenue)                     AS revenue,
        SUM(dr.transaction_count)                 AS txns
      FROM merchant_analytics.daily_revenue dr
      GROUP BY DATE_TRUNC('month', dr.date)
      ORDER BY period_start ASC
    `;
  }

  // 3m / 6m / 1y — weekly buckets
  return sql`
    SELECT
      DATE_TRUNC('week', dr.date)::date::text  AS period_start,
      SUM(dr.total_revenue)                    AS revenue,
      SUM(dr.transaction_count)                AS txns
    FROM merchant_analytics.daily_revenue dr
    WHERE dr.date >= CURRENT_DATE - INTERVAL ${interval ?? '91 days'}
    GROUP BY DATE_TRUNC('week', dr.date)
    ORDER BY period_start ASC
  `;
}

// ─── Cross-merchant shopping (network effect proof) ───────────────────────────
export const getCrossMerchantShopping = unstable_cache(
  async () => {
    return sql`
      WITH user_merchants AS (
        SELECT
          user_id,
          BOOL_OR(payment_method IN ('Token','Freedom (FDM)','Freedom Shard (FDS)')) AS uses_tokens,
          COUNT(DISTINCT org_id)              AS merchant_count,
          SUM(payment_amount::numeric)        AS total_spent
        FROM server_side_http_api_prod.fdp_payment_completed
        GROUP BY user_id
      )
      SELECT
        CASE WHEN uses_tokens THEN 'Token Users' ELSE 'Cash Only' END AS segment,
        COUNT(*)                                                        AS users,
        ROUND(AVG(merchant_count)::numeric, 2)                        AS avg_merchants_visited,
        ROUND(AVG(total_spent)::numeric, 0)                           AS avg_total_spent,
        MAX(merchant_count)                                            AS max_merchants,
        COUNT(*) FILTER (WHERE merchant_count > 1)                    AS multi_merchant_buyers
      FROM user_merchants
      GROUP BY uses_tokens
    `;
  },
  ['commerce-cross-merchant'],
  { revalidate: 600 }
);

// ─── Loyalty depth by payment type (avg purchases, active days) ───────────────
export const getLoyaltyDepth = unstable_cache(
  async () => {
    return sql`
      WITH buyer_methods AS (
        SELECT
          user_id,
          BOOL_OR(payment_method IN ('Token','Freedom (FDM)','Freedom Shard (FDS)')) AS used_tokens,
          BOOL_OR(payment_method NOT IN ('Token','Freedom (FDM)','Freedom Shard (FDS)'))  AS used_cash,
          COUNT(*)                                         AS total_purchases,
          COUNT(DISTINCT DATE(timestamp))                 AS active_days
        FROM server_side_http_api_prod.fdp_payment_completed
        GROUP BY user_id
      )
      SELECT
        CASE
          WHEN used_tokens AND NOT used_cash THEN 'Token Only'
          WHEN NOT used_tokens AND used_cash THEN 'Cash Only'
          WHEN used_tokens AND used_cash     THEN 'Token + Cash'
        END                                                               AS buyer_type,
        COUNT(*)                                                          AS buyers,
        ROUND(AVG(total_purchases)::numeric, 1)                         AS avg_purchases,
        ROUND(AVG(active_days)::numeric, 1)                             AS avg_active_days,
        ROUND((COUNT(*) FILTER (WHERE total_purchases > 1)::numeric
               / NULLIF(COUNT(*),0)::numeric * 100)::numeric, 1)       AS repeat_rate
      FROM buyer_methods
      WHERE used_tokens OR used_cash
      GROUP BY 1
      ORDER BY avg_purchases DESC
    `;
  },
  ['commerce-loyalty-depth'],
  { revalidate: 600 }
);

// ─── Ecosystem all-time totals (for hero banner) ──────────────────────────────
export const getEcosystemTotals = unstable_cache(
  async () => {
    const revenue = await sql`
      SELECT
        ROUND(SUM(total_revenue)::numeric, 0)     AS gmv_all_time,
        SUM(transaction_count)                    AS txns_all_time,
        COUNT(DISTINCT org_id)                    AS merchant_count,
        MAX(currency)                             AS currency
      FROM merchant_analytics.daily_revenue
    `;
    const buyers = await sql`
      SELECT COUNT(DISTINCT user_id) AS total_buyers
      FROM server_side_http_api_prod.fdp_payment_completed
    `;
    const tokenAdoption = await sql`
      SELECT
        ROUND(
          COUNT(DISTINCT user_id) FILTER (
            WHERE payment_method IN ('Token','Freedom (FDM)','Freedom Shard (FDS)')
          )::numeric
          / NULLIF(COUNT(DISTINCT user_id),0)::numeric * 100,
          1
        ) AS token_adoption_pct
      FROM server_side_http_api_prod.fdp_payment_completed
    `;
    return {
      ...revenue[0],
      total_buyers: buyers[0]?.total_buyers,
      token_adoption_pct: tokenAdoption[0]?.token_adoption_pct,
    };
  },
  ['commerce-ecosystem-totals'],
  { revalidate: 3600 }
);
