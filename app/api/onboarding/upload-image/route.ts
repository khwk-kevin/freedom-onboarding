import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/onboarding/community';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    const type = formData.get('type') as 'logo' | 'banner' | null;

    if (!file) {
      return NextResponse.json({ error: 'image file required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadImage(buffer, file.type, type || 'logo');
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Upload image error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
