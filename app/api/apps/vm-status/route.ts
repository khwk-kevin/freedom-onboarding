/**
 * GET /api/apps/vm-status?serviceId={serviceId}
 *
 * Checks the current status of a Railway builder service.
 * Polls until the dev server is accessible (HTTP reachable).
 *
 * Query params: serviceId (required)
 * Response: { status: 'starting' | 'ready' | 'error', devUrl?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceDevUrl, waitForServiceReady } from '@/lib/app-builder/railway';

export const maxDuration = 30; // 30 second timeout for status check

type VMStatus = 'starting' | 'ready' | 'error';

interface VMStatusResponse {
  status: VMStatus;
  devUrl?: string;
  message?: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<VMStatusResponse | ErrorResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    if (!serviceId) {
      return NextResponse.json(
        { error: 'serviceId query parameter is required' },
        { status: 400 }
      );
    }

    // 1. Try to get the dev URL
    let devUrl: string;
    try {
      devUrl = await getServiceDevUrl(serviceId);
    } catch {
      // Service domain not yet assigned — still starting
      return NextResponse.json({
        status: 'starting',
        message: 'Service domain not yet available',
      });
    }

    // 2. Check if the service is actually responding (quick probe, 8s timeout)
    const isReady = await waitForServiceReady(serviceId, 8000);

    if (isReady) {
      return NextResponse.json({
        status: 'ready',
        devUrl,
      });
    }

    // 3. Domain exists but service not yet responding — still starting
    return NextResponse.json({
      status: 'starting',
      devUrl,
      message: 'Dev server starting...',
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[vm-status] Error:', error.message);

    // Distinguish timeout vs. actual error
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Service timed out',
        },
        { status: 200 } // Return 200 so client can interpret the status field
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to check service status',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
