import { NextRequest, NextResponse } from 'next/server';
import { createCommunity } from '@/lib/onboarding/community';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createCommunity(body);
    return NextResponse.json(result, { status: result.success ? 200 : 422 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Create community error:', err);
    return NextResponse.json({ success: false, error: err.message, errorType: 'server_error' }, { status: 500 });
  }
}
