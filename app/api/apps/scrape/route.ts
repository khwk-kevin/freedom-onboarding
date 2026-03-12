/**
 * POST /api/apps/scrape
 *
 * Scrapes a URL and returns the scraped fields mapped to a partial MerchantAppSpec.
 * Does NOT persist anything — caller is responsible for merging with existing spec.
 *
 * Used by the interview pipeline when the user provides a Google Maps URL or website
 * during Q2. The response is merged into the session's MerchantAppSpec by the caller,
 * and a build task is dispatched with trigger 'scrape_complete'.
 *
 * Body:   { url: string, merchantId: string }
 * Response: { spec: Partial<MerchantAppSpec> }
 * Errors:   { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapeToSpec } from '@/lib/app-builder/scraper-adapter';
import { MerchantAppSpec } from '@/lib/app-builder/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Scraping + Places API can take up to 30s

interface ScrapeRequestBody {
  url: string;
  merchantId: string;
}

interface ScrapeResponse {
  spec: Partial<MerchantAppSpec>;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

/**
 * Minimal stub spec used as the base for scrapeToSpec.
 * Only the fields scrapeToSpec might update are returned in the response.
 */
function createStubSpec(merchantId: string): MerchantAppSpec {
  return {
    id: merchantId,
    slug: '',
    region: process.env.RAILWAY_REGION ?? 'ap-southeast-1',
    appType: 'business',
    primaryLanguage: 'en',
    tokenBalance: 0,
    tokenUsed: 0,
    status: 'interviewing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Extracts only the scraped fields from a spec, omitting stub/infrastructure fields.
 * This is what we return to the client — just the data the scraper populated.
 */
function extractScrapedFields(spec: MerchantAppSpec): Partial<MerchantAppSpec> {
  const scraped: Partial<MerchantAppSpec> = {};

  if (spec.businessName !== undefined) scraped.businessName = spec.businessName;
  if (spec.scrapedData !== undefined) scraped.scrapedData = spec.scrapedData;
  if (spec.businessType !== undefined) scraped.businessType = spec.businessType;
  if (spec.category !== undefined) scraped.category = spec.category;

  return scraped;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ScrapeResponse | ErrorResponse>> {
  let body: ScrapeRequestBody;

  try {
    body = (await request.json()) as ScrapeRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { url, merchantId } = body;

  // ── Validate inputs ────────────────────────────────────────────────────────
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return NextResponse.json(
      { error: 'url is required' },
      { status: 400 }
    );
  }

  if (!merchantId || typeof merchantId !== 'string') {
    return NextResponse.json(
      { error: 'merchantId is required' },
      { status: 400 }
    );
  }

  if (url.length > 500) {
    return NextResponse.json(
      { error: 'URL too long (max 500 characters)' },
      { status: 400 }
    );
  }

  // ── Scrape ─────────────────────────────────────────────────────────────────
  try {
    console.log(
      `[apps/scrape] Scraping for merchant=${merchantId} url=${url.slice(0, 80)}`
    );

    const stubSpec = createStubSpec(merchantId);
    const updatedSpec = await scrapeToSpec(url.trim(), stubSpec);

    // Return only the scraped fields (not infra stubs)
    const scrapedFields = extractScrapedFields(updatedSpec);

    console.log(
      `[apps/scrape] Done. businessName=${scrapedFields.businessName ?? '(none)'} ` +
        `photos=${scrapedFields.scrapedData?.photos?.length ?? 0}`
    );

    return NextResponse.json({ spec: scrapedFields }, { status: 200 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[apps/scrape] Error:', error.message);

    return NextResponse.json(
      {
        error: 'Scrape failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
