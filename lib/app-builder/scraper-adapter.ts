/**
 * Freedom World App Builder — Scraper Adapter
 * Sprint 2.4 — Scraper Integration
 *
 * Wires the existing scraper (lib/onboarding/scraper.ts + google-places-scraper.ts)
 * to the MerchantAppSpec structure, and provides photo downloading to Railway services.
 */

import { MerchantAppSpec, ScrapedBusinessData } from './types';
import { scrapeBrandContext } from '@/lib/onboarding/scraper';
import {
  scrapeGooglePlace,
  isGoogleMapsUrl,
} from '@/lib/onboarding/google-places-scraper';
import { sshExecCommand } from './railway';

// ============================================================
// INTERNAL TYPES
// ============================================================

/**
 * Extends ScrapedBusinessData with lat/lng and asset URL fields
 * that the scraper returns but aren't in the base interface.
 * Used locally — cast back to ScrapedBusinessData before storing on spec.
 */
interface EnrichedScrapedData extends ScrapedBusinessData {
  latitude?: number;
  longitude?: number;
  logoUrl?: string;
  bannerUrl?: string;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Parse a Google Places hours string into Record<string, string>.
 * Input:  "Monday: 9:00 AM – 10:00 PM" (or similar)
 * Output: { "Monday": "09:00–22:00", ... }
 *
 * Handles both structured objects and freeform strings gracefully.
 */
function parseHours(raw: string | Record<string, string>): Record<string, string> | undefined {
  if (!raw) return undefined;

  // Already a Record
  if (typeof raw === 'object') return raw;

  // Parse freeform string — "Monday: 9:00 AM – 10:00 PM, Tuesday: 9:00 AM – 10:00 PM"
  const result: Record<string, string> = {};
  const lines = raw.split(/[,\n]/);
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const day = line.slice(0, colonIdx).trim();
      const hours = line.slice(colonIdx + 1).trim();
      if (day && hours) result[day] = hours;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Map a Google price level string to ScrapedBusinessData's 1-4 scale.
 */
function mapPriceLevel(priceLevel?: string): 1 | 2 | 3 | 4 | undefined {
  if (!priceLevel) return undefined;
  const map: Record<string, 1 | 2 | 3 | 4> = {
    free: 1,
    budget: 1,
    'mid-range': 2,
    upscale: 3,
    'fine-dining': 4,
  };
  return map[priceLevel.toLowerCase()];
}

// ============================================================
// MAIN: scrapeToSpec
// ============================================================

/**
 * Scrapes a URL using the existing scraper infrastructure and maps the result
 * into a MerchantAppSpec. Merges scraped data with existing spec fields —
 * scraped data wins for fields it explicitly provides.
 *
 * For Google Maps URLs: uses scrapeGooglePlace directly to get full data
 *   (phone, hours, rating, lat/lng).
 * For other URLs (websites, Instagram, Facebook): uses scrapeBrandContext.
 *
 * Handles gracefully: URL unavailable, partial data, no photos found.
 *
 * @param url     URL to scrape (Google Maps, website, social media)
 * @param spec    Existing MerchantAppSpec to merge into
 * @returns       Updated MerchantAppSpec with scraped data merged in
 */
export async function scrapeToSpec(
  url: string,
  spec: MerchantAppSpec
): Promise<MerchantAppSpec> {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    console.warn('[scraper-adapter] scrapeToSpec called with empty URL');
    return spec;
  }

  const trimmedUrl = url.trim();

  try {
    // ── Google Maps path ─────────────────────────────────────────────────────
    // Use scrapeGooglePlace directly to get full structured data:
    // phone, hours, rating, lat/lng — which scrapeBrandContext strips out.
    if (isGoogleMapsUrl(trimmedUrl)) {
      console.log('[scraper-adapter] Google Maps URL detected, using Places scraper');

      const placeData = await scrapeGooglePlace(trimmedUrl);

      if (placeData.error && !placeData.businessName) {
        console.warn('[scraper-adapter] Google Maps scrape failed:', placeData.error);
        return spec;
      }

      // Cap photos to 10 max to avoid slow downloads later
      const photos = (placeData.imageUrls ?? []).slice(0, 10);

      const enriched: EnrichedScrapedData = {
        // Standard ScrapedBusinessData fields
        name: placeData.businessName,
        address: placeData.address,
        phone: placeData.phone,
        website: placeData.website,
        googleMapsUrl: placeData.url,
        rating: placeData.rating ? parseFloat(placeData.rating) : undefined,
        reviewCount: placeData.reviewCount
          ? parseInt(placeData.reviewCount, 10)
          : undefined,
        hours: placeData.hours
          ? parseHours(placeData.hours as unknown as string)
          : undefined,
        photos,
        categories: placeData.products ?? [],
        description: placeData.description,
        priceLevel: mapPriceLevel(placeData.priceLevel),
        scrapedAt: new Date().toISOString(),
        // Extended fields (lat/lng, logo, banner)
        latitude: placeData.latitude,
        longitude: placeData.longitude,
        logoUrl: photos[0],
        bannerUrl: photos[1] ?? photos[0],
      };

      return {
        ...spec,
        businessName: placeData.businessName ?? spec.businessName,
        scrapedData: enriched as ScrapedBusinessData,
      };
    }

    // ── Generic scraper path (website / Instagram / Facebook) ────────────────
    console.log('[scraper-adapter] Generic URL, using scrapeBrandContext');

    const brandData = await scrapeBrandContext(trimmedUrl);

    if (brandData.error && !brandData.businessName) {
      console.warn('[scraper-adapter] Generic scrape failed:', brandData.error);
      return spec;
    }

    const photos = (brandData.imageUrls ?? []).slice(0, 10);

    const enriched: EnrichedScrapedData = {
      name: brandData.businessName,
      address: brandData.address,
      photos,
      categories: brandData.products ?? [],
      description: brandData.bio ?? brandData.description,
      scrapedAt: new Date().toISOString(),
      latitude: brandData.latitude,
      longitude: brandData.longitude,
      logoUrl: photos[0],
      bannerUrl: photos[1] ?? photos[0],
    };

    return {
      ...spec,
      businessName: brandData.businessName ?? spec.businessName,
      scrapedData: enriched as ScrapedBusinessData,
    };
  } catch (err) {
    // Non-crashing: return original spec on any unexpected error
    console.error('[scraper-adapter] scrapeToSpec unexpected error:', err);
    return spec;
  }
}

// ============================================================
// MAIN: downloadAssetsToService
// ============================================================

/**
 * Downloads photo URLs into a Railway service container via SSH (using curl).
 *
 * Gallery photos → /workspace/public/assets/gallery/photo-N.jpg  (N = 1-based)
 * Logo           → /workspace/public/assets/logo.png
 * Banner         → /workspace/public/assets/banner.jpg
 *
 * Returns array of relative paths accessible from the Next.js app:
 *   ['/public/assets/gallery/photo-1.jpg', '/public/assets/gallery/photo-2.jpg', ...]
 *
 * Limit: processes at most 10 photos (enforced internally) to avoid slow downloads.
 *
 * @param projectId  Railway project ID
 * @param serviceId  Railway service ID
 * @param photos     Array of photo URLs to download to the gallery
 * @param logoUrl    Optional logo URL — downloads to /workspace/public/assets/logo.png
 * @param bannerUrl  Optional banner URL — downloads to /workspace/public/assets/banner.jpg
 * @returns          Array of relative paths for successfully downloaded gallery photos
 */
export async function downloadAssetsToService(
  projectId: string,
  serviceId: string,
  photos: string[],
  logoUrl?: string,
  bannerUrl?: string
): Promise<string[]> {
  if (!projectId || !serviceId) {
    console.warn('[scraper-adapter] downloadAssetsToService: missing projectId or serviceId');
    return [];
  }

  // ── Setup directories ──────────────────────────────────────────────────────
  const mkdirResult = await sshExecCommand(
    projectId,
    serviceId,
    'mkdir -p /workspace/public/assets/gallery'
  );

  if (mkdirResult.exitCode !== 0) {
    console.error(
      '[scraper-adapter] Failed to create gallery directory:',
      mkdirResult.stderr
    );
    return [];
  }

  const downloadedPaths: string[] = [];

  // ── Download gallery photos (max 10) ──────────────────────────────────────
  const limitedPhotos = photos.slice(0, 10);

  for (let i = 0; i < limitedPhotos.length; i++) {
    const photoUrl = limitedPhotos[i];
    const targetPath = `/workspace/public/assets/gallery/photo-${i + 1}.jpg`;
    const relativePath = `/public/assets/gallery/photo-${i + 1}.jpg`;

    const result = await sshExecCommand(
      projectId,
      serviceId,
      // -s: silent, -L: follow redirects, -o: output path, --max-time: timeout 30s
      `curl -sL --max-time 30 --create-dirs -o "${targetPath}" "${photoUrl}"`
    );

    if (result.exitCode === 0) {
      downloadedPaths.push(relativePath);
      console.log(`[scraper-adapter] Downloaded photo ${i + 1}: ${relativePath}`);
    } else {
      console.warn(
        `[scraper-adapter] Failed to download photo ${i + 1} (${photoUrl}):`,
        result.stderr || result.stdout
      );
    }
  }

  // ── Download logo ──────────────────────────────────────────────────────────
  const effectiveLogo = logoUrl ?? photos[0];
  if (effectiveLogo) {
    const result = await sshExecCommand(
      projectId,
      serviceId,
      `curl -sL --max-time 30 --create-dirs -o "/workspace/public/assets/logo.png" "${effectiveLogo}"`
    );

    if (result.exitCode === 0) {
      console.log('[scraper-adapter] Downloaded logo → /public/assets/logo.png');
    } else {
      console.warn(
        '[scraper-adapter] Failed to download logo:',
        result.stderr || result.stdout
      );
    }
  }

  // ── Download banner ────────────────────────────────────────────────────────
  const effectiveBanner = bannerUrl ?? photos[1] ?? photos[0];
  if (effectiveBanner) {
    const result = await sshExecCommand(
      projectId,
      serviceId,
      `curl -sL --max-time 30 --create-dirs -o "/workspace/public/assets/banner.jpg" "${effectiveBanner}"`
    );

    if (result.exitCode === 0) {
      console.log('[scraper-adapter] Downloaded banner → /public/assets/banner.jpg');
    } else {
      console.warn(
        '[scraper-adapter] Failed to download banner:',
        result.stderr || result.stdout
      );
    }
  }

  return downloadedPaths;
}
