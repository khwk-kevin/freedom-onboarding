import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/onboarding/sync-community
 * 
 * Called after signup to sync ALL collected onboarding data to:
 * 1. Supabase merchants table (our CRM)
 * 2. Freedom World backend API (community creation)
 * 
 * Expected body: {
 *   merchantId: string,
 *   communityData: {
 *     name, description, businessType, vibe, products, brandStyle,
 *     primaryColor, logo, banner, rewards, welcomePost, audiencePersona,
 *     scrapedUrl, scrapedImages
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { merchantId, communityData } = await req.json();

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // ── 1. Save EVERYTHING to our Supabase merchant record ──────
    const merchantUpdate: Record<string, unknown> = {
      onboarding_status: 'community_created',
      onboarding_completed_at: new Date().toISOString(),
    };

    if (communityData.name) merchantUpdate.business_name = communityData.name;
    if (communityData.businessType) merchantUpdate.business_type = communityData.businessType;
    if (communityData.primaryColor) merchantUpdate.primary_color = communityData.primaryColor;
    if (communityData.description) merchantUpdate.description = communityData.description;

    // Store all onboarding data in JSONB column
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

    // Store image URLs separately for easy access
    if (communityData.logo) merchantUpdate.logo_url = communityData.logo;
    if (communityData.banner) merchantUpdate.banner_url = communityData.banner;

    const { error: dbError } = await supabase
      .from('merchants')
      .update(merchantUpdate)
      .eq('id', merchantId);

    if (dbError) {
      console.error('[sync-community] Supabase update error:', dbError);
      // Don't block — continue to FW API
    }

    // ── 2. Sync to Freedom World backend ────────────────────────
    let fwResult = null;
    const fwApiBase = process.env.FREEDOM_API_BASE_URL;
    const fwAppKey = process.env.FREEDOM_APP_KEY;

    if (fwApiBase && fwAppKey) {
      try {
        // Get merchant's auth tokens for FW API
        const { data: merchant } = await supabase
          .from('merchants')
          .select('cognito_user_id, email, ref_code')
          .eq('id', merchantId)
          .single();

        if (merchant) {
          // Create/update community on Freedom World
          const fwPayload = {
            appKey: fwAppKey,
            refCode: merchant.ref_code,
            community: {
              name: communityData.name,
              description: communityData.description,
              category: communityData.businessType,
              type: 'Public',
              primaryColor: communityData.primaryColor,
              coverImageUrl: communityData.banner,
              logoUrl: communityData.logo,
              vibe: communityData.vibe,
              products: communityData.products,
            },
          };

          console.log('[sync-community] Calling FW API:', JSON.stringify(fwPayload).slice(0, 200));

          const fwRes = await fetch(`${fwApiBase}/api/community/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fwPayload),
          });

          fwResult = await fwRes.json();
          console.log('[sync-community] FW API response:', JSON.stringify(fwResult).slice(0, 200));

          // Store FW community ID if returned
          if (fwResult.communityId || fwResult.id) {
            await supabase
              .from('merchants')
              .update({
                freedom_community_id: fwResult.communityId || fwResult.id,
                onboarding_status: 'live',
              })
              .eq('id', merchantId);
          }
        }
      } catch (fwErr) {
        console.error('[sync-community] FW API error:', fwErr);
        fwResult = { error: 'Freedom World API call failed — data saved locally' };
      }
    }

    // ── 3. Log the sync event ───────────────────────────────────
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
          fwSynced: Boolean(fwResult && !fwResult.error),
        },
      });
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      savedToDb: !dbError,
      freedomWorldSync: fwResult,
    });
  } catch (error) {
    console.error('[sync-community] Error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
