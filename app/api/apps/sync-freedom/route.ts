/**
 * POST /api/apps/sync-freedom
 *
 * Creates/syncs a Freedom community after a merchant app is deployed.
 *
 * Body:    { merchantId: string }
 * Success: { orgId: string, communityId: string }
 * Error:   { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadMerchantApp } from '@/lib/app-builder/persistence';
import { syncToFreedom } from '@/lib/app-builder/freedom-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { merchantId?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
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
    console.error('[sync-freedom] loadMerchantApp error:', err);
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

  // Run the Freedom sync
  try {
    const { orgId, communityId } = await syncToFreedom(spec);
    return NextResponse.json({ orgId, communityId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[sync-freedom] syncToFreedom error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
