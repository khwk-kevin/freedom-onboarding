// Social media / website scraper for brand context extraction
// Scrapes public pages and extracts: colors, images, bio, products, vibe

import Anthropic from '@anthropic-ai/sdk';
import { isGoogleMapsUrl, scrapeGooglePlace } from './google-places-scraper';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ScrapedBrandContext {
  source: 'instagram' | 'facebook' | 'website' | 'google_maps' | 'unknown';
  url: string;
  businessName?: string;
  bio?: string;
  description?: string;
  products?: string[];
  vibe?: string;
  brandColors?: string[];
  imageUrls?: string[];
  followerCount?: string;
  category?: string;
  address?: string;
  error?: string;
}

// Detect platform from URL
function detectPlatform(url: string): 'instagram' | 'facebook' | 'website' {
  const lower = url.toLowerCase();
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram';
  if (lower.includes('facebook.com') || lower.includes('fb.com') || lower.includes('fb.me')) return 'facebook';
  return 'website';
}

// Normalize URL
function normalizeUrl(input: string): string {
  let url = input.trim();
  // Handle @username for Instagram
  if (url.startsWith('@')) {
    return `https://www.instagram.com/${url.slice(1)}/`;
  }
  // Handle bare usernames (no dots, no spaces, no slashes)
  if (!url.includes('.') && !url.includes('/') && !url.includes(' ')) {
    return `https://www.instagram.com/${url}/`;
  }
  if (!url.startsWith('http')) {
    url = `https://${url}`;
  }
  return url;
}

// Fetch page HTML with browser-like headers
async function fetchPage(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    // Limit to 50KB to avoid huge pages
    return html.slice(0, 50000);
  } finally {
    clearTimeout(timeout);
  }
}

// Extract meta tags and structured data from HTML
function extractMeta(html: string): Record<string, string> {
  const meta: Record<string, string> = {};

  // OG tags
  const ogMatches = html.matchAll(/<meta\s+(?:property|name)=["'](og:[^"']+)["']\s+content=["']([^"']*)["']/gi);
  for (const m of ogMatches) meta[m[1]] = m[2];

  // Standard meta
  const metaMatches = html.matchAll(/<meta\s+name=["']([^"']+)["']\s+content=["']([^"']*)["']/gi);
  for (const m of metaMatches) meta[m[1]] = m[2];

  // Reverse order (content before name)
  const revMatches = html.matchAll(/<meta\s+content=["']([^"']*)["']\s+(?:property|name)=["']([^"']+)["']/gi);
  for (const m of revMatches) meta[m[2]] = m[1];

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) meta['title'] = titleMatch[1].trim();

  // JSON-LD
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const ld = JSON.parse(jsonLdMatch[1]);
      if (ld.name) meta['ld:name'] = ld.name;
      if (ld.description) meta['ld:description'] = ld.description;
      if (ld.image) meta['ld:image'] = typeof ld.image === 'string' ? ld.image : ld.image?.url || '';
    } catch { /* ignore */ }
  }

  return meta;
}

// Extract image URLs from HTML
function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];

  // OG image
  const ogImg = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i)
    || html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);
  if (ogImg) images.push(ogImg[1]);

  // Large images from img tags
  const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*/gi);
  for (const m of imgMatches) {
    const src = m[1];
    // Skip tiny icons, tracking pixels, etc
    if (src.includes('1x1') || src.includes('pixel') || src.includes('blank') || src.includes('.svg')) continue;
    // Check for size hints
    const widthMatch = m[0].match(/width=["']?(\d+)/i);
    if (widthMatch && parseInt(widthMatch[1]) < 100) continue;
    
    let fullUrl = src;
    if (src.startsWith('//')) fullUrl = 'https:' + src;
    else if (src.startsWith('/')) fullUrl = new URL(src, baseUrl).href;
    
    if (!images.includes(fullUrl)) images.push(fullUrl);
  }

  return images.slice(0, 8); // Max 8 images
}

// Use Claude to analyze the scraped content and extract brand context
async function analyzeBrandContext(
  html: string,
  meta: Record<string, string>,
  imageUrls: string[],
  url: string,
  platform: string
): Promise<Partial<ScrapedBrandContext>> {
  const prompt = `Analyze this ${platform} page and extract brand information for a local business.

URL: ${url}

META TAGS:
${Object.entries(meta).slice(0, 20).map(([k, v]) => `${k}: ${v}`).join('\n')}

IMAGE URLs FOUND:
${imageUrls.slice(0, 5).join('\n')}

PAGE TEXT (first 3000 chars):
${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000)}

Extract and return a JSON object with:
{
  "businessName": "the business name",
  "bio": "their bio or tagline (1-2 sentences)",
  "description": "what this business is about (2-3 sentences)",
  "products": ["product1", "product2", "product3"],
  "vibe": "one of: cozy, bold, classy, playful, modern, elegant, rustic, vibrant, minimal",
  "category": "restaurant/cafe/salon/retail/fitness/bar/clinic/other",
  "brandColors": ["#hex1", "#hex2"] (infer from the page design or content if possible)
}

Return ONLY the JSON object, no explanation.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('[scraper] Claude analysis failed:', err);
  }

  return {};
}

// Main scrape function
export async function scrapeBrandContext(rawUrl: string): Promise<ScrapedBrandContext> {
  const url = normalizeUrl(rawUrl);
  
  // Check if it's a Google Maps URL or search query
  if (isGoogleMapsUrl(url) || isGoogleMapsUrl(rawUrl)) {
    try {
      const placeData = await scrapeGooglePlace(url);
      if (placeData.error) {
        return { source: 'unknown', url, error: placeData.error };
      }
      return {
        source: 'google_maps',
        url,
        businessName: placeData.businessName,
        bio: placeData.description,
        description: placeData.description,
        products: placeData.products,
        vibe: placeData.vibe,
        imageUrls: placeData.imageUrls,
        category: placeData.category,
        followerCount: placeData.rating ? `${placeData.rating}★ (${placeData.reviewCount || ''} reviews)` : undefined,
        address: placeData.address,
      };
    } catch (err) {
      console.error('[scraper] Google Maps scrape failed:', err);
    }
  }

  const platform = detectPlatform(url);

  try {
    const html = await fetchPage(url);
    const meta = extractMeta(html);
    const imageUrls = extractImages(html, url);

    // Use Claude to analyze
    const analysis = await analyzeBrandContext(html, meta, imageUrls, url, platform);

    return {
      source: platform,
      url,
      businessName: analysis.businessName || meta['og:title'] || meta['title'],
      bio: analysis.bio || meta['og:description'] || meta['description'],
      description: analysis.description,
      products: analysis.products,
      vibe: analysis.vibe,
      brandColors: analysis.brandColors,
      imageUrls: imageUrls.slice(0, 5),
      category: analysis.category,
    };
  } catch (err) {
    console.error('[scraper] Failed to scrape:', url, err);
    return {
      source: platform,
      url,
      error: `Couldn't access this page. No worries — we'll build your cover from your answers instead!`,
    };
  }
}
