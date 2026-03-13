import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

interface EnrichmentResult {
  type: 'enrichment';
  enriched_at: string;
  source: string;
  query: string;
  website: string | null;
  social: {
    facebook: string | null;
    instagram: string | null;
    line_oa: string | null;
    twitter: string | null;
    tiktok: string | null;
    youtube: string | null;
  };
  google_maps: string | null;
  industry: string | null;
  description: string | null;
  employee_estimate: string | null;
  location_details: string | null;
  key_products: string[];
  competitive_landscape: string | null;
  pain_points: string[];
  monetization_opportunities: string[];
  recent_news: string[];
  bd_talking_points: string[];
}

async function probeUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function findSocialLinks(businessName: string): Promise<Record<string, string | null>> {
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

  const results: Record<string, string | null> = {};

  for (const [platform, urls] of Object.entries(checks)) {
    results[platform] = null;
    for (const url of urls) {
      const exists = await probeUrl(url);
      if (exists) {
        results[platform] = url;
        break;
      }
    }
  }

  return results;
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const body = await req.json();
  const { merchantId, businessName } = body as { merchantId: string; businessName: string };

  if (!merchantId || !businessName) {
    return NextResponse.json({ error: 'Missing merchantId or businessName' }, { status: 400 });
  }

  // Fetch current merchant
  const { data: merchant, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('id', merchantId)
    .single();

  if (error || !merchant) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
  }

  // Extract existing Pipedrive data for context
  const notes = Array.isArray(merchant.notes) ? merchant.notes : [];
  const pipedriveNote = notes.find((n: Record<string, unknown>) => n.type === 'pipedrive_import') as Record<string, unknown> | undefined;
  const contactPerson = pipedriveNote?.contact_person || 'Unknown';
  const pipedriveLabel = pipedriveNote?.pipedrive_label || 'Unknown';
  const pipedriveStage = pipedriveNote?.pipedrive_stage || 'Unknown';

  // 1. Try to find social media links by probing common URLs
  const socialProbes = await findSocialLinks(businessName);

  // 2. Use Claude to research and analyze the business
  let aiResearch: Partial<EnrichmentResult> = {};

  const anthropicKey = process.env.ANTHROPIC_OAUTH_TOKEN || process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const anthropic = new Anthropic({ apiKey: anthropicKey });

      const prompt = `You are a business intelligence researcher for a BD (Business Development) team at Freedom World, a loyalty and rewards platform in Thailand.

Research this merchant and provide actionable intelligence:

**Business Name:** ${businessName}
**Contact Person:** ${contactPerson}
**Category:** ${pipedriveLabel}
**Current Stage:** ${pipedriveStage}
**Location:** ${merchant.location || 'Thailand (unknown city)'}
**Business Type:** ${merchant.business_type || 'Unknown'}

Based on your knowledge, provide the following in JSON format ONLY (no other text):
{
  "website": "likely official website URL or null",
  "industry": "specific industry category (e.g., 'Restaurant & Cafe', 'Beauty & Wellness', 'Crypto & Web3', 'Retail Fashion', 'Food & Beverage', 'Technology', 'Education', etc.)",
  "description": "2-3 sentence description of what this business likely does, target customers, and market position",
  "employee_estimate": "estimated range like '1-10', '10-50', '50-200', or null if unknown",
  "location_details": "specific area/neighborhood in Thailand if known, or null",
  "key_products": ["list of main products or services they likely offer"],
  "competitive_landscape": "brief note on their competitive position and main competitors",
  "pain_points": ["3-5 likely business pain points this type of business faces that a loyalty/rewards platform could solve"],
  "monetization_opportunities": ["3-5 specific ways Freedom World could help monetize or grow this merchant"],
  "bd_talking_points": ["4-6 specific talking points the BD team should use when engaging this merchant, tailored to their business type and stage"],
  "recent_news": ["any notable recent developments if known, otherwise empty array"]
}

Be specific and actionable. The BD team needs to walk into a meeting and sound like they deeply understand this merchant's business. If you're not sure about something, make an educated guess based on the business name and category rather than returning null. Think like a sales strategist.`;

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = message.content.find((c) => c.type === 'text');
      if (textContent && textContent.type === 'text') {
        // Extract JSON from response
        const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiResearch = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (err) {
      console.error('AI enrichment error:', err);
    }
  }

  // 3. Build final enrichment data
  const enrichmentData: EnrichmentResult = {
    type: 'enrichment',
    enriched_at: new Date().toISOString(),
    source: anthropicKey ? 'ai_research' : 'probe_only',
    query: businessName,
    website: (aiResearch.website as string) || null,
    social: {
      facebook: socialProbes.facebook || null,
      instagram: socialProbes.instagram || null,
      line_oa: null,
      twitter: null,
      tiktok: null,
      youtube: null,
    },
    google_maps: `https://www.google.com/maps/search/${encodeURIComponent(businessName + ' Thailand')}`,
    industry: (aiResearch.industry as string) || null,
    description: (aiResearch.description as string) || null,
    employee_estimate: (aiResearch.employee_estimate as string) || null,
    location_details: (aiResearch.location_details as string) || null,
    key_products: (aiResearch.key_products as string[]) || [],
    competitive_landscape: (aiResearch.competitive_landscape as string) || null,
    pain_points: (aiResearch.pain_points as string[]) || [],
    monetization_opportunities: (aiResearch.monetization_opportunities as string[]) || [],
    recent_news: (aiResearch.recent_news as string[]) || [],
    bd_talking_points: (aiResearch.bd_talking_points as string[]) || [],
  };

  // 4. Save to merchant notes
  const existingNotes: Array<Record<string, unknown>> = Array.isArray(merchant.notes)
    ? (merchant.notes as Array<Record<string, unknown>>)
    : [];
  const filteredNotes = existingNotes.filter((n) => n.type !== 'enrichment');
  const newNotes = [...filteredNotes, enrichmentData];

  const updates: Record<string, unknown> = { notes: newNotes };

  // Auto-fill empty merchant fields with researched data
  if (enrichmentData.description && !merchant.business_description) {
    updates.business_description = enrichmentData.description;
  }
  if (enrichmentData.location_details && !merchant.location) {
    updates.location = enrichmentData.location_details;
  }
  if (enrichmentData.industry && !merchant.business_type) {
    updates.business_type = enrichmentData.industry;
  }
  if (enrichmentData.website && !merchant.website_url) {
    updates.website_url = enrichmentData.website;
  }

  const { data: updated, error: updateError } = await supabase
    .from('merchants')
    .update(updates)
    .eq('id', merchantId)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ merchant: updated, enrichment: enrichmentData });
}
