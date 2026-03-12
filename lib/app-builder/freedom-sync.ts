/**
 * Freedom World App Builder — Freedom Community Sync
 * Sprint 4.2 — Freedom Community Sync
 *
 * After deploy, creates the merchant's Freedom community and POI from their
 * app spec. Reuses the same Freedom API endpoints and patterns as the existing
 * onboarding sync-community route.
 *
 * API base: https://gateway.freedom.world/api/fdw-console/v1
 * Auth: Bearer <cognito_access_token> (from spec.cognitoAccessToken or FREEDOM_API_KEY fallback)
 */

import { saveMerchantApp } from './persistence';
import { createServiceClient } from '../supabase/server';
import type { MerchantAppSpec } from './types';

// ============================================================
// CONSTANTS
// ============================================================

const FW_API_BASE =
  process.env.FREEDOM_API_BASE_URL ||
  'https://gateway.freedom.world/api/fdw-console/v1';

// ============================================================
// HELPERS
// ============================================================

/**
 * Maps internal app builder category slugs to Freedom community categories.
 */
export function mapCategoryToFreedom(category: string): string {
  const map: Record<string, string> = {
    'restaurant-food': 'food_and_drink',
    'retail-catalog':  'shopping',
    'services':        'health_and_wellness',
  };
  return map[category] ?? 'other';
}

/**
 * Resolves the auth token for Freedom API calls.
 *
 * Priority order:
 *   1. spec.cognitoAccessToken  — stored at signup (if Sprint 3.3 persisted it)
 *   2. merchants table           — look up by freedomUserId (old-flow tokens)
 *   3. FREEDOM_API_KEY env var   — server-side service account fallback
 */
async function resolveAccessToken(spec: MerchantAppSpec): Promise<string> {
  // 1. Check for token persisted in spec JSONB (Sprint 3.3 may store it there)
  const specAny = spec as MerchantAppSpec & { cognitoAccessToken?: string };
  if (specAny.cognitoAccessToken) {
    return specAny.cognitoAccessToken;
  }

  // 2. Look up in the merchants table (old-flow cognito_access_token)
  if (spec.freedomUserId) {
    try {
      const supabase = createServiceClient();
      const { data } = await supabase
        .from('merchants')
        .select('cognito_access_token')
        .eq('cognito_user_id', spec.freedomUserId)
        .single();
      if (data?.cognito_access_token) {
        return data.cognito_access_token as string;
      }
    } catch {
      // Not found or table doesn't exist — continue
    }
  }

  // 3. Service-level API key fallback
  const apiKey = process.env.FREEDOM_API_KEY;
  if (apiKey) return apiKey;

  throw new Error(
    'No Freedom API auth token available. ' +
    'Set FREEDOM_API_KEY or ensure the merchant has a cognito_access_token.'
  );
}

/**
 * Downloads a remote URL and returns a Blob for use in FormData uploads.
 * Returns null if the URL is empty or the fetch fails.
 */
async function urlToBlob(
  url: string,
  filename: string
): Promise<{ blob: Blob; name: string } | null> {
  if (!url) return null;
  try {
    if (url.startsWith('data:')) {
      const [header, b64] = url.split(',');
      const mimeMatch = header.match(/data:([^;]+)/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const ext = mime.split('/')[1] || 'png';
      const buffer = Buffer.from(b64, 'base64');
      return { blob: new Blob([buffer], { type: mime }), name: `${filename}.${ext}` };
    }
    if (url.startsWith('http')) {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) return null;
      const contentType = res.headers.get('content-type') || 'image/png';
      const ext = contentType.split('/')[1]?.split(';')[0] || 'png';
      const buffer = await res.arrayBuffer();
      return { blob: new Blob([buffer], { type: contentType }), name: `${filename}.${ext}` };
    }
  } catch (err) {
    console.error('[freedom-sync] urlToBlob failed:', err);
  }
  return null;
}

// ============================================================
// MAIN SYNC FUNCTION
// ============================================================

/**
 * Full Freedom community sync after a merchant app is deployed.
 *
 * Steps:
 * 1. Create Freedom community (name, description, banner, logo, category)
 * 2. Create POI if the app has a physical location (lat/lng from scrapedData)
 * 3. Create welcome post with production URL
 * 4. Publish community
 * 5. Persist freedomOrgId + freedomCommunityId back to spec / Supabase
 *
 * Skips POI creation silently if no lat/lng (idea apps or non-location businesses).
 */
export async function syncToFreedom(
  spec: MerchantAppSpec
): Promise<{ orgId: string; communityId: string }> {
  const accessToken = await resolveAccessToken(spec);
  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  const communityName = spec.businessName ?? 'My Community';
  const description =
    spec.scrapedData?.description ??
    spec.ideaDescription ??
    `Welcome to ${communityName}`;
  const bannerUrl = spec.scrapedData?.photos?.[0] ?? '';
  const logoUrl = (spec as MerchantAppSpec & { logoUrl?: string }).logoUrl ?? '';
  const fwCategory = mapCategoryToFreedom(spec.category ?? '');

  // ── Step 1: Create community ────────────────────────────────
  let orgId: string;
  let communityId: string;

  {
    const form = new FormData();
    form.append('name', communityName);
    form.append('description', description);
    form.append('communityType', 'Public');
    form.append('communityCategory', fwCategory);
    form.append('targetAudience', spec.audienceDescription ?? '');
    form.append('color', spec.primaryColor ?? '#10F48B');
    form.append('isPrivate', 'false');

    if (logoUrl) {
      const logoBlob = await urlToBlob(logoUrl, 'logo');
      if (logoBlob) form.append('logoImage', logoBlob.blob, logoBlob.name);
    }
    if (bannerUrl) {
      const bannerBlob = await urlToBlob(bannerUrl, 'banner');
      if (bannerBlob) form.append('bannerImage', bannerBlob.blob, bannerBlob.name);
    }

    console.log('[freedom-sync] Creating community:', communityName, fwCategory);

    const createRes = await fetch(`${FW_API_BASE}/organizations/v2`, {
      method: 'POST',
      headers: authHeaders,
      body: form,
    });

    const result = await createRes.json().catch(
      () => ({ status: createRes.status }) as Record<string, unknown>
    );
    console.log('[freedom-sync] Create result:', JSON.stringify(result).slice(0, 300));

    if (!createRes.ok) {
      throw new Error(
        `Freedom community creation failed (HTTP ${createRes.status}): ` +
        JSON.stringify(result).slice(0, 200)
      );
    }

    // Freedom API returns various shapes — handle all known patterns
    const r = result as Record<string, unknown>;
    orgId = (r.orgId ?? r.organizationId ?? r.id ?? '') as string;
    communityId = (r.communityId ?? r.id ?? '') as string;

    if (!orgId || !communityId) {
      throw new Error(
        'Freedom API did not return orgId/communityId: ' +
        JSON.stringify(result).slice(0, 200)
      );
    }
  }

  // ── Step 2: Create POI (if location exists) ─────────────────
  const lat = spec.scrapedData?.lat;
  const lng = spec.scrapedData?.lng;

  if (lat && lng) {
    try {
      const photos = spec.scrapedData?.photos ?? [];
      const poiImages: string[] = [];

      // Upload up to 5 POI images
      for (const imgUrl of photos.slice(0, 5)) {
        try {
          const imgBlob = await urlToBlob(imgUrl, 'poi-image');
          if (imgBlob) {
            const uploadForm = new FormData();
            uploadForm.append('file', imgBlob.blob, imgBlob.name);
            const uploadRes = await fetch(
              `${FW_API_BASE}/organizations/${orgId}/community/${communityId}/poi/requests/image-upload`,
              { method: 'POST', headers: authHeaders, body: uploadForm }
            );
            const uploadResult = await uploadRes.json().catch(() => null) as { data?: { link?: string } } | null;
            if (uploadResult?.data?.link) poiImages.push(uploadResult.data.link);
          }
        } catch (imgErr) {
          console.error('[freedom-sync] POI image upload failed:', imgErr);
        }
      }

      const poiBody = {
        latitude: lat,
        longitude: lng,
        name: communityName,
        address: spec.scrapedData?.address ?? '',
        images: poiImages,
      };

      console.log('[freedom-sync] Creating POI:', poiBody.name, poiBody.address);

      const poiRes = await fetch(
        `${FW_API_BASE}/organizations/${orgId}/community/${communityId}/poi/requests`,
        {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(poiBody),
        }
      );
      const poiResult = await poiRes.json().catch(() => ({ status: poiRes.status }));
      console.log('[freedom-sync] POI result:', JSON.stringify(poiResult).slice(0, 200));
    } catch (poiErr) {
      // POI failure is non-fatal — log and continue
      console.error('[freedom-sync] POI creation failed (non-fatal):', poiErr);
    }
  } else {
    console.log('[freedom-sync] Skipping POI — no lat/lng (idea app or no location)');
  }

  // ── Step 3: Create welcome post ─────────────────────────────
  try {
    const productionUrl = spec.productionUrl ?? '';
    const postText = `Welcome! Our app is live: ${productionUrl}`;

    const feedForm = new FormData();
    feedForm.append('titles', JSON.stringify({ en: 'Welcome!' }));
    feedForm.append('descriptions', JSON.stringify({ en: postText }));
    feedForm.append('isDraft', 'false');

    // Attach banner as feed image if available
    if (bannerUrl) {
      const feedImageBlob = await urlToBlob(bannerUrl, 'feed-image');
      if (feedImageBlob) {
        feedForm.append('image', feedImageBlob.blob, feedImageBlob.name);
      }
    }

    console.log('[freedom-sync] Creating welcome post for org:', orgId);

    const postRes = await fetch(`${FW_API_BASE}/organizations/${orgId}/feed`, {
      method: 'POST',
      headers: authHeaders,
      body: feedForm,
    });
    const postResult = await postRes.json().catch(() => ({ status: postRes.status }));
    console.log('[freedom-sync] Post result:', JSON.stringify(postResult).slice(0, 200));
  } catch (postErr) {
    // Post failure is non-fatal
    console.error('[freedom-sync] Welcome post failed (non-fatal):', postErr);
  }

  // ── Step 4: Publish community ───────────────────────────────
  try {
    const publishForm = new FormData();
    publishForm.append('publishConfirmed', 'true');

    const publishRes = await fetch(
      `${FW_API_BASE}/organizations/${orgId}/community/${communityId}`,
      {
        method: 'PUT',
        headers: authHeaders,
        body: publishForm,
      }
    );
    const publishResult = await publishRes.json().catch(
      () => ({ status: publishRes.status })
    );
    console.log('[freedom-sync] Publish result:', JSON.stringify(publishResult).slice(0, 200));
  } catch (publishErr) {
    // Non-fatal — community exists even if publish call fails
    console.error('[freedom-sync] Publish failed (non-fatal):', publishErr);
  }

  // ── Step 5: Persist IDs back to spec ────────────────────────
  spec.freedomOrgId = orgId;
  spec.freedomCommunityId = communityId;
  spec.updatedAt = new Date().toISOString();

  await saveMerchantApp(spec.id, spec);

  console.log('[freedom-sync] Sync complete:', { orgId, communityId });

  return { orgId, communityId };
}
