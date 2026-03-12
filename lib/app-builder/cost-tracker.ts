/**
 * Freedom World App Builder — Build Cost + Performance Tracker
 * Sprint 6.2 — Infrastructure cost projections and token budget calibration.
 *
 * Tracks per-merchant build task costs using Railway compute pricing.
 * Writes to `build_tasks` table and exposes aggregation helpers.
 */

import { createServiceClient } from '../supabase/server';
import type { BuildTrigger } from './types';

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Railway compute cost per second of CPU-time.
 * ~$0.03/hour → $0.03 / 3600 ≈ 0.000008 USD/s
 */
export const RAILWAY_COST_PER_SECOND = 0.000008;

/**
 * Compute estimated USD cost for a given build duration.
 */
export function estimateBuildCostUsd(durationMs: number): number {
  return (durationMs / 1000) * RAILWAY_COST_PER_SECOND;
}

// ─── recordBuildTask ─────────────────────────────────────────────────────────

/**
 * Insert a completed build task row into the `build_tasks` Supabase table.
 *
 * Because `duration_ms` is a GENERATED column derived from `started_at` and
 * `completed_at`, we back-calculate `started_at` from `durationMs` so the
 * generated column reflects the actual elapsed time.
 */
export async function recordBuildTask(
  merchantId: string,
  trigger: BuildTrigger,
  durationMs: number,
  success: boolean,
  error?: string
): Promise<void> {
  const supabase = createServiceClient();

  const completedAt = new Date();
  const startedAt = new Date(completedAt.getTime() - durationMs);

  const { error: dbError } = await supabase.from('build_tasks').insert({
    merchant_id: merchantId,
    trigger,
    status: success ? 'success' : 'failed',
    // prompt is NOT NULL in schema — use trigger as minimal descriptor
    prompt: trigger,
    started_at: startedAt.toISOString(),
    completed_at: completedAt.toISOString(),
    error: error ?? null,
  });

  if (dbError) {
    // Non-fatal: log but don't throw — cost tracking must not break build flow
    console.error(
      `[cost-tracker] recordBuildTask failed for merchant ${merchantId}: ${dbError.message}`
    );
  }
}

// ─── getMerchantBuildCost ────────────────────────────────────────────────────

/**
 * Aggregate total build time, estimated cost, and task count for a merchant.
 *
 * Returns:
 *   - totalMs:      sum of all recorded `duration_ms` values
 *   - estimatedUsd: totalMs converted to USD at RAILWAY_COST_PER_SECOND
 *   - taskCount:    number of completed build tasks
 */
export async function getMerchantBuildCost(
  merchantId: string
): Promise<{ totalMs: number; estimatedUsd: number; taskCount: number }> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('build_tasks')
    .select('duration_ms')
    .eq('merchant_id', merchantId)
    .not('duration_ms', 'is', null);

  if (error) {
    throw new Error(
      `getMerchantBuildCost failed for merchant ${merchantId}: ${error.message}`
    );
  }

  const rows = data ?? [];
  const totalMs = rows.reduce(
    (sum, row) => sum + ((row.duration_ms as number | null) ?? 0),
    0
  );

  return {
    totalMs,
    estimatedUsd: estimateBuildCostUsd(totalMs),
    taskCount: rows.length,
  };
}

// ─── getCategoryAvgBuildTime ─────────────────────────────────────────────────

/**
 * Return the average build duration (ms) for all merchants in a given category.
 *
 * Joins `build_tasks` → `merchant_apps` on `merchant_id = merchant_apps.id`
 * and filters by `merchant_apps.category`. Uses the Supabase RPC pattern
 * for the join since the JS client doesn't support cross-table aggregates
 * directly — we use a raw SQL query via `.rpc()` if available, or fall back
 * to a two-step lookup.
 *
 * Returns 0 if no tasks exist for the category.
 */
export async function getCategoryAvgBuildTime(category: string): Promise<number> {
  const supabase = createServiceClient();

  // Step 1: Get all merchant IDs in this category
  const { data: merchants, error: merchantError } = await supabase
    .from('merchant_apps')
    .select('id')
    .eq('category', category);

  if (merchantError) {
    throw new Error(
      `getCategoryAvgBuildTime — merchant lookup failed for category "${category}": ${merchantError.message}`
    );
  }

  if (!merchants || merchants.length === 0) {
    return 0;
  }

  const merchantIds = merchants.map((m) => m.id as string);

  // Step 2: Aggregate duration_ms across all build tasks for those merchants
  const { data: tasks, error: tasksError } = await supabase
    .from('build_tasks')
    .select('duration_ms')
    .in('merchant_id', merchantIds)
    .not('duration_ms', 'is', null);

  if (tasksError) {
    throw new Error(
      `getCategoryAvgBuildTime — tasks lookup failed for category "${category}": ${tasksError.message}`
    );
  }

  const rows = tasks ?? [];
  if (rows.length === 0) return 0;

  const totalMs = rows.reduce(
    (sum, row) => sum + ((row.duration_ms as number | null) ?? 0),
    0
  );

  return totalMs / rows.length;
}
