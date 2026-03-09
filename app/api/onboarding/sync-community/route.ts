import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Freedom World API base URLs (production)
 * - BACKEND_URL = gateway.freedom.world/api/fdw-console/v1
 * - FREEDOM_WORLD_ENDPOINT = gateway.freedom.world/api/fdw-console/v1
 * 
 * Community endpoints:
 * - POST /organizations (create community, FormData: name, country, logo, product, token)
 * - PUT  /organizations/{orgId}/community/{communityId} (update, FormData: name, slug, descriptions, color, logo, coverImage, category, publishConfirmed)
 * - POST /organizations/{orgId}/community/banner/{communityId} (upload banner, FormData)
 */

const FW_API_BASE = process.env.FREEDOM_API_BASE_URL || 'https://gateway.freedom.world/api/fdw-console/v1';

/**
 * Convert a data URL or remote URL to a File-like Blob for FormData
 */
async function urlToBlob(url: string, filename: string): Promise<{ blob: Blob; name: string } | null> {
  try {
    if (url.startsWith('data:')) {
      // data:image/png;base64,...
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
    console.error('[sync] Failed to convert URL to blob:', err);
  }
  return null;
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

    // Full onboarding data in JSONB
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

    if (communityData.logo) merchantUpdate.logo_url = communityData.logo;
    if (communityData.banner) merchantUpdate.banner_url = communityData.banner;

    const { error: dbError } = await supabase
      .from('merchants')
      .update(merchantUpdate)
      .eq('id', merchantId);

    if (dbError) {
      console.error('[sync] Supabase error:', dbError);
    }

    // ── 2. Sync to Freedom World backend ────────────────────────
    let fwResult: Record<string, unknown> | null = null;

    // Get merchant's FW credentials
    const { data: merchant } = await supabase
      .from('merchants')
      .select('cognito_user_id, cognito_access_token, freedom_org_id, freedom_community_id, email')
      .eq('id', merchantId)
      .single();

    const accessToken = merchant?.cognito_access_token;
    const orgId = merchant?.freedom_org_id;
    const communityId = merchant?.freedom_community_id;

    if (accessToken && orgId && communityId) {
      try {
        // Build FormData for PUT /organizations/{orgId}/community/{communityId}
        const form = new FormData();
        
        if (communityData.name) {
          form.append('name', communityData.name);
        }
        
        if (communityData.description) {
          form.append('descriptions', JSON.stringify({ en: communityData.description }));
        }
        
        if (communityData.primaryColor) {
          form.append('color', JSON.stringify(communityData.primaryColor));
        }
        
        if (communityData.businessType) {
          form.append('category', communityData.businessType);
        }
        
        // Convert and attach logo
        if (communityData.logo) {
          const logoBlob = await urlToBlob(communityData.logo, 'logo');
          if (logoBlob) {
            form.append('logo', logoBlob.blob, logoBlob.name);
          }
        }
        
        // Convert and attach cover image
        if (communityData.banner) {
          const coverBlob = await urlToBlob(communityData.banner, 'cover');
          if (coverBlob) {
            form.append('coverImage', coverBlob.blob, coverBlob.name);
          }
        }
        
        form.append('publishConfirmed', JSON.stringify(true));

        console.log('[sync] PUT community update:', { orgId, communityId, fields: [...form.keys()] });

        const fwRes = await fetch(
          `${FW_API_BASE}/organizations/${orgId}/community/${communityId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
            body: form,
          }
        );

        fwResult = await fwRes.json().catch(() => ({ status: fwRes.status }));
        console.log('[sync] FW response:', JSON.stringify(fwResult).slice(0, 300));

        // Also upload banner separately if we have one
        if (communityData.banner) {
          const bannerForm = new FormData();
          const bannerBlob = await urlToBlob(communityData.banner, 'banner');
          if (bannerBlob) {
            bannerForm.append('file', bannerBlob.blob, bannerBlob.name);
            
            try {
              const bannerRes = await fetch(
                `${FW_API_BASE}/organizations/${orgId}/community/banner/${communityId}`,
                {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${accessToken}` },
                  body: bannerForm,
                }
              );
              const bannerResult = await bannerRes.json().catch(() => ({}));
              console.log('[sync] Banner upload result:', JSON.stringify(bannerResult).slice(0, 200));
            } catch (bannerErr) {
              console.error('[sync] Banner upload failed:', bannerErr);
            }
          }
        }

        // Update sync status
        await supabase
          .from('merchants')
          .update({ onboarding_status: 'live' })
          .eq('id', merchantId);

      } catch (fwErr) {
        console.error('[sync] FW API error:', fwErr);
        fwResult = { error: 'Freedom World API call failed' };
      }
    } else {
      console.log('[sync] Missing FW credentials:', {
        hasToken: Boolean(accessToken),
        orgId,
        communityId,
      });
      fwResult = {
        pending: true,
        reason: !accessToken ? 'no_access_token' : !orgId ? 'no_org_id' : 'no_community_id',
        message: 'Data saved to Supabase. FW sync will happen when org/community IDs are available.',
      };
    }

    // ── 3. Log event ────────────────────────────────────────────
    try {
      await supabase.from('events').insert({
        merchant_id: merchantId,
        event_type: 'community_synced',
        event_data: {
          hasBanner: Boolean(communityData.banner),
          hasLogo: Boolean(communityData.logo),
          hasDescription: Boolean(communityData.description),
          hasRewards: Boolean(communityData.rewards?.length),
          hasWelcomePost: Boolean(communityData.welcomePost),
          fwSynced: Boolean(fwResult && !fwResult.error && !fwResult.pending),
          fwOrgId: orgId,
          fwCommunityId: communityId,
        },
      });
    } catch { /* non-fatal */ }

    return NextResponse.json({
      success: true,
      savedToDb: !dbError,
      freedomWorldSync: fwResult,
    });
  } catch (error) {
    console.error('[sync] Error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
