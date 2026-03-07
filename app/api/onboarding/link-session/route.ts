import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/onboarding/link-session
 * Links an anonymous onboarding session to a newly created merchant account.
 * Called after signup to preserve the chat history and community data collected
 * during the free (anonymous) phase.
 */
export async function POST(req: NextRequest) {
  try {
    const { anonymousSessionId, merchantId, communityData } = await req.json() as {
      anonymousSessionId: string;
      merchantId: string;
      communityData?: Record<string, unknown>;
    };

    if (!anonymousSessionId || !merchantId) {
      return NextResponse.json(
        { error: 'anonymousSessionId and merchantId are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 1. Update conversations: set merchant_id on all rows for this anonymous session
    const { error: convErr } = await supabase
      .from('conversations')
      .update({ merchant_id: merchantId })
      .eq('anonymous_session_id', anonymousSessionId)
      .is('merchant_id', null);

    if (convErr) {
      console.error('link-session: conversations update error', convErr);
      // Non-fatal — don't block the flow
    }

    // 2. Update anonymous_sessions table
    const { error: anonErr } = await supabase
      .from('anonymous_sessions')
      .update({
        converted_merchant_id: merchantId,
        converted_at: new Date().toISOString(),
      })
      .eq('id', anonymousSessionId);

    if (anonErr) {
      console.error('link-session: anonymous_sessions update error', anonErr);
    }

    // 3. Apply any collected community data to the merchant record
    if (communityData && Object.keys(communityData).length > 0) {
      const merchantUpdate: Record<string, unknown> = {};

      if (communityData.name) merchantUpdate.business_name = communityData.name;
      if (communityData.businessType) merchantUpdate.business_type = communityData.businessType;
      if (communityData.primaryColor) merchantUpdate.primary_color = communityData.primaryColor;
      if (communityData.logo) merchantUpdate.logo_url = communityData.logo;
      if (communityData.vibe) {
        // Store vibe in onboarding_data JSONB
        merchantUpdate.onboarding_data = { vibe: communityData.vibe, ...communityData };
      }

      if (Object.keys(merchantUpdate).length > 0) {
        const { error: merchantErr } = await supabase
          .from('merchants')
          .update(merchantUpdate)
          .eq('id', merchantId);

        if (merchantErr) {
          console.error('link-session: merchant update error', merchantErr);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('link-session error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
