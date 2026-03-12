/**
 * Freedom World App Builder — Iteration Mode
 * Sprint 5.1 — Console "Edit My App" Iframe
 *
 * Manages iteration sessions: waking the builder service, loading vault context,
 * and committing + stopping at the end.
 */

import { loadMerchantApp, saveMerchantApp, commitVaultToGit } from './persistence';
import {
  restartBuilderService,
  waitForServiceReady,
  getServiceDevUrl,
  stopBuilderService,
} from './railway';
import type { MerchantAppSpec } from './types';

// ============================================================
// START ITERATION SESSION
// ============================================================

/**
 * Wakes the merchant's Railway builder service and returns the dev URL.
 *
 * Steps:
 *   1. Load existing MerchantAppSpec from Supabase
 *   2. Restart the Railway service (may be in `sleep infinity` / stopped state)
 *   3. Wait for the dev server to become responsive (up to 30 seconds)
 *   4. Resolve the service's dev URL
 *   5. Update spec status → 'iterating'
 *   6. Persist updated spec
 *   7. Return { devUrl, spec }
 *
 * @throws if the spec doesn't exist or lacks Railway IDs
 * @throws if the service fails to become ready within 30 s
 */
export async function startIterationSession(
  merchantId: string
): Promise<{ devUrl: string; spec: MerchantAppSpec }> {
  // 1. Load existing spec
  const spec = await loadMerchantApp(merchantId);
  if (!spec) {
    throw new Error(`No app found for merchant ${merchantId}`);
  }

  const { railwayServiceId } = spec;
  if (!railwayServiceId) {
    throw new Error(
      `Merchant ${merchantId} has no Railway service ID — provisioning may not have completed`
    );
  }

  // 2. Restart builder service (resets start command to `npm run dev` + redeploys)
  await restartBuilderService(railwayServiceId);

  // 3. Wait for dev server to be ready (30 second timeout)
  const ready = await waitForServiceReady(railwayServiceId, 30_000);
  if (!ready) {
    throw new Error(
      `Builder service for merchant ${merchantId} did not become ready within 30 seconds`
    );
  }

  // 4. Get the service's public dev URL
  const devUrl = await getServiceDevUrl(railwayServiceId);

  // 5. Update spec: mark as iterating
  const updatedSpec: MerchantAppSpec = {
    ...spec,
    status: 'iterating',
    updatedAt: new Date().toISOString(),
  };

  // 6. Persist
  await saveMerchantApp(merchantId, updatedSpec);

  // 7. Return
  return { devUrl, spec: updatedSpec };
}

// ============================================================
// END ITERATION SESSION
// ============================================================

/**
 * Commits vault changes to Git, stops the builder service, and marks the
 * spec as 'deployed'.
 *
 * Steps:
 *   1. Load existing spec
 *   2. Commit vault files inside Railway container → Git push
 *   3. Stop the builder service (sets start command to `sleep infinity`)
 *   4. Update spec status → 'deployed'
 *   5. Persist updated spec
 *
 * @throws if the spec doesn't exist or lacks Railway IDs
 */
export async function endIterationSession(merchantId: string): Promise<void> {
  // 1. Load existing spec
  const spec = await loadMerchantApp(merchantId);
  if (!spec) {
    throw new Error(`No app found for merchant ${merchantId}`);
  }

  const { railwayProjectId, railwayServiceId } = spec;
  if (!railwayProjectId || !railwayServiceId) {
    throw new Error(
      `Merchant ${merchantId} is missing Railway project/service IDs`
    );
  }

  // 2. Commit vault files to Git (idempotent: no-op if nothing changed)
  await commitVaultToGit(
    railwayProjectId,
    railwayServiceId,
    'iteration: save changes'
  );

  // 3. Stop the builder service
  await stopBuilderService(railwayServiceId);

  // 4 & 5. Update spec → 'deployed' and persist
  const updatedSpec: MerchantAppSpec = {
    ...spec,
    status: 'deployed',
    updatedAt: new Date().toISOString(),
  };
  await saveMerchantApp(merchantId, updatedSpec);
}
