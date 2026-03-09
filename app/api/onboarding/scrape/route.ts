import { NextRequest, NextResponse } from 'next/server';
import { scrapeBrandContext } from '@/lib/onboarding/scraper';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/utils/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Rate limit: 5 scrapes per minute per IP
  const ip = getClientIp(req);
  const rl = rateLimit(`${ip}:scrape`, { limit: 5, windowMs: 60_000 });
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    if (url.length > 500) {
      return NextResponse.json({ error: 'URL too long' }, { status: 400 });
    }

    const result = await scrapeBrandContext(url);
    return NextResponse.json({ success: !result.error, ...result });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Scrape error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
