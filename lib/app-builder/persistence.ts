/**
 * Freedom World App Builder — Persistence Layer
 * Sprint 1.4 — Vault Persistence + Session Storage
 *
 * Handles Supabase upserts/reads for merchant apps and sessions,
 * plus Git commit of vault files via Railway SSH.
 */

import { createServiceClient } from '../supabase/server';
import { sshExecCommand } from './railway';
import type { MerchantAppSpec, AppBuilderSession } from './types';

// ============================================================
// MERCHANT APP PERSISTENCE
// ============================================================

/**
 * Upsert a MerchantAppSpec to the `merchant_apps` table.
 *
 * Full spec is stored as JSONB in the `spec` column.
 * Key fields are promoted to indexed top-level columns for fast querying.
 *
 * Uses merchantId as the lookup key (matches `merchant_apps.id` UUID).
 */
export async function saveMerchantApp(
  merchantId: string,
  spec: MerchantAppSpec
): Promise<void> {
  const supabase = createServiceClient();

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('merchant_apps')
    .upsert(
      {
        id: merchantId,

        // ── Promoted indexed columns ──────────────────────
        slug: spec.slug,
        status: spec.status,
        app_type: spec.appType,
        business_name: spec.businessName ?? null,
        primary_language: spec.primaryLanguage,
        region: spec.region,

        // ── Freedom World identity ────────────────────────
        freedom_user_id: spec.freedomUserId ?? null,
        freedom_org_id: spec.freedomOrgId ?? null,
        freedom_community_id: spec.freedomCommunityId ?? null,

        // ── Infrastructure ────────────────────────────────
        railway_project_id: spec.railwayProjectId ?? null,
        railway_service_id: spec.railwayServiceId ?? null,
        github_repo_url: spec.githubRepoUrl ?? null,

        // ── Token economics ───────────────────────────────
        token_balance: spec.tokenBalance,
        token_used: spec.tokenUsed,

        // ── Production ───────────────────────────────────
        production_url: spec.productionUrl ?? null,
        deployed_at: spec.deployedAt ?? null,

        // ── Full JSONB spec ───────────────────────────────
        spec: spec as unknown as Record<string, unknown>,

        updated_at: now,
      },
      {
        onConflict: 'id',
      }
    );

  if (error) {
    throw new Error(`saveMerchantApp failed for ${merchantId}: ${error.message}`);
  }
}

/**
 * Load a MerchantAppSpec from Supabase by merchantId.
 * Returns null if the app doesn't exist yet.
 */
export async function loadMerchantApp(
  merchantId: string
): Promise<MerchantAppSpec | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('merchant_apps')
    .select('spec')
    .eq('id', merchantId)
    .single();

  if (error) {
    // Not found is a normal case — return null
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`loadMerchantApp failed for ${merchantId}: ${error.message}`);
  }

  if (!data?.spec) {
    return null;
  }

  return data.spec as unknown as MerchantAppSpec;
}

// ============================================================
// SESSION PERSISTENCE
// ============================================================

/**
 * Upsert a session record to the `app_builder_sessions` table.
 * Merges partial data — only the fields provided are written.
 */
export async function saveSession(
  sessionId: string,
  data: Partial<AppBuilderSession>
): Promise<void> {
  const supabase = createServiceClient();

  const now = new Date().toISOString();

  const row: Record<string, unknown> = {
    session_id: sessionId,
    last_active_at: now,
  };

  if (data.merchantId !== undefined) {
    row.merchant_id = data.merchantId;
  }
  if (data.phase !== undefined) {
    row.phase = data.phase;
  }
  if (data.funnelStage !== undefined) {
    row.funnel_stage = data.funnelStage;
  }
  if (data.startedAt !== undefined) {
    row.started_at = data.startedAt;
  }

  const { error } = await supabase
    .from('app_builder_sessions')
    .upsert(row, { onConflict: 'session_id' });

  if (error) {
    throw new Error(`saveSession failed for ${sessionId}: ${error.message}`);
  }
}

/**
 * Update only the phase and last_active_at for a session.
 * Lightweight update — avoids a full upsert when only phase changes.
 */
export async function updateSessionPhase(
  sessionId: string,
  phase: string
): Promise<void> {
  const supabase = createServiceClient();

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('app_builder_sessions')
    .update({
      phase,
      last_active_at: now,
    })
    .eq('session_id', sessionId);

  if (error) {
    throw new Error(
      `updateSessionPhase failed for session ${sessionId}: ${error.message}`
    );
  }
}

// ============================================================
// GIT VAULT COMMIT
// ============================================================

/**
 * Commit vault files inside the Railway container to Git and push.
 *
 * Runs inside the Railway service container via SSH:
 *   cd /workspace && git add context/ design/theme.json history/ && git commit -m "{msg}" && git push
 *
 * Idempotent: if there's nothing to commit, git will exit 1 (nothing to commit),
 * which we treat as a success (no-op).
 */
export async function commitVaultToGit(
  projectId: string,
  serviceId: string,
  commitMsg: string
): Promise<void> {
  // Sanitize commit message — strip shell-special chars to prevent injection
  const safeMsg = commitMsg
    .replace(/["`$\\]/g, '')
    .replace(/'/g, "''")
    .trim()
    .slice(0, 500); // reasonable length cap

  const cmd = [
    'cd /workspace',
    'git add context/ design/theme.json history/',
    `git commit -m '${safeMsg}'`,
    'git push',
  ].join(' && ');

  const result = await sshExecCommand(projectId, serviceId, cmd);

  // Exit code 1 from `git commit` usually means "nothing to commit" — not an error.
  if (result.exitCode !== 0) {
    const nothingToCommit =
      result.stdout.includes('nothing to commit') ||
      result.stderr.includes('nothing to commit');

    if (nothingToCommit) {
      // No changes since last commit — silently return
      return;
    }

    throw new Error(
      `commitVaultToGit failed (exit ${result.exitCode}):\nstdout: ${result.stdout}\nstderr: ${result.stderr}`
    );
  }
}
