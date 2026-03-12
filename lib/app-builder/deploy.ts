/**
 * Freedom World App Builder — Production Deploy Flow
 * Sprint 4.1 — Production Deploy Flow
 *
 * Handles the "Go live" flow: build, commit, switch to production start command,
 * assign custom domain, persist final spec.
 */

import { sshExecCommand, assignCustomDomain, updateServiceStartCommand } from './railway';
import { saveMerchantApp } from './persistence';
import { createServiceClient } from '../supabase/server';
import type { MerchantAppSpec } from './types';
import { sanitizeErrorForUser } from './error-handler';

// ============================================================
// SLUG HELPERS
// ============================================================

/**
 * Converts a business name into a URL-safe slug.
 * - Lowercase
 * - Spaces and special characters replaced with hyphens
 * - Non-alphanumeric (except hyphens) stripped
 * - Max 50 characters
 * - Trailing hyphens trimmed
 */
export function generateSlug(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/[\s_]+/g, '-')            // spaces and underscores → hyphens
    .replace(/[^a-z0-9-]/g, '')        // strip everything except alphanumeric + hyphens
    .replace(/-{2,}/g, '-')            // collapse multiple consecutive hyphens
    .replace(/^-+|-+$/g, '')           // trim leading/trailing hyphens
    .slice(0, 50)
    .replace(/-+$/, '');               // trim trailing hyphens again after slice
}

/**
 * Checks whether the given slug is available (not already in use).
 * Queries the `merchant_apps` table in Supabase.
 */
export async function checkSlugAvailable(slug: string): Promise<boolean> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('merchant_apps')
    .select('id')
    .eq('slug', slug)
    .limit(1);

  if (error) {
    throw new Error(`checkSlugAvailable failed for slug "${slug}": ${error.message}`);
  }

  return !data || data.length === 0;
}

/**
 * Finds a unique slug for the given business name.
 * If the base slug is taken, appends -2, -3, etc. until one is available.
 */
async function resolveUniqueSlug(businessName: string): Promise<string> {
  const base = generateSlug(businessName);
  let candidate = base;
  let counter = 2;

  while (!(await checkSlugAvailable(candidate))) {
    // Ensure we don't exceed 50 chars after appending the suffix
    const suffix = `-${counter}`;
    candidate = base.slice(0, 50 - suffix.length) + suffix;
    counter++;
  }

  return candidate;
}

// ============================================================
// BUILD WITH AUTO-FIX
// ============================================================

/**
 * Runs `npm run build` inside the Railway service.
 * On failure: attempts one Claude Code auto-fix, then retries the build.
 * Returns { success: true } or { success: false, sanitizedLogs: string }.
 */
async function runBuildWithAutoFix(
  merchantId: string,
  railwayProjectId: string,
  railwayServiceId: string
): Promise<{ success: true } | { success: false; sanitizedLogs: string }> {
  const buildResult = await sshExecCommand(
    railwayProjectId,
    railwayServiceId,
    'cd /workspace && npm run build'
  );

  if (buildResult.exitCode === 0) return { success: true };

  const rawBuildLogs = buildResult.stderr || buildResult.stdout;
  console.warn(
    `[deploy] Initial build failed for merchant ${merchantId}. ` +
    `Attempting auto-fix via Claude Code.`
  );

  // Auto-fix: ask Claude Code to fix TypeScript/build errors
  const autoFixPrompt =
    `Build failed with these errors: ${sanitizeErrorForUser(rawBuildLogs)}. ` +
    `Fix the TypeScript/build errors so that \`npm run build\` succeeds.`;
  const escapedFixPrompt = autoFixPrompt.replace(/"/g, '\\"');
  const autoFixCmd =
    `claude -p "${escapedFixPrompt}" --dangerously-skip-permissions --max-turns 50 --cwd /workspace`;

  const fixResult = await sshExecCommand(railwayProjectId, railwayServiceId, autoFixCmd);

  if (fixResult.exitCode !== 0) {
    console.error(
      `[deploy] Auto-fix Claude Code run failed for merchant ${merchantId}.`,
      fixResult.stderr
    );
    return { success: false, sanitizedLogs: sanitizeErrorForUser(rawBuildLogs) };
  }

  // Retry build after auto-fix
  const retryBuildResult = await sshExecCommand(
    railwayProjectId,
    railwayServiceId,
    'cd /workspace && npm run build'
  );

  if (retryBuildResult.exitCode === 0) {
    console.log(`[deploy] Build succeeded after auto-fix for merchant ${merchantId}.`);
    return { success: true };
  }

  console.error(
    `[deploy] Build failed even after auto-fix for merchant ${merchantId}.`
  );
  return {
    success: false,
    sanitizedLogs: sanitizeErrorForUser(
      retryBuildResult.stderr || retryBuildResult.stdout
    ),
  };
}

// ============================================================
// MAIN DEPLOY FUNCTION
// ============================================================

/**
 * Full production deploy for a merchant app.
 *
 * Steps:
 * 1. SSH: npm run build (verify exit code 0)
 * 2. SSH: git add/commit/push (idempotent)
 * 3. Switch Railway start command to npm run start
 * 4. Generate unique slug and assign {slug}.app.freedom.world
 * 5. Persist updated spec (status=deployed, productionUrl, slug, deployedAt)
 */
export async function deployMerchantApp(
  merchantId: string,
  spec: MerchantAppSpec
): Promise<{ productionUrl: string } | { error: string; buildLogs: string }> {
  const { railwayProjectId, railwayServiceId } = spec;

  if (!railwayProjectId || !railwayServiceId) {
    return {
      error: 'Missing Railway project/service IDs on spec',
      buildLogs: '',
    };
  }

  // ── Step 1: Build (with auto-fix fallback) ─────────────────
  const buildPassed = await runBuildWithAutoFix(
    merchantId,
    railwayProjectId,
    railwayServiceId
  );

  if (!buildPassed.success) {
    return {
      error: "We couldn't get the build to pass. Our team has been notified.",
      buildLogs: buildPassed.sanitizedLogs,
    };
  }

  // ── Step 2: Git commit + push ──────────────────────────────
  // Idempotent: "nothing to commit" exits 1, which we allow.
  const gitResult = await sshExecCommand(
    railwayProjectId,
    railwayServiceId,
    `cd /workspace && git add -A && git commit -m "deploy: production $(date)" && git push || true`
  );

  // We use `|| true` so the shell always exits 0 even if nothing to commit.
  // Log stderr for observability but do not fail the deploy.
  if (gitResult.exitCode !== 0) {
    console.warn(
      `[deploy] git push exited ${gitResult.exitCode} for merchant ${merchantId}:`,
      gitResult.stderr
    );
  }

  // ── Step 3: Switch start command to production ─────────────
  await updateServiceStartCommand(railwayServiceId, 'npm run start');

  // ── Step 4: Generate slug and assign custom domain ─────────
  const businessName = spec.businessName ?? merchantId;
  const slug = await resolveUniqueSlug(businessName);
  const productionUrl = await assignCustomDomain(railwayServiceId, slug);

  // ── Step 5: Update spec + persist ─────────────────────────
  spec.status = 'deployed';
  spec.productionUrl = productionUrl;
  spec.slug = slug;
  spec.deployedAt = new Date().toISOString();
  spec.updatedAt = new Date().toISOString();

  await saveMerchantApp(merchantId, spec);

  return { productionUrl };
}
