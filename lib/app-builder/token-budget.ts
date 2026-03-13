/**
 * Freedom World App Builder — Token Budget System
 * Sprint 5.2 — Token Budget
 *
 * Meters AI compute usage per merchant. Deducts tokens after each build task,
 * gates new builds when the budget is exhausted.
 *
 * Token estimates per trigger type (placeholder — calibrate after K's test):
 *   scrape_complete / idea_described : 2000
 *   products_added / priorities_set  : 1000
 *   mood_selected / audience_defined
 *     / anti_prefs_set / features_selected : 500
 *   color_changed                    : 200
 *   ad_hoc_request                   : 800
 *
 * Update FREE_TIER_TOKENS after real benchmarks are recorded in
 * /clawd/bd/freedom/specs/TOKEN-BENCHMARKS.md
 */

import { createServiceClient } from '../supabase/server';
import type { BuildTrigger } from './types';

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Default token allocation for new merchants on the free tier.
 * Placeholder — calibrate once K's test provides real usage data.
 */
export const FREE_TIER_TOKENS = 10_000;

// ============================================================
// TOKEN ESTIMATION
// ============================================================

/**
 * Rough token cost estimate per build trigger.
 * Based on expected Claude Code turns and context size.
 * Refine these values after running TOKEN-BENCHMARKS.md benchmarks.
 */
const TOKEN_ESTIMATES: Record<BuildTrigger, number> = {
  scrape_complete: 2000,
  idea_described: 2000,
  products_added: 1000,
  priorities_set: 1000,
  mood_selected: 500,
  audience_defined: 500,
  anti_prefs_set: 500,
  features_selected: 500,
  color_changed: 200,
  style_changed: 200,
  ad_hoc_request: 800,
};

/**
 * Returns the estimated token cost for a given build trigger.
 */
export function estimateTaskTokens(trigger: BuildTrigger): number {
  return TOKEN_ESTIMATES[trigger] ?? 500;
}

// ============================================================
// TOKEN READS
// ============================================================

/**
 * Returns the current token balance for a merchant.
 * Returns FREE_TIER_TOKENS if the merchant row doesn't exist yet
 * (shouldn't happen in normal flow — provision initialises the row).
 */
export async function getTokenBalance(merchantId: string): Promise<number> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('merchant_apps')
    .select('token_balance')
    .eq('id', merchantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Row not found — return the full free allocation
      return FREE_TIER_TOKENS;
    }
    throw new Error(`getTokenBalance failed for ${merchantId}: ${error.message}`);
  }

  return (data?.token_balance as number) ?? FREE_TIER_TOKENS;
}

/**
 * Returns true when the merchant's token balance is zero or negative.
 */
export async function isTokenBudgetExhausted(merchantId: string): Promise<boolean> {
  const balance = await getTokenBalance(merchantId);
  return balance <= 0;
}

// ============================================================
// TOKEN WRITES — optimistic updates via Supabase RPC
// ============================================================

/**
 * Deduct tokens from the merchant's balance.
 *
 * Uses an atomic Supabase RPC (`deduct_tokens`) to avoid race conditions when
 * multiple build tasks complete concurrently.  Falls back to a simple UPDATE if
 * the RPC is not yet deployed (the fallback is not race-safe but is fine for MVP).
 *
 * Returns the new balance and whether the budget is now exhausted.
 */
export async function deductTokens(
  merchantId: string,
  amount: number
): Promise<{ remaining: number; isExhausted: boolean }> {
  const supabase = createServiceClient();

  // Attempt atomic RPC first
  const { data: rpcData, error: rpcError } = await supabase.rpc('deduct_tokens', {
    p_merchant_id: merchantId,
    p_amount: amount,
  });

  if (!rpcError && rpcData !== null) {
    // RPC returns the new balance as a scalar
    const remaining = Math.max(0, rpcData as number);
    return { remaining, isExhausted: remaining <= 0 };
  }

  // --- Fallback: read-modify-write (not perfectly atomic) ---
  const currentBalance = await getTokenBalance(merchantId);
  const newBalance = Math.max(0, currentBalance - amount);
  const newUsed = Math.max(0, await _getTokenUsed(merchantId)) + amount;

  const { error: updateError } = await supabase
    .from('merchant_apps')
    .update({
      token_balance: newBalance,
      token_used: newUsed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', merchantId);

  if (updateError) {
    throw new Error(`deductTokens failed for ${merchantId}: ${updateError.message}`);
  }

  return { remaining: newBalance, isExhausted: newBalance <= 0 };
}

/**
 * Add tokens to the merchant's balance (e.g. after a paid top-up).
 */
export async function addTokens(merchantId: string, amount: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase.rpc('add_tokens', {
    p_merchant_id: merchantId,
    p_amount: amount,
  });

  if (!error) return; // RPC succeeded

  // Fallback: read-modify-write
  const currentBalance = await getTokenBalance(merchantId);
  const newBalance = currentBalance + amount;

  const { error: updateError } = await supabase
    .from('merchant_apps')
    .update({
      token_balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('id', merchantId);

  if (updateError) {
    throw new Error(`addTokens failed for ${merchantId}: ${updateError.message}`);
  }
}

// ============================================================
// HELPERS
// ============================================================

async function _getTokenUsed(merchantId: string): Promise<number> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('merchant_apps')
    .select('token_used')
    .eq('id', merchantId)
    .single();

  if (error || !data) return 0;
  return (data.token_used as number) ?? 0;
}
