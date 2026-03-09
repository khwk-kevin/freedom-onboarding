import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Freedom World API (from web-micro-console-enterprise)
 * 
 * Create community (V2): POST /organizations/v2
 *   FormData: name, description, logoImage, bannerImage, communityType, 
 *             communityCategory, targetAudience, color, isPrivate
 * 
 * Update community: PUT /organizations/{orgId}/community/{communityId}
 *   FormData: name, descriptions (JSON {en:"..."}), color, logo, coverImage, 
 *             category, slug, publishConfirmed
 * 
 * Upload banner: POST /organizations/{orgId}/community/banner/{communityId}
 *   FormData: file
 * 
 * Base: https://gateway.freedom.world/api/fdw-console/v1
 * Auth: Bearer <cognito_access_token>
 */

const FW_API_BASE = process.env.FREEDOM_API_BASE_URL || 'https://gateway.freedom.world/api/fdw-console/v1';

async function urlToBlob(url: string, filename: string): Promise<{ blob: Blob; name: string } | null> {
  try {
    if (url.startsWith('data:')) {
      const [header, b64] = url.split(',');
      const mimeMatch = header.match(/data:([^;]+)/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const ext = mime.split('/')[1] || 'png';
      const buffer = Buffer.from(b64, 'base64');
      return { blob: new Blob([buffer], { type: mime }), name: `${filename}.${ext}` };
    } else if (url.startsWith('http')) {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return null;
      const contentType = res.headers.get('content-type') || 'image/png';
      const ext = contentType.split('/')[1]?.split(';')[0] || 'png';
      const buffer = await res.arrayBuffer();
      return { blob: new Blob([buffer], { type: contentType }), name: `${filename}.${ext}` };
    }
  } catch (err) {
    console.error('[sync] urlToBlob failed:', err);
  }
  return null;
}

// Map our business types to FW community categories
function mapBusinessTypeToCategory(type?: string): string {
  const map: Record<string, string> = {
    restaurant: 'Food & Beverage',
    cafe: 'Food & Beverage',
    bar: 'Food & Beverage',
    salon: 'Beauty & Wellness',
    fitness: 'Health & Fitness',
    retail: 'Shopping',
    clinic: 'Health & Fitness',
    other: 'Others',
  };
  return map[type || ''] || type || 'Others';
}

export async function POST(req: NextRequest) {
  try {
    const { merchantId, communityData } = await req.json();
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // ── 1. Save to Supabase ─────────────────────────────────────
    const merchantUpdate: Record<string, unknown> = {
      onboarding_status: 'community_created',
      onboarding_completed_at: new Date().toISOString(),
    };
    if (communityData.name) merchantUpdate.business_name = communityData.name;
    if (communityData.businessType) merchantUpdate.business_type = communityData.businessType;
    if (communityData.primaryColor) merchantUpdate.primary_color = communityData.primaryColor;
    if (communityData.description) merchantUpdate.description = communityData.description;
    if (communityData.logo) merchantUpdate.logo_url = communityData.logo;
    if (communityData.banner) merchantUpdate.banner_url = communityData.banner;

    merchantUpdate.onboarding_data = {
      name: communityData.name,
      description: communityData.description,
      businessType: communityData.businessType,
      vibe: communityData.vibe,
      products: communityData.products,
      brandStyle: communityData.brandStyle,
      primaryColor: communityData.primaryColor,
      audiencePersona: communityData.audiencePersona,
      rewards: communityData.rewards,
      welcomePost: communityData.welcomePost,
      scrapedUrl: communityData.scrapedUrl,
      completedAt: new Date().toISOString(),
    };

    const { error: dbError } = await supabase
      .from('merchants')
      .update(merchantUpdate)
      .eq('id', merchantId);
    if (dbError) console.error('[sync] Supabase error:', dbError);

    // ── 2. Get merchant's Cognito access token ──────────────────
    const { data: merchant } = await supabase
      .from('merchants')
      .select('cognito_user_id, cognito_access_token, freedom_org_id, freedom_community_id')
      .eq('id', merchantId)
      .single();

    const accessToken = merchant?.cognito_access_token;
    let orgId = merchant?.freedom_org_id;
    let communityId = merchant?.freedom_community_id;
    let fwResult: Record<string, unknown> | null = null;

    if (!accessToken) {
      return NextResponse.json({
        success: true,
        savedToDb: !dbError,
        freedomWorldSync: { pending: true, reason: 'no_access_token' },
      });
    }

    const authHeaders = { 'Authorization': `Bearer ${accessToken}` };

    // ── 3. Create community if no orgId/communityId yet ─────────
    if (!orgId || !communityId) {
      try {
        // Check name availability first
        const communityName = communityData.name || 'My Community';
        try {
          const checkRes = await fetch(`${FW_API_BASE}/organizations/check-create`, {
            method: 'POST',
            headers: { ...authHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: communityName, isPrivate: false }),
          });
          const checkResult = await checkRes.json();
          if (!checkResult.success && checkRes.status !== 200) {
            console.log('[sync] Name check failed:', checkResult);
            // Name might be taken, append a suffix
            // Continue anyway — the create API will handle the error
          }
        } catch (checkErr) {
          console.log('[sync] Name check skipped:', checkErr);
        }

        // POST /organizations/v2 (create community V2)
        const form = new FormData();
        form.append('name', communityData.name || 'My Community');
        form.append('description', communityData.description || '');
        form.append('communityType', 'Public');
        form.append('communityCategory', mapBusinessTypeToCategory(communityData.businessType));
        form.append('targetAudience', communityData.audiencePersona || communityData.audience || '');
        form.append('color', communityData.primaryColor || '#10F48B');
        form.append('isPrivate', 'false');

        // Attach logo
        if (communityData.logo) {
          const logoBlob = await urlToBlob(communityData.logo, 'logo');
          if (logoBlob) form.append('logoImage', logoBlob.blob, logoBlob.name);
        }

        // Attach banner/cover
        if (communityData.banner) {
          const bannerBlob = await urlToBlob(communityData.banner, 'banner');
          if (bannerBlob) form.append('bannerImage', bannerBlob.blob, bannerBlob.name);
        }

        console.log('[sync] Creating community V2:', { fields: [...form.keys()] });

        const createRes = await fetch(`${FW_API_BASE}/organizations/v2`, {
          method: 'POST',
          headers: authHeaders,
          body: form,
        });

        fwResult = await createRes.json().catch(() => ({ status: createRes.status }));
        console.log('[sync] Create community response:', JSON.stringify(fwResult).slice(0, 300));

        // Extract org/community IDs from response
        if (fwResult && (fwResult.id || fwResult.orgId || fwResult.organizationId)) {
          orgId = fwResult.orgId || fwResult.organizationId || fwResult.id;
          communityId = fwResult.communityId || fwResult.id;

          // Save IDs back to merchant record
          await supabase
            .from('merchants')
            .update({
              freedom_org_id: orgId,
              freedom_community_id: communityId,
              onboarding_status: 'live',
            })
            .eq('id', merchantId);
        }
      } catch (createErr) {
        console.error('[sync] Create community failed:', createErr);
        fwResult = { error: 'Community creation failed', details: String(createErr) };
      }
    } else {
      // ── 4. Update existing community ──────────────────────────
      try {
        const form = new FormData();
        if (communityData.name) form.append('name', communityData.name);
        if (communityData.description) {
          form.append('descriptions', JSON.stringify({ en: communityData.description }));
        }
        if (communityData.primaryColor) form.append('color', JSON.stringify(communityData.primaryColor));
        if (communityData.businessType) form.append('category', mapBusinessTypeToCategory(communityData.businessType));
        form.append('publishConfirmed', JSON.stringify(true));

        if (communityData.logo) {
          const logoBlob = await urlToBlob(communityData.logo, 'logo');
          if (logoBlob) form.append('logo', logoBlob.blob, logoBlob.name);
        }
        if (communityData.banner) {
          const coverBlob = await urlToBlob(communityData.banner, 'cover');
          if (coverBlob) form.append('coverImage', coverBlob.blob, coverBlob.name);
        }

        console.log('[sync] Updating community:', { orgId, communityId, fields: [...form.keys()] });

        const updateRes = await fetch(
          `${FW_API_BASE}/organizations/${orgId}/community/${communityId}`,
          { method: 'PUT', headers: authHeaders, body: form },
        );
        fwResult = await updateRes.json().catch(() => ({ status: updateRes.status }));
        console.log('[sync] Update response:', JSON.stringify(fwResult).slice(0, 300));

        // Also upload banner separately
        if (communityData.banner) {
          const bannerForm = new FormData();
          const bannerBlob = await urlToBlob(communityData.banner, 'banner');
          if (bannerBlob) {
            bannerForm.append('file', bannerBlob.blob, bannerBlob.name);
            await fetch(
              `${FW_API_BASE}/organizations/${orgId}/community/banner/${communityId}`,
              { method: 'POST', headers: authHeaders, body: bannerForm },
            ).catch(e => console.error('[sync] Banner upload failed:', e));
          }
        }

        await supabase
          .from('merchants')
          .update({ onboarding_status: 'live' })
          .eq('id', merchantId);
      } catch (updateErr) {
        console.error('[sync] Update community failed:', updateErr);
        fwResult = { error: 'Community update failed', details: String(updateErr) };
      }
    }

    // ── 5. Post welcome message if we have one ───────────────────
    if (communityData.welcomePost && orgId && accessToken) {
      try {
        const feedForm = new FormData();
        feedForm.append('titles', JSON.stringify({ en: 'Welcome!', th: 'ยินดีต้อนรับ!' }));
        feedForm.append('descriptions', JSON.stringify({
          en: communityData.welcomePost,
          th: communityData.welcomePost,
        }));
        feedForm.append('isDraft', 'false');

        // Attach banner as feed image if available
        if (communityData.banner) {
          const feedImageBlob = await urlToBlob(communityData.banner, 'feed-image');
          if (feedImageBlob) {
            feedForm.append('image', feedImageBlob.blob, feedImageBlob.name);
          }
        }

        console.log('[sync] Creating welcome post for org:', orgId);
        await fetch(
          `${FW_API_BASE}/organizations/${orgId}/feed`,
          { method: 'POST', headers: authHeaders, body: feedForm },
        ).then(r => r.json()).then(r => {
          console.log('[sync] Welcome post result:', JSON.stringify(r).slice(0, 200));
        });
      } catch (feedErr) {
        console.error('[sync] Welcome post failed:', feedErr);
      }
    }

    // ── 6. Create POI (business location) if we have coordinates ──
    if (orgId && communityId && accessToken && communityData.location) {
      try {
        const loc = communityData.location;
        // loc should have: { latitude, longitude, name, address, images? }
        if (loc.latitude && loc.longitude) {
          // Upload location images first if any
          const poiImages: string[] = [];
          const locationPhotos = loc.images || communityData.scrapedImages || [];
          for (const imgUrl of locationPhotos.slice(0, 5)) {
            try {
              const imgBlob = await urlToBlob(imgUrl, 'poi-image');
              if (imgBlob) {
                const uploadForm = new FormData();
                uploadForm.append('file', imgBlob.blob, imgBlob.name);
                const uploadRes = await fetch(
                  `${FW_API_BASE}/organizations/${orgId}/community/${communityId}/poi/requests/image-upload`,
                  { method: 'POST', headers: authHeaders, body: uploadForm },
                );
                const uploadResult = await uploadRes.json().catch(() => null);
                if (uploadResult?.data?.link) {
                  poiImages.push(uploadResult.data.link);
                }
              }
            } catch (imgErr) {
              console.error('[sync] POI image upload failed:', imgErr);
            }
          }

          // Create POI request
          const poiBody = {
            latitude: loc.latitude,
            longitude: loc.longitude,
            name: loc.name || communityData.name || 'Business Location',
            address: loc.address || loc.formattedAddress || '',
            images: poiImages,
          };

          console.log('[sync] Creating POI request:', poiBody.name, poiBody.address);
          const poiRes = await fetch(
            `${FW_API_BASE}/organizations/${orgId}/community/${communityId}/poi/requests`,
            {
              method: 'POST',
              headers: { ...authHeaders, 'Content-Type': 'application/json' },
              body: JSON.stringify(poiBody),
            },
          );
          const poiResult = await poiRes.json().catch(() => ({ status: poiRes.status }));
          console.log('[sync] POI result:', JSON.stringify(poiResult).slice(0, 200));
        }
      } catch (poiErr) {
        console.error('[sync] POI creation failed:', poiErr);
      }
    }

    // ── 7. Log event ────────────────────────────────────────────
    try {
      await supabase.from('events').insert({
        merchant_id: merchantId,
        event_type: 'community_synced',
        event_data: {
          hasBanner: Boolean(communityData.banner),
          hasLogo: Boolean(communityData.logo),
          hasDescription: Boolean(communityData.description),
          fwOrgId: orgId,
          fwCommunityId: communityId,
          fwSynced: Boolean(fwResult && !fwResult.error),
        },
      });
    } catch { /* non-fatal */ }

    return NextResponse.json({
      success: true,
      savedToDb: !dbError,
      freedomWorldSync: fwResult,
      orgId,
      communityId,
    });
  } catch (error) {
    console.error('[sync] Error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
