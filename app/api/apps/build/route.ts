/**
 * POST /api/apps/build
 *
 * Enqueues a build task for a merchant.
 * Body: { merchantId: string, trigger: BuildTrigger, adHocMessage?: string }
 * Response: { success: boolean, taskId: string }
 *
 * NOTE: This route looks up the merchant's MerchantAppSpec from the DB.
 * For now it expects the spec to be passed in the request body during
 * early integration. A follow-up sprint will replace this with a DB lookup.
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { BuildTrigger, MerchantAppSpec } from '@/lib/app-builder/types';
import { enqueueBuildTask } from '@/lib/app-builder/build-dispatcher';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: {
    merchantId?: string;
    trigger?: BuildTrigger;
    adHocMessage?: string;
    spec?: MerchantAppSpec;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { merchantId, trigger, adHocMessage, spec } = body;

  if (!merchantId || typeof merchantId !== 'string') {
    return NextResponse.json(
      { success: false, error: 'merchantId is required' },
      { status: 400 }
    );
  }

  if (!trigger || typeof trigger !== 'string') {
    return NextResponse.json(
      { success: false, error: 'trigger is required' },
      { status: 400 }
    );
  }

  if (!spec) {
    return NextResponse.json(
      { success: false, error: 'spec is required (MerchantAppSpec)' },
      { status: 400 }
    );
  }

  const taskId = randomUUID();

  // Enqueue asynchronously — do not await (returns immediately to client)
  enqueueBuildTask(merchantId, trigger as BuildTrigger, spec, adHocMessage).catch(
    (err) => {
      console.error(`[BuildDispatcher] Task ${taskId} failed:`, err);
    }
  );

  return NextResponse.json({ success: true, taskId }, { status: 202 });
}
