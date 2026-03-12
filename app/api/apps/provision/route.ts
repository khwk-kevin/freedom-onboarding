/**
 * POST /api/apps/provision
 *
 * Provisions a GitHub repo + Railway project/service for a merchant.
 *
 * Full flow:
 *   1. createMerchantRepo  → GitHub repo from template (fw-app-{merchantId})
 *   2. createMerchantProject → Railway project + service (linked to the GitHub repo)
 *
 * Body: { merchantId: string, category?: string }
 * Response: { projectId, serviceId, devUrl, repoUrl, cloneUrl }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  createMerchantProject,
  getServiceDevUrl,
} from '@/lib/app-builder/railway';
import {
  createMerchantRepo,
  repoExists,
} from '@/lib/app-builder/github';

export const maxDuration = 60; // 60 second timeout (Railway provisioning ~12s)

interface ProvisionRequestBody {
  merchantId: string;
  category?: string;
}

interface ProvisionResponse {
  projectId: string;
  serviceId: string;
  devUrl: string;
  repoUrl: string;
  cloneUrl: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ProvisionResponse | ErrorResponse>> {
  try {
    // Parse request body
    const body = (await request.json()) as ProvisionRequestBody;
    const { merchantId, category = 'unknown' } = body;

    if (!merchantId || typeof merchantId !== 'string') {
      return NextResponse.json(
        { error: 'merchantId is required and must be a string' },
        { status: 400 }
      );
    }

    // Sanitize merchantId — only allow alphanumeric, hyphens, underscores
    const safeId = merchantId.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 50);
    if (safeId !== merchantId) {
      console.warn(
        `[provision] merchantId sanitized: "${merchantId}" → "${safeId}"`
      );
    }

    console.log(
      `[provision] Provisioning for merchant: ${safeId} (category: ${category})`
    );

    // ── Step 1: Create GitHub repo from template ───────────────────────────

    // Guard: skip if repo already exists (idempotent re-provision)
    const alreadyExists = await repoExists(safeId);
    let repoUrl = '';
    let cloneUrl = '';

    if (alreadyExists) {
      console.warn(
        `[provision] Repo already exists for ${safeId} — skipping GitHub creation`
      );
      // Reconstruct the expected URLs
      const org = process.env.GITHUB_ORG ?? 'freedom-world';
      const name = `fw-app-${safeId}`;
      repoUrl = `https://github.com/${org}/${name}`;
      cloneUrl = `https://github.com/${org}/${name}.git`;
    } else {
      const repoResult = await createMerchantRepo(safeId, category);
      repoUrl = repoResult.repoUrl;
      cloneUrl = repoResult.cloneUrl;
      console.log(`[provision] GitHub repo created: ${repoUrl}`);
    }

    // ── Step 2: Create Railway project + service (links to GitHub repo) ────

    console.log(`[provision] Creating Railway project for merchant: ${safeId}`);
    const { projectId, serviceId } = await createMerchantProject(safeId);
    console.log(
      `[provision] Created project=${projectId} service=${serviceId}`
    );

    // ── Step 3: Get dev URL (best-effort, non-blocking) ───────────────────

    let devUrl = '';
    try {
      // Give Railway a moment to assign a domain
      await new Promise((resolve) => setTimeout(resolve, 5000));
      devUrl = await getServiceDevUrl(serviceId);
    } catch (err) {
      // Domain may not be ready yet — client can poll /api/apps/vm-status
      console.warn(
        `[provision] Domain not yet available for service ${serviceId}:`,
        err
      );
    }

    // ── Step 4: Persist to Supabase ──────────────────────────────────────
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
      );
      await supabase.from('merchant_apps').upsert({
        slug: safeId,
        status: 'provisioned',
        app_type: category ?? 'business',
        railway_project_id: projectId,
        railway_service_id: serviceId,
        github_repo_url: repoUrl,
        token_balance: 1000,
        token_used: 0,
        region: process.env.RAILWAY_REGION ?? 'asia-southeast1',
      }, { onConflict: 'slug' });
    } catch (dbErr) {
      console.warn('[provision] DB write failed (non-fatal):', dbErr);
    }

    return NextResponse.json(
      {
        projectId,
        serviceId,
        devUrl,
        repoUrl,
        cloneUrl,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[provision] Error:', error.message);

    return NextResponse.json(
      {
        error: 'Failed to provision app infrastructure',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
