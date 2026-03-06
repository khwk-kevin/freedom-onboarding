import { NextRequest, NextResponse } from 'next/server';
import { generateLandingPageContent } from '@/lib/onboarding/landing-gen';
import type { CommunityData } from '@/types/onboarding';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { communityData } = body as { communityData: Partial<CommunityData> };

    if (!communityData) {
      return NextResponse.json({ error: 'communityData required' }, { status: 400 });
    }

    const result = await generateLandingPageContent(communityData);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Generate landing error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
