/**
 * POST /api/apps/stop-vm
 * Sprint 5.1 — Console "Edit My App" Iframe
 *
 * Commits vault changes to Git, stops the Railway builder service,
 * and marks the merchant's spec as 'deployed'.
 *
 * Also used by the inactivity timeout (Sprint 7.3) to stop idle VMs.
 *
 * Body:     { merchantId: string }
 * Response: { success: true }
 * Error:    { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { endIterationSession } from '@/lib/app-builder/iteration';

export const maxDuration = 60; // Git commit + Railway stop can take up to ~30 s

interface StopVMBody {
  merchantId: string;
}

export async function POST(request: NextRequest) {
  let body: StopVMBody;

  try {
    body = (await request.json()) as StopVMBody;
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

  try {
    await endIterationSession(merchantId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[POST /api/apps/stop-vm]', message);

    if (message.includes('No app found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json(
      { error: `Failed to stop VM: ${message}` },
      { status: 500 }
    );
  }
}
