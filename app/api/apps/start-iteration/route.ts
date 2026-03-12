/**
 * POST /api/apps/start-iteration
 * Sprint 5.1 — Console "Edit My App" Iframe
 *
 * Wakes the merchant's Railway builder service and returns the dev URL
 * for the iframe + current token balance.
 *
 * Body:   { merchantId: string }
 * Response: { devUrl: string, tokenBalance: number }
 * Error:  { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { startIterationSession } from '@/lib/app-builder/iteration';

export const maxDuration = 60; // Up to 60 s — service wake can take ~20 s

interface StartIterationBody {
  merchantId: string;
}

export async function POST(request: NextRequest) {
  let body: StartIterationBody;

  try {
    body = (await request.json()) as StartIterationBody;
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
    const { devUrl, spec } = await startIterationSession(merchantId);

    return NextResponse.json({
      devUrl,
      tokenBalance: spec.tokenBalance,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[POST /api/apps/start-iteration]', message);

    // Distinguish 404 (no spec) from 500 (infra error)
    if (message.includes('No app found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json(
      { error: `Failed to start iteration session: ${message}` },
      { status: 500 }
    );
  }
}
