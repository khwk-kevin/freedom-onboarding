import { getNeonClient } from './client';

export interface MerchantRevenue {
  total_revenue: number;
  total_transactions: number;
  avg_transaction: number;
  monthly_revenue: number;
  monthly_transactions: number;
  last_transaction_at: string | null;
}

export interface MerchantLTV {
  ltv: number;
  active_days: number;
  avg_monthly_revenue: number;
  first_transaction_at: string | null;
  last_transaction_at: string | null;
}

// Get total and monthly revenue for a merchant org
export async function getMerchantRevenue(orgId: string): Promise<MerchantRevenue | null> {
  try {
    const sql = getNeonClient();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const result = await sql`
      SELECT
        COALESCE(SUM(amount), 0)::FLOAT AS total_revenue,
        COUNT(*)::INT AS total_transactions,
        COALESCE(AVG(amount), 0)::FLOAT AS avg_transaction,
        COALESCE(SUM(CASE WHEN created_at >= ${monthAgo} THEN amount ELSE 0 END), 0)::FLOAT AS monthly_revenue,
        COUNT(CASE WHEN created_at >= ${monthAgo} THEN 1 END)::INT AS monthly_transactions,
        MAX(created_at) AS last_transaction_at
      FROM server_side_http_api_prod.fdp_payment_completed
      WHERE org_id = ${orgId}
        AND status = 'success'
    `;

    const rows = result as any[];
    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    return {
      total_revenue: Number(row.total_revenue) || 0,
      total_transactions: Number(row.total_transactions) || 0,
      avg_transaction: Number(row.avg_transaction) || 0,
      monthly_revenue: Number(row.monthly_revenue) || 0,
      monthly_transactions: Number(row.monthly_transactions) || 0,
      last_transaction_at: row.last_transaction_at ? String(row.last_transaction_at) : null,
    };
  } catch (err) {
    console.error('[neon/getMerchantRevenue] error:', err);
    return null;
  }
}

// Get LTV (lifetime value) analysis for a merchant
export async function getMerchantLTV(orgId: string): Promise<MerchantLTV | null> {
  try {
    const sql = getNeonClient();

    const result = await sql`
      SELECT
        COALESCE(SUM(amount), 0)::FLOAT AS ltv,
        COALESCE(
          EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 86400,
          0
        )::INT AS active_days,
        MIN(created_at) AS first_transaction_at,
        MAX(created_at) AS last_transaction_at
      FROM server_side_http_api_prod.fdp_payment_completed
      WHERE org_id = ${orgId}
        AND status = 'success'
    `;

    const rows = result as any[];
    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    const ltv = Number(row.ltv) || 0;
    const activeDays = Number(row.active_days) || 0;
    const avgMonthly = activeDays > 0 ? (ltv / activeDays) * 30 : 0;

    return {
      ltv,
      active_days: activeDays,
      avg_monthly_revenue: Math.round(avgMonthly),
      first_transaction_at: row.first_transaction_at ? String(row.first_transaction_at) : null,
      last_transaction_at: row.last_transaction_at ? String(row.last_transaction_at) : null,
    };
  } catch (err) {
    console.error('[neon/getMerchantLTV] error:', err);
    return null;
  }
}
