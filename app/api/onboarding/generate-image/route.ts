import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/onboarding/image-gen';
import type { CommunityData } from '@/types/onboarding';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, communityData } = body as {
      type: 'logo' | 'banner';
      communityData: Partial<CommunityData>;
    };

    if (!type || !['logo', 'banner'].includes(type)) {
      return NextResponse.json({ error: 'type must be logo or banner' }, { status: 400 });
    }

    const result = await generateImage({ type, communityData });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Generate image error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
