import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lightweight URL probe (no auth needed)
async function probeUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function findSocialLinks(businessName: string) {
  const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const slugDash = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');

  const checks: Record<string, string[]> = {
    facebook: [
      `https://www.facebook.com/${slug}`,
      `https://www.facebook.com/${slugDash}`,
    ],
    instagram: [
      `https://www.instagram.com/${slug}`,
      `https://www.instagram.com/${slugDash}`,
    ],
  };

  const results: Record<string, string | null> = { facebook: null, instagram: null };
  await Promise.all(
    Object.entries(checks).map(async ([platform, urls]) => {
      for (const url of urls) {
        if (await probeUrl(url)) { results[platform] = url; break; }
      }
    })
  );
  return results;
}

export async function POST(req: NextRequest) {
  const { businessName, websiteUrl } = await req.json() as {
    businessName: string;
    websiteUrl?: string;
  };

  if (!businessName?.trim()) {
    return NextResponse.json({ error: 'businessName is required' }, { status: 400 });
  }

  const authToken = process.env.ANTHROPIC_AUTH_TOKEN;
  if (!anthropicKey) {
    return NextResponse.json({ error: 'AI research not configured' }, { status: 500 });
  }

  // Run social probes and AI research in parallel
  const [socialProbes, aiResult] = await Promise.all([
    findSocialLinks(businessName),
    (async () => {
      try {
        const anthropic = new Anthropic({ authToken, defaultHeaders: { 'anthropic-beta': 'oauth-2025-04-20' } });
        const prompt = `You are a business intelligence researcher for Freedom World, a loyalty & rewards platform in Thailand.

Research this prospect business and provide actionable BD intelligence:

**Business Name:** ${businessName}
${websiteUrl ? `**Website:** ${websiteUrl}` : ''}

Return ONLY valid JSON — no prose, no markdown fences:
{
  "website": "official website URL or null",
  "industry": "specific industry (e.g. 'Restaurant & Cafe', 'Beauty & Wellness', 'Retail Fashion')",
  "description": "2-3 sentence description of what they do, target customers, market position",
  "employee_estimate": "size estimate like '1-10' or '10-50' or null",
  "location_details": "specific Bangkok/Thailand area if inferrable, else null",
  "key_products": ["main products/services list"],
  "pain_points": ["3-5 business pain points a loyalty platform solves"],
  "monetization_opportunities": ["3-5 specific Freedom World monetization angles"],
  "bd_talking_points": ["5-6 specific talking points for a BD meeting with this merchant"],
  "social": {
    "facebook": "facebook URL if confidently known, else null",
    "instagram": "instagram URL if confidently known, else null",
    "line_oa": "LINE OA URL if confidently known, else null",
    "tiktok": "tiktok URL if confidently known, else null"
  }
}

Be specific and sales-strategic. Think like a BD consultant prepping for a pitch meeting.`;

        const msg = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
        });

        const text = msg.content.find((c) => c.type === 'text');
        if (!text || text.type !== 'text') return null;

        const jsonMatch = text.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('AI research error:', e);
        return null;
      }
    })(),
  ]);

  // Merge: social probes override AI guesses for fb/ig
  const research = {
    ...(aiResult ?? {}),
    social: {
      facebook: socialProbes.facebook || aiResult?.social?.facebook || null,
      instagram: socialProbes.instagram || aiResult?.social?.instagram || null,
      line_oa: aiResult?.social?.line_oa || null,
      tiktok: aiResult?.social?.tiktok || null,
    },
  };

  return NextResponse.json({ research });
}
