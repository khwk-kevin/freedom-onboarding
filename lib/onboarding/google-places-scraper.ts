// Google Maps Place Scraper
// Uses Google Places API (New) for structured data, falls back to HTML scraping
// Requires GOOGLE_PLACES_API_KEY or GEMINI_API_KEY with Places API enabled

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
  latitude?: number;
  longitude?: number;
}

// Detect if URL is a Google Maps link
export function isGoogleMapsUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes('google.com/maps') || lower.includes('maps.google') || lower.includes('goo.gl/maps') || lower.includes('maps.app.goo.gl');
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
      model: 'claude-3-haiku-20240307',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `You are analyzing a Google Maps business listing for "${query}". Extract and INFER as much as possible. Never return empty fields.

Data available:
${textContent}

IMPORTANT: Even with limited data, you MUST infer reasonable values for every field. Use the business name, category, and any other clues to make intelligent guesses.

Return a JSON object:
{
  "businessName": "the business name in English",
  "category": "restaurant|cafe|salon|retail|fitness|bar|clinic|other",
  "rating": "4.5",
  "address": "full address if available",
  "description": "2-3 compelling sentences about what this business offers and what makes it special. Be specific and enthusiastic.",
  "products": ["main offering 1", "main offering 2", "main offering 3"] (for restaurants: cuisine/dishes, for salons: services, etc.),
  "vibe": "cozy|bold|classy|playful|modern|elegant|rustic|vibrant|minimal",
  "priceLevel": "budget|mid-range|upscale|fine-dining"
}

Return ONLY valid JSON.`
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

// Try Google Places API (New) — text search
async function tryPlacesApi(query: string): Promise<GooglePlaceData | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    console.log('[google-places] tryPlacesApi query:', query, 'keyPrefix:', apiKey.slice(0, 10));
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.types,places.editorialSummary,places.photos,places.primaryType,places.websiteUri,places.googleMapsUri,places.rating,places.userRatingCount,places.priceLevel,places.nationalPhoneNumber',
      },
      body: JSON.stringify({ textQuery: query, languageCode: 'en' }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.log('[google-places] API returned', res.status, errText.slice(0, 200));
      return null;
    }

    const data = await res.json();
    console.log('[google-places] API response places count:', data.places?.length || 0);
    const place = data.places?.[0];
    if (!place) return null;

    // Get photo URLs — fetch each photo's media endpoint to get the real googleusercontent URL
    const imageUrls: string[] = [];
    if (place.photos?.length) {
      const photoPromises = place.photos.slice(0, 4).map(async (photo: { name: string }) => {
        try {
          const mediaUrl = `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&key=${apiKey}`;
          const photoRes = await fetch(mediaUrl, { method: 'GET', redirect: 'manual' });
          // The API returns JSON with photoUri, or redirects to the image
          if (photoRes.status === 200) {
            const photoData = await photoRes.json().catch(() => null);
            if (photoData?.photoUri) return photoData.photoUri;
          }
          // If it redirects, use the Location header
          const location = photoRes.headers.get('location');
          if (location) return location;
          return null;
        } catch {
          return null;
        }
      });
      const resolvedUrls = await Promise.all(photoPromises);
      for (const url of resolvedUrls) {
        if (url) imageUrls.push(url);
      }
      console.log(`[google-places] Resolved ${imageUrls.length} photo URLs`);
    }

    return {
      source: 'google_maps',
      url: place.googleMapsUri || '',
      businessName: place.displayName?.text,
      category: mapGoogleType(place.primaryType || place.types?.[0]),
      rating: place.rating?.toString(),
      reviewCount: place.userRatingCount?.toString(),
      address: place.formattedAddress,
      phone: place.nationalPhoneNumber,
      website: place.websiteUri,
      description: place.editorialSummary?.text,
      priceLevel: mapPriceLevel(place.priceLevel),
      imageUrls,
      // Location coordinates for POI creation
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
    };
  } catch (err) {
    console.log('[google-places] API error:', err);
    return null;
  }
}

function mapGoogleType(type?: string): string {
  if (!type) return 'other';
  const map: Record<string, string> = {
    restaurant: 'restaurant', cafe: 'cafe', coffee_shop: 'cafe',
    bar: 'bar', night_club: 'bar', hair_salon: 'salon', beauty_salon: 'salon',
    spa: 'clinic', gym: 'fitness', store: 'retail', shopping_mall: 'retail',
    hospital: 'clinic', dentist: 'clinic', doctor: 'clinic',
  };
  return map[type] || 'other';
}

function mapPriceLevel(level?: string): string | undefined {
  if (!level) return undefined;
  const map: Record<string, string> = {
    PRICE_LEVEL_FREE: 'free',
    PRICE_LEVEL_INEXPENSIVE: 'budget',
    PRICE_LEVEL_MODERATE: 'mid-range',
    PRICE_LEVEL_EXPENSIVE: 'upscale',
    PRICE_LEVEL_VERY_EXPENSIVE: 'fine-dining',
  };
  return map[level];
}

// Resolve shortened Google Maps URLs (maps.app.goo.gl, goo.gl/maps) to full URLs
async function resolveShortUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    return res.url || url;
  } catch {
    // Try GET if HEAD fails
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(8000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });
      return res.url || url;
    } catch {
      return url;
    }
  }
}

// Check if URL is a shortened Google Maps link that needs resolving
function isShortGoogleMapsUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes('maps.app.goo.gl') || lower.includes('goo.gl/maps');
}

// Main function: scrape Google Maps for a business
export async function scrapeGooglePlace(input: string): Promise<GooglePlaceData> {
  let url: string;
  let searchQuery: string;

  if (isGoogleMapsUrl(input)) {
    url = input;
    
    // Resolve short URLs to get the full Google Maps URL with place name
    if (isShortGoogleMapsUrl(url)) {
      console.log('[google-places] Resolving short URL:', url);
      url = await resolveShortUrl(url);
      console.log('[google-places] Resolved to:', url);
    }
    
    searchQuery = extractSearchQuery(url) || input;
    console.log('[google-places] extracted searchQuery:', searchQuery, 'from url:', url.slice(0, 80));
  } else {
    searchQuery = input;
    url = buildSearchUrl(input);
  }

  // Try Places API first (structured, reliable)
  const apiResult = await tryPlacesApi(searchQuery);
  if (apiResult && apiResult.businessName) {
    console.log('[google-places] API success:', apiResult.businessName);
    // Enrich with Claude analysis for vibe/products/description
    if (!apiResult.vibe || !apiResult.products || !apiResult.description) {
      const enrichment = await analyzeWithClaude(
        `Business: ${apiResult.businessName}\nCategory: ${apiResult.category}\nDescription: ${apiResult.description || 'unknown'}\nAddress: ${apiResult.address || 'unknown'}\nPrice Level: ${apiResult.priceLevel || 'unknown'}\nRating: ${apiResult.rating || 'unknown'}\nWebsite: ${apiResult.website || 'unknown'}`,
        searchQuery
      );
      if (enrichment.vibe) apiResult.vibe = enrichment.vibe;
      if (enrichment.products) apiResult.products = enrichment.products;
      if (enrichment.description && !apiResult.description) apiResult.description = enrichment.description;
    }
    return apiResult;
  }

  // Fallback: HTML scraping
  try {
    console.log('[google-places] Falling back to HTML scrape:', url);
    const html = await fetchGoogleMapsPage(url);
    const htmlData = extractFromHtml(html);
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
