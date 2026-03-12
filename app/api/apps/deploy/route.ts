/**
 * POST /api/apps/deploy
 *
 * Triggers the production deploy flow for a merchant app ("Go live").
 *
 * Body:    { merchantId: string }
 * Success: { productionUrl: string }
 * Error:   { error: string, buildLogs?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadMerchantApp } from '@/lib/app-builder/persistence';
import { deployMerchantApp } from '@/lib/app-builder/deploy';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { merchantId?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { merchantId } = body;

  if (!merchantId || typeof merchantId !== 'string') {
    return NextResponse.json(
      { error: 'merchantId is required' },
      { status: 400 }
    );
  }

  // Load spec from Supabase
  let spec;
  try {
    spec = await loadMerchantApp(merchantId);
  } catch (err) {
    console.error('[deploy route] loadMerchantApp error:', err);
    return NextResponse.json(
      { error: 'Failed to load merchant app' },
      { status: 500 }
    );
  }

  if (!spec) {
    return NextResponse.json(
      { error: `No app found for merchantId: ${merchantId}` },
      { status: 404 }
    );
  }

  // Guard: prevent re-deploying an already-deployed app without explicit force flag
  if (spec.status === 'deployed') {
    return NextResponse.json(
      {
        error: 'App is already deployed',
        productionUrl: spec.productionUrl,
      },
      { status: 409 }
    );
  }

  // Run the deploy
  let result;
  try {
    result = await deployMerchantApp(merchantId, spec);
  } catch (err) {
    console.error('[deploy route] deployMerchantApp threw:', err);
    return NextResponse.json(
      { error: 'Deploy failed unexpectedly', buildLogs: String(err) },
      { status: 500 }
    );
  }

  if ('error' in result) {
    return NextResponse.json(
      { error: result.error, buildLogs: result.buildLogs },
      { status: 422 }
    );
  }

  return NextResponse.json({ productionUrl: result.productionUrl });
}
