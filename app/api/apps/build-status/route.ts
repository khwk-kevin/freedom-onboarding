/**
 * GET /api/apps/build-status?merchantId=xxx
 *
 * Returns the current queue status for a merchant.
 * Response: { isBuilding: boolean, queueDepth: number, lastTaskResult?: BuildResult }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQueueStatus } from '@/lib/app-builder/build-dispatcher';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const merchantId = searchParams.get('merchantId');

  if (!merchantId) {
    return NextResponse.json(
      { success: false, error: 'merchantId query param is required' },
      { status: 400 }
    );
  }

  const status = getQueueStatus(merchantId);

  return NextResponse.json({
    isBuilding: status.isBuilding,
    queueDepth: status.queueDepth,
    currentTask: status.currentTask,
    lastTaskResult: status.lastTaskResult ?? null,
  });
}
