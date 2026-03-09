// Google Maps Place Scraper — no API key needed
// Uses server-side fetch + HTML parsing to extract business data

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface GooglePlaceData {
  source: 'google_maps';
  url: string;
  businessName?: string;
  category?: string;
  rating?: string;
  reviewCount?: string;
  address?: string;
  phone?: string;
  website?: string;
  hours?: string;
  description?: string;
  priceLevel?: string;
  imageUrls?: string[];
  products?: string[];
  vibe?: string;
  error?: string;
}

// Detect if URL is a Google Maps link
export function isGoogleMapsUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes('google.com/maps') || lower.includes('maps.google') || lower.includes('goo.gl/maps');
}

// Build Google Maps search URL
function buildSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
}

// Extract place ID from Google Maps URL
function extractSearchQuery(url: string): string | null {
  // Handle various Google Maps URL formats
  // google.com/maps/place/Business+Name/...
  const placeMatch = url.match(/\/maps\/place\/([^/@]+)/);
  if (placeMatch) return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
  
  // google.com/maps/search/query
  const searchMatch = url.match(/\/maps\/search\/([^/@?]+)/);
  if (searchMatch) return decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));

  return null;
}

// Fetch Google Maps page HTML
async function fetchGoogleMapsPage(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.text()).slice(0, 100000);
  } finally {
    clearTimeout(timeout);
  }
}

// Extract structured data from Google Maps HTML
function extractFromHtml(html: string): Partial<GooglePlaceData> {
  const data: Partial<GooglePlaceData> = {};

  // Extract from meta tags
  const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/i)
    || html.match(/content="([^"]+)"\s+property="og:title"/i);
  if (ogTitle) data.businessName = ogTitle[1];

  const ogDesc = html.match(/property="og:description"\s+content="([^"]+)"/i)
    || html.match(/content="([^"]+)"\s+property="og:description"/i);
  if (ogDesc) data.description = ogDesc[1];

  const ogImage = html.match(/property="og:image"\s+content="([^"]+)"/i)
    || html.match(/content="([^"]+)"\s+property="og:image"/i);
  if (ogImage) data.imageUrls = [ogImage[1]];

  // Extract from embedded JSON data (Google Maps embeds data in script tags)
  // Look for rating
  const ratingMatch = html.match(/"(\d\.\d)","(\d[\d,]*)(?:\s*reviews|\s*รีวิว)/i);
  if (ratingMatch) {
    data.rating = ratingMatch[1];
    data.reviewCount = ratingMatch[2];
  }

  // Look for phone number
  const phoneMatch = html.match(/"(\+?\d[\d\s-]{8,15})"/);
  if (phoneMatch) data.phone = phoneMatch[1];

  // Look for website
  const websiteMatch = html.match(/"(https?:\/\/(?!www\.google)[^"]{10,100})"/);
  if (websiteMatch) data.website = websiteMatch[1];

  // Extract Google user content images (high-res place photos)
  const imageMatches = html.matchAll(/https:\/\/lh3\.googleusercontent\.com\/[^"'\s]+(?:=w\d+-h\d+[^"'\s]*)/g);
  const images: string[] = [];
  for (const m of imageMatches) {
    // Upgrade to larger size
    let url = m[0].replace(/=w\d+-h\d+[^"'\s]*/, '=w800-h400-k-no');
    if (!images.includes(url) && !url.includes('=w32')) images.push(url);
  }
  if (images.length) data.imageUrls = images.slice(0, 6);

  return data;
}

// Use Claude to analyze the raw HTML and extract structured business data
async function analyzeWithClaude(html: string, query: string): Promise<Partial<GooglePlaceData>> {
  // Strip HTML tags for text content, keep key data
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Extract business information from this Google Maps page for "${query}".

Page text (first 4000 chars):
${textContent}

Return a JSON object with:
{
  "businessName": "the business name in English",
  "category": "restaurant/cafe/salon/retail/fitness/bar/clinic/other",
  "rating": "4.5",
  "address": "full address",
  "description": "2-3 sentence description of what this business is",
  "products": ["main product 1", "main product 2", "main product 3"],
  "vibe": "one of: cozy, bold, classy, playful, modern, elegant, rustic, vibrant, minimal",
  "priceLevel": "budget/mid-range/upscale/fine-dining"
}

Return ONLY the JSON object.`
      }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('[google-places] Claude analysis failed:', err);
  }

  return {};
}

// Main function: scrape Google Maps for a business
export async function scrapeGooglePlace(input: string): Promise<GooglePlaceData> {
  let url: string;
  let searchQuery: string;

  if (isGoogleMapsUrl(input)) {
    url = input;
    searchQuery = extractSearchQuery(input) || input;
  } else {
    // Treat as a search query
    searchQuery = input;
    url = buildSearchUrl(input);
  }

  try {
    console.log('[google-places] Fetching:', url);
    const html = await fetchGoogleMapsPage(url);
    
    // Extract from HTML structure
    const htmlData = extractFromHtml(html);
    
    // Use Claude to analyze the text content
    const claudeData = await analyzeWithClaude(html, searchQuery);

    return {
      source: 'google_maps',
      url,
      businessName: claudeData.businessName || htmlData.businessName,
      category: claudeData.category,
      rating: claudeData.rating || htmlData.rating,
      reviewCount: htmlData.reviewCount,
      address: claudeData.address || htmlData.address,
      phone: htmlData.phone,
      website: htmlData.website,
      description: claudeData.description || htmlData.description,
      priceLevel: claudeData.priceLevel,
      imageUrls: htmlData.imageUrls,
      products: claudeData.products,
      vibe: claudeData.vibe,
    };
  } catch (err) {
    console.error('[google-places] Scrape failed:', err);
    return {
      source: 'google_maps',
      url,
      error: "Couldn't find this place on Google Maps. No worries — we'll build your cover from your answers instead!",
    };
  }
}
